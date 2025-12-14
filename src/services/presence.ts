import { ref, onValue, set, onDisconnect, serverTimestamp } from 'firebase/database';
import { database } from '../firebase';
import { AuthService } from './auth';

export type UserStatus = 'online' | 'offline' | 'playing';

export interface UserPresence {
    status: UserStatus;
    lastChanged: number;
    currentRoomCode?: string;
}

const PRESENCE_PATH = 'presence';

export const PresenceService = {
    // Initialize presence monitoring for the current user
    initPresence(userId: string) {
        const connectedRef = ref(database, '.info/connected');
        const userStatusRef = ref(database, `${PRESENCE_PATH}/${userId}`);

        onValue(connectedRef, (snapshot) => {
            // If we're not connected, we don't need to do anything.
            if (snapshot.val() === false) {
                return;
            }

            // When I disconnect, remove this device
            onDisconnect(userStatusRef).set({
                status: 'offline',
                lastChanged: serverTimestamp()
            }).then(() => {
                // When I connect, set this device to online
                set(userStatusRef, {
                    status: 'online',
                    lastChanged: serverTimestamp()
                });
            });
        });
    },

    // Manually update status (e.g. when joining a game)
    async setStatus(status: UserStatus, roomCode?: string) {
        const currentUser = AuthService.getCurrentUser();
        if (!currentUser) return;

        const userStatusRef = ref(database, `${PRESENCE_PATH}/${currentUser.id}`);
        
        const presenceData: any = {
            status,
            lastChanged: serverTimestamp()
        };

        if (status === 'playing' && roomCode) {
            presenceData.currentRoomCode = roomCode;
        }

        await set(userStatusRef, presenceData);
    },

    // Subscribe to a specific user's presence
    subscribeToUserPresence(userId: string, callback: (presence: UserPresence | null) => void): () => void {
        const userStatusRef = ref(database, `${PRESENCE_PATH}/${userId}`);
        return onValue(userStatusRef, (snapshot) => {
            if (snapshot.exists()) {
                callback(snapshot.val() as UserPresence);
            } else {
                callback(null);
            }
        });
    },

    // Subscribe to multiple users' presence (simple approach: multiple listeners)
    // Note: In a large scale app, we might want to query by status or lastChanged, but for friends list this is okay
    subscribeToFriendsPresence(friendIds: string[], callback: (presenceMap: Record<string, UserPresence>) => void): () => void {
        const presenceMap: Record<string, UserPresence> = {};
        const unsubscribers: (() => void)[] = [];

        friendIds.forEach(friendId => {
            const unsub = this.subscribeToUserPresence(friendId, (presence) => {
                if (presence) {
                    presenceMap[friendId] = presence;
                } else {
                    delete presenceMap[friendId];
                }
                // Emit update
                callback({ ...presenceMap });
            });
            unsubscribers.push(unsub);
        });

        return () => {
            unsubscribers.forEach(unsub => unsub());
        };
    }
};
