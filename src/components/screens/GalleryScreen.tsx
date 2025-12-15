import React, { useState, useEffect, useRef } from 'react';
import { GalleryService } from '../../services/galleryService';
import type { GalleryGame, GalleryRound, BlockInfo, DrawingStroke } from '../../types';
import { vibrate, HapticPatterns } from '../../utils/haptics';
import { MonogramBackground } from '../common/MonogramBackground';

interface GalleryScreenProps {
    onBack: () => void;
    showToast: (message: string, type: 'success' | 'error' | 'info') => void;
    currentSessionId?: string;
}

export const GalleryScreen: React.FC<GalleryScreenProps> = ({ onBack, showToast, currentSessionId }) => {
    const [games, setGames] = useState<GalleryGame[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedGameId, setExpandedGameId] = useState<string | null>(null);
    const [expandedRoundId, setExpandedRoundId] = useState<string | null>(null);

    // Fullscreen View State
    const [viewingImage, setViewingImage] = useState<{ url: string; round: GalleryRound; winnerName: string } | null>(null);
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);

    useEffect(() => {
        loadGallery();
    }, []);

    const loadGallery = async () => {
        setIsLoading(true);
        try {
            // Pass the session ID to support guest users
            const history = await GalleryService.getPlayerGallery(currentSessionId);
            setGames(history);
        } catch (error) {
            console.error('Failed to load gallery:', error);
            showToast('Failed to load history', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const toggleGame = (gameId: string) => {
        vibrate(HapticPatterns.light);
        if (expandedGameId === gameId) {
            setExpandedGameId(null);
            setExpandedRoundId(null);
        } else {
            setExpandedGameId(gameId);
            setExpandedRoundId(null);
        }
    };

    const toggleRound = (roundId: string) => {
        vibrate(HapticPatterns.light);
        setExpandedRoundId(expandedRoundId === roundId ? null : roundId);
    };

    const handleViewDrawing = async (round: GalleryRound) => {
        // Find winner's drawing (safe access)
        const winnerDrawing = round.drawings?.find(d => d.playerId === round.winner?.playerId);
        
        setIsGeneratingImage(true);
        vibrate(HapticPatterns.light);

        try {
            // Generate watermarked image
            const dataUrl = await GalleryService.renderDrawingToDataUrl(
                round.imageUrl,
                winnerDrawing?.strokes || [],
                {
                    block: round.block,
                    watermark: true,
                    canvasSize: 1080 // High res for saving
                }
            );

            setViewingImage({
                url: dataUrl,
                round,
                winnerName: round.winner.playerName
            });
        } catch (error) {
            console.error('Failed to generate image:', error);
            showToast('Failed to generate image', 'error');
        } finally {
            setIsGeneratingImage(false);
        }
    };

    return (
        <div className="fixed inset-0 z-0 bg-black text-white overflow-hidden flex flex-col font-sans">
            <MonogramBackground opacity={0.1} />

            {/* Header */}
            <div 
                className="relative z-10 px-6 pb-4 flex items-center gap-4"
                style={{ paddingTop: 'max(env(safe-area-inset-top), 40px)' }}
            >
                <button
                    onClick={onBack}
                    className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10 active:scale-95 transition-all shadow-lg"
                >
                    <span className="text-xl">←</span>
                </button>
                <h1 className="text-2xl font-black tracking-tight">Match History</h1>
            </div>

            {/* Main Content */}
            <div className="flex-1 relative z-10 overflow-y-auto px-4 pb-safe-bottom">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-64 opacity-50 space-y-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-white/20 border-t-white"></div>
                        <p className="text-sm font-medium">Loading history...</p>
                    </div>
                ) : games.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-center p-8 opacity-60">
                        <div className="text-4xl mb-4">📜</div>
                        <h3 className="text-lg font-bold mb-2">No Games Yet</h3>
                        <p className="text-sm">Finish a game to see it here!</p>
                    </div>
                ) : (
                    <div className="space-y-4 pb-8">
                        {games.map(game => (
                            <GameCard
                                key={game.gameId}
                                game={game}
                                isExpanded={expandedGameId === game.gameId}
                                onToggle={() => toggleGame(game.gameId)}
                                expandedRoundId={expandedRoundId}
                                onToggleRound={toggleRound}
                                onViewDrawing={(round) => handleViewDrawing(round)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Fullscreen Image Viewer Modal */}
            {viewingImage && (
                <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col animate-fade-in safe-area-padding">
                    {/* Header */}
                    <div className="h-16 flex items-center justify-between px-6 z-10">
                        <div className="flex flex-col">
                            <span className="font-bold text-lg">{viewingImage.winnerName}'s Masterpiece</span>
                            <span className="text-xs text-white/50">Round {viewingImage.round.roundNumber} Winner</span>
                        </div>
                        <button
                            onClick={() => setViewingImage(null)}
                            className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold active:scale-90 transition-transform"
                        >
                            ✕
                        </button>
                    </div>

                    {/* Image Container */}
                    <div className="flex-1 flex items-center justify-center p-4 relative overflow-hidden">
                        <div className="relative w-full max-w-md aspect-square bg-white/5 rounded-2xl shadow-2xl overflow-hidden ring-1 ring-white/10 group">
                             {/* Hint Overlay - Fades out */}
                             <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20 animate-fade-out-delay">
                                <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-full text-sm font-bold border border-white/10">
                                    Press & Hold to Save 📸
                                </div>
                             </div>
                            <img
                                src={viewingImage.url}
                                alt="Winner's Drawing"
                                className="w-full h-full object-contain select-none pointer-events-auto"
                                style={{ WebkitUserSelect: 'none', touchAction: 'none' }} 
                                // Actually, for 'hold to save', we usually need standard touch behavior on img?
                                // iOS handles long press on img automatically unless prevented.
                                // Removing touchAction: none and WebkitUserSelect: none just in case.
                            />
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-6 pb-safe-bottom z-10">
                        <button
                            onClick={() => setViewingImage(null)}
                            className="w-full py-4 bg-white text-black rounded-2xl font-black text-lg shadow-lg active:scale-95 transition-transform"
                        >
                            Done
                        </button>
                    </div>
                </div>
            )}

            {/* Loading Overlay */}
            {isGeneratingImage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-black/80 p-6 rounded-2xl flex flex-col items-center gap-4 border border-white/10">
                        <div className="animate-spin rounded-full h-10 w-10 border-4 border-white/20 border-t-white"></div>
                        <p className="font-bold">Generating Image...</p>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- Subcomponents ---

const GameCard: React.FC<{
    game: GalleryGame;
    isExpanded: boolean;
    onToggle: () => void;
    expandedRoundId: string | null;
    onToggleRound: (id: string) => void;
    onViewDrawing: (round: GalleryRound) => void;
    isGenerating?: boolean; // Optional if not used directly
}> = ({ game, isExpanded, onToggle, expandedRoundId, onToggleRound, onViewDrawing }) => {
    // Determine overall winner with safety check
    const winnerId = game.winner?.playerId;
    const winner = winnerId ? game.players?.find(p => p.id === winnerId) : null;
    
    // Safety check for players
    const safePlayers = game.players || [];
    
    // Sort logic for medal summary
    const sortedPlayers = [...safePlayers].sort(
        (a, b) => (game.finalScores?.[b.id] || 0) - (game.finalScores?.[a.id] || 0)
    );

    // Format Date and Time
    const dateObj = new Date(game.completedAt);
    const dateStr = dateObj.toLocaleDateString();
    const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Deduplicate rounds for display if the data is corrupted
    // We expect clean data from service now, but duplicate keys crash React list
    // Use a map to ensure unique round numbers for rendering
    const uniqueRounds = Array.from(new Map((game.rounds || []).map(r => [r.roundNumber, r])).values())
        .sort((a, b) => a.roundNumber - b.roundNumber);


    return (
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl overflow-hidden transition-all duration-300">
            <button
                onClick={onToggle}
                className="w-full p-5 text-left active:bg-white/5 transition-colors"
            >
                <div className="flex justify-between items-start mb-2">
                    <div className="flex flex-col">
                        <span className="text-xs font-bold text-white/40 uppercase tracking-wider mb-1">
                            {dateStr} • {timeStr}
                        </span>
                        <h3 className="font-bold text-lg leading-tight">
                            Game with {safePlayers.length} Players
                        </h3>
                    </div>
                    {winner && (
                        <div className="flex flex-col items-end">
                            <span className="text-xs font-bold text-yellow-400 uppercase tracking-wide">Winner</span>
                            <span className="font-bold text-white">{winner.name}</span>
                        </div>
                    )}
                </div>

                {/* Score Pills */}
                <div className="flex flex-wrap gap-2 mt-2">
                    {sortedPlayers.slice(0, 3).map((p, i) => (
                        <div key={p.id} className={`text-xs px-2 py-1 rounded-md font-bold ${
                            i === 0 ? 'bg-yellow-400/20 text-yellow-300 border border-yellow-400/30' : 'bg-white/10 text-white/60'
                        }`}>
                            {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'} {p.name}
                        </div>
                    ))}
                </div>
            </button>

            {/* Expanded Rounds */}
            {isExpanded && (
                <div className="border-t border-white/10 bg-black/20">
                    <div className="p-2 space-y-2">
                        {uniqueRounds.map((round) => {
                            // Use roundNumber as key to prevent duplicate key error
                            const roundId = `${game.gameId}_r${round.roundNumber}`;
                            const isRoundExpanded = expandedRoundId === roundId;
                            // Safe winner access
                            const roundWinnerName = round.winner?.playerName || 'Unknown';
                            
                            // Safe drawing access
                            const winnerDrawing = round.drawings?.find(d => d.playerId === round.winner?.playerId);
                            
                            return (
                                <div key={round.roundNumber} className="rounded-2xl overflow-hidden bg-white/5 border border-white/5">
                                    <button
                                        onClick={() => onToggleRound(roundId)}
                                        className="w-full p-4 flex items-center justify-between active:bg-white/5 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center font-bold text-sm">
                                                {round.roundNumber}
                                            </div>
                                            <div className="flex flex-col items-start">
                                                <span className="font-bold text-sm">Round {round.roundNumber}</span>
                                                <span className="text-xs text-white/50">Winner: {roundWinnerName}</span>
                                            </div>
                                        </div>
                                        <span className={`text-white/40 transition-transform duration-300 ${isRoundExpanded ? 'rotate-180' : ''}`}>
                                            ▼
                                        </span>
                                    </button>

                                    {/* Round Winner Reveal */}
                                    {isRoundExpanded && (
                                        <div className="p-4 pt-0 animate-slide-down">
                                            {/* Drawing Container - Clickable */}
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    // Always try to view, even if just base image
                                                    onViewDrawing(round);
                                                }}
                                                className="aspect-square w-full relative group rounded-xl overflow-hidden shadow-lg bg-white box-content border-4 border-white active:scale-[0.98] transition-all"
                                            >
                                                {winnerDrawing || round.imageUrl ? (
                                                    <DrawingDisplay
                                                        imageUrl={round.imageUrl}
                                                        strokes={winnerDrawing?.strokes || []}
                                                        block={round.block}
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                                                        No image data
                                                    </div>
                                                )}
                                                
                                                {/* Hint Overlay - Always visible on bottom on mobile, or on hover */}
                                                <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/60 to-transparent flex justify-center">
                                                    <span className="bg-white/20 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-bold border border-white/20 shadow-sm">
                                                        Tap to View & Save
                                                    </span>
                                                </div>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

// Canvas Renderer Component
const DrawingDisplay: React.FC<{
    imageUrl: string;
    strokes: DrawingStroke[];
    block?: BlockInfo;
}> = ({ imageUrl, strokes, block }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear previous
        ctx.clearRect(0,0, canvas.width, canvas.height);

        if (!imageUrl) return; // Guard

        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = imageUrl;

        // Handle load error
        img.onerror = () => {
             console.warn('Failed to load base image for drawing display');
        };

        img.onload = () => {
            const size = canvas.width; // Assume square
            
            // 1. Draw Base
            try {
                ctx.drawImage(img, 0, 0, size, size);
            } catch (e) {
                console.warn('Error drawing base image', e);
            }

             // 2. Draw Block
             if (block && typeof block.x === 'number') { // Basic validation
                ctx.fillStyle = '#ffffff';
                const bx = (block.x / 100) * size;
                const by = (block.y / 100) * size;
                const bSize = (block.size / 100) * size;

                if (block.type === 'circle') {
                    ctx.beginPath();
                    ctx.arc(bx + bSize / 2, by + bSize / 2, bSize / 2, 0, Math.PI * 2);
                    ctx.fill();
                } else {
                    ctx.fillRect(bx, by, bSize, bSize);
                }
            }

            // 3. Draw Strokes
            if (Array.isArray(strokes)) {
                for (const stroke of strokes) {
                    if (!stroke.points || stroke.points.length === 0) continue;

                    ctx.beginPath();
                    ctx.strokeStyle = stroke.isEraser ? '#ffffff' : stroke.color;
                    ctx.lineWidth = stroke.size ? (stroke.size / 600) * size * 1.5 : 2; // Scale width roughly
                    ctx.lineCap = 'round';
                    ctx.lineJoin = 'round';

                    const points = stroke.points.map(p => ({
                        x: (p.x / 100) * size,
                        y: (p.y / 100) * size
                    }));

                    ctx.moveTo(points[0].x, points[0].y);
                    for (let i = 1; i < points.length; i++) {
                        ctx.lineTo(points[i].x, points[i].y);
                    }
                    ctx.stroke();
                }
            }
        };
    }, [imageUrl, strokes, block]);

    return <canvas ref={canvasRef} width={400} height={400} className="w-full h-full object-cover bg-white" />;
};
