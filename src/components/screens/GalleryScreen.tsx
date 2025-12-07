import React, { useState, useEffect } from 'react';
import { GalleryService } from '../../services/galleryService';
import type { GalleryGame, GalleryRound, GalleryDrawing } from '../../types';
import { vibrate, HapticPatterns } from '../../utils/haptics';

interface GalleryScreenProps {
    onBack: () => void;
    showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const GalleryScreen: React.FC<GalleryScreenProps> = ({ onBack, showToast }) => {
    const [games, setGames] = useState<GalleryGame[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedGameId, setExpandedGameId] = useState<string | null>(null);
    const [selectedDrawing, setSelectedDrawing] = useState<{
        game: GalleryGame;
        round: GalleryRound;
        drawing: GalleryDrawing;
    } | null>(null);
    const [isDownloading, setIsDownloading] = useState(false);

    useEffect(() => {
        loadGallery();
    }, []);

    const loadGallery = async () => {
        setIsLoading(true);
        try {
            const galleryGames = await GalleryService.getPlayerGallery();
            setGames(galleryGames);
        } catch (error) {
            console.error('Failed to load gallery:', error);
            showToast('Failed to load gallery', 'error');
        }
        setIsLoading(false);
    };

    const formatTimeAgo = (timestamp: number): string => {
        const now = Date.now();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days === 1) return 'Yesterday';
        return `${days} days ago`;
    };

    const handleDownload = async (drawing: GalleryDrawing, round: GalleryRound) => {
        setIsDownloading(true);
        vibrate(HapticPatterns.light);

        try {
            const filename = `ano_drawing_r${round.roundNumber}_${drawing.playerName}.png`;
            await GalleryService.downloadRenderedDrawing(
                round.imageUrl,
                drawing.strokes,
                filename
            );
            showToast('Drawing saved! 📸', 'success');
            vibrate(HapticPatterns.success);
        } catch (error) {
            console.error('Failed to download:', error);
            showToast('Failed to save drawing', 'error');
        }

        setIsDownloading(false);
    };

    const toggleGame = (gameId: string) => {
        vibrate(HapticPatterns.light);
        setExpandedGameId(expandedGameId === gameId ? null : gameId);
    };

