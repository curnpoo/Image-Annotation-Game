import React, { useState, useEffect } from 'react';
import type { GameRoom } from '../../types';
import { StorageService } from '../../services/storage';
import { XPService } from '../../services/xp';
import { AvatarDisplay } from '../common/AvatarDisplay';
import { GameCanvas } from '../game/GameCanvas';
import { vibrate, HapticPatterns } from '../../utils/haptics';
import { useDrawings } from '../../hooks/useDrawings';
import { ForceAdvanceButton } from '../common/ForceAdvanceButton';

interface VotingScreenProps {
    room: GameRoom;
    currentPlayerId: string;
    onVote: (votedForId: string) => void;
    showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const VotingScreen: React.FC<VotingScreenProps> = ({
    room,
    currentPlayerId,
    onVote,
    showToast
}) => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [hasVoted, setHasVoted] = useState(false);
    const [mounted, setMounted] = useState(false);

    // Fetch drawings from separate path (optimized)
    const { drawings: drawingsMap, loading: drawingsLoading } = useDrawings(room.roomCode, room.roundNumber);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Get all completed drawings and sort by join time for stability
    const drawings = room.players
        .filter(p => drawingsMap[p.id]) // Use drawingsMap instead of playerStates
        .map(p => ({
            player: p,
            drawing: drawingsMap[p.id]
        }))
        .sort((a, b) => a.player.joinedAt - b.player.joinedAt);

    const votedCount = Object.keys(room.votes).length;
    const totalPlayers = room.players.length;
    const currentDrawing = drawings[selectedIndex];
    const isOwnDrawing = currentDrawing?.player.id === currentPlayerId;
    const alreadyVoted = !!room.votes[currentPlayerId];

    useEffect(() => {
        setHasVoted(alreadyVoted);
    }, [alreadyVoted]);


    const isHost = room.hostId === currentPlayerId;
    const waitingForVotes = room.players.filter(p => !room.votes[p.id]).map(p => p.name);

    const handleVote = async () => {
        if (!isOwnDrawing && currentDrawing && !hasVoted) {
            // OPTIMISTIC: Show voted immediately
            setHasVoted(true);
            vibrate(HapticPatterns.success);

            // Award XP for voting
            const { leveledUp, newLevel } = XPService.addXP(10);
            if (leveledUp) {
                showToast(`🎉 Level Up! You are now level ${newLevel}!`, 'success');
            } else {
                showToast(`Vote cast! +10 XP ✨`, 'success');
            }

            // Fire and forget with error handling
            try {
                await StorageService.submitVote(room.roomCode, currentPlayerId, currentDrawing.player.id);
            } catch (error) {
                console.error('Vote submission failed:', error);
                setHasVoted(false);
                showToast('Vote failed. Tap to retry.', 'error');
            }

            onVote(currentDrawing.player.id);
        }
    };

