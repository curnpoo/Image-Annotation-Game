import React, { useState, useEffect } from 'react';
import type { GameRoom } from '../../types';
import { AvatarDisplay } from '../common/AvatarDisplay';
import { GameCanvas } from '../game/GameCanvas';
import { vibrate, HapticPatterns } from '../../utils/haptics';

interface VotingScreenProps {
    room: GameRoom;
    currentPlayerId: string;
    onVote: (votedForId: string) => void;
}

export const VotingScreen: React.FC<VotingScreenProps> = ({
    room,
    currentPlayerId,
    onVote
}) => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [hasVoted, setHasVoted] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Get all completed drawings and sort by join time for stability
    const drawings = room.players
        .filter(p => room.playerStates[p.id]?.drawing)
        .map(p => ({
            player: p,
            drawing: room.playerStates[p.id].drawing!
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

    const handleVote = () => {
        if (!isOwnDrawing && currentDrawing && !hasVoted) {
            vibrate(HapticPatterns.success);
            onVote(currentDrawing.player.id);
            setHasVoted(true);
        }
    };

    if (!currentDrawing) {
        return (
            <div className="min-h-screen bg-90s-animated flex items-center justify-center">
                <div className="text-2xl font-bold text-white">No drawings to vote on!</div>
            </div>
        );
    }

    return (
        <div
            className={`fixed inset-0 bg-90s-animated flex flex-col p-4 ${mounted ? 'pop-in' : 'opacity-0'} overflow-hidden touch-none`}
            style={{
                paddingTop: 'max(1rem, env(safe-area-inset-top) + 1rem)',
                paddingBottom: 'max(1rem, env(safe-area-inset-bottom) + 1rem)'
            }}
        >
            {/* Header */}
            <div className="text-center mb-4">
                <h1 className="text-3xl font-bold text-white drop-shadow-lg mb-2">
                    🗳️ Vote Time!
                </h1>
                <div className="inline-block bg-white/90 rounded-full px-4 py-2 font-bold text-purple-600">
                    {votedCount}/{totalPlayers} voted
                </div>

                {/* Show missing voters if few remain */}
                {(totalPlayers - votedCount) <= 2 && (totalPlayers - votedCount) > 0 && (
                    <div className="mt-2 text-sm text-white/90 font-medium animate-pulse">
                        Waiting for: {room.players.filter(p => !room.votes[p.id]).map(p => p.name).join(', ')}
                    </div>
                )}
            </div>

            {/* Drawing Display */}
            <div className="flex-1 flex flex-col items-center justify-center">
                {/* Player Name */}
                <div className="bg-white rounded-2xl px-6 py-3 mb-4 pop-in flex items-center gap-3"
                    style={{
                        boxShadow: '0 4px 0 rgba(155, 89, 182, 0.3)',
                        border: `3px solid ${currentDrawing.player.color}`
                    }}>
                    <AvatarDisplay
                        strokes={currentDrawing.player.avatarStrokes}
                        avatar={currentDrawing.player.avatar}
                        frame={currentDrawing.player.frame}
                        color={currentDrawing.player.color}
                        size={40}
                    />
                    <span className="text-xl font-bold" style={{ color: currentDrawing.player.color }}>
                        {currentDrawing.player.name}
                        {isOwnDrawing && <span className="ml-2 text-gray-400">(You)</span>}
                    </span>
                </div>

                {/* Drawing Canvas - Show the image with their drawing */}
                <div className="relative w-full max-w-md aspect-square rounded-2xl overflow-hidden"
                    style={{
                        boxShadow: '0 10px 0 rgba(155, 89, 182, 0.4), 0 20px 40px rgba(0, 0, 0, 0.3)',
                        border: '5px solid white'
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
                            className="absolute bg-white"
                            style={{
                                left: `${room.block.x}%`,
                                top: `${room.block.y}%`,
                                width: `${room.block.size}%`,
                                height: `${room.block.size}%`,
                                borderRadius: room.block.type === 'circle' ? '50%' : '0',
                                boxShadow: 'inset 0 0 20px rgba(0,0,0,0.1)'
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
                <div className="flex gap-2 mt-4">
                    {drawings.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => {
                                vibrate();
                                setSelectedIndex(i);
                            }}
                            className={`w-3 h-3 rounded-full transition-all ${i === selectedIndex
                                ? 'bg-white scale-125'
                                : 'bg-white/40 hover:bg-white/60'
                                }`}
                        />
                    ))}
                </div>
            </div>

            {/* Bottom Actions */}
            <div className="mt-4 flex flex-col items-center gap-3">
                {/* Navigation Arrows */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => {
                            vibrate();
                            setSelectedIndex(Math.max(0, selectedIndex - 1));
                        }}
                        disabled={selectedIndex === 0}
                        className={`w-12 h-12 rounded-full text-2xl transition-all ${selectedIndex === 0
                            ? 'bg-gray-200 text-gray-400'
                            : 'bg-white hover:scale-110 jelly-hover'
                            }`}
                        style={{ boxShadow: selectedIndex !== 0 ? '0 3px 0 rgba(0,0,0,0.2)' : 'none' }}
                    >
                        ←
                    </button>

                    {/* Vote Button */}
                    {hasVoted ? (
                        <div className="bg-green-500 text-white px-8 py-4 rounded-2xl font-bold text-xl">
                            ✓ Voted!
                        </div>
                    ) : isOwnDrawing ? (
                        <div className="bg-gray-300 text-gray-500 px-8 py-4 rounded-2xl font-bold text-lg">
                            Can't vote for yourself
                        </div>
                    ) : (
                        <button
                            onClick={handleVote}
                            className="btn-90s bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 text-white px-8 py-4 rounded-2xl font-bold text-xl jelly-hover"
                        >
                            🗳️ VOTE
                        </button>
                    )}

                    <button
                        onClick={() => {
                            vibrate();
                            setSelectedIndex(Math.min(drawings.length - 1, selectedIndex + 1));
                        }}
                        disabled={selectedIndex === drawings.length - 1}
                        className={`w-12 h-12 rounded-full text-2xl transition-all ${selectedIndex === drawings.length - 1
                            ? 'bg-gray-200 text-gray-400'
                            : 'bg-white hover:scale-110 jelly-hover'
                            }`}
                        style={{ boxShadow: selectedIndex !== drawings.length - 1 ? '0 3px 0 rgba(0,0,0,0.2)' : 'none' }}
                    >
                        →
                    </button>
                </div>

                {hasVoted && (
                    <p className="text-white/80 font-medium animate-pulse">
                        Waiting for others to vote...
                    </p>
                )}
            </div>
        </div>
    );
};