    // Drawing detail modal
    if (selectedDrawing) {
        const { round, drawing } = selectedDrawing;

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
                style={{ background: 'var(--theme-background)' }}>

                {/* Back button */}
                <button
                    onClick={() => setSelectedDrawing(null)}
                    className="absolute top-4 left-4 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-all z-10"
                >
                    <span className="text-2xl">←</span>
                </button>

                <div className="w-full max-w-lg space-y-4">
                    {/* Player info */}
                    <div className="text-center">
                        <h2 className="text-xl font-bold" style={{ color: 'var(--theme-text)' }}>
                            <span style={{ color: drawing.playerColor }}>{drawing.playerName}</span>'s Drawing
                        </h2>
                        <p className="text-sm opacity-60" style={{ color: 'var(--theme-text)' }}>
                            Round {round.roundNumber} • {drawing.votes} vote{drawing.votes !== 1 ? 's' : ''}
                        </p>
                    </div>

                    {/* Drawing preview - render on canvas */}
                    <DrawingPreview
                        baseImageUrl={round.imageUrl}
                        strokes={drawing.strokes}
                    />

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            onClick={() => setSelectedDrawing(null)}
                            className="flex-1 py-3 rounded-xl font-bold transition-all"
                            style={{
                                backgroundColor: 'var(--theme-card-bg)',
                                color: 'var(--theme-text)'
                            }}
                        >
                            Close
                        </button>
                        <button
                            onClick={() => handleDownload(drawing, round)}
                            disabled={isDownloading}
                            className="flex-1 py-3 rounded-xl font-bold transition-all bg-gradient-to-r from-green-500 to-emerald-600 text-white disabled:opacity-50"
                        >
                            {isDownloading ? 'Saving...' : '💾 Save to Device'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-4 pb-20" style={{ background: 'var(--theme-background)' }}>
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <button
                    onClick={onBack}
                    className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition-all"
                >
                    <span className="text-2xl">←</span>
                </button>
                <h1 className="text-2xl font-black" style={{ color: 'var(--theme-text)' }}>
                    📊 Match History
                </h1>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="text-4xl animate-bounce">🎮</div>
                        <p className="mt-2 opacity-60" style={{ color: 'var(--theme-text)' }}>
                            Loading history...
                        </p>
                    </div>
                </div>
            ) : games.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                    <div className="text-6xl mb-4">📊</div>
                    <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--theme-text)' }}>
                        No games yet!
                    </h2>
                    <p className="opacity-60" style={{ color: 'var(--theme-text)' }}>
                        Complete a game to see your match history here.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {games.map((game) => {
                        // Sort players by score for display
                        const sortedPlayers = [...game.players].sort(
                            (a, b) => (game.finalScores[b.id] || 0) - (game.finalScores[a.id] || 0)
                        );
                        const medals = ['🥇', '🥈', '🥉'];

                        return (
                            <div
                                key={game.gameId}
                                className="rounded-2xl overflow-hidden transition-all"
                                style={{
                                    backgroundColor: 'var(--theme-card-bg)',
                                    border: '2px solid var(--theme-border)'
                                }}
                            >
                                {/* Game header */}
                                <button
                                    onClick={() => toggleGame(game.gameId)}
                                    className="w-full p-4 hover:bg-white/5 transition-all text-left"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="text-3xl">🎮</div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between">
                                                <h3 className="font-bold" style={{ color: 'var(--theme-text)' }}>
                                                    Game with {game.players.slice(0, 2).map(p => p.name).join(', ')}
                                                    {game.players.length > 2 && ` +${game.players.length - 2}`}
                                                </h3>
                                                <div className="text-xl transition-transform"
                                                    style={{ transform: expandedGameId === game.gameId ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                                                    ▶
                                                </div>
                                            </div>
                                            <p className="text-sm opacity-60 mb-2" style={{ color: 'var(--theme-text)' }}>
                                                {formatTimeAgo(game.completedAt)} • {game.rounds.length} rounds
                                            </p>
                                            {/* Final Scores Row */}
                                            <div className="flex flex-wrap gap-2">
                                                {sortedPlayers.slice(0, 4).map((player, idx) => (
                                                    <span
                                                        key={player.id}
                                                        className="text-xs px-2 py-1 rounded-full font-bold"
                                                        style={{
                                                            backgroundColor: idx === 0 ? 'rgba(255, 215, 0, 0.2)' : 'rgba(255,255,255,0.1)',
                                                            color: idx === 0 ? '#FFD700' : 'var(--theme-text-secondary)'
                                                        }}
                                                    >
                                                        {medals[idx] || ''} {player.name}: {game.finalScores[player.id] || 0}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </button>

                                {/* Expanded rounds */}
                                {expandedGameId === game.gameId && (
                                    <div className="px-4 pb-4 space-y-3 animate-fade-in">
                                        {(game.rounds || []).map((round, roundIndex) => (
                                            <div key={roundIndex} className="rounded-xl p-3"
                                                style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                                                <h4 className="font-bold mb-2 text-sm" style={{ color: 'var(--theme-text)' }}>
                                                    Round {round.roundNumber || roundIndex + 1} — Winner: {round.winner?.playerName || 'Unknown'} 🏆
                                                </h4>



                                                {/* Drawing thumbnails */}
                                                <div className="flex gap-2 overflow-x-auto pb-2">
                                                    {(round.drawings || []).map((drawing, drawingIndex) => (

                                                        <button
                                                            key={drawingIndex}
                                                            onClick={() => setSelectedDrawing({ game, round, drawing })}
                                                            className="flex-shrink-0 rounded-xl overflow-hidden hover:scale-105 transition-all"
                                                            style={{
                                                                width: 80,
                                                                height: 80,
                                                                border: drawing.playerId === round.winner?.playerId
                                                                    ? '3px solid gold'
                                                                    : '2px solid var(--theme-border)'
                                                            }}

                                                        >
                                                            <DrawingThumbnail
                                                                baseImageUrl={round.imageUrl}
                                                                strokes={drawing.strokes}
                                                            />
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

            )}
        </div>
    );
};

// Component to render a drawing thumbnail
const DrawingThumbnail: React.FC<{
    baseImageUrl: string;
    strokes: any[];
}> = ({ baseImageUrl, strokes }) => {
    const canvasRef = React.useRef<HTMLCanvasElement>(null);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const img = new Image();
        img.crossOrigin = 'anonymous';

        img.onload = () => {
            const size = 80;
            canvas.width = size;
            canvas.height = size;

            // Draw base image
            ctx.drawImage(img, 0, 0, size, size);

            // Draw strokes
            for (const stroke of strokes) {
                if (!stroke.points || stroke.points.length === 0) continue;

                ctx.beginPath();
                ctx.strokeStyle = stroke.isEraser ? '#ffffff' : stroke.color;
                ctx.lineWidth = (stroke.size || 4) * (size / 600); // Scale line width
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';

                const points = stroke.points.map((p: any) => ({
                    x: (p.x / 100) * size,
                    y: (p.y / 100) * size
                }));

                ctx.moveTo(points[0].x, points[0].y);
                for (let i = 1; i < points.length; i++) {
                    ctx.lineTo(points[i].x, points[i].y);
                }
                ctx.stroke();
            }

            setLoaded(true);
        };

        img.onerror = () => {
            // Draw placeholder
            ctx.fillStyle = '#333';
            ctx.fillRect(0, 0, 80, 80);
            ctx.fillStyle = '#666';
            ctx.textAlign = 'center';
            ctx.fillText('⚠️', 40, 45);
        };

        img.src = baseImageUrl;
    }, [baseImageUrl, strokes]);

    return (
        <canvas
            ref={canvasRef}
            width={80}
            height={80}
            className={`w-full h-full object-cover transition-opacity ${loaded ? 'opacity-100' : 'opacity-50'}`}
        />
    );
};

// Component to render full-size drawing preview
const DrawingPreview: React.FC<{
    baseImageUrl: string;
    strokes: any[];
}> = ({ baseImageUrl, strokes }) => {
    const canvasRef = React.useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const img = new Image();
        img.crossOrigin = 'anonymous';

        img.onload = () => {
            const size = 600;
            canvas.width = size;
            canvas.height = size;

            // Draw base image
            ctx.drawImage(img, 0, 0, size, size);

            // Draw strokes
            for (const stroke of strokes) {
                if (!stroke.points || stroke.points.length === 0) continue;

                ctx.beginPath();
                ctx.strokeStyle = stroke.isEraser ? '#ffffff' : stroke.color;
                ctx.lineWidth = stroke.size || 4;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';

                const points = stroke.points.map((p: any) => ({
                    x: (p.x / 100) * size,
                    y: (p.y / 100) * size
                }));

                ctx.moveTo(points[0].x, points[0].y);
                for (let i = 1; i < points.length; i++) {
                    ctx.lineTo(points[i].x, points[i].y);
                }
                ctx.stroke();
            }
        };

        img.src = baseImageUrl;
    }, [baseImageUrl, strokes]);

    return (
        <canvas
            ref={canvasRef}
            className="w-full aspect-square rounded-2xl shadow-xl"
            style={{ maxWidth: '100%' }}
        />
    );
};