    // Show loading state while fetching drawings from separate path
    if (drawingsLoading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center"
                style={{ backgroundColor: 'var(--theme-bg-primary)' }}>
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-transparent mb-4"
                    style={{ borderColor: 'var(--theme-accent)', borderTopColor: 'transparent' }} />
                <div className="text-lg font-bold" style={{ color: 'var(--theme-text)' }}>
                    Loading drawings...
                </div>
            </div>
        );
    }

    if (!currentDrawing) {
        return (
            <div className="min-h-screen flex items-center justify-center"
                style={{ backgroundColor: 'var(--theme-bg-primary)' }}>
                <div className="text-2xl font-bold" style={{ color: 'var(--theme-text)' }}>
                    No drawings to vote on!
                </div>
            </div>
        );
    }

    return (
        <div
            className={`fixed inset-0 flex flex-col p-4 ${mounted ? 'pop-in' : 'opacity-0'} overflow-hidden touch-none`}
            style={{
                paddingTop: 'max(1rem, env(safe-area-inset-top) + 1rem)',
                paddingBottom: 'max(1rem, env(safe-area-inset-bottom) + 1rem)',
                backgroundColor: 'var(--theme-bg-primary)'
            }}
        >
            {/* Header */}
            <div className="text-center mb-4">
                <h1 className="text-3xl font-black mb-2" style={{ color: 'var(--theme-text)' }}>
                    🗳️ Vote Time!
                </h1>
                <div className="inline-block px-4 py-2 rounded-full font-bold shadow-lg"
                    style={{
                        backgroundColor: 'var(--theme-card-bg)',
                        color: 'var(--theme-accent)',
                        border: '2px solid var(--theme-border)'
                    }}>
                    {votedCount}/{totalPlayers} voted
                </div>

                {/* Sabotage victim reveal */}
                {room.sabotageTargetId && (
                    <div className="mt-3 bg-[#8B0000] text-[#FFaaaa] rounded-full px-4 py-2 font-bold text-sm inline-block animate-pulse shadow-md border border-red-900/30">
                        ⚠️ {room.players.find(p => p.id === room.sabotageTargetId)?.name || 'Someone'} was SABOTAGED!
                    </div>
                )}

                {/* Show missing voters if few remain */}
                {(totalPlayers - votedCount) <= 2 && (totalPlayers - votedCount) > 0 && (
                    <div className="mt-2 text-sm font-medium animate-pulse" style={{ color: 'var(--theme-text-secondary)' }}>
                        Waiting for: {room.players.filter(p => !room.votes[p.id]).map(p => p.name).join(', ')}
                    </div>
                )}
            </div>

            {/* Drawing Display */}
            <div className="flex-1 flex flex-col items-center justify-center">
                {/* Player Name */}
                <div className="rounded-[2rem] px-6 py-3 mb-4 pop-in flex items-center gap-3 shadow-xl"
                    style={{
                        backgroundColor: 'var(--theme-card-bg)', // Using theme card bg
                        border: `3px solid ${currentDrawing.player.color}`
                    }}>
                    <AvatarDisplay
                        strokes={currentDrawing.player.avatarStrokes}
                        avatar={currentDrawing.player.avatar}
                        frame={currentDrawing.player.frame}
                        color={currentDrawing.player.color}
                        backgroundColor={currentDrawing.player.backgroundColor}
                        size={40}
                    />
                    <span className="text-xl font-bold" style={{ color: currentDrawing.player.color }}>
                        {currentDrawing.player.name}
                        {isOwnDrawing && <span className="ml-2 text-[var(--theme-text-secondary)] opacity-60">(You)</span>}
                    </span>
                </div>

                {/* Drawing Canvas - Show the image with their drawing */}
                <div className="relative w-full max-w-md aspect-square rounded-3xl overflow-hidden shadow-2xl"
                    style={{
                        border: '4px solid var(--theme-card-bg)' // Clean border
                    }}>
                    {/* Base image */}
                    <img
                        src={room.currentImage?.url}
                        alt="Round image"
                        className="absolute inset-0 w-full h-full object-cover"
                    />

                    {/* Block overlay */}
                    {room.block && (
                        <div
                            className="absolute shadow-inner"
                            style={{
                                left: `${room.block.x}%`,
                                top: `${room.block.y}%`,
                                width: `${room.block.size}%`,
                                height: `${room.block.size}%`,
                                borderRadius: room.block.type === 'circle' ? '50%' : '12px',
                                backgroundColor: '#ffffff',
                                opacity: 1,
                                zIndex: 10
                            }}
                        />
                    )}

                    {/* Drawing overlay - use GameCanvas for proper eraser rendering */}
                    <div className="absolute inset-0 pointer-events-none">
                        <GameCanvas
                            imageUrl={room.currentImage?.url || ''}
                            brushColor="#000000" // Dummy value, not used in read-only
                            brushSize={10} // Dummy value
                            isDrawingEnabled={false}
                            strokes={currentDrawing.drawing.strokes || []}
                            onStrokesChange={() => { }} // Read-only
                            isEraser={false}
                        />
                    </div>
                </div>

                {/* Navigation Dots */}
                <div className="flex gap-2 mt-6">
                    {drawings.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => {
                                vibrate();
                                setSelectedIndex(i);
                            }}
                            className={`w-3 h-3 rounded-full transition-all duration-300 ${i === selectedIndex
                                ? 'scale-125'
                                : 'opacity-40 hover:opacity-100'
                                }`}
                            style={{
                                backgroundColor: i === selectedIndex ? 'var(--theme-accent)' : 'var(--theme-text)'
                            }}
                        />
                    ))}
                </div>
            </div>

            {/* Bottom Actions */}
            <div className="mt-6 flex flex-col items-center gap-3">
                {/* Navigation Arrows & Vote Button */}
                <div className="flex items-center justify-between w-full max-w-sm px-2 gap-4">
                    <button
                        onClick={() => {
                            vibrate();
                            setSelectedIndex(Math.max(0, selectedIndex - 1));
                        }}
                        disabled={selectedIndex === 0}
                        className={`w-14 h-14 flex-shrink-0 rounded-full text-2xl transition-all flex items-center justify-center shadow-lg ${selectedIndex === 0
                            ? 'opacity-30 cursor-not-allowed'
                            : 'hover:scale-110 active:scale-95'
                            }`}
                        style={{
                            backgroundColor: 'var(--theme-card-bg)',
                            color: 'var(--theme-text)',
                            border: '2px solid var(--theme-border)'
                        }}
                    >
                        ←
                    </button>

                    {/* Vote Button Area - Centered & Flexible */}
                    <div className="flex-1 flex justify-center min-w-0">
                        {hasVoted ? (
                            <div className="px-6 py-4 rounded-2xl font-bold text-lg shadow-lg whitespace-nowrap animate-bounce flex items-center justify-center gap-2"
                                style={{ backgroundColor: '#22c55e', color: '#ffffff' }}>
                                ✓ Voted!
                            </div>
                        ) : isOwnDrawing ? (
                            <div className="px-6 py-4 rounded-2xl font-bold text-sm text-center shadow-inner leading-tight opacity-70"
                                style={{
                                    backgroundColor: 'var(--theme-bg-secondary)',
                                    color: 'var(--theme-text)'
                                }}>
                                Your Drawing
                            </div>
                        ) : (
                            <button
                                onClick={handleVote}
                                className="w-full max-w-[200px] text-black py-4 rounded-2xl font-black text-xl shadow-xl transform transition-all hover:scale-105 active:scale-95"
                                style={{
                                    background: 'linear-gradient(135deg, var(--theme-accent) 0%, #FFD700 100%)',
                                    textShadow: '0 2px 0 rgba(0,0,0,0.2)'
                                }}
                            >
                                🗳️ VOTE
                            </button>
                        )}
                    </div>

                    <button
                        onClick={() => {
                            vibrate();
                            setSelectedIndex(Math.min(drawings.length - 1, selectedIndex + 1));
                        }}
                        disabled={selectedIndex === drawings.length - 1}
                        className={`w-14 h-14 flex-shrink-0 rounded-full text-2xl transition-all flex items-center justify-center shadow-lg ${selectedIndex === drawings.length - 1
                            ? 'opacity-30 cursor-not-allowed'
                            : 'hover:scale-110 active:scale-95'
                            }`}
                        style={{
                            backgroundColor: 'var(--theme-card-bg)',
                            color: 'var(--theme-text)',
                            border: '2px solid var(--theme-border)'
                        }}
                    >
                        →
                    </button>
                </div>

                {hasVoted && (
                    <p className="font-bold text-sm animate-pulse" style={{ color: 'var(--theme-text-secondary)' }}>
                        Waiting for others to vote...
                    </p>
                )}

                {/* Force Advance for Host */}
                <ForceAdvanceButton
                    isHost={isHost}
                    onForceAdvance={() => StorageService.forceAdvanceRound(room.roomCode)}
                    waitingForPlayers={waitingForVotes}
                    phaseName="voting"
                    timeoutSeconds={45}
                />
            </div>
        </div>
    );
};
