// Friends Service - Friend management and game invitations
import { ref, get, set, update, push, query, orderByChild, equalTo, onValue } from 'firebase/database';
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

    // Search for users by username OR display name (partial match)
    async searchUsers(query: string, limit: number = 50): Promise<UserAccount[]> {
        try {
            const usersRef = ref(database, USERS_PATH);
            const snapshot = await get(usersRef);

            if (!snapshot.exists()) return [];

            const users: UserAccount[] = [];
            const searchLower = query.toLowerCase().trim();

            snapshot.forEach((child) => {
                const user = { ...child.val(), id: child.key } as UserAccount;
                const username = user.username?.toLowerCase() || '';

                // Search in username (from UserAccount - this is the unique @username)
                // Note: Player.name is the display name, but it's not stored in UserAccount
                // We need to check if there's a display name field we should search
                if (username.includes(searchLower)) {
                    users.push(user);
                }
            });

            // Sort by relevance (exact matches first, then partial)
            users.sort((a, b) => {
                const aUsername = a.username?.toLowerCase() || '';
                const bUsername = b.username?.toLowerCase() || '';

                const aExact = aUsername === searchLower;
                const bExact = bUsername === searchLower;

                if (aExact && !bExact) return -1;
                if (!aExact && bExact) return 1;

                const aStarts = aUsername.startsWith(searchLower);
                const bStarts = bUsername.startsWith(searchLower);

                if (aStarts && !bStarts) return -1;
                if (!aStarts && bStarts) return 1;

                return aUsername.localeCompare(bUsername);
            });

            return users.slice(0, limit);
        } catch (error) {
            console.error('Error searching for users:', error);
            return [];
        }
    },

    // Get all users (for browsing), with optional limit
    async getAllUsers(limit: number = 100): Promise<UserAccount[]> {
        try {
            const usersRef = ref(database, USERS_PATH);
            const snapshot = await get(usersRef);

            if (!snapshot.exists()) return [];

            const users: UserAccount[] = [];
            snapshot.forEach((child) => {
                users.push({ ...child.val(), id: child.key });
            });

            // Sort by most recent activity
            users.sort((a, b) => (b.lastLoginAt || 0) - (a.lastLoginAt || 0));

            return users.slice(0, limit);
        } catch (error) {
            console.error('Error getting all users:', error);
            return [];
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

    // Subscribe to friends list updates
    subscribeToFriends(onUpdate: (friends: UserAccount[]) => void): () => void {
        const currentUser = AuthService.getCurrentUser();
        if (!currentUser || !currentUser.friends || currentUser.friends.length === 0) {
            onUpdate([]);
            return () => { };
        }

        const friendsMap = new Map<string, UserAccount>();
        const listeners: (() => void)[] = [];

        // Helper to trigger update
        const triggerUpdate = () => {
            const friends = Array.from(friendsMap.values());
            onUpdate(friends);
        };

        // Set up listeners for each friend
        currentUser.friends.forEach(friendId => {
            const friendRef = ref(database, `${USERS_PATH}/${friendId}`);

            const unsubscribe = onValue(friendRef, (snapshot) => {
                if (snapshot.exists()) {
                    friendsMap.set(friendId, { ...snapshot.val(), id: friendId });
                } else {
                    friendsMap.delete(friendId);
                }
                triggerUpdate();
            });

            listeners.push(unsubscribe);
        });

        // Return unsubscribe function
        return () => {
            listeners.forEach(off => off());
        };
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

    // Remove a friend (bidirectional - removes from both users' lists)
    async removeFriend(userId: string): Promise<{ success: boolean; error?: string }> {
        const currentUser = AuthService.getCurrentUser();
        if (!currentUser) {
            return { success: false, error: 'Not logged in' };
        }

        if (!currentUser.friends?.includes(userId)) {
            return { success: false, error: 'Not friends with this user' };
        }

        try {
            // Remove from current user's friends list
            const updatedFriends = currentUser.friends.filter(id => id !== userId);
            await AuthService.updateUser(currentUser.id, { friends: updatedFriends });

            // Also remove current user from the other user's friends list
            try {
                const otherUserRef = ref(database, `${USERS_PATH}/${userId}`);
                const otherUserSnapshot = await get(otherUserRef);
                if (otherUserSnapshot.exists()) {
                    const otherUser = otherUserSnapshot.val() as UserAccount;
                    if (otherUser.friends?.includes(currentUser.id)) {
                        const otherUpdatedFriends = otherUser.friends.filter(id => id !== currentUser.id);
                        await update(otherUserRef, { friends: otherUpdatedFriends });
                    }
                }
            } catch (err) {
                console.error('Failed to remove from other user\'s friends list:', err);
                // Continue anyway - at least the current user's list is updated
            }

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
                status: 'pending',
                origin: window.location.origin
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

    async getFriendRequestStatus(otherUserId: string): Promise<'none' | 'friend' | 'sent' | 'received'> {
        const currentUser = AuthService.getCurrentUser();
        if (!currentUser) return 'none';

        if (currentUser.friends?.includes(otherUserId)) return 'friend';

        try {
            const requestsRef = ref(database, FRIEND_REQUESTS_PATH);

            // Check sent
            const sentQuery = query(requestsRef, orderByChild('fromUserId'), equalTo(currentUser.id));
            const sentSnapshot = await get(sentQuery);
            let sentExists = false;
            sentSnapshot.forEach((child) => {
                const req = child.val() as FriendRequest;
                if (req.toUserId === otherUserId && req.status === 'pending') {
                    sentExists = true;
                }
            });
            if (sentExists) return 'sent';

            // Check received
            const receivedQuery = query(requestsRef, orderByChild('toUserId'), equalTo(currentUser.id));
            const receivedSnapshot = await get(receivedQuery);
            let receivedExists = false;
            receivedSnapshot.forEach((child) => {
                const req = child.val() as FriendRequest;
                if (req.fromUserId === otherUserId && req.status === 'pending') {
                    receivedExists = true;
                }
            });
            if (receivedExists) return 'received';

            return 'none';
        } catch (error) {
            console.error('Error checking friend status:', error);
            return 'none';
        }
    },

    // Check if a friend request is pending (Legacy generic check)
    async isFriendRequestPending(toUserId: string): Promise<boolean> {
        const status = await this.getFriendRequestStatus(toUserId);
        return status === 'sent' || status === 'received';
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

    // Subscribe to pending friend requests (real-time updates)
    subscribeToFriendRequests(onUpdate: (requests: FriendRequest[]) => void): () => void {
        const currentUser = AuthService.getCurrentUser();
        if (!currentUser) {
            onUpdate([]);
            return () => { };
        }

        const requestsRef = ref(database, FRIEND_REQUESTS_PATH);

        const unsubscribe = onValue(requestsRef, (snapshot) => {
            if (!snapshot.exists()) {
                onUpdate([]);
                return;
            }

            const requests: FriendRequest[] = [];
            snapshot.forEach((child) => {
                const req = child.val() as FriendRequest;
                // Only include pending requests TO the current user
                if (req.toUserId === currentUser.id && req.status === 'pending') {
                    requests.push({ ...req, id: child.key! });
                }
            });

            // Sort by most recent first
            requests.sort((a, b) => b.createdAt - a.createdAt);
            onUpdate(requests);
        });

        return unsubscribe;
    },

    // Get pending friend requests (sent), populated with user details
    async getSentFriendRequests(): Promise<(FriendRequest & { toUser?: UserAccount })[]> {
        const currentUser = AuthService.getCurrentUser();
        if (!currentUser) return [];

        try {
            const requestsRef = ref(database, FRIEND_REQUESTS_PATH);
            const requestsQuery = query(requestsRef, orderByChild('fromUserId'), equalTo(currentUser.id));
            const snapshot = await get(requestsQuery);

            if (!snapshot.exists()) return [];

            const requests: (FriendRequest & { toUser?: UserAccount })[] = [];

            // Promise.all to fetch all target users parallel
            const promises: Promise<void>[] = [];

            snapshot.forEach((child) => {
                const req = child.val() as FriendRequest;
                if (req.status === 'pending') {
                    const fetchPromise = this.getUserById(req.toUserId).then(user => {
                        if (user) {
                            requests.push({ ...req, toUser: user });
                        } else {
                            requests.push(req);
                        }
                    });
                    promises.push(fetchPromise);
                }
            });

            await Promise.all(promises);
            return requests.sort((a, b) => b.createdAt - a.createdAt);
        } catch (error) {
            console.error('Error getting sent friend requests:', error);
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

            // Update status
            await update(requestRef, { status: 'accepted' });

            // FORCE FRIEND ADDITION CLIENT-SIDE (Redundancy for Cloud Function)
            try {
                // Add sender to current user's friend list
                const myFriends = [...(currentUser.friends || [])];
                if (!myFriends.includes(req.fromUserId)) {
                    myFriends.push(req.fromUserId);
                    await AuthService.updateUser(currentUser.id, { friends: myFriends });
                }

                // Add current user to sender's friend list
                const senderRef = ref(database, `${USERS_PATH}/${req.fromUserId}`);
                const senderSnapshot = await get(senderRef);
                if (senderSnapshot.exists()) {
                    const sender = senderSnapshot.val() as UserAccount;
                    const senderFriends = [...(sender.friends || [])];
                    if (!senderFriends.includes(currentUser.id)) {
                        senderFriends.push(currentUser.id);
                        await update(senderRef, { friends: senderFriends });
                    }
                }
            } catch (err) {
                console.error('Manual friend addition failed, hoping Cloud Function works:', err);
            }

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
    },

    // Accept friend request from a specific user
    async acceptFriendRequestFromUser(userId: string): Promise<{ success: boolean; error?: string }> {
        try {
            const requests = await this.getFriendRequests();
            const request = requests.find(r => r.fromUserId === userId);

            if (!request) {
                return { success: false, error: 'Request not found' };
            }

            return await this.acceptFriendRequest(request.id);
        } catch (error) {
            console.error('Error accepting friend request from user:', error);
            return { success: false, error: 'Failed' };
        }
    }
};
