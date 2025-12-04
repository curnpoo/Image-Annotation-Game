import type { GameRoom, Player, Annotation } from '../types';

// Simulation of window.storage using localStorage for multi-tab support
const STORAGE_PREFIX = 'aic_game_';

export const StorageService = {
    // Room Management
    createRoom: (roomCode: string, hostPlayer: Player): GameRoom => {
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
        StorageService.saveRoom(room);
        return room;
    },

    getRoom: (roomCode: string): GameRoom | null => {
        const data = localStorage.getItem(`${STORAGE_PREFIX}room_${roomCode}`);
        return data ? JSON.parse(data) : null;
    },

    saveRoom: (room: GameRoom) => {
        localStorage.setItem(`${STORAGE_PREFIX}room_${room.roomCode}`, JSON.stringify(room));
    },

    updateRoom: (roomCode: string, updateFn: (room: GameRoom) => GameRoom) => {
        const room = StorageService.getRoom(roomCode);
        if (room) {
            const updatedRoom = updateFn(room);
            StorageService.saveRoom(updatedRoom);
            return updatedRoom;
        }
        return null;
    },

    // Player Session
    saveSession: (player: Player) => {
        localStorage.setItem(`${STORAGE_PREFIX}session`, JSON.stringify(player));
    },

    getSession: (): Player | null => {
        const data = localStorage.getItem(`${STORAGE_PREFIX}session`);
        return data ? JSON.parse(data) : null;
    },

    // Helpers
    generateRoomCode: (): string => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No I, O, 0, 1 to avoid confusion
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    },

    joinRoom: (roomCode: string, player: Player): GameRoom | null => {
        const room = StorageService.getRoom(roomCode);
        if (!room) return null;

        // Check if player already in room
        const existingPlayerIndex = room.players.findIndex(p => p.id === player.id);
        if (existingPlayerIndex >= 0) {
            room.players[existingPlayerIndex] = { ...player, lastSeen: Date.now() };
        } else {
            room.players.push({ ...player, lastSeen: Date.now() });
        }

        StorageService.saveRoom(room);
        return room;
    },

    // Turn Logic
    startTurn: (roomCode: string): GameRoom | null => {
        return StorageService.updateRoom(roomCode, (r) => ({
            ...r,
            turnStatus: 'drawing',
            turnEndsAt: Date.now() + 10000 + 1000 // 10s + 1s buffer
        }));
    },

    endTurn: (roomCode: string, annotation: Annotation): GameRoom | null => {
        return StorageService.updateRoom(roomCode, (r) => {
            const nextIndex = r.currentTurnIndex + 1;
            const isRoundOver = nextIndex >= r.turnOrder.length;

            return {
                ...r,
                annotations: [...r.annotations, annotation],
                currentTurnIndex: isRoundOver ? 0 : nextIndex, // Loop or end? Prompt says "Review Phase" after round.
                turnStatus: 'waiting',
                status: isRoundOver ? 'reviewing' : 'annotating',
                turnEndsAt: undefined
            };
        });
    }
};
