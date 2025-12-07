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

/**
 * Cloud Function triggered when a new game invite is created
 * Sends a push notification to the invited user
 */
export const onInviteCreated = functions.database
    .ref('/invites/{inviteId}')
    .onCreate(async (snapshot, context) => {
        const invite = snapshot.val() as GameInvite;
        const inviteId = context.params.inviteId;

        console.log(`New invite created: ${inviteId}`, invite);

        // Only process pending invites
        if (invite.status !== 'pending') {
            console.log('Invite is not pending, skipping notification');
            return null;
        }

        try {
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
                    click_action: `https://ano-game.vercel.app/?join=${invite.roomCode}`
                },
                webpush: {
                    fcmOptions: {
                        link: `https://ano-game.vercel.app/?join=${invite.roomCode}`
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
