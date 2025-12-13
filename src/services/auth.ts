// Auth Service - Username/PIN authentication with Firebase
import { ref, get, set, query, orderByChild, equalTo } from 'firebase/database';
import { database, auth, functions } from '../firebase';
import { signInWithCustomToken, signOut } from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import type { UserAccount } from '../types';
import { CurrencyService } from './currency';
import { XPService } from './xp';

const USERS_PATH = 'users';
const LOCAL_USER_KEY = 'logged_in_user';

// Simple hash function moved to backend


// Default stats and cosmetics moved to backend


export const AuthService = {
    // Check if a username already exists (Public read is still allowed for this specific check? No, we might need a function or public read on usernames)
    // Update: We'll leave public read on users for now or create a function.
    // For now, let's assume we can still read usernames or use the register function's error.
    async usernameExists(username: string): Promise<boolean> {
        // Optimization: The register function checks this.
        // But for UI feedback, we might want to check.
        // If we lock down read, this will fail. 
        // We should PROBABLY just let the register function handle it.
        try {
            const usersRef = ref(database, USERS_PATH);
            const usernameQuery = query(usersRef, orderByChild('username'), equalTo(username.toLowerCase()));
            const snapshot = await get(usernameQuery);
            return snapshot.exists();
        } catch (error) {
            // Assume false if we can't check, let register fail
            return false;
        }
    },

    // Register a new user
    async register(username: string, pin: string): Promise<{ success: boolean; user?: UserAccount; error?: string }> {
        try {
            // Validate PIN client-side too
            if (pin.length !== 4 || !/^\d+$/.test(pin)) {
                return { success: false, error: 'PIN must be 4 digits' };
            }

            // Call Cloud Function
            const registerFn = httpsCallable(functions, 'register');
            const result = await registerFn({ username, pin });
            const { token, user } = result.data as { token: string, user: UserAccount };

            // Sign in with custom token
            await signInWithCustomToken(auth, token);

            // Clean stale local data
            localStorage.removeItem('player_purchased_items');
            localStorage.removeItem('player_currency');
            localStorage.removeItem('player_xp');
            localStorage.removeItem('player_level');

            // Save to LocalStorage (maintain existing app flow)
            localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(user));

            // Sync Currency/XP
            CurrencyService.setCurrency(user.currency || 0);
            localStorage.setItem('player_purchased_items', '[]');
            localStorage.setItem('player_xp', '0');
            localStorage.setItem('player_level', '0');

            return { success: true, user };
        } catch (error: any) {
            console.error('Registration failed:', error);
            return { success: false, error: error.message || 'Registration failed.' };
        }
    },

    // Login with username and PIN
    async login(username: string, pin: string): Promise<{ success: boolean; user?: UserAccount; error?: string }> {
        try {
            // Call Cloud Function
            const loginFn = httpsCallable(functions, 'login');
            const result = await loginFn({ username, pin });
            const { token, user } = result.data as { token: string, user: UserAccount };

            // Sign in with custom token
            await signInWithCustomToken(auth, token);

            // Update local storage
            localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(user));

            // Sync Currency
            CurrencyService.setCurrency(user.currency || 0);

            // Sync XP
            const xp = user.xp || 0;
            const level = XPService.getLevelFromXP(xp);
            localStorage.setItem('player_xp', xp.toString());
            localStorage.setItem('player_level', level.toString());

            return { success: true, user };

        } catch (error: any) {
            console.error('Login failed:', error);
            return { success: false, error: error.message || 'Login failed' };
        }
    },

    // Logout
    async logout(): Promise<void> {
        await signOut(auth);
        localStorage.removeItem(LOCAL_USER_KEY);
        // Clear XP data
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

                // MIGRATION: Add default backgroundColor for legacy users
                if (!user.backgroundColor) {
                    console.log('🎨 Migrating user: Adding default backgroundColor');
                    user.backgroundColor = '#ffffff';

                    // Save back to firebase
                    await set(userRef, user);
                }

                localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(user));

                // Sync Currency
                if (user.currency !== undefined) {
                    CurrencyService.setCurrency(user.currency);
                }

                // MIGRATION: Sync XP from localStorage to Firebase if Firebase has no XP
                // This handles older accounts that accumulated XP locally before Firebase sync
                const localXP = parseInt(localStorage.getItem('player_xp') || '0', 10);
                if ((!user.xp || user.xp === 0) && localXP > 0) {
                    console.log(`📈 Migrating XP: localStorage has ${localXP}, Firebase has ${user.xp || 0}`);
                    user.xp = localXP;
                    await set(userRef, user);
                }

                // Sync XP - Critical for correct level display in lobby
                // Use the higher value between Firebase and localStorage
                const xp = Math.max(user.xp || 0, localXP);
                const level = XPService.getLevelFromXP(xp);
                localStorage.setItem('player_xp', xp.toString());
                localStorage.setItem('player_level', level.toString());

                return user;
            }
        } catch (error: any) {
            console.error('Failed to sync user:', error);
            // CRITICAL: If we get Permission Denied, it means our local session 
            // is not authenticated with Firebase (Zombie Session). Force Logout.
            if (error.code === 'PERMISSION_DENIED' || error.message?.includes('permission_denied')) {
                console.warn('SyncUser: Permission denied. Invalidating session.');
                await this.logout();
                return null;
            }
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
