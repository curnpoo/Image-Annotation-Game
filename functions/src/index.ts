import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK
admin.initializeApp();

const db = admin.database();
const messaging = admin.messaging();

interface GameInvite {
    id: string;
    fromUserId: string;
    fromUsername: string;
    toUserId: string;
    roomCode: string;
    sentAt: number;
    status: 'pending' | 'accepted' | 'declined' | 'expired';
}

interface FriendRequest {
    id: string;
    fromUserId: string;
    fromUsername: string;
    toUserId: string;
    status: 'pending' | 'accepted' | 'declined';
    createdAt: number;
}

interface PushTokenData {
    token: string;
    updatedAt: number;
}

interface UserAccount {
    id: string;
    username: string;
    pinHash: string;
    createdAt: number;
    lastLoginAt: number;
    // ... other fields optional for auth lookup
}

// Simple hash function matching client-side implementation
function hashPin(pin: string): string {
    let hash = 0;
    for (let i = 0; i < pin.length; i++) {
        const char = pin.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16);
}

/**
 * Register a new user
 * Returns a custom Firebase Auth token
 */
export const register = functions.https.onCall(async (data, context) => {
    const { username, pin } = data;

    if (!username || !pin) {
        throw new functions.https.HttpsError('invalid-argument', 'Username and PIN are required');
    }

    if (username.length < 2 || username.length > 20) {
        throw new functions.https.HttpsError('invalid-argument', 'Username must be between 2 and 20 characters');
    }

    if (pin.length !== 4 || !/^\d+$/.test(pin)) {
        throw new functions.https.HttpsError('invalid-argument', 'PIN must be 4 digits');
    }

    const normalizedUsername = username.toLowerCase().trim();
    const pinHash = hashPin(pin);

    // Check if username exists
    const usersRef = db.ref('users');
    const snapshot = await usersRef.orderByChild('username').equalTo(normalizedUsername).once('value');

    if (snapshot.exists()) {
        throw new functions.https.HttpsError('already-exists', 'Username is already taken');
    }

    // Create user
    const userId = db.ref().child('users').push().key;
    if (!userId) {
        throw new functions.https.HttpsError('internal', 'Failed to generate user ID');
    }

    const now = Date.now();
    const newUser = {
        id: userId,
        username: normalizedUsername,
        pinHash: pinHash,
        createdAt: now,
        lastLoginAt: now,
        stats: {
            gamesPlayed: 0,
            gamesWon: 0,
            roundsWon: 0,
            roundsLost: 0,
            timesSabotaged: 0,
            timesSaboteur: 0,
            totalCurrencyEarned: 0,
            totalXPEarned: 0,
            highestLevel: 0
        },
        currency: 5, // Starting currency
        xp: 0,
        purchasedItems: [],
        cosmetics: {
            brushesUnlocked: ['basic'],
            colorsUnlocked: ['#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF'],
            badges: [],
            activeFont: 'default'
        }
    };

    await db.ref(`users/${userId}`).set(newUser);

    // Mint custom token
    const token = await admin.auth().createCustomToken(userId, { username: normalizedUsername });

    return { token, user: newUser };
});

/**
 * Login existing user
 * Returns a custom Firebase Auth token
 */
export const login = functions.https.onCall(async (data, context) => {
    const { username, pin } = data;

    if (!username || !pin) {
        throw new functions.https.HttpsError('invalid-argument', 'Username and PIN are required');
    }

    const normalizedUsername = username.toLowerCase().trim();
    const pinHash = hashPin(pin);

    const usersRef = db.ref('users');
    const snapshot = await usersRef.orderByChild('username').equalTo(normalizedUsername).once('value');

    if (!snapshot.exists()) {
        throw new functions.https.HttpsError('not-found', 'User not found');
    }

    const usersMap = snapshot.val();
    const userIds = Object.keys(usersMap);
    if (userIds.length === 0) {
        throw new functions.https.HttpsError('not-found', 'User not found');
    }
    const userId = userIds[0];
    const userData = usersMap[userId];
    const user = { ...userData, id: userId } as UserAccount;

    if (user.pinHash !== pinHash) {
        throw new functions.https.HttpsError('unauthenticated', 'Incorrect PIN');
    }

    // Update last login
    const userRef = db.ref(`users/${user.id}`);
    await userRef.update({ lastLoginAt: Date.now() });

    try {
        // Mint custom token
        const token = await admin.auth().createCustomToken(user.id, { username: user.username });
        return { token, user };
    } catch (error) {
        console.error('Error creating custom token:', error);
        throw new functions.https.HttpsError('internal', 'Failed to create auth token. Please check server logs.');
    }
});

