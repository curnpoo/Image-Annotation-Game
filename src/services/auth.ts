// Auth Service - Username/PIN authentication with Firebase
import { ref, get, set, query, orderByChild, equalTo } from 'firebase/database';
import { database } from '../firebase';
import type { UserAccount, PlayerStats, PlayerCosmetics } from '../types';

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
    highestLevel: 1
};

const defaultCosmetics: PlayerCosmetics = {
    brushesUnlocked: ['basic'],
    colorsUnlocked: ['#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF'],
    badges: []
};

export const AuthService = {
    // Check if a username already exists
    async usernameExists(username: string): Promise<boolean> {
        const usersRef = ref(database, USERS_PATH);
        const usernameQuery = query(usersRef, orderByChild('username'), equalTo(username.toLowerCase()));
        const snapshot = await get(usernameQuery);
        return snapshot.exists();
    },

    // Register a new user
    async register(username: string, pin: string): Promise<UserAccount | null> {
        try {
            // Check username availability
            if (await this.usernameExists(username)) {
                console.error('Username already taken');
                return null;
            }

            // Validate PIN
            if (pin.length !== 4 || !/^\d+$/.test(pin)) {
                console.error('PIN must be 4 digits');
                return null;
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
                currency: 100, // Starting currency
                xp: 0,
                purchasedItems: [],
                cosmetics: defaultCosmetics
            };

            // Save to Firebase
            await set(ref(database, `${USERS_PATH}/${userId}`), newUser);

            // Save locally
            localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(newUser));

            return newUser;
        } catch (error) {
            console.error('Registration failed:', error);
            return null;
        }
    },

    // Login with username and PIN
    async login(username: string, pin: string): Promise<UserAccount | null> {
        try {
            const usersRef = ref(database, USERS_PATH);
            const usernameQuery = query(usersRef, orderByChild('username'), equalTo(username.toLowerCase()));
            const snapshot = await get(usernameQuery);

            if (!snapshot.exists()) {
                console.error('User not found');
                return null;
            }

            // Get the user data
            let user: UserAccount | null = null;
            snapshot.forEach((child) => {
                const userData = child.val() as UserAccount;
                if (userData.pinHash === hashPin(pin)) {
                    user = userData;
                }
            });

            if (!user) {
                console.error('Invalid PIN');
                return null;
            }

            // Update last login - need to cast to avoid TS narrowing issue
            const loggedInUser = user as UserAccount;
            loggedInUser.lastLoginAt = Date.now();
            await set(ref(database, `${USERS_PATH}/${loggedInUser.id}/lastLoginAt`), loggedInUser.lastLoginAt);

            // Save locally
            localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(loggedInUser));

            return loggedInUser;
        } catch (error) {
            console.error('Login failed:', error);
            return null;
        }
    },

    // Logout
    logout(): void {
        localStorage.removeItem(LOCAL_USER_KEY);
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
                const user = snapshot.val() as UserAccount;
                localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(user));
                return user;
            }
        } catch (error) {
            console.error('Failed to sync user:', error);
        }
        return local;
    }
};
