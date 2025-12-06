// Admin Service - Administrative tasks
import { ref, get, update } from 'firebase/database';
import { database } from '../firebase';
import type { UserAccount } from '../types';

const USERS_PATH = 'users';

export const AdminService = {
    // Grant stimulus check to all users
    // Returns number of users updated
    async grantStimulusCheck(amount: number): Promise<number> {
        try {
            const usersRef = ref(database, USERS_PATH);
            const snapshot = await get(usersRef);

            if (!snapshot.exists()) {
                console.log('No users found to grant stimulus to.');
                return 0;
            }

            const updates: Record<string, any> = {};
            let count = 0;

            snapshot.forEach((child) => {
                const user = child.val() as UserAccount;
                if (user.id) {
                    // Add to existing currency (handle missing currency field)
                    const currentBalance = user.currency || 0;
                    updates[`${USERS_PATH}/${user.id}/currency`] = currentBalance + amount;
                    count++;
                }
            });

            if (count > 0) {
                await update(ref(database), updates);
            }

            return count;
        } catch (error) {
            console.error('Failed to grant stimulus:', error);
            throw error;
        }
    },

    // Get all users for admin dashboard
    async getAllUsers(): Promise<UserAccount[]> {
        try {
            const usersRef = ref(database, USERS_PATH);
            const snapshot = await get(usersRef);

            if (!snapshot.exists()) return [];

            const users: UserAccount[] = [];
            snapshot.forEach((child) => {
                users.push(child.val() as UserAccount);
            });

            return users.sort((a, b) => (b.currency || 0) - (a.currency || 0)); // Sort by richest
        } catch (error) {
            console.error('Failed to fetch users:', error);
            return [];
        }
    },

    // Grant stimulus to specific users
    async grantStimulusToUsers(userIds: string[], amount: number): Promise<number> {
        try {
            const usersRef = ref(database, USERS_PATH);
            const snapshot = await get(usersRef);

            if (!snapshot.exists()) return 0;

            const updates: Record<string, any> = {};
            let count = 0;

            snapshot.forEach((child) => {
                const user = child.val() as UserAccount;
                if (user.id && userIds.includes(user.id)) {
                    const currentBalance = user.currency || 0;
                    updates[`${USERS_PATH}/${user.id}/currency`] = currentBalance + amount;
                    count++;
                }
            });

            if (count > 0) {
                await update(ref(database), updates);
            }

            return count;
        } catch (error) {
            console.error('Failed to grant specific stimulus:', error);
            throw error;
        }
    }
};
