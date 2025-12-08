import { ref, set, get, onValue, runTransaction, remove } from 'firebase/database';
import { database } from '../firebase';
import { ImageService } from './image';
import type { GameRoom, Player, GameSettings, BlockInfo, PlayerState, PlayerDrawing, RoundResult, RoomHistoryEntry, PlayerCosmetics } from '../types';
import { AuthService } from './auth';
import { AvatarService } from './avatarService';

const ROOMS_PATH = 'rooms';

const DEFAULT_SETTINGS: GameSettings = {
    timerDuration: 20,
    totalRounds: 3
};

const DEFAULT_COSMETICS: PlayerCosmetics = {
    brushesUnlocked: ['default'],
    colorsUnlocked: ['#000000', '#ffffff', '#FF0000', '#00FF00', '#0000FF'], // Basic starting colors
    badges: [],
    activeBrush: 'default',
    activeColor: '#000000'
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

        // if (!data.chatEvents) data.chatEvents = [];
        // else if (!Array.isArray(data.chatEvents)) data.chatEvents = Object.values(data.chatEvents);

        if (!data.settings) data.settings = DEFAULT_SETTINGS;

        return data as GameRoom;
    },

    /**
     * Helper to strip heavy data (avatar strokes) from player before adding to room
     * and ensure it's uploaded to the separate avatars path
     */
    preparePlayerForRoom: async (player: Player): Promise<Player> => {
        // Upload strokes if present
        if (player.avatarStrokes && player.avatarStrokes.length > 0) {
            await AvatarService.uploadAvatarStrokes(player.id, player.avatarStrokes);
        }

        // Return player object WITHOUT strokes
        const { avatarStrokes, ...leanPlayer } = player;
        return leanPlayer as Player;
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

    // --- Logic Helper ---
    checkAndAdvanceState: (room: GameRoom): GameRoom => {
        // If we in drawing phase, check if all have submitted
        if (room.status === 'drawing') {
            // Defensive check: Ensure playerStates exist for all players
            const hasAllPlayerStates = room.players.every(p => room.playerStates[p.id]);
            if (!hasAllPlayerStates) {
                console.warn('checkAndAdvanceState: Not all players have playerStates yet, skipping advancement check');
                return room;
            }

            const allSubmitted = room.players.every(p =>
                room.playerStates[p.id]?.status === 'submitted'
            );

            if (allSubmitted && room.players.length > 0) {
                room.status = 'voting';
            }
        }
        // If we in voting phase, check if all have voted
        else if (room.status === 'voting') {
            const allVoted = room.players.every(p => room.votes[p.id]);
            if (allVoted && room.players.length > 0) {
                // Calculate Results (Re-using logic from submitVote essentially)
                // We need to trigger the calculation.
                // Since exact calculation is complex to duplicate, we'll extract it or simple trigger 'results'
                // For robustness, let's just copy the calc logic here to ensure it happens.

                const voteCounts: { [playerId: string]: number } = {};
                room.players.forEach(p => { voteCounts[p.id] = 0; });
                Object.values(room.votes).forEach(votedFor => {
                    voteCounts[votedFor] = (voteCounts[votedFor] || 0) + 1;
                });

                const rankings = room.players
                    .map(p => ({
                        playerId: p.id,
                        playerName: p.name,
                        votes: voteCounts[p.id] || 0,
                        points: 0
                    }))
                    .sort((a, b) => b.votes - a.votes);

                if (rankings[0]) rankings[0].points = 3;
                if (rankings[1]) rankings[1].points = 2;
                if (rankings[2]) rankings[2].points = 1;

                const newScores = { ...room.scores };
                rankings.forEach(rank => {
                    newScores[rank.playerId] = (newScores[rank.playerId] || 0) + rank.points;
                });


                const roundResult: RoundResult = {
                    roundNumber: room.roundNumber,
                    rankings
                    // OPTIMIZATION: Drawings are NOT saved to history to keep room object small.
                    // If we need to view old drawings, we can fetch them from drawings/[roomCode]/[round]
                };

                const isFinalRound = room.roundNumber >= room.settings.totalRounds;

                room.scores = newScores;
                room.roundResults = [...(room.roundResults || []), roundResult];
                room.status = isFinalRound ? 'final' : 'results';
            }
        }
        return room;
    },

    // Force advance the round (Host only - skip waiting players)
    forceAdvanceRound: async (roomCode: string): Promise<GameRoom | null> => {
        return StorageService.updateRoom(roomCode, (r) => {
            if (r.status === 'drawing') {
                // Force all players to 'submitted' status
                const newPlayerStates = { ...r.playerStates };
                r.players.forEach(p => {
                    if (newPlayerStates[p.id]?.status !== 'submitted') {
                        newPlayerStates[p.id] = { status: 'submitted' };
                    }
                });
                return {
                    ...r,
                    playerStates: newPlayerStates,
                    status: 'voting'
                };
            } else if (r.status === 'voting') {
                // Calculate results with existing votes
                const voteCounts: { [playerId: string]: number } = {};
                r.players.forEach(p => { voteCounts[p.id] = 0; });
                Object.values(r.votes).forEach(votedFor => {
                    voteCounts[votedFor] = (voteCounts[votedFor] || 0) + 1;
                });

                const rankings = r.players
                    .map(p => ({
                        playerId: p.id,
                        playerName: p.name,
                        votes: voteCounts[p.id] || 0,
                        points: 0
                    }))
                    .sort((a, b) => b.votes - a.votes);

                const multiplier = r.isDoublePoints ? 2 : 1;
                if (rankings[0]) rankings[0].points = 3 * multiplier;
                if (rankings[1]) rankings[1].points = 2 * multiplier;
                if (rankings[2]) rankings[2].points = 1 * multiplier;

                const newScores = { ...r.scores };
                rankings.forEach(rank => {
                    newScores[rank.playerId] = (newScores[rank.playerId] || 0) + rank.points;
                });

                // Capture drawings before they get cleared
                const drawings = r.players.map(p => {
                    const playerState = r.playerStates[p.id];
                    return {
                        playerId: p.id,
                        playerName: p.name,
                        playerColor: p.color,
                        strokes: playerState?.drawing?.strokes || []
                    };
                }).filter(d => d.strokes.length > 0);

                const roundResult: RoundResult = {
                    roundNumber: r.roundNumber,
                    imageUrl: r.currentImage?.url || '',
                    rankings,
                    drawings
                };

                const isFinalRound = r.roundNumber >= r.settings.totalRounds;

                return {
                    ...r,
                    scores: newScores,
                    roundResults: [...r.roundResults, roundResult],
                    status: isFinalRound ? 'final' : 'results'
                };

            }
            return r;
        });
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

            // Remove from players lists
            if (room.players) {
                room.players = room.players.filter((p: Player) => p.id !== playerId);
            }
            if (room.waitingPlayers) {
                room.waitingPlayers = room.waitingPlayers.filter((p: Player) => p.id !== playerId);
            }

            // Remove state
            if (room.playerStates && room.playerStates[playerId]) {
                delete room.playerStates[playerId];
            }
            // Remove votes
            if (room.votes && room.votes[playerId]) {
                delete room.votes[playerId]; // Remove their vote
            }
            // Remove votes received by them (optional, but cleaner)
            // If someone voted for the kicked player, that vote technically points to nobody now.
            // We can leave it or clear it. Leaving it is safer for now to avoid complexity in counting.

            // CKECK FOR ADVANCEMENT
            return StorageService.checkAndAdvanceState(room);
        });

        // Clear user's room code
        try {
            await AuthService.updateUser(playerId, { currentRoomCode: null as any });
        } catch (e) {
            console.error("Failed to clear user room code on kick", e);
        }
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
        // Delete images from Firebase Storage first
        await ImageService.deleteRoomImages(roomCode);

        // Delete associated data
        const drawingsRef = ref(database, `drawings/${roomCode}`);
        const presenceRef = ref(database, `presence/${roomCode}`);

        await Promise.all([
            remove(drawingsRef).catch(() => { }),
            remove(presenceRef).catch(() => { })
        ]);

        // Then delete the room from the database
        const roomRef = ref(database, `${ROOMS_PATH}/${roomCode}`);
        await remove(roomRef);
    },

    getRoomPreview: async (roomCode: string): Promise<{ playerCount: number, roundNumber: number, totalRounds: number, status: string, hostName: string } | null> => {
        try {
            const roomSnap = await get(ref(database, `${ROOMS_PATH}/${roomCode}`));
            if (!roomSnap.exists()) return null;

            const room = roomSnap.val();
            // Count players (array or object check)
            let playerCount = 0;
            let hostName = 'Unknown Host';

            if (room.players) {
                const playersList = Array.isArray(room.players) ? room.players : Object.values(room.players);
                playerCount = playersList.length;

                // Try to find host name
                const host = playersList.find((p: any) => p.id === room.hostId);
                if (host) hostName = host.name;
            }

            return {
                playerCount,
                roundNumber: room.roundNumber || 1,
                totalRounds: room.settings?.totalRounds || 3,
                status: room.status || 'lobby',
                hostName
            };
        } catch (e) {
            console.error("Failed to get room preview", e);
            return null;
        }
    },

    // --- Cleanup ---
    // Auto-delete old rooms (> 24 hours)
    cleanupOldRooms: async (): Promise<{ deleted: number; errors: number }> => {
        const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
        const cutoffTime = Date.now() - TWENTY_FOUR_HOURS;

        let deleted = 0;
        let errors = 0;

        try {
            const roomsRef = ref(database, ROOMS_PATH);
            const snapshot = await get(roomsRef);

            if (!snapshot.exists()) {
                console.log('[Cleanup] No rooms to clean up');
                return { deleted: 0, errors: 0 };
            }

            const rooms = snapshot.val();
            const deletePromises: Promise<void>[] = [];

            for (const [roomCode, roomData] of Object.entries(rooms)) {
                const room = roomData as any;
                const createdAt = room.createdAt || 0;

                if (createdAt < cutoffTime) {
                    console.log(`[Cleanup] Room ${roomCode} is older than 24 hours (created: ${new Date(createdAt).toISOString()})`);

                    deletePromises.push(
                        (async () => {
                            try {
                                // Delete images
                                await ImageService.deleteRoomImages(roomCode);

                                // Delete associated data
                                await Promise.all([
                                    remove(ref(database, `drawings/${roomCode}`)).catch(() => { }),
                                    remove(ref(database, `presence/${roomCode}`)).catch(() => { })
                                ]);

                                // Delete room
                                await remove(ref(database, `${ROOMS_PATH}/${roomCode}`));

                                console.log(`[Cleanup] Successfully deleted room ${roomCode}`);
                                deleted++;
                            } catch (error) {
                                console.error(`[Cleanup] Failed to delete room ${roomCode}:`, error);
                                errors++;
                            }
                        })()
                    );
                }
            }

            await Promise.all(deletePromises);

            if (deleted > 0 || errors > 0) {
                console.log(`[Cleanup] Complete. Deleted: ${deleted}, Errors: ${errors}`);
            }

            return { deleted, errors };
        } catch (error) {
            console.error('[Cleanup] Failed to query rooms:', error);
            return { deleted: 0, errors: 1 };
        }
    },

    // --- Room Management ---
    createRoom: async (hostPlayer: Player): Promise<string> => {
        // ONE ROOM POLICY: Check if host is already in a room
        const currentUser = await AuthService.syncUser();
        if (currentUser?.currentRoomCode) {
            console.log(`[Policy] Leaving old room ${currentUser.currentRoomCode} before creating new one`);
            await StorageService.removePlayerFromRoom(currentUser.currentRoomCode, hostPlayer.id);
        }

        const roomCode = StorageService.generateRoomCode();
        const roomRef = ref(database, `rooms/${roomCode}`);

        // Pick a random sabotage round (1 to totalRounds)
        const totalRounds = 3; // Default rounds
        const sabotageRound = Math.floor(Math.random() * totalRounds) + 1;

        const newRoom: GameRoom = {
            roomCode: roomCode,
            hostId: hostPlayer.id,
            players: [await StorageService.preparePlayerForRoom({ ...hostPlayer, cosmetics: hostPlayer.cosmetics || DEFAULT_COSMETICS })],
            waitingPlayers: [],
            currentUploaderId: hostPlayer.id,
            status: 'lobby',
            createdAt: Date.now(),
            settings: {
                timerDuration: 20,
                totalRounds: 3
            },
            roundNumber: 0,
            playerStates: {},
            votes: {},
            scores: {},
            roundResults: [],
            sabotageRound // Store which round has sabotage
        };

        await set(roomRef, newRoom);
        StorageService.saveRoomCode(roomCode); // Save for persistence
        StorageService.saveRoomToHistory(newRoom);

        // Update User Status
        if (currentUser) {
            await AuthService.updateUser(hostPlayer.id, { currentRoomCode: roomCode });
        }

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
        // console.log('Subscribing to room:', roomCode);
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

    clearSession: (): void => {
        localStorage.removeItem('aic_game_session');
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

        // ONE ROOM POLICY: Check if user is in a different room
        const currentUser = await AuthService.syncUser();
        // Don't leave if rejoining the SAME room
        if (currentUser?.currentRoomCode && currentUser.currentRoomCode !== roomCode) {
            console.log(`[Policy] Leaving old room ${currentUser.currentRoomCode} before joining ${roomCode}`);
            await StorageService.removePlayerFromRoom(currentUser.currentRoomCode, player.id);
        }

        // Check if already in players
        const existingPlayerIndex = room.players.findIndex(p => p.id === player.id);
        if (existingPlayerIndex >= 0) {
            room.players[existingPlayerIndex] = { ...player, lastSeen: Date.now() };
            await StorageService.saveRoom(room);
            StorageService.saveRoomToHistory(room);
            // Ensure status is updated (might have been cleared if they were kicked)
            if (currentUser) await AuthService.updateUser(player.id, { currentRoomCode: roomCode });
            return room;
        }

        // Check if already in waitingPlayers
        const existingWaitingIndex = room.waitingPlayers?.findIndex(p => p.id === player.id) ?? -1;
        if (existingWaitingIndex >= 0 && room.waitingPlayers) {
            room.waitingPlayers[existingWaitingIndex] = { ...player, lastSeen: Date.now() };
            await StorageService.saveRoom(room);
            StorageService.saveRoomToHistory(room);
            if (currentUser) await AuthService.updateUser(player.id, { currentRoomCode: roomCode });
            return room;
        }

        // New player
        if (room.status === 'lobby') {
            room.players.push(await StorageService.preparePlayerForRoom({ ...player, lastSeen: Date.now(), cosmetics: player.cosmetics || DEFAULT_COSMETICS }));
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
            room.waitingPlayers.push(await StorageService.preparePlayerForRoom({ ...player, lastSeen: Date.now(), cosmetics: player.cosmetics || DEFAULT_COSMETICS }));
        }

        await StorageService.saveRoom(room);
        StorageService.saveRoomCode(roomCode); // Save for persistence (Rejoin Card)
        StorageService.saveRoomToHistory(room);

        // Update User Status
        if (currentUser) await AuthService.updateUser(player.id, { currentRoomCode: roomCode });

        return room;
    },

    removePlayerFromRoom: async (roomCode: string, playerId: string): Promise<void> => {
        // First, check if the room will be empty after this player leaves
        const currentRoom = await StorageService.getRoom(roomCode);
        if (!currentRoom) {
            // Room doesn't exist, just clear the user's room code
            try {
                await AuthService.updateUser(playerId, { currentRoomCode: null as any });
            } catch (e) {
                console.error("Failed to clear user room code on leave", e);
            }
            return;
        }

        const remainingPlayers = currentRoom.players.filter(p => p.id !== playerId);
        const remainingWaiting = currentRoom.waitingPlayers?.filter(p => p.id !== playerId) || [];

        // If no players will remain, close the room entirely
        if (remainingPlayers.length === 0 && remainingWaiting.length === 0) {
            console.log(`[Cleanup] Room ${roomCode} is empty, closing it`);
            try {
                await StorageService.closeRoom(roomCode);
            } catch (e) {
                console.error(`Failed to close empty room ${roomCode}`, e);
            }
            // Clear user's room code
            try {
                await AuthService.updateUser(playerId, { currentRoomCode: null as any });
            } catch (e) {
                console.error("Failed to clear user room code on leave", e);
            }
            return;
        }

        // Room will still have players, proceed with normal removal
        await StorageService.updateRoom(roomCode, (r) => {
            const newPlayers = r.players.filter(p => p.id !== playerId);
            const newWaiting = r.waitingPlayers?.filter(p => p.id !== playerId) || [];

            // Remove state & votes
            const newPlayerStates = { ...r.playerStates };
            delete newPlayerStates[playerId];

            const newVotes = { ...r.votes };
            delete newVotes[playerId];

            let newHostId = r.hostId;
            if (playerId === r.hostId) {
                // Host left, assign new host
                if (newPlayers.length > 0) {
                    newHostId = newPlayers[0].id;
                } else if (newWaiting.length > 0) {
                    newHostId = newWaiting[0].id;
                }
            }

            let newUploaderId = r.currentUploaderId;
            // If the player leaving was the current uploader (and we are in uploading phase)
            if (playerId === r.currentUploaderId && r.status === 'uploading') {
                if (newPlayers.length > 0) {
                    const randomPlayer = newPlayers[Math.floor(Math.random() * newPlayers.length)];
                    newUploaderId = randomPlayer.id;
                }
            }

            const updatedRoom = {
                ...r,
                players: newPlayers,
                waitingPlayers: newWaiting,
                playerStates: newPlayerStates,
                votes: newVotes,
                hostId: newHostId,
                currentUploaderId: newUploaderId
            };

            return StorageService.checkAndAdvanceState(updatedRoom);
        });

        // Clear user's room code
        try {
            await AuthService.updateUser(playerId, { currentRoomCode: null as any });
        } catch (e) {
            console.error("Failed to clear user room code on leave", e);
        }
    },

    // Heartbeat to update lastSeen (Optimized: writes to presence path)
    heartbeat: async (roomCode: string, playerId: string): Promise<void> => {
        StorageService.updateLocalActivity(); // Keep local session alive

        // Write to split presence path to avoid re-downloading entire room
        const presenceRef = ref(database, `presence/${roomCode}/${playerId}`);
        // We use set directly as it's a simple timestamp update
        // No need for transaction overhead for this specific value
        await set(presenceRef, Date.now());
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
            // Reset player states for new round - ensure ALL players get an entry
            const playerStates: { [id: string]: PlayerState } = {};
            r.players.forEach(p => {
                playerStates[p.id] = { status: 'waiting' };
            });

            // Validation: Ensure no players are missing from playerStates
            const missingPlayers = r.players.filter(p => !playerStates[p.id]);
            if (missingPlayers.length > 0) {
                console.warn('startRound: Some players missing from playerStates:', missingPlayers.map(p => p.id));
            }

            // 20% chance for double points round
            const isDoublePoints = Math.random() < 0.2;

            // No random time bonus (User requested fairness)
            const timeBonusPlayerId = null;

            // Check if this is the sabotage round
            const nextRoundNumber = r.roundNumber + 1;
            const isSabotageRound = r.sabotageRound === nextRoundNumber;

            // Pick a random saboteur (not the uploader) for sabotage round
            const eligibleSaboteurs = r.players.filter(p => p.id !== uploadedBy);
            const saboteurId = isSabotageRound && eligibleSaboteurs.length > 0
                ? eligibleSaboteurs[Math.floor(Math.random() * eligibleSaboteurs.length)].id
                : null;

            return {
                ...r,
                status: 'drawing',
                roundNumber: nextRoundNumber,
                currentImage: {
                    url: imageUrl,
                    uploadedBy,
                    uploadedAt: Date.now()
                },
                block,
                playerStates,
                votes: {},
                isDoublePoints,
                timeBonusPlayerId: timeBonusPlayerId || null,
                // Sabotage state
                saboteurId: isSabotageRound && saboteurId ? saboteurId : null,
                sabotageTargetId: null, // Saboteur picks this
                sabotageTriggered: false
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

    // Saboteur sets their target
    setSabotageTarget: async (roomCode: string, targetId: string, effect: any): Promise<GameRoom | null> => {
        return StorageService.updateRoom(roomCode, (r) => ({
            ...r,
            sabotageTargetId: targetId,
            sabotageEffect: effect
        }));
    },

    // Trigger sabotage effect when target starts drawing
    triggerSabotage: async (roomCode: string): Promise<GameRoom | null> => {
        return StorageService.updateRoom(roomCode, (r) => ({
            ...r,
            sabotageTriggered: true
        }));
    },

    updatePlayerCosmetics: async (roomCode: string, playerId: string, updates: Partial<PlayerCosmetics>): Promise<GameRoom | null> => {
        return StorageService.updateRoom(roomCode, (r) => {
            const playerIndex = r.players.findIndex(p => p.id === playerId);
            if (playerIndex === -1) return r;

            const updatedPlayers = [...r.players];
            const currentPlayer = updatedPlayers[playerIndex];

            updatedPlayers[playerIndex] = {
                ...currentPlayer,
                cosmetics: {
                    ...currentPlayer.cosmetics,
                    ...updates
                } as PlayerCosmetics
            };

            return {
                ...r,
                players: updatedPlayers
            };
        });
    },

    // Submit drawing (Optimized: writes drawing to separate path)
    submitDrawing: async (roomCode: string, drawing: PlayerDrawing): Promise<GameRoom | null> => {
        // First, get the current round number
        const room = await StorageService.getRoom(roomCode);
        if (!room) return null;

        // Write drawing to separate path for reduced room payload
        const drawingRef = ref(database, `drawings/${roomCode}/${room.roundNumber}/${drawing.playerId}`);
        await set(drawingRef, drawing);

        // Then update room state (without the drawing data)
        return StorageService.updateRoom(roomCode, (r) => {
            // ATOMIC Guard: Prevent duplicate submissions (inside transaction)
            if (r.playerStates[drawing.playerId]?.status === 'submitted') {
                return r; // Return unchanged room
            }

            const newPlayerStates = {
                ...r.playerStates,
                [drawing.playerId]: {
                    status: 'submitted' as const
                    // NOTE: drawing data is now stored separately
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
    submitVote: async (roomCode: string, voterId: string, votedForId: string): Promise<GameRoom | null> => {
        return StorageService.updateRoom(roomCode, (r) => {
            const newVotes = { ...r.votes, [voterId]: votedForId };

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

                // Award points (3, 2, 1 for top 3) - double if it's a double points round
                const multiplier = r.isDoublePoints ? 2 : 1;
                if (rankings[0]) rankings[0].points = 3 * multiplier;
                if (rankings[1]) rankings[1].points = 2 * multiplier;
                if (rankings[2]) rankings[2].points = 1 * multiplier;

                // Update scores
                const newScores = { ...r.scores };
                rankings.forEach(rank => {
                    newScores[rank.playerId] = (newScores[rank.playerId] || 0) + rank.points;
                });

                // Capture drawings before they get cleared
                const drawings = r.players.map(p => {
                    const playerState = r.playerStates[p.id];
                    return {
                        playerId: p.id,
                        playerName: p.name,
                        playerColor: p.color,
                        strokes: playerState?.drawing?.strokes || []
                    };
                }).filter(d => d.strokes.length > 0);

                const roundResult: RoundResult = {
                    roundNumber: r.roundNumber,
                    imageUrl: r.currentImage?.url || '',
                    rankings,
                    drawings
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

    // Trigger rewards phase for all players
    triggerRewards: async (roomCode: string): Promise<GameRoom | null> => {
        return StorageService.updateRoom(roomCode, (r) => ({
            ...r,
            status: 'rewards'
        }));
    },

    // --- Join Active Game ---
    joinCurrentGame: async (roomCode: string, playerId: string): Promise<void> => {
        const roomRef = ref(database, `${ROOMS_PATH}/${roomCode}`);
        const result = await runTransaction(roomRef, (room) => {
            if (!room) return null;

            // Normalize lists
            let players = room.players || [];
            if (!Array.isArray(players)) players = Object.values(players);
            room.players = players; // Ensure arrays

            let waitingPlayers = room.waitingPlayers || [];
            if (!Array.isArray(waitingPlayers)) waitingPlayers = Object.values(waitingPlayers);
            room.waitingPlayers = waitingPlayers;

            let playerObj: Player | null = null;

            // 1. Check if already in active players
            const playerIndex = players.findIndex((p: Player) => p.id === playerId);
            if (playerIndex >= 0) {
                playerObj = players[playerIndex];
            }
            // 2. If not, check waiting players
            else {
                const waitingIndex = waitingPlayers.findIndex((p: Player) => p.id === playerId);
                if (waitingIndex >= 0) {
                    playerObj = waitingPlayers[waitingIndex];
                    // Move from waiting to players
                    room.waitingPlayers.splice(waitingIndex, 1);
                    room.players.push(playerObj);
                }
            }

            // If found nowhere, abort
            if (!playerObj) return undefined;

            // Initialize State based on status
            if (!room.playerStates) room.playerStates = {};

            // Force status to waiting/active so they can join
            if (room.status === 'drawing' || room.status === 'uploading') {
                // Only reset if they don't have a valid state or we want to force them in
                // If they are 'submitted', don't reset them!
                const currentState = room.playerStates[playerId];
                if (!currentState || currentState.status !== 'submitted') {
                    room.playerStates[playerId] = { status: 'waiting' };
                }
            } else if (room.status === 'voting') {
                // Determine if they should be waiting
                const currentState = room.playerStates[playerId];
                if (!currentState || currentState.status !== 'submitted') {
                    room.playerStates[playerId] = { status: 'waiting' };
                }
            }

            if (!room.scores) room.scores = {};
            if (room.scores[playerId] === undefined) room.scores[playerId] = 0;

            return room;
        });

        if (!result.committed) {
            throw new Error("Could not join game (player not found in room)");
        }
    }
};
