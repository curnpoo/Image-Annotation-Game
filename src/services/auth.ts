// Auth Service - Username/PIN authentication with Firebase
import { ref, get, set, query, orderByChild, equalTo } from 'firebase/database';
import { database } from '../firebase';
import type { UserAccount, PlayerStats, PlayerCosmetics } from '../types';
import { CurrencyService } from './currency';

const USERS_PATH = 'users';
const LOCAL_USER_KEY = 'logged_in_user';

// Simple hash function for PIN (not cryptographically secure, but sufficient for game PIN)
function hashPin(pin: string): string {
    let hash = 0;
    for (let i = 0; i < pin.length; i++) {
        const char = pin.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16);
}

// Default stats for new users
const defaultStats: PlayerStats = {
    gamesPlayed: 0,
    gamesWon: 0,
    roundsWon: 0,
    roundsLost: 0,
    timesSabotaged: 0,
    timesSaboteur: 0,
    totalCurrencyEarned: 0,
    totalXPEarned: 0,
    highestLevel: 0
};

const defaultCosmetics: PlayerCosmetics = {
    brushesUnlocked: ['basic'],
    colorsUnlocked: ['#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF'],
    badges: []
};

export const AuthService = {
    // Check if a username already exists
    async usernameExists(username: string): Promise<boolean> {
        try {
            const usersRef = ref(database, USERS_PATH);
            const usernameQuery = query(usersRef, orderByChild('username'), equalTo(username.toLowerCase()));
            const snapshot = await get(usernameQuery);
            return snapshot.exists();
        } catch (error) {
            console.error('Error checking username:', error);
            // Default to false so user can TRY to register if it's just a permission/network blip?
            // Or true to be safe? 
            // If permissions are denied (read: false), this throws. 
            // We should probably let the registration attempt fail with a specific error if write also fails.
            throw error;
        }
    },

    // Register a new user
    async register(username: string, pin: string): Promise<{ success: boolean; user?: UserAccount; error?: string }> {
        try {
            // Validate PIN
            if (pin.length !== 4 || !/^\d+$/.test(pin)) {
                return { success: false, error: 'PIN must be 4 digits' };
            }

            // CRITICAL: Ensure no stale data leaks into new account
            localStorage.removeItem('player_purchased_items');
            localStorage.removeItem('player_currency');
            localStorage.removeItem('player_xp');
            localStorage.removeItem('player_level');

            // Check username availability
            if (await this.usernameExists(username)) {
                return { success: false, error: 'Username already taken' };
            }

            const userId = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString();
            const now = Date.now();

            const newUser: UserAccount = {
                id: userId,
                username: username.toLowerCase(),
                pinHash: hashPin(pin),
                createdAt: now,
                lastLoginAt: now,
                stats: defaultStats,
                currency: 5, // Starting currency ($5)
                xp: 0,
                purchasedItems: [],
                cosmetics: {
                    ...defaultCosmetics,
                    activeFont: 'default'
                }
            };

            // Save to Firebase
            await set(ref(database, `${USERS_PATH}/${userId}`), newUser);

            // Save locally
            localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(newUser));

            // Sync Currency
            CurrencyService.setCurrency(newUser.currency || 0);
            // reset purchased items key just in case
            localStorage.setItem('player_purchased_items', '[]');

            // Sync XP (Initialize for new user)
            localStorage.setItem('player_xp', '0');
            localStorage.setItem('player_level', '0');

            return { success: true, user: newUser };
        } catch (error: any) {
            console.error('Registration failed:', error);
            if (error.code === 'PERMISSION_DENIED') {
                return { success: false, error: 'Database access denied. Check Firebase rules.' };
            }
            return { success: false, error: error.message || 'Registration failed due to network or server error.' };
        }
    },

    // Login with username and PIN
    async login(username: string, pin: string): Promise<{ success: boolean; user?: UserAccount; error?: string }> {
        try {
            const usersRef = ref(database, USERS_PATH);
            const usernameQuery = query(usersRef, orderByChild('username'), equalTo(username.toLowerCase()));
            const snapshot = await get(usernameQuery);

            if (!snapshot.exists()) {
                return { success: false, error: 'User not found' };
            }

            // Should only be one user with this username
            let user: UserAccount | null = null;
            snapshot.forEach((child) => {
                user = child.val();
            });

            if (!user) return { success: false, error: 'User data corrupted' };

            // Check PIN
            if ((user as UserAccount).pinHash !== hashPin(pin)) {
                return { success: false, error: 'Incorrect PIN' };
            }

            // Update Login Time
            const u = user as UserAccount;
            const updates = { lastLoginAt: Date.now() };
            // Fire and forget update
            AuthService.updateUser(u.id, updates);

            // Save locally
            const updatedUser = { ...u, lastLoginAt: Date.now() };
            localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(updatedUser));

            // Sync Currency
            // Sync Currency
            CurrencyService.setCurrency(updatedUser.currency);

            // Sync XP
            const xp = updatedUser.xp || 0;
            const level = Math.floor(xp / 100);
            localStorage.setItem('player_xp', xp.toString());
            localStorage.setItem('player_level', level.toString());

            return { success: true, user: updatedUser };

        } catch (error: any) {
            console.error('Login failed:', error);
            if (error.code === 'PERMISSION_DENIED') {
                return { success: false, error: 'Database access denied. Check Firebase rules.' };
            }
            return { success: false, error: error.message || 'Login failed' };
        }
    },

    // Logout
    logout(): void {
        localStorage.removeItem(LOCAL_USER_KEY);
        // Clear XP data to prevent visual glitches for next user
        localStorage.removeItem('player_xp');
        localStorage.removeItem('player_level');
        localStorage.removeItem('player_currency');
        localStorage.removeItem('player_purchased_items');
        localStorage.removeItem('aic_game_session');
    },

    // Check if logged in
    isLoggedIn(): boolean {
        return localStorage.getItem(LOCAL_USER_KEY) !== null;
    },

    // Get current user from local storage
    getCurrentUser(): UserAccount | null {
        const stored = localStorage.getItem(LOCAL_USER_KEY);
        return stored ? JSON.parse(stored) : null;
    },

    // Update user data in Firebase and local storage
    async updateUser(userId: string, updates: Partial<UserAccount>): Promise<void> {
        try {
            const userRef = ref(database, `${USERS_PATH}/${userId}`);
            const snapshot = await get(userRef);

            if (snapshot.exists()) {
                const currentData = snapshot.val();
                const updatedData = { ...currentData, ...updates };
                await set(userRef, updatedData);
                localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(updatedData));
            }
        } catch (error) {
            console.error('Failed to update user:', error);
        }
    },

    // Sync local user with Firebase (for stats updates)
    async syncUser(): Promise<UserAccount | null> {
        const local = this.getCurrentUser();
        if (!local) return null;

        try {
            const userRef = ref(database, `${USERS_PATH}/${local.id}`);
            const snapshot = await get(userRef);

            if (snapshot.exists()) {
                let user = snapshot.val() as UserAccount;

                // STIMULUS CHECK: Give everyone $5 if they haven't received it
                const STIMULUS_ID = 'stimulus_check_1';
                if (!user.purchasedItems) user.purchasedItems = [];

                if (!user.purchasedItems.includes(STIMULUS_ID)) {
                    console.log('💰 Granting Stimulus Check!');
                    user.currency = (user.currency || 0) + 5;
                    user.purchasedItems.push(STIMULUS_ID);

                    // Save back to firebase immediately
                    await set(userRef, user);
                }

                localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(user));

                // Sync Currency
                if (user.currency !== undefined) {
                    CurrencyService.setCurrency(user.currency);
                }

                return user;
            }
        } catch (error) {
            console.error('Failed to sync user:', error);
        }
        return local;
    },

    // Delete account
    async deleteAccount(): Promise<void> {
        const user = this.getCurrentUser();
        if (user) {
            // Remove from Firebase
            const userRef = ref(database, `${USERS_PATH}/${user.id}`);
            await set(userRef, null);
        }
        // Remove from local storage
        localStorage.removeItem(LOCAL_USER_KEY);
        localStorage.removeItem('player_xp');
        localStorage.removeItem('player_level');
        localStorage.removeItem('player_currency');
        localStorage.removeItem('player_purchased_items');
        localStorage.removeItem('aic_game_session');
    },

    // Change username with history tracking
    async changeUsername(newUsername: string): Promise<{ success: boolean; error?: string }> {
        const currentUser = this.getCurrentUser();
        if (!currentUser) {
            return { success: false, error: 'Not logged in' };
        }

        const normalizedNewUsername = newUsername.toLowerCase().trim();

        // Validate new username
        if (normalizedNewUsername.length < 2) {
            return { success: false, error: 'Username must be at least 2 characters' };
        }

        if (normalizedNewUsername.length > 20) {
            return { success: false, error: 'Username must be 20 characters or less' };
        }

        if (!/^[a-z0-9_]+$/.test(normalizedNewUsername)) {
            return { success: false, error: 'Username can only contain letters, numbers, and underscores' };
        }

        // Check if same as current
        if (normalizedNewUsername === currentUser.username.toLowerCase()) {
            return { success: false, error: 'This is already your username' };
        }

        try {
            // Check if username is taken by someone else
            const usersRef = ref(database, USERS_PATH);
            const usernameQuery = query(usersRef, orderByChild('username'), equalTo(normalizedNewUsername));
            const snapshot = await get(usernameQuery);

            if (snapshot.exists()) {
                // Check if it's a different user
                let isTaken = false;
                snapshot.forEach((child) => {
                    if (child.key !== currentUser.id) {
                        isTaken = true;
                    }
                });
                if (isTaken) {
                    return { success: false, error: 'Username already taken' };
                }
            }

            // Build username history (keep last 3, most recent first)
            const oldUsername = currentUser.username;
            let usernameHistory = currentUser.usernameHistory || [];

            // Add current username to history if not already there
            if (!usernameHistory.includes(oldUsername)) {
                usernameHistory = [oldUsername, ...usernameHistory].slice(0, 3);
            }

            // Update in Firebase
            const updates = {
                username: normalizedNewUsername,
                usernameHistory: usernameHistory,
                lastUsernameChange: Date.now()
            };

            await this.updateUser(currentUser.id, updates);

            return { success: true };
        } catch (error: any) {
            console.error('Error changing username:', error);
            return { success: false, error: error.message || 'Failed to change username' };
        }
    }
};
