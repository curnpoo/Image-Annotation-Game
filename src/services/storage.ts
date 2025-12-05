import { ref, set, get, onValue, runTransaction, remove } from 'firebase/database';
import { database } from '../firebase';
import type { GameRoom, Player, GameSettings, BlockInfo, PlayerState, PlayerDrawing, RoundResult, RoomHistoryEntry, ChatMessage } from '../types';
import { generateId } from '../utils/id';

const ROOMS_PATH = 'rooms';

const DEFAULT_SETTINGS: GameSettings = {
    timerDuration: 15,
    totalRounds: 5
};

export const StorageService = {
    // Helpers
    normalizeRoom: (data: any): GameRoom => {
        if (!data.players) data.players = [];
        else if (!Array.isArray(data.players)) data.players = Object.values(data.players);

        if (!data.waitingPlayers) data.waitingPlayers = [];
        else if (!Array.isArray(data.waitingPlayers)) data.waitingPlayers = Object.values(data.waitingPlayers);

        if (!data.playerStates) data.playerStates = {};
        if (!data.votes) data.votes = {};
        if (!data.scores) data.scores = {};
        if (!data.roundResults) data.roundResults = [];
        else if (!Array.isArray(data.roundResults)) data.roundResults = Object.values(data.roundResults);

        if (!data.chatEvents) data.chatEvents = [];
        else if (!Array.isArray(data.chatEvents)) data.chatEvents = Object.values(data.chatEvents);

        if (!data.settings) data.settings = DEFAULT_SETTINGS;

        return data as GameRoom;
    },

    // Generate random block for the image (50% of image size = 1/4 area)
    generateBlock: (): BlockInfo => {
        const isCircle = Math.random() > 0.75; // 25% chance of circle (75% square)
        const size = 50; // Fixed 50% of image

        if (isCircle) {
            // Circle somewhere in the middle area
            return {
                type: 'circle',
                x: Math.random() * 50, // 0-50%
                y: Math.random() * 50,
                size
            };
        } else {
            // Square in one of the corners
            const corners = [
                { x: 0, y: 0 },    // top-left
                { x: 50, y: 0 },   // top-right
                { x: 0, y: 50 },   // bottom-left
                { x: 50, y: 50 }   // bottom-right
            ];
            const corner = corners[Math.floor(Math.random() * corners.length)];
            return {
                type: 'square',
                x: corner.x,
                y: corner.y,
                size
            };
        }
    },

    // --- Persistence ---
    saveRoomCode: (code: string) => {
        localStorage.setItem('lastRoomCode', code);
    },

    getRoomCode: (): string | null => {
        return localStorage.getItem('lastRoomCode');
    },

    leaveRoom: () => {
        localStorage.removeItem('lastRoomCode');
    },

    // --- Moderation ---
    kickPlayer: async (roomCode: string, playerId: string): Promise<void> => {
        const roomRef = ref(database, `${ROOMS_PATH}/${roomCode}`);
        await runTransaction(roomRef, (room) => {
            if (!room) return null;

            if (room.players) {
                room.players = room.players.filter((p: Player) => p.id !== playerId);
            }
            if (room.waitingPlayers) {
                room.waitingPlayers = room.waitingPlayers.filter((p: Player) => p.id !== playerId);
            }
            // Also remove their state if exists
            if (room.playerStates && room.playerStates[playerId]) {
                delete room.playerStates[playerId];
            }
            return room;
        });
    },

    // --- History ---
    saveRoomToHistory: (room: GameRoom) => {
        const history = StorageService.getHistory();
        const host = room.players.find(p => p.id === room.hostId);
        const newEntry: RoomHistoryEntry = {
            roomCode: room.roomCode,
            lastSeen: Date.now(),
            playerCount: room.players.length,
            roundNumber: room.roundNumber,
            hostName: host?.name
        };

        // Remove existing entry for this room
        const filtered = history.filter(h => h.roomCode !== room.roomCode);

        // Add to top, limit to 5
        const newHistory = [newEntry, ...filtered].slice(0, 5);
        localStorage.setItem('aic_room_history', JSON.stringify(newHistory));
    },

    getHistory: (): RoomHistoryEntry[] => {
        const data = localStorage.getItem('aic_room_history');
        return data ? JSON.parse(data) : [];
    },

    updateHistoryWinner: (roomCode: string, winnerName: string) => {
        const history = StorageService.getHistory();
        const index = history.findIndex(h => h.roomCode === roomCode);
        if (index >= 0) {
            history[index].winnerName = winnerName;
            history[index].endReason = 'finished';
            localStorage.setItem('aic_room_history', JSON.stringify(history));
        }
    },

    updateHistoryEndState: (roomCode: string, reason: 'finished' | 'early' | 'cancelled', leaderName?: string) => {
        const history = StorageService.getHistory();
        const index = history.findIndex(h => h.roomCode === roomCode);
        if (index >= 0) {
            history[index].endReason = reason;
            if (leaderName) history[index].leaderName = leaderName;
            localStorage.setItem('aic_room_history', JSON.stringify(history));
        }
    },

    updateHistoryStatus: (roomCode: string, status: 'left') => {
        const history = StorageService.getHistory();
        const index = history.findIndex(h => h.roomCode === roomCode);
        if (index >= 0) {
            history[index].endReason = status;
            localStorage.setItem('aic_room_history', JSON.stringify(history));
        }
    },

    closeRoom: async (roomCode: string): Promise<void> => {
        const roomRef = ref(database, `${ROOMS_PATH}/${roomCode}`);
        await remove(roomRef);
    },

    // --- Room Management ---
    createRoom: async (hostPlayer: Player): Promise<string> => {
        const roomCode = StorageService.generateRoomCode();
        const roomRef = ref(database, `rooms/${roomCode}`);

        const newRoom: GameRoom = {
            roomCode: roomCode,
            hostId: hostPlayer.id,
            players: [hostPlayer],
            waitingPlayers: [],
            currentUploaderId: hostPlayer.id,
            status: 'lobby',
            createdAt: Date.now(),
            settings: {
                timerDuration: 15,
                totalRounds: 5
            },
            roundNumber: 0,
            playerStates: {},
            votes: {},
            scores: {},
            roundResults: []
        };

        await set(roomRef, newRoom);
        await set(roomRef, newRoom);
        StorageService.saveRoomCode(roomCode); // Save for persistence
        StorageService.saveRoomToHistory(newRoom);
        return roomCode;
    },

    getRoom: async (roomCode: string): Promise<GameRoom | null> => {
        const roomRef = ref(database, `${ROOMS_PATH}/${roomCode}`);
        const snapshot = await get(roomRef);
        if (!snapshot.exists()) return null;
        return StorageService.normalizeRoom(snapshot.val());
    },

    saveRoom: async (room: GameRoom): Promise<void> => {
        const roomRef = ref(database, `${ROOMS_PATH}/${room.roomCode}`);
        await set(roomRef, room);
    },

    updateRoom: async (roomCode: string, updateFn: (room: GameRoom) => GameRoom): Promise<GameRoom | null> => {
        const roomRef = ref(database, `${ROOMS_PATH}/${roomCode}`);
        const result = await runTransaction(roomRef, (currentData) => {
            if (!currentData) return null; // Room doesn't exist
            const room = StorageService.normalizeRoom(currentData);
            return updateFn(room);
        });

        if (result.committed && result.snapshot.exists()) {
            return StorageService.normalizeRoom(result.snapshot.val());
        }
        return null;
    },

    // Subscribe to room changes (real-time)
    subscribeToRoom: (roomCode: string, callback: (room: GameRoom | null) => void): (() => void) => {
        console.log('Subscribing to room:', roomCode);
        const roomRef = ref(database, `${ROOMS_PATH}/${roomCode}`);

        const unsubscribe = onValue(roomRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = StorageService.normalizeRoom(snapshot.val());
                callback(data);
            } else {
                callback(null);
            }
        }, (error) => {
            console.error('Firebase subscription error:', error);
        });

        return unsubscribe;
    },

    // Player Session (localStorage for individual session)
    saveSession: (player: Player): void => {
        localStorage.setItem('aic_game_session', JSON.stringify(player));
    },

    getSession: (): Player | null => {
        const data = localStorage.getItem('aic_game_session');
        return data ? JSON.parse(data) : null;
    },

    generateRoomCode: (): string => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = '';
        for (let i = 0; i < 4; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    },

    // Initialize a new round (pick uploader)
    initiateRound: async (roomCode: string): Promise<GameRoom | null> => {
        return StorageService.updateRoom(roomCode, (r) => {
            // Merge waiting players
            const waiting = r.waitingPlayers || [];
            const allPlayers = [...r.players, ...waiting];

            // Initialize scores/states for new players
            waiting.forEach(p => {
                if (!r.scores[p.id]) r.scores[p.id] = 0;
                if (!r.playerStates[p.id]) r.playerStates[p.id] = { status: 'waiting' };
            });

            const randomPlayer = allPlayers[Math.floor(Math.random() * allPlayers.length)];
            return {
                ...r,
                players: allPlayers,
                waitingPlayers: [],
                status: 'uploading',
                currentUploaderId: randomPlayer.id,
                currentImage: null,
                block: null,
                playerStates: {},
                votes: {}
            };
        });
    },

    joinRoom: async (roomCode: string, player: Player): Promise<GameRoom | null> => {
        const room = await StorageService.getRoom(roomCode);
        if (!room) return null;

        // Check if already in players
        const existingPlayerIndex = room.players.findIndex(p => p.id === player.id);
        if (existingPlayerIndex >= 0) {
            room.players[existingPlayerIndex] = { ...player, lastSeen: Date.now() };
            await StorageService.saveRoom(room);
            StorageService.saveRoomToHistory(room);
            return room;
        }

        // Check if already in waitingPlayers
        const existingWaitingIndex = room.waitingPlayers?.findIndex(p => p.id === player.id) ?? -1;
        if (existingWaitingIndex >= 0 && room.waitingPlayers) {
            room.waitingPlayers[existingWaitingIndex] = { ...player, lastSeen: Date.now() };
            await StorageService.saveRoom(room);
            StorageService.saveRoomToHistory(room);
            return room;
        }

        // New player
        if (room.status === 'lobby') {
            room.players.push({ ...player, lastSeen: Date.now() });
            // Init state/score
            if (!room.playerStates[player.id]) {
                room.playerStates[player.id] = { status: 'waiting' };
            }
            if (room.scores[player.id] === undefined) {
                room.scores[player.id] = 0;
            }
        } else {
            // Game in progress -> Waiting Room
            if (!room.waitingPlayers) room.waitingPlayers = [];
            room.waitingPlayers.push({ ...player, lastSeen: Date.now() });
        }

        await StorageService.saveRoom(room);
        StorageService.saveRoomToHistory(room);
        return room;
    },

    removePlayerFromRoom: async (roomCode: string, playerId: string): Promise<void> => {
        await StorageService.updateRoom(roomCode, (r) => {
            const newPlayers = r.players.filter(p => p.id !== playerId);
            const newWaiting = r.waitingPlayers?.filter(p => p.id !== playerId) || [];

            let newHostId = r.hostId;
            if (playerId === r.hostId) {
                // Host left, assign new host
                if (newPlayers.length > 0) {
                    newHostId = newPlayers[0].id;
                } else if (newWaiting.length > 0) {
                    newHostId = newWaiting[0].id;
                }
            }

            return {
                ...r,
                players: newPlayers,
                waitingPlayers: newWaiting,
                hostId: newHostId
            };
        });
    },

    // Heartbeat to update lastSeen
    heartbeat: async (roomCode: string, playerId: string): Promise<void> => {
        StorageService.updateLocalActivity(); // Keep local session alive
        const roomRef = ref(database, `${ROOMS_PATH}/${roomCode}`);
        await runTransaction(roomRef, (room) => {
            if (!room) return null;

            // Update in players list
            if (room.players) {
                const pIndex = room.players.findIndex((p: any) => p.id === playerId);
                if (pIndex >= 0) {
                    room.players[pIndex].lastSeen = Date.now();
                }
            }

            // Update in waiting list
            if (room.waitingPlayers) {
                const wIndex = room.waitingPlayers.findIndex((p: any) => p.id === playerId);
                if (wIndex >= 0) {
                    room.waitingPlayers[wIndex].lastSeen = Date.now();
                }
            }

            return room;
        });
    },

    // Local Activity Tracking
    updateLocalActivity: () => {
        localStorage.setItem('aic_last_active', Date.now().toString());
    },

    getLastLocalActivity: (): number => {
        const val = localStorage.getItem('aic_last_active');
        return val ? parseInt(val, 10) : 0;
    },

    // Game Settings
    updateSettings: async (roomCode: string, settings: Partial<GameSettings>): Promise<GameRoom | null> => {
        return StorageService.updateRoom(roomCode, (r) => ({
            ...r,
            settings: { ...r.settings, ...settings }
        }));
    },

    // Start a new round
    startRound: async (roomCode: string, imageUrl: string, uploadedBy: string): Promise<GameRoom | null> => {
        const block = StorageService.generateBlock();

        return StorageService.updateRoom(roomCode, (r) => {
            // Reset player states for new round
            const playerStates: { [id: string]: PlayerState } = {};
            r.players.forEach(p => {
                playerStates[p.id] = { status: 'waiting' };
            });

            return {
                ...r,
                status: 'drawing',
                roundNumber: r.roundNumber + 1,
                currentImage: {
                    url: imageUrl,
                    uploadedBy,
                    uploadedAt: Date.now()
                },
                block,
                playerStates,
                votes: {}
            };
        });
    },

    // Player ready to draw (starts their personal timer)
    playerReady: async (roomCode: string, playerId: string): Promise<GameRoom | null> => {
        return StorageService.updateRoom(roomCode, (r) => ({
            ...r,
            playerStates: {
                ...r.playerStates,
                [playerId]: {
                    ...r.playerStates[playerId],
                    status: 'drawing',
                    timerStartedAt: Date.now()
                }
            }
        }));
    },

    // Submit drawing
    submitDrawing: async (roomCode: string, drawing: PlayerDrawing): Promise<GameRoom | null> => {
        return StorageService.updateRoom(roomCode, (r) => {
            const newPlayerStates = {
                ...r.playerStates,
                [drawing.playerId]: {
                    status: 'submitted' as const,
                    drawing
                }
            };

            // Check if all players have submitted
            const allSubmitted = r.players.every(p =>
                newPlayerStates[p.id]?.status === 'submitted'
            );

            return {
                ...r,
                playerStates: newPlayerStates,
                status: allSubmitted ? 'voting' : r.status
            };
        });
    },

    // Submit vote
    submitVote: async (roomCode: string, oderId: string, votedForId: string): Promise<GameRoom | null> => {
        return StorageService.updateRoom(roomCode, (r) => {
            const newVotes = { ...r.votes, [oderId]: votedForId };

            // Check if all players have voted
            const allVoted = r.players.every(p => newVotes[p.id]);

            // If all voted, calculate results
            if (allVoted) {
                // Count votes
                const voteCounts: { [playerId: string]: number } = {};
                r.players.forEach(p => { voteCounts[p.id] = 0; });
                Object.values(newVotes).forEach(votedFor => {
                    voteCounts[votedFor] = (voteCounts[votedFor] || 0) + 1;
                });

                // Sort by votes
                const rankings = r.players
                    .map(p => ({
                        playerId: p.id,
                        playerName: p.name,
                        votes: voteCounts[p.id] || 0,
                        points: 0
                    }))
                    .sort((a, b) => b.votes - a.votes);

                // Award points (3, 2, 1 for top 3)
                if (rankings[0]) rankings[0].points = 3;
                if (rankings[1]) rankings[1].points = 2;
                if (rankings[2]) rankings[2].points = 1;

                // Update scores
                const newScores = { ...r.scores };
                rankings.forEach(rank => {
                    newScores[rank.playerId] = (newScores[rank.playerId] || 0) + rank.points;
                });

                const roundResult: RoundResult = {
                    roundNumber: r.roundNumber,
                    rankings
                };

                const isFinalRound = r.roundNumber >= r.settings.totalRounds;

                return {
                    ...r,
                    votes: newVotes,
                    scores: newScores,
                    roundResults: [...r.roundResults, roundResult],
                    status: isFinalRound ? 'final' : 'results'
                };
            }

            return {
                ...r,
                votes: newVotes
            };
        });
    },

    // Continue to next round (from results screen)
    nextRound: async (roomCode: string): Promise<GameRoom | null> => {
        return StorageService.updateRoom(roomCode, (r) => {
            // Merge waiting players
            const waiting = r.waitingPlayers || [];
            const allPlayers = [...r.players, ...waiting];

            // Initialize scores/states for new players
            waiting.forEach(p => {
                if (!r.scores[p.id]) r.scores[p.id] = 0;
                if (!r.playerStates[p.id]) r.playerStates[p.id] = { status: 'waiting' };
            });

            const randomPlayer = allPlayers[Math.floor(Math.random() * allPlayers.length)];
            return {
                ...r,
                players: allPlayers,
                waitingPlayers: [],
                status: 'uploading',
                currentUploaderId: randomPlayer.id,
                currentImage: null,
                block: null, // Firebase doesn't accept undefined
                playerStates: {},
                votes: {}
            };
        });
    },

    // Reset game for new game
    resetGame: async (roomCode: string): Promise<GameRoom | null> => {
        return StorageService.updateRoom(roomCode, (r) => {
            // Merge waiting players
            const waiting = r.waitingPlayers || [];
            const allPlayers = [...r.players, ...waiting];

            // Initialize scores/states for new players
            waiting.forEach(p => {
                if (!r.scores[p.id]) r.scores[p.id] = 0;
                if (!r.playerStates[p.id]) r.playerStates[p.id] = { status: 'waiting' };
            });

            const randomPlayer = allPlayers[Math.floor(Math.random() * allPlayers.length)];
            return {
                ...r,
                players: allPlayers,
                waitingPlayers: [],
                status: 'lobby',
                currentUploaderId: randomPlayer.id,
                roundNumber: 0,
                currentImage: null,
                block: null, // Firebase doesn't accept undefined
                playerStates: {},
                votes: {},
                scores: {},
                roundResults: []
            };
        });
    },

    // --- Chat ---
    sendChatMessage: async (roomCode: string, player: Player, text: string): Promise<void> => {
        const message: ChatMessage = {
            id: generateId(),
            playerId: player.id,
            playerName: player.name,
            playerAvatar: player.avatar,
            text: text.trim().slice(0, 100), // Limit length
            timestamp: Date.now()
        };

        const roomRef = ref(database, `${ROOMS_PATH}/${roomCode}`);
        // ...
        await runTransaction(roomRef, (room) => {
            if (!room) return null;

            const chatEvents = room.chatEvents || [];
            // Keep last 20 messages
            const newEvents = [...chatEvents, message].slice(-20);

            room.chatEvents = newEvents;
            return room;
        });
    },

    // --- Join Active Game ---
    joinCurrentGame: async (roomCode: string, playerId: string): Promise<void> => {
        const roomRef = ref(database, `${ROOMS_PATH}/${roomCode}`);
        const result = await runTransaction(roomRef, (room) => {
            if (!room) return null;

            // Ensure waitingPlayers is handled correctly (convert to array if needed for processing)
            let waitingPlayers = room.waitingPlayers || [];
            if (!Array.isArray(waitingPlayers)) waitingPlayers = Object.values(waitingPlayers);

            const waitingIndex = waitingPlayers.findIndex((p: Player) => p.id === playerId);
            if (waitingIndex === -1) return undefined; // Abort transaction if not found

            const player = waitingPlayers[waitingIndex];

            // Remove from waiting (create new array to be safe)
            const newWaitingPlayers = waitingPlayers.filter((p: Player) => p.id !== playerId);
            room.waitingPlayers = newWaitingPlayers;

            // Add to players
            if (!room.players) room.players = [];
            else if (!Array.isArray(room.players)) room.players = Object.values(room.players);

            // Check if already in players to avoid dups
            if (!room.players.some((p: Player) => p.id === playerId)) {
                room.players.push(player);
            }

            // Initialize State based on status
            if (!room.playerStates) room.playerStates = {};

            if (room.status === 'drawing' || room.status === 'uploading') {
                room.playerStates[playerId] = { status: 'waiting' };
            } else if (room.status === 'voting') {
                room.playerStates[playerId] = { status: 'waiting' };
            }

            if (!room.scores) room.scores = {};
            if (room.scores[playerId] === undefined) room.scores[playerId] = 0;

            return room;
        });

        if (!result.committed) {
            throw new Error("Could not join game (player not in waiting list or conflict)");
        }
    }
};