/**
 * Cloud Function triggered when a new game invite is created
 * Sends a push notification to the invited user
 */
export const onInviteCreated = functions.database
    .ref('/invites/{inviteId}')
    .onCreate(async (snapshot, context) => {
        const invite = snapshot.val() as GameInvite & { origin?: string; notificationSent?: boolean };
        const inviteId = context.params.inviteId;

        console.log(`New invite created: ${inviteId}`, invite);

        // Only process pending invites
        if (invite.status !== 'pending') {
            console.log('Invite is not pending, skipping notification');
            return null;
        }

        // Idempotency Check: Don't send if already sent
        if (invite.notificationSent) {
            console.log('Notification already sent for this invite, skipping');
            return null;
        }

        try {
            // Mark as sent immediately to prevent race conditions (idempotency)
            // We use a transaction or simple update. Since this is onCreate, we might just update.
            await snapshot.ref.update({ notificationSent: true });

            // Get the recipient's push token
            const tokenSnapshot = await db.ref(`/pushTokens/${invite.toUserId}`).once('value');

            if (!tokenSnapshot.exists()) {
                console.log(`No push token found for user ${invite.toUserId}`);
                return null;
            }

            const tokenData = tokenSnapshot.val() as PushTokenData;
            const fcmToken = tokenData.token;

            if (!fcmToken) {
                console.log('Push token is empty');
                return null;
            }

            // DYNAMIC LINK GENERATION
            // If origin is provided and valid (not localhost for prod links), use it.
            // Otherwise fallback to production Vercel app.
            let baseUrl = 'https://ano-game.vercel.app';
            if (invite.origin && !invite.origin.includes('localhost') && !invite.origin.includes('127.0.0.1')) {
                baseUrl = invite.origin;
            }

            const linkUrl = `${baseUrl}/?join=${invite.roomCode}`;

            // Build the notification payload
            const message: admin.messaging.Message = {
                token: fcmToken,
                notification: {
                    title: '🎮 Game Invite!',
                    body: `${invite.fromUsername} wants you to join their game!`
                },
                data: {
                    type: 'game_invite',
                    inviteId: inviteId,
                    roomCode: invite.roomCode,
                    fromUserId: invite.fromUserId,
                    fromUsername: invite.fromUsername,
                    // Click action to open the app and navigate to the invite
                    click_action: linkUrl
                },
                webpush: {
                    fcmOptions: {
                        link: linkUrl
                    },
                    notification: {
                        icon: '/icons/icon-192x192.png',
                        badge: '/icons/badge-72x72.png',
                        vibrate: [100, 50, 100],
                        requireInteraction: true,
                        actions: [
                            {
                                action: 'join',
                                title: '🎮 Join Game'
                            },
                            {
                                action: 'decline',
                                title: '❌ Decline'
                            }
                        ]
                    }
                }
            };

            // Send the notification
            const response = await messaging.send(message);
            console.log('Notification sent successfully:', response);

            return response;
        } catch (error) {
            console.error('Error sending notification:', error);

            // If the token is invalid, clean it up
            if ((error as any).code === 'messaging/invalid-registration-token' ||
                (error as any).code === 'messaging/registration-token-not-registered') {
                console.log('Removing invalid token for user:', invite.toUserId);
                await db.ref(`/pushTokens/${invite.toUserId}`).remove();
            }

            throw error;
        }
    });

/**
 * Cloud Function to clean up expired invites (older than 5 minutes)
 * Runs every hour
 */
export const cleanupExpiredInvites = functions.pubsub
    .schedule('every 60 minutes')
    .onRun(async () => {
        const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);

        const invitesSnapshot = await db.ref('/invites')
            .orderByChild('sentAt')
            .endAt(fiveMinutesAgo)
            .once('value');

        if (!invitesSnapshot.exists()) {
            console.log('No expired invites to clean up');
            return null;
        }

        const updates: { [key: string]: null } = {};
        let count = 0;

        invitesSnapshot.forEach((child) => {
            const invite = child.val() as GameInvite;
            // Only delete pending invites
            if (invite.status === 'pending') {
                updates[`/invites/${child.key}`] = null;
                count++;
            }
        });

        if (count > 0) {
            await db.ref().update(updates);
            console.log(`Cleaned up ${count} expired invites`);
        }

        return null;
    });

