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
    onShowSettings?: () => void;
}

export const VotingScreen: React.FC<VotingScreenProps> = ({
    room,
    currentPlayerId,
    onVote,
    showToast,
    onShowSettings
}) => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [hasVoted, setHasVoted] = useState(false);
    // Fetch drawings from separate path (optimized)
    const { drawings: drawingsMap, loading: drawingsLoading } = useDrawings(room.roomCode, room.roundNumber);

    // useEffect(() => {
    //     setMounted(true);
    // }, []);

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

    if (drawingsLoading) {
        return (
            <div className="fixed inset-0 w-full h-[100dvh] flex flex-col items-center justify-center bg-black/5 overflow-hidden">
                {/* Background Bubbles */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                    <div className="bubble bg-indigo-500/10 w-96 h-96 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animation-delay-0 blur-3xl rounded-full absolute animate-pulse-slow"></div>
                </div>
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-t-transparent border-indigo-500 mb-6 z-10" />
                <div className="text-xl font-bold text-white/80 z-10 animate-pulse">
                    Collecting Masterpieces...
                </div>
            </div>
        );
    }

    if (!currentDrawing) {
        return (
            <div className="fixed inset-0 w-full h-[100dvh] flex items-center justify-center bg-black/5">
                <div className="glass-panel p-8 rounded-3xl text-center">
                    <div className="text-4xl mb-4">🖼️</div>
                    <div className="text-2xl font-bold text-white mb-2">
                        No drawings found!
                    </div>
                    <p className="text-white/60">Did everyone forget to draw?</p>
                </div>
            </div>
        );
    }

    // Safe area style for top
    const safeAreaTopStyle = {
        paddingTop: 'max(1rem, env(safe-area-inset-top) + 0.5rem)'
    };

    return (
        <div className="fixed inset-0 w-full h-[100dvh] overflow-hidden flex flex-col items-center bg-black/5 safe-area-padding">

            {/* Background Bubbles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                <div className="bubble bg-indigo-500/10 w-[500px] h-[500px] -right-20 -top-20 animation-delay-0 blur-3xl rounded-full absolute animate-float"></div>
                <div className="bubble bg-purple-500/10 w-[400px] h-[400px] -left-20 -bottom-20 animation-delay-2000 blur-3xl rounded-full absolute animate-float-slow"></div>
            </div>

            {/* Header Area */}
            <div
                className="w-full pb-2 px-4 z-10 flex flex-col items-center"
                style={safeAreaTopStyle}
            >
                {/* Header Row with Settings */}
                <div className="w-full relative flex items-center justify-center mb-2">
                    {/* Settings Button - Top Left */}
                    <button
                        onClick={onShowSettings}
                        className="absolute left-0 top-1/2 -translate-y-1/2 bg-white/10 backdrop-blur-md p-2 rounded-xl text-white hover:bg-white/20 transition-all active:scale-95 border border-white/10"
                    >
                        ⚙️
                    </button>

                    <h1 className="text-4xl font-black rainbow-text drop-shadow-lg text-center animate-slide-down">
                        Vote Time!
                    </h1>
                </div>

                {/* Stats Bar */}
                <div className="glass-panel px-4 py-2 rounded-full flex items-center gap-4 text-sm font-bold text-white/90 shadow-lg mb-2 backdrop-blur-md">
                    <div className="flex items-center gap-2">
                        <span className="text-indigo-300">🗳️ Voted:</span>
                        <span className={votedCount === totalPlayers ? "text-green-400" : "text-white"}>
                            {votedCount}/{totalPlayers}
                        </span>
                    </div>
                </div>

                {/* Sub-header info */}
                {room.sabotageTargetId && (
                    <div className="bg-red-500/20 border border-red-500/40 text-red-200 rounded-full px-4 py-1 font-bold text-xs inline-flex items-center gap-2 animate-pulse shadow-md backdrop-blur-md">
                        <span>⚠️</span>
                        <span>{room.players.find(p => p.id === room.sabotageTargetId)?.name || 'Someone'} was SABOTAGED!</span>
                    </div>
                )}
                {(totalPlayers - votedCount) <= 2 && (totalPlayers - votedCount) > 0 && (
                    <div className="text-xs font-medium text-white/50 animate-pulse mt-1">
                        Waiting for: {room.players.filter(p => !room.votes[p.id]).map(p => p.name).join(', ')}
                    </div>
                )}
            </div>

            {/* Main Content - Centered */}
            <div className="flex-1 w-full max-w-md relative z-10 flex flex-col items-center justify-center -mt-8 min-h-0 px-4">

                {/* Artist Card */}
                <div className="bg-white/10 backdrop-blur-xl rounded-[2rem] p-2 mb-4 animate-slide-up flex items-center gap-3 pr-6 border border-white/20 shadow-xl transition-all" key={currentDrawing.player.id}>
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-white/20 shadow-inner">
                        <AvatarDisplay
                            strokes={currentDrawing.player.avatarStrokes}
                            avatar={currentDrawing.player.avatar}
                            frame={currentDrawing.player.frame}
                            color={currentDrawing.player.color}
                            backgroundColor={currentDrawing.player.backgroundColor}
                            size={48}
                            playerId={currentDrawing.player.id}
                        />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs font-bold text-white/50 uppercase tracking-wider">Artist</span>
                        <span className="text-xl font-bold text-white leading-none">
                            {currentDrawing.player.name}
                            {isOwnDrawing && <span className="ml-2 text-white/40 text-sm">(You)</span>}
                        </span>
                    </div>
                </div>

                {/* Drawing Display */}
                <div className="relative w-full aspect-square bg-white rounded-[2rem] shadow-2xl overflow-hidden border-4 border-white/30 ring-4 ring-black/10 transition-all duration-500 group">
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

                    {/* Drawing overlay */}
                    <div className="absolute inset-0 pointer-events-none">
                        <GameCanvas
                            imageUrl={room.currentImage?.url || ''}
                            brushColor="#000000"
                            brushSize={10}
                            isDrawingEnabled={false}
                            strokes={currentDrawing.drawing.strokes || []}
                            onStrokesChange={() => { }}
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
                            className={`h-2 rounded-full transition-all duration-300 ${i === selectedIndex
                                ? 'w-8 bg-white shadow-glow'
                                : 'w-2 bg-white/30 hover:bg-white/50'
                                }`}
                        />
                    ))}
                </div>
            </div>

            {/* Bottom Controls Area */}
            <div className="w-full pb-6 px-4 z-20 safe-area-bottom-padding">
                <div className="max-w-md mx-auto flex items-center justify-between gap-4">
                    {/* Prev Button */}
                    <button
                        onClick={() => {
                            vibrate();
                            setSelectedIndex(Math.max(0, selectedIndex - 1));
                        }}
                        disabled={selectedIndex === 0}
                        className={`w-14 h-14 rounded-full flex items-center justify-center bg-white/10 backdrop-blur-md border border-white/20 text-white text-2xl transition-all ${selectedIndex === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white/20 active:scale-95 shadow-lg'}`}
                    >
                        ←
                    </button>

                    {/* Action Button */}
                    <div className="flex-1 flex justify-center h-16">
                        {hasVoted ? (
                            <div className="w-full h-full rounded-2xl bg-green-500/20 backdrop-blur-md border border-green-500/50 flex items-center justify-center gap-2 animate-bounce-gentle shadow-lg shadow-green-500/10">
                                <span className="text-2xl">✅</span>
                                <span className="font-bold text-green-300 text-lg uppercase tracking-wide">Voted</span>
                            </div>
                        ) : isOwnDrawing ? (
                            <div className="w-full h-full rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/50 font-bold uppercase tracking-widest text-sm italic">
                                Your Masterpiece
                            </div>
                        ) : (
                            <button
                                onClick={handleVote}
                                className="w-full h-full rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 border border-white/20 text-white font-black text-xl uppercase tracking-wider shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 group"
                            >
                                <span className="text-2xl group-hover:rotate-12 transition-transform">⭐</span>
                                Vote
                            </button>
                        )}
                    </div>

                    {/* Next Button */}
                    <button
                        onClick={() => {
                            vibrate();
                            setSelectedIndex(Math.min(drawings.length - 1, selectedIndex + 1));
                        }}
                        disabled={selectedIndex === drawings.length - 1}
                        className={`w-14 h-14 rounded-full flex items-center justify-center bg-white/10 backdrop-blur-md border border-white/20 text-white text-2xl transition-all ${selectedIndex === drawings.length - 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white/20 active:scale-95 shadow-lg'}`}
                    >
                        →
                    </button>
                </div>

                {/* Host Force Advance */}
                <div className="mt-4 flex justify-center">
                    <ForceAdvanceButton
                        isHost={isHost}
                        onForceAdvance={() => StorageService.forceAdvanceRound(room.roomCode)}
                        waitingForPlayers={waitingForVotes}
                        phaseName="voting"
                        timeoutSeconds={45}
                    />
                </div>
            </div>

        </div>
    );
};
