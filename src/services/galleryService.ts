import { ref, set, get, remove } from 'firebase/database';
import { ref as storageRef, uploadString, getDownloadURL } from 'firebase/storage';
import { database, storage } from '../firebase';
import { AuthService } from './auth';
import type { GalleryGame, GalleryRound, GalleryDrawing, DrawingStroke, GameRoom } from '../types';


const GALLERY_PATH = 'gallery';
const MAX_GALLERY_GAMES = 3;

export const GalleryService = {
    /**
     * Save a completed game to gallery for all participants
     */
    saveGameToGallery: async (room: GameRoom): Promise<void> => {
        const currentUser = AuthService.getCurrentUser();
        if (!currentUser) return;

        // Use deterministic gameId based on roomCode and round count
        // This ensures all players write to the same record
        const gameId = `game_${room.roomCode}_r${room.roundResults?.length || 0}`;
        const playerIds = room.players.map(p => p.id);



        // Build rounds with drawings
        const rounds: GalleryRound[] = [];

        for (let i = 0; i < (room.roundResults?.length || 0); i++) {
            const result = room.roundResults[i];

            // Get drawings from the round result (captured when round ended)
            const drawings: GalleryDrawing[] = (result.drawings || []).map(d => {
                const votes = result.rankings.find(r => r.playerId === d.playerId)?.votes || 0;
                return {
                    playerId: d.playerId,
                    playerName: d.playerName,
                    playerColor: d.playerColor,
                    strokes: d.strokes,
                    votes
                };
            });

            // Find winner of this round
            const sortedRankings = [...(result.rankings || [])].sort((a, b) => b.votes - a.votes);
            const winner = sortedRankings[0] || { playerId: '', playerName: 'Unknown', votes: 0 };

            rounds.push({
                roundNumber: result.roundNumber,
                imageUrl: result.imageUrl || '',
                drawings,
                winner: {
                    playerId: winner.playerId,
                    playerName: winner.playerName,
                    votes: winner.votes
                }
            });
        }


        // Find overall winner
        const sortedPlayers = [...room.players].sort(
            (a, b) => (room.scores[b.id] || 0) - (room.scores[a.id] || 0)
        );
        const overallWinner = sortedPlayers[0];

        const galleryGame: GalleryGame = {
            gameId,
            roomCode: room.roomCode,
            completedAt: Date.now(),
            playerIds,
            players: room.players.map(p => ({ id: p.id, name: p.name, color: p.color })),
            rounds,
            finalScores: room.scores,
            winner: {
                playerId: overallWinner?.id || '',
                playerName: overallWinner?.name || 'Unknown'
            }
        };

        // Save to ALL participants' galleries (server-side for everyone)
        const savePromises = playerIds.map(async (playerId) => {
            const galleryRef = ref(database, `${GALLERY_PATH}/${playerId}/${gameId}`);
            await set(galleryRef, galleryGame);
            // Prune old games for each player (keep only last 3)
            await GalleryService.pruneOldGames(playerId);
        });

        await Promise.all(savePromises);
    },


    /**
     * Get all gallery games for the current player
     */
    getPlayerGallery: async (): Promise<GalleryGame[]> => {
        const currentUser = AuthService.getCurrentUser();
        if (!currentUser) return [];

        const galleryRef = ref(database, `${GALLERY_PATH}/${currentUser.id}`);
        const snapshot = await get(galleryRef);

        if (!snapshot.exists()) return [];

        const data = snapshot.val();
        const games: GalleryGame[] = Object.values(data);

        // Sort by completedAt descending (newest first)
        games.sort((a, b) => b.completedAt - a.completedAt);

        return games;
    },

    /**
     * Render a drawing (combine base image + strokes) and return as data URL
     */
    renderDrawingToDataUrl: async (
        baseImageUrl: string,
        strokes: DrawingStroke[],
        canvasSize: number = 600
    ): Promise<string> => {
        return new Promise((resolve, reject) => {
            // Create offscreen canvas
            const canvas = document.createElement('canvas');
            canvas.width = canvasSize;
            canvas.height = canvasSize;
            const ctx = canvas.getContext('2d');

            if (!ctx) {
                reject(new Error('Failed to create canvas context'));
                return;
            }

            // Load base image
            const img = new Image();
            img.crossOrigin = 'anonymous';

            img.onload = () => {
                // Draw base image
                ctx.drawImage(img, 0, 0, canvasSize, canvasSize);

                // Replay strokes
                for (const stroke of strokes) {
                    if (!stroke.points || stroke.points.length === 0) continue;

                    ctx.beginPath();
                    ctx.strokeStyle = stroke.isEraser ? '#ffffff' : stroke.color;
                    ctx.lineWidth = stroke.size || 4;
                    ctx.lineCap = 'round';
                    ctx.lineJoin = 'round';

                    // Scale points from percentage to canvas size
                    const points = stroke.points.map(p => ({
                        x: (p.x / 100) * canvasSize,
                        y: (p.y / 100) * canvasSize
                    }));

                    ctx.moveTo(points[0].x, points[0].y);
                    for (let i = 1; i < points.length; i++) {
                        ctx.lineTo(points[i].x, points[i].y);
                    }
                    ctx.stroke();
                }

                // Export as PNG data URL
                resolve(canvas.toDataURL('image/png'));
            };

            img.onerror = () => {
                reject(new Error('Failed to load base image'));
            };

            img.src = baseImageUrl;
        });
    },

    /**
     * Render and upload a drawing to Firebase Storage
     */
    renderAndUploadDrawing: async (
        baseImageUrl: string,
        strokes: DrawingStroke[],
        gameId: string,
        roundNumber: number,
        playerId: string
    ): Promise<string> => {
        // Render the drawing
        const dataUrl = await GalleryService.renderDrawingToDataUrl(baseImageUrl, strokes);

        // Upload to Firebase Storage
        const fileName = `${roundNumber}_${playerId}.png`;
        const fileRef = storageRef(storage, `gallery-images/${gameId}/${fileName}`);

        const snapshot = await uploadString(fileRef, dataUrl, 'data_url');
        const downloadUrl = await getDownloadURL(snapshot.ref);

        return downloadUrl;
    },

    /**
     * Download a rendered drawing to device
     */
    downloadDrawing: async (imageUrl: string, filename: string = 'drawing.png'): Promise<void> => {
        try {
            // Fetch the image
            const response = await fetch(imageUrl);
            const blob = await response.blob();

            // Create download link
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Failed to download drawing:', error);
            throw error;
        }
    },

    /**
     * Download a drawing by rendering it on-the-fly
     */
    downloadRenderedDrawing: async (
        baseImageUrl: string,
        strokes: DrawingStroke[],
        filename: string = 'drawing.png'
    ): Promise<void> => {
        try {
            const dataUrl = await GalleryService.renderDrawingToDataUrl(baseImageUrl, strokes);

            // Convert data URL to blob
            const response = await fetch(dataUrl);
            const blob = await response.blob();

            // Create download link
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Failed to render and download drawing:', error);
            throw error;
        }
    },

    /**
     * Remove old games to keep only the last MAX_GALLERY_GAMES
     */
    pruneOldGames: async (playerId: string): Promise<void> => {
        const galleryRef = ref(database, `${GALLERY_PATH}/${playerId}`);
        const snapshot = await get(galleryRef);

        if (!snapshot.exists()) return;

        const data = snapshot.val();
        const games: GalleryGame[] = Object.values(data);

        // Sort by completedAt descending
        games.sort((a, b) => b.completedAt - a.completedAt);

        // Remove games beyond the limit
        if (games.length > MAX_GALLERY_GAMES) {
            const gamesToRemove = games.slice(MAX_GALLERY_GAMES);

            for (const game of gamesToRemove) {
                const gameRef = ref(database, `${GALLERY_PATH}/${playerId}/${game.gameId}`);
                await remove(gameRef);
            }
        }
    },

    /**
     * Delete a specific game from gallery
     */
    deleteGame: async (gameId: string): Promise<void> => {
        const currentUser = AuthService.getCurrentUser();
        if (!currentUser) return;

        const gameRef = ref(database, `${GALLERY_PATH}/${currentUser.id}/${gameId}`);
        await remove(gameRef);
    }
};