/**
 * HTTP endpoint to manually send a notification (for testing)
 */
export const sendTestNotification = functions.https.onRequest(async (req, res) => {
    // Only allow POST requests
    if (req.method !== 'POST') {
        res.status(405).send('Method Not Allowed');
        return;
    }

    const { userId, title, body } = req.body;

    if (!userId || !title || !body) {
        res.status(400).json({ error: 'Missing required fields: userId, title, body' });
        return;
    }

    try {
        const tokenSnapshot = await db.ref(`/pushTokens/${userId}`).once('value');

        if (!tokenSnapshot.exists()) {
            res.status(404).json({ error: 'No push token found for user' });
            return;
        }

        const tokenData = tokenSnapshot.val() as PushTokenData;

        const message: admin.messaging.Message = {
            token: tokenData.token,
            notification: { title, body }
        };

        const response = await messaging.send(message);
        res.json({ success: true, messageId: response });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to send notification' });
    }
});

/**
 * Cloud Function triggered when a friend request is created
 * Sends push notification
 */
export const onFriendRequestCreated = functions.database
    .ref('/friendRequests/{requestId}')
    .onCreate(async (snapshot, context) => {
        const request = snapshot.val() as FriendRequest;
        const requestId = context.params.requestId;

        console.log(`New friend request: ${requestId}`, request);

        try {
            const tokenSnapshot = await db.ref(`/pushTokens/${request.toUserId}`).once('value');
            if (!tokenSnapshot.exists()) return null;

            const tokenData = tokenSnapshot.val() as PushTokenData;

            const message: admin.messaging.Message = {
                token: tokenData.token,
                notification: {
                    title: '👥 New Friend Request',
                    body: `${request.fromUsername} wants to be friends!`
                },
                data: {
                    type: 'friend_request',
                    requestId: requestId,
                    fromUserId: request.fromUserId
                }
            };

            await messaging.send(message);
            return null;
        } catch (error) {
            console.error('Error sending friend request notification:', error);
            return null;
        }
    });

/**
 * Cloud Function triggered when friend request status changes
 * Handles mutual friend addition on acceptance
 */
export const onFriendRequestStatusChanged = functions.database
    .ref('/friendRequests/{requestId}/status')
    .onUpdate(async (change, context) => {
        // const startStatus = change.before.val();
        const endStatus = change.after.val();

        if (endStatus !== 'accepted') return null;

        const requestId = context.params.requestId;
        // Fetch full request to get user IDs
        const requestSnapshot = await db.ref(`/friendRequests/${requestId}`).once('value');
        const request = requestSnapshot.val() as FriendRequest;

        console.log(`Friend request accepted: ${requestId}`, request);

        try {
            // Add each to the other's friend list using transactions for safety
            const fromRef = db.ref(`/users/${request.fromUserId}/friends`);
            const toRef = db.ref(`/users/${request.toUserId}/friends`);

            await Promise.all([
                fromRef.transaction((friends) => {
                    const list = friends || [];
                    if (!list.includes(request.toUserId)) list.push(request.toUserId);
                    return list;
                }),
                toRef.transaction((friends) => {
                    const list = friends || [];
                    if (!list.includes(request.fromUserId)) list.push(request.fromUserId);
                    return list;
                })
            ]);

            // Notify the sender that request was accepted
            const tokenSnapshot = await db.ref(`/pushTokens/${request.fromUserId}`).once('value');
            if (tokenSnapshot.exists()) {
                const tokenData = tokenSnapshot.val() as PushTokenData;
                await messaging.send({
                    token: tokenData.token,
                    notification: {
                        title: '✅ Friend Request Accepted',
                        body: 'You are now friends!' // Could fetch username but efficient enough
                    },
                    data: {
                        type: 'friend_accepted',
                        friendId: request.toUserId
                    }
                });
            }

            return null;
        } catch (error) {
            console.error('Error handling friend acceptance:', error);
            return null;
        }
    });
