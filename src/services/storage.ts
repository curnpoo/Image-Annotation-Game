import { ref, set, get, onValue, off } from 'firebase/database';
import { database } from '../firebase';
import type { GameRoom, Player, Annotation } from '../types';

const ROOMS_PATH = 'rooms';

export const StorageService = {
    // Helpers
    normalizeRoom: (data: any): GameRoom => {
        if (!data.players) data.players = [];
        else if (!Array.isArray(data.players)) data.players = Object.values(data.players);

        if (!data.annotations) data.annotations = [];
        else if (!Array.isArray(data.annotations)) data.annotations = Object.values(data.annotations);

        if (!data.turnOrder) data.turnOrder = [];
        else if (!Array.isArray(data.turnOrder)) data.turnOrder = Object.values(data.turnOrder);

        return data as GameRoom;
    },

    // Room Management
    createRoom: async (roomCode: string, hostPlayer: Player): Promise<GameRoom> => {
        const room: GameRoom = {
            roomCode,
            status: 'lobby',
            roundNumber: 0,
            turnOrder: [],
            currentTurnIndex: 0,
            turnStatus: 'waiting',
            players: [hostPlayer],
            annotations: [],
            createdAt: Date.now(),
        };

        const roomRef = ref(database, `${ROOMS_PATH}/${roomCode}`);
        await set(roomRef, room);
        return room;
    },

    getRoom: async (roomCode: string): Promise<GameRoom | null> => {
        const roomRef = ref(database, `${ROOMS_PATH}/${roomCode}`);
        const snapshot = await get(roomRef);
        if (snapshot.exists()) {
            return StorageService.normalizeRoom(snapshot.val());
        }
        return null;
    },

    saveRoom: async (room: GameRoom): Promise<void> => {
        const roomRef = ref(database, `${ROOMS_PATH}/${room.roomCode}`);
        await set(roomRef, room);
    },

    updateRoom: async (roomCode: string, updateFn: (room: GameRoom) => GameRoom): Promise<GameRoom | null> => {
        try {
            const room = await StorageService.getRoom(roomCode);
            if (room) {
                const updatedRoom = updateFn(room);
                await StorageService.saveRoom(updatedRoom);
                return updatedRoom;
            }
            return null;
        } catch (error) {
            console.error('Error updating room:', error);
            throw error;
        }
    },

    // Subscribe to room changes (real-time)
    subscribeToRoom: (roomCode: string, callback: (room: GameRoom | null) => void): (() => void) => {
        console.log('Subscribing to room:', roomCode);
        const roomRef = ref(database, `${ROOMS_PATH}/${roomCode}`);

        const listener = onValue(roomRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = StorageService.normalizeRoom(snapshot.val());
                callback(data);
            } else {
                callback(null);
            }
        }, (error) => {
            console.error('Firebase subscription error:', error);
        });

        // Return unsubscribe function
        return () => {
            off(roomRef, 'value', listener);
        };
    },

    // Player Session (still use localStorage for individual session)
    saveSession: (player: Player): void => {
        localStorage.setItem('aic_game_session', JSON.stringify(player));
    },

    getSession: (): Player | null => {
        const data = localStorage.getItem('aic_game_session');
        return data ? JSON.parse(data) : null;
    },

    // Helpers
    generateRoomCode: (): string => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    },

    joinRoom: async (roomCode: string, player: Player): Promise<GameRoom | null> => {
        const room = await StorageService.getRoom(roomCode);
        if (!room) return null;

        // Check if player already in room
        const existingPlayerIndex = room.players.findIndex(p => p.id === player.id);
        if (existingPlayerIndex >= 0) {
            room.players[existingPlayerIndex] = { ...player, lastSeen: Date.now() };
        } else {
            room.players.push({ ...player, lastSeen: Date.now() });
        }

        await StorageService.saveRoom(room);
        return room;
    },

    // Turn Logic
    startTurn: async (roomCode: string): Promise<GameRoom | null> => {
        return StorageService.updateRoom(roomCode, (r) => ({
            ...r,
            turnStatus: 'drawing',
            turnEndsAt: Date.now() + 10000 + 1000 // 10s + 1s buffer
        }));
    },

    endTurn: async (roomCode: string, annotation: Annotation): Promise<GameRoom | null> => {
        console.log('Ending turn for room:', roomCode);
        return StorageService.updateRoom(roomCode, (r) => {
            // Ensure turnOrder exists (it should due to normalizeRoom, but being safe)
            const turnOrder = r.turnOrder || [];
            const nextIndex = r.currentTurnIndex + 1;
            const isRoundOver = nextIndex >= turnOrder.length;

            console.log('Turn update:', {
                currentIndex: r.currentTurnIndex,
                nextIndex,
                totalPlayers: turnOrder.length,
                isRoundOver
            });

            return {
                ...r,
                annotations: [...(r.annotations || []), annotation],
                currentTurnIndex: isRoundOver ? 0 : nextIndex,
                turnStatus: 'waiting',
                status: isRoundOver ? 'reviewing' : 'annotating',
                turnEndsAt: null // Firebase doesn't accept undefined, use null to clear
            };
        });
    }
};
