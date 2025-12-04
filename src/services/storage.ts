import { ref, set, get, onValue, off } from 'firebase/database';
import { database } from '../firebase';
import type { GameRoom, Player, Annotation } from '../types';

const ROOMS_PATH = 'rooms';

export const StorageService = {
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
        return snapshot.exists() ? snapshot.val() as GameRoom : null;
    },

    saveRoom: async (room: GameRoom): Promise<void> => {
        const roomRef = ref(database, `${ROOMS_PATH}/${room.roomCode}`);
        await set(roomRef, room);
    },

    updateRoom: async (roomCode: string, updateFn: (room: GameRoom) => GameRoom): Promise<GameRoom | null> => {
        const room = await StorageService.getRoom(roomCode);
        if (room) {
            const updatedRoom = updateFn(room);
            await StorageService.saveRoom(updatedRoom);
            return updatedRoom;
        }
        return null;
    },

    // Subscribe to room changes (real-time)
    subscribeToRoom: (roomCode: string, callback: (room: GameRoom | null) => void): (() => void) => {
        const roomRef = ref(database, `${ROOMS_PATH}/${roomCode}`);

        const listener = onValue(roomRef, (snapshot) => {
            if (snapshot.exists()) {
                callback(snapshot.val() as GameRoom);
            } else {
                callback(null);
            }
        });

        // Return unsubscribe function
        return () => off(roomRef, 'value', listener);
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
        return StorageService.updateRoom(roomCode, (r) => {
            const nextIndex = r.currentTurnIndex + 1;
            const isRoundOver = nextIndex >= r.turnOrder.length;

            return {
                ...r,
                annotations: [...(r.annotations || []), annotation],
                currentTurnIndex: isRoundOver ? 0 : nextIndex,
                turnStatus: 'waiting',
                status: isRoundOver ? 'reviewing' : 'annotating',
                turnEndsAt: undefined
            };
        });
    }
};
