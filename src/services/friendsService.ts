// Friends Service - Friend management and game invitations
import { ref, get, set, update, push, query, orderByChild, equalTo } from 'firebase/database';
import { database } from '../firebase';
import type { UserAccount, GameInvite, FriendRequest } from '../types';
import { AuthService } from './auth';

const USERS_PATH = 'users';
const INVITES_PATH = 'invites';
const FRIEND_REQUESTS_PATH = 'friendRequests';
const INVITE_COOLDOWN_MS = 30000; // 30 seconds

export const FriendsService = {
    // Search for a user by username
    async searchUserByUsername(username: string): Promise<UserAccount | null> {
        try {
            const usersRef = ref(database, USERS_PATH);
            const usernameQuery = query(usersRef, orderByChild('username'), equalTo(username.toLowerCase()));
            const snapshot = await get(usernameQuery);

            if (!snapshot.exists()) return null;

            let user: UserAccount | null = null;
            snapshot.forEach((child) => {
                user = { ...child.val(), id: child.key };
            });

            return user;
        } catch (error) {
            console.error('Error searching for user:', error);
            return null;
        }
    },

    // Get a user by ID
    async getUserById(userId: string): Promise<UserAccount | null> {
        try {
            const userRef = ref(database, `${USERS_PATH}/${userId}`);
            const snapshot = await get(userRef);

            if (!snapshot.exists()) return null;

            return { ...snapshot.val(), id: userId } as UserAccount;
        } catch (error) {
            console.error('Error getting user by ID:', error);
            return null;
        }
    },

    // Get current user's friends list with full profile data
    async getFriends(): Promise<UserAccount[]> {
        const currentUser = AuthService.getCurrentUser();
        if (!currentUser || !currentUser.friends || currentUser.friends.length === 0) {
            return [];
        }

        const friends: UserAccount[] = [];

        for (const friendId of currentUser.friends) {
            const friend = await this.getUserById(friendId);
            if (friend) {
                friends.push(friend);
            }
        }

        return friends;
    },

    // Add a friend
    async addFriend(userId: string): Promise<{ success: boolean; error?: string }> {
        const currentUser = AuthService.getCurrentUser();
        if (!currentUser) {
            return { success: false, error: 'Not logged in' };
        }

        if (userId === currentUser.id) {
            return { success: false, error: "You can't add yourself as a friend" };
        }

        // Check if already friends
        if (currentUser.friends?.includes(userId)) {
            return { success: false, error: 'Already friends' };
        }

        // Check if user exists
        const targetUser = await this.getUserById(userId);
        if (!targetUser) {
            return { success: false, error: 'User not found' };
        }

        try {
            // Add to current user's friends list
            const updatedFriends = [...(currentUser.friends || []), userId];
            await AuthService.updateUser(currentUser.id, { friends: updatedFriends });

            return { success: true };
        } catch (error) {
            console.error('Error adding friend:', error);
            return { success: false, error: 'Failed to add friend' };
        }
    },

    // Remove a friend
    async removeFriend(userId: string): Promise<{ success: boolean; error?: string }> {
        const currentUser = AuthService.getCurrentUser();
        if (!currentUser) {
            return { success: false, error: 'Not logged in' };
        }

        if (!currentUser.friends?.includes(userId)) {
            return { success: false, error: 'Not friends with this user' };
        }

        try {
            const updatedFriends = currentUser.friends.filter(id => id !== userId);
            await AuthService.updateUser(currentUser.id, { friends: updatedFriends });

            return { success: true };
        } catch (error) {
            console.error('Error removing friend:', error);
            return { success: false, error: 'Failed to remove friend' };
        }
    },

    // Check if a user is a friend
    isFriend(userId: string): boolean {
        const currentUser = AuthService.getCurrentUser();
        return currentUser?.friends?.includes(userId) || false;
    },

    // Check if we can invite a user (30-second cooldown)
    canInvite(userId: string): boolean {
        const currentUser = AuthService.getCurrentUser();
        if (!currentUser) return false;

        const lastInviteTime = currentUser.lastInviteTimes?.[userId];
        if (!lastInviteTime) return true;

        return Date.now() - lastInviteTime >= INVITE_COOLDOWN_MS;
    },

    // Get remaining cooldown time in seconds
    getInviteCooldown(userId: string): number {
        const currentUser = AuthService.getCurrentUser();
        if (!currentUser) return 0;

        const lastInviteTime = currentUser.lastInviteTimes?.[userId];
        if (!lastInviteTime) return 0;

        const elapsed = Date.now() - lastInviteTime;
        const remaining = INVITE_COOLDOWN_MS - elapsed;

        return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
    },

    // Send a game invite
    async sendInvite(toUserId: string, roomCode: string): Promise<{ success: boolean; error?: string }> {
        const currentUser = AuthService.getCurrentUser();
        if (!currentUser) {
            return { success: false, error: 'Not logged in' };
        }

        // Check cooldown
        if (!this.canInvite(toUserId)) {
            const remaining = this.getInviteCooldown(toUserId);
            return { success: false, error: `Please wait ${remaining}s before inviting again` };
        }

        // Check if target user exists
        const targetUser = await this.getUserById(toUserId);
        if (!targetUser) {
            return { success: false, error: 'User not found' };
        }

        try {
            // Create invite in Firebase
            const inviteRef = push(ref(database, INVITES_PATH));
            const invite: GameInvite = {
                id: inviteRef.key!,
                fromUserId: currentUser.id,
                fromUsername: currentUser.username,
                toUserId: toUserId,
                roomCode: roomCode,
                sentAt: Date.now(),
                status: 'pending'
            };

            await set(inviteRef, invite);

            // Update local cooldown tracking
            const updatedInviteTimes = {
                ...(currentUser.lastInviteTimes || {}),
                [toUserId]: Date.now()
            };
            await AuthService.updateUser(currentUser.id, { lastInviteTimes: updatedInviteTimes });

            return { success: true };
        } catch (error) {
            console.error('Error sending invite:', error);
            return { success: false, error: 'Failed to send invite' };
        }
    },

    // Get pending invites for the current user
    async getPendingInvites(): Promise<GameInvite[]> {
        const currentUser = AuthService.getCurrentUser();
        if (!currentUser) return [];

        try {
            const invitesRef = ref(database, INVITES_PATH);
            const invitesQuery = query(invitesRef, orderByChild('toUserId'), equalTo(currentUser.id));
            const snapshot = await get(invitesQuery);

            if (!snapshot.exists()) return [];

            const invites: GameInvite[] = [];
            const now = Date.now();
            const INVITE_EXPIRY = 5 * 60 * 1000; // 5 minutes

            snapshot.forEach((child) => {
                const invite = child.val() as GameInvite;
                // Only include pending invites that haven't expired
                if (invite.status === 'pending' && now - invite.sentAt < INVITE_EXPIRY) {
                    invites.push(invite);
                }
            });

            // Sort by most recent first
            return invites.sort((a, b) => b.sentAt - a.sentAt);
        } catch (error) {
            console.error('Error getting invites:', error);
            return [];
        }
    },

    // Accept an invite
    async acceptInvite(inviteId: string): Promise<{ success: boolean; roomCode?: string; error?: string }> {
        try {
            const inviteRef = ref(database, `${INVITES_PATH}/${inviteId}`);
            const snapshot = await get(inviteRef);

            if (!snapshot.exists()) {
                return { success: false, error: 'Invite not found' };
            }

            const invite = snapshot.val() as GameInvite;
            await update(inviteRef, { status: 'accepted' });

            return { success: true, roomCode: invite.roomCode };
        } catch (error) {
            console.error('Error accepting invite:', error);
            return { success: false, error: 'Failed to accept invite' };
        }
    },

    // Decline an invite
    async declineInvite(inviteId: string): Promise<void> {
        try {
            const inviteRef = ref(database, `${INVITES_PATH}/${inviteId}`);
            await update(inviteRef, { status: 'declined' });
        } catch (error) {
            console.error('Error declining invite:', error);
        }
    },

    // Send a friend request
    async sendFriendRequest(toUserId: string): Promise<{ success: boolean; error?: string }> {
        const currentUser = AuthService.getCurrentUser();
        if (!currentUser) return { success: false, error: 'Not logged in' };

        if (toUserId === currentUser.id) {
            return { success: false, error: "You can't add yourself" };
        }

        if (currentUser.friends?.includes(toUserId)) {
            return { success: false, error: 'Already friends' };
        }

        const pending = await this.isFriendRequestPending(toUserId);
        if (pending) {
            return { success: false, error: 'Friend request already pending' };
        }

        try {
            const requestRef = push(ref(database, FRIEND_REQUESTS_PATH));
            const request: FriendRequest = {
                id: requestRef.key!,
                fromUserId: currentUser.id,
                fromUsername: currentUser.username,
                toUserId,
                status: 'pending',
                createdAt: Date.now()
            };

            await set(requestRef, request);
            return { success: true };
        } catch (error) {
            console.error('Error sending friend request:', error);
            return { success: false, error: 'Failed to send friend request' };
        }
    },

    // Check if a friend request is pending
    async isFriendRequestPending(toUserId: string): Promise<boolean> {
        const currentUser = AuthService.getCurrentUser();
        if (!currentUser) return false;

        try {
            const requestsRef = ref(database, FRIEND_REQUESTS_PATH);
            const sentQuery = query(requestsRef, orderByChild('fromUserId'), equalTo(currentUser.id));
            const snapshot = await get(sentQuery);

            let exists = false;
            snapshot.forEach((child) => {
                const req = child.val() as FriendRequest;
                if (req.toUserId === toUserId && req.status === 'pending') {
                    exists = true;
                }
            });

            if (exists) return true;

            const receivedQuery = query(requestsRef, orderByChild('toUserId'), equalTo(currentUser.id));
            const snapshot2 = await get(receivedQuery);
            snapshot2.forEach((child) => {
                const req = child.val() as FriendRequest;
                if (req.fromUserId === toUserId && req.status === 'pending') {
                    exists = true;
                }
            });

            return exists;
        } catch (error) {
            return false;
        }
    },

    // Get pending friend requests (received)
    async getFriendRequests(): Promise<FriendRequest[]> {
        const currentUser = AuthService.getCurrentUser();
        if (!currentUser) return [];

        try {
            const requestsRef = ref(database, FRIEND_REQUESTS_PATH);
            const requestsQuery = query(requestsRef, orderByChild('toUserId'), equalTo(currentUser.id));
            const snapshot = await get(requestsQuery);

            if (!snapshot.exists()) return [];

            const requests: FriendRequest[] = [];
            snapshot.forEach((child) => {
                const req = child.val() as FriendRequest;
                if (req.status === 'pending') {
                    requests.push(req);
                }
            });

            return requests.sort((a, b) => b.createdAt - a.createdAt);
        } catch (error) {
            console.error('Error getting friend requests:', error);
            return [];
        }
    },

    // Accept friend request
    async acceptFriendRequest(requestId: string): Promise<{ success: boolean; error?: string }> {
        try {
            const requestRef = ref(database, `${FRIEND_REQUESTS_PATH}/${requestId}`);
            const snapshot = await get(requestRef);

            if (!snapshot.exists()) return { success: false, error: 'Request not found' };

            const req = snapshot.val() as FriendRequest;
            const currentUser = AuthService.getCurrentUser();
            if (req.toUserId !== currentUser?.id) {
                return { success: false, error: 'Not authorized' };
            }

            await update(requestRef, { status: 'accepted' });
            return { success: true };
        } catch (error) {
            console.error('Error accepting friend request:', error);
            return { success: false, error: 'Failed' };
        }
    },

    // Decline friend request
    async declineFriendRequest(requestId: string): Promise<{ success: boolean; error?: string }> {
        try {
            const requestRef = ref(database, `${FRIEND_REQUESTS_PATH}/${requestId}`);
            const snapshot = await get(requestRef);
            if (!snapshot.exists()) return { success: false, error: 'Request not found' };
            const req = snapshot.val() as FriendRequest;
            const currentUser = AuthService.getCurrentUser();
            if (req.toUserId !== currentUser?.id) {
                return { success: false, error: 'Not authorized' };
            }

            await update(requestRef, { status: 'declined' });
            return { success: true };
        } catch (error) {
            console.error('Error declining friend request:', error);
            return { success: false, error: 'Failed' };
        }
    }
};
