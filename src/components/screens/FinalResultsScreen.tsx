import React, { useState, useEffect } from 'react';
import type { GameRoom } from '../../types';
import { Confetti } from '../common/Confetti';
import { vibrate, HapticPatterns } from '../../utils/haptics';

interface FinalResultsScreenProps {
    room: GameRoom;
    currentPlayerId: string;
    onPlayAgain: () => void;
    onGoHome: () => void;
}

export const FinalResultsScreen: React.FC<FinalResultsScreenProps> = ({
    room,
    currentPlayerId,
    onPlayAgain,
    onGoHome
}) => {
    const [mounted, setMounted] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);

    useEffect(() => {
        setMounted(true);
        setTimeout(() => {
            setShowConfetti(true);
            vibrate(HapticPatterns.success);
        }, 800);
    }, []);

    const isHost = room.hostId === currentPlayerId;

    // Sort players by score
    const sortedPlayers = [...room.players].sort(
        (a, b) => (room.scores[b.id] || 0) - (room.scores[a.id] || 0)
    );

    const [first, second, third] = sortedPlayers;

    return (
        <div
            className={`min-h-screen bg-90s-animated flex flex-col items-center p-4 relative overflow-hidden ${mounted ? 'pop-in' : 'opacity-0'}`}
            style={{ paddingTop: 'max(1.5rem, env(safe-area-inset-top) + 1rem)' }}
        >
            {/* Confetti Effect */}
            {showConfetti && <Confetti />}

            {/* Home Button Card */}
            <button
                onClick={onGoHome}
                className="w-full max-w-md mb-4 bg-white/10 backdrop-blur-sm rounded-2xl p-4 border-2 border-white/20 flex items-center gap-4 hover:bg-white/20 active:scale-95 transition-all z-10"
            >
                <div className="text-3xl">🏠</div>
                <div className="flex-1 text-left">
                    <div className="text-lg font-bold text-white">Back to Home</div>
                    <div className="text-white/60 text-sm">Return to main menu</div>
                </div>
                <div className="text-2xl text-white/60">←</div>
            </button>

            {/* Header */}
            <div className="text-center mb-6 z-10">
                <h1 className="text-5xl font-bold text-white drop-shadow-lg mb-2 animate-pulse">
                    🏆 GAME OVER! 🏆
                </h1>
                <p className="text-white/80 font-medium text-xl">
                    After {room.settings.totalRounds} rounds...
                </p>
            </div>

            {/* Grand Podium */}
            <div className="flex items-end justify-center gap-6 mb-8 z-10">
                {/* 2nd Place */}
                {second && (
                    <div className="flex flex-col items-center pop-in" style={{ animationDelay: '0.3s' }}>
                        <div className="text-5xl mb-2">🥈</div>
                        <div
                            className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold text-white mb-2 border-4 border-white"
                            style={{
                                backgroundColor: second.color,
                                boxShadow: '0 6px 0 rgba(0,0,0,0.2)'
                            }}
                        >
                            {second.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="bg-gradient-to-b from-gray-300 to-gray-400 w-28 h-28 rounded-t-xl flex flex-col items-center justify-center"
                            style={{ boxShadow: '0 6px 0 rgba(0,0,0,0.2)' }}>
                            <span className="text-3xl font-bold text-gray-700">2nd</span>
                            <span className="text-lg font-bold text-gray-600">{room.scores[second.id] || 0}</span>
                            <span className="text-sm text-gray-500">points</span>
                        </div>
                        <p className="mt-2 font-bold text-white text-lg">{second.name}</p>
                    </div>
                )}

                {/* 1st Place - THE WINNER */}
                {first && (
                    <div className="flex flex-col items-center pop-in" style={{ animationDelay: '0.1s' }}>
                        <div className="text-6xl mb-2 animate-bounce">👑</div>
                        <div
                            className="w-32 h-32 rounded-full flex items-center justify-center text-4xl font-bold text-white mb-2 border-4 border-yellow-300"
                            style={{
                                backgroundColor: first.color,
                                boxShadow: '0 8px 0 rgba(0,0,0,0.2), 0 0 30px rgba(255, 215, 0, 0.5)'
                            }}
                        >
                            {first.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="bg-gradient-to-b from-yellow-400 to-yellow-500 w-36 h-36 rounded-t-xl flex flex-col items-center justify-center"
                            style={{ boxShadow: '0 6px 0 rgba(0,0,0,0.2)' }}>
                            <span className="text-4xl font-bold text-yellow-800">1st</span>
                            <span className="text-2xl font-bold text-yellow-700">{room.scores[first.id] || 0}</span>
                            <span className="text-sm text-yellow-600">points</span>
                        </div>
                        <p className="mt-2 font-bold text-white text-xl">🎉 {first.name} 🎉</p>
                    </div>
                )}

                {/* 3rd Place */}
                {third && (
                    <div className="flex flex-col items-center pop-in" style={{ animationDelay: '0.5s' }}>
                        <div className="text-4xl mb-2">🥉</div>
                        <div
                            className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white mb-2 border-4 border-white"
                            style={{
                                backgroundColor: third.color,
                                boxShadow: '0 4px 0 rgba(0,0,0,0.2)'
                            }}
                        >
                            {third.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="bg-gradient-to-b from-orange-300 to-orange-400 w-24 h-20 rounded-t-xl flex flex-col items-center justify-center"
                            style={{ boxShadow: '0 6px 0 rgba(0,0,0,0.2)' }}>
                            <span className="text-2xl font-bold text-orange-800">3rd</span>
                            <span className="text-lg font-bold text-orange-700">{room.scores[third.id] || 0}</span>
                            <span className="text-xs text-orange-600">points</span>
                        </div>
                        <p className="mt-2 font-bold text-white">{third.name}</p>
                    </div>
                )}
            </div>

            {/* All Scores */}
            <div className="bg-white/90 rounded-2xl p-4 mb-6 w-full max-w-sm z-10"
                style={{ boxShadow: '0 6px 0 rgba(155, 89, 182, 0.3)' }}>
                <h3 className="text-lg font-bold text-purple-600 mb-3 text-center">📊 Final Scores</h3>
                <div className="space-y-2">
                    {sortedPlayers.map((player, i) => (
                        <div
                            key={player.id}
                            className={`flex items-center justify-between px-3 py-2 rounded-lg ${i === 0 ? 'bg-yellow-100' : 'bg-gray-50'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-gray-400 w-6">#{i + 1}</span>
                                <div
                                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                                    style={{ backgroundColor: player.color }}
                                >
                                    {player.name.charAt(0).toUpperCase()}
                                </div>
                                <span className="font-medium">{player.name}</span>
                                {player.id === currentPlayerId && (
                                    <span className="text-xs text-gray-400">(You)</span>
                                )}
                            </div>
                            <span className="font-bold text-purple-600 text-lg">{room.scores[player.id] || 0}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Play Again Button */}
            {isHost ? (
                <button
                    onClick={onPlayAgain}
                    className="btn-90s bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 text-white px-10 py-5 rounded-2xl font-bold text-2xl jelly-hover z-10"
                >
                    🎮 Play Again!
                </button>
            ) : (
                <p className="text-white/80 font-medium animate-pulse z-10">
                    Waiting for host to start new game...
                </p>
            )}
        </div>
    );
};
