import { ref, push, onValue, set, query, limitToLast, serverTimestamp, off } from 'firebase/database';
import { database } from '../firebase';
import type { ChatMessage } from '../types';

const CHATS_PATH = 'chats';

export const ChatService = {
    /**
     * Subscribe to chat messages for a specific room
     * @param roomCode 
     * @param callback 
     * @returns unsubscribe function
     */
    subscribeToChat: (roomCode: string, callback: (messages: ChatMessage[]) => void): (() => void) => {
        const chatRef = query(ref(database, `${CHATS_PATH}/${roomCode}`), limitToLast(50));

        const listener = onValue(chatRef, (snapshot) => {
            const messages: ChatMessage[] = [];
            snapshot.forEach((child) => {
                messages.push({
                    id: child.key!,
                    ...child.val()
                });
            });
            callback(messages);
        });

        return () => off(chatRef, 'value', listener);
    },

    /**
     * Send a message to the chat
     */
    sendMessage: async (roomCode: string, message: Omit<ChatMessage, 'id' | 'timestamp'>): Promise<void> => {
        const chatRef = ref(database, `${CHATS_PATH}/${roomCode}`);
        const newMsgRef = push(chatRef);
        await set(newMsgRef, {
            ...message,
            timestamp: serverTimestamp()
        });
    }
};
