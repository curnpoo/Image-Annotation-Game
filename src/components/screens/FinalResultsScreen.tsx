import React, { useState, useEffect } from 'react';
import { XPService } from '../../services/xp';
import { AuthService } from '../../services/auth';
import { StatsService } from '../../services/stats';
import { StatsHistoryService } from '../../services/statsHistory';
import type { GameRoom } from '../../types';
import { Confetti } from '../common/Confetti';
import { vibrate, HapticPatterns } from '../../utils/haptics';

interface FinalResultsScreenProps {
    room: GameRoom;
    currentPlayerId: string;
    onPlayAgain: () => void;
    onGoHome: () => void;
    showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const FinalResultsScreen: React.FC<FinalResultsScreenProps> = ({
    room,
    currentPlayerId,
    onPlayAgain,
    onGoHome,
    showToast
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

    // Process final stats once
    useEffect(() => {
        const processFinalStats = async () => {
            // prevent running multiple times
            if (sessionStorage.getItem(`processed_game_${room.roomCode}`)) return;
            sessionStorage.setItem(`processed_game_${room.roomCode}`, 'true');

            // 1. Award Completion XP
            const { leveledUp, newLevel } = XPService.addXP(100);
            setTimeout(() => {
                showToast(leveledUp ? `🎉 Level Up! Level ${newLevel}` : `+100 XP Game Complete!`, 'success');
            }, 500);

            // 2. Calculate Winner
            const sortedPlayers = [...room.players].sort((a, b) => (room.scores[b.id] || 0) - (room.scores[a.id] || 0));
            const isWinner = sortedPlayers[0]?.id === currentPlayerId; // Changed player.id to currentPlayerId

            // 3. Update Stats
            const currentUser = AuthService.getCurrentUser();
            if (currentUser && currentUser.id === currentPlayerId) { // Ensure we're updating the current player's stats
                const currentStats = currentUser.stats || {
                    gamesPlayed: 0, gamesWon: 0, roundsWon: 0, roundsLost: 0,
                    timesSabotaged: 0, timesSaboteur: 0, totalCurrencyEarned: 0,
                    totalXPEarned: 0, highestLevel: 1
                };

                const newStats = {
                    ...currentStats,
                    gamesPlayed: currentStats.gamesPlayed + 1,
                    gamesWon: currentStats.gamesWon + (isWinner ? 1 : 0),
                    totalXPEarned: currentStats.totalXPEarned + 100,
                    highestLevel: Math.max(currentStats.highestLevel, newLevel || 1)
                };

                // Award Currency (e.g., 50 coins for playing, +100 for winning)
                const currencyEarned = 50 + (isWinner ? 100 : 0);
                const newCurrency = (currentUser.currency || 0) + currencyEarned;

                // Track currency earned in stats
                await StatsService.recordCurrencyEarned(currencyEarned);

                // Track sabotage stats only if sabotage round was the final round
                // (Earlier rounds' sabotage is tracked in ResultsScreen)
                if (room.sabotageRound === room.roundNumber) {
                    if (room.saboteurId === currentPlayerId) {
                        await StatsService.recordWasSaboteur();
                    }
                    if (room.sabotageTargetId === currentPlayerId && room.sabotageTriggered) {
                        await StatsService.recordSabotaged();
                    }
                }

                AuthService.updateUser(currentPlayerId, { // Changed player.id to currentPlayerId
                    stats: newStats,
                    xp: XPService.getXP(),
                    currency: newCurrency
                });

                showToast(`+${currencyEarned} Coins Earned! 🪙`, 'success');

                // Record stats snapshot for history/trends
                StatsHistoryService.recordSnapshot();
            }
        };

        processFinalStats();
    }, [room.roomCode, currentPlayerId, room.players, room.scores, showToast]);

    // Stats Logic
    const [showStatsModal, setShowStatsModal] = useState(false);
    const [pendingAction, setPendingAction] = useState<'home' | 'replay' | null>(null);
    const [earnedStats, setEarnedStats] = useState<{ xp: number; coins: number; isWinner: boolean; newLevel?: number } | null>(null);

    // Capture calculated stats (using a separate effect or ref logic would be cleaner, but we can hook into the existing one if we move logic out,
    // OR we can just re-calculate/access them since they are deterministic based on room state).
    // Let's re-calculate cleanly here for display purposes.
    useEffect(() => {
        if (!earnedStats && mounted) {
            const sortedPlayers = [...room.players].sort((a, b) => (room.scores[b.id] || 0) - (room.scores[a.id] || 0));
            const isWinner = sortedPlayers[0]?.id === currentPlayerId;
            const currencyEarned = 50 + (isWinner ? 100 : 0);
            // We can't easily know "newLevel" here without duplicating the XP service call which acts as a transaction.
            // For now, let's just show "+100 XP".
            setEarnedStats({
                xp: 100,
                coins: currencyEarned,
                isWinner
            });
        }
    }, [room, currentPlayerId, mounted]);


    const handleGoHome = () => {
        setPendingAction('home');
        setShowStatsModal(true);
    };

    const handlePlayAgain = () => {
        setPendingAction('replay');
        setShowStatsModal(true);
    };

    const handleContinue = () => {
        if (pendingAction === 'home') onGoHome();
        if (pendingAction === 'replay') onPlayAgain();
    };


    const isHost = room.hostId === currentPlayerId;

    // Sort players by score
    const sortedPlayers = [...room.players].sort(
        (a, b) => (room.scores[b.id] || 0) - (room.scores[a.id] || 0)
    );

    const [first, second, third] = sortedPlayers;

    return (
        <div
            className={`min-h-screen flex flex-col items-center p-4 relative overflow-hidden ${mounted ? 'pop-in' : 'opacity-0'}`}
            style={{
                paddingTop: 'max(1.5rem, env(safe-area-inset-top) + 1rem)',
                backgroundColor: 'var(--theme-bg-primary)'
            }}
        >
            {/* Confetti Effect */}
            {showConfetti && <Confetti />}

            {/* Home Button Card */}
            <button
                onClick={handleGoHome}
                className="w-full max-w-md mb-4 rounded-[2rem] p-4 flex items-center gap-4 hover:brightness-110 active:scale-95 transition-all z-10 shadow-lg"
                style={{
                    backgroundColor: 'var(--theme-card-bg)',
                    border: '2px solid var(--theme-border)'
                }}
            >
                <div className="text-3xl">🏠</div>
                <div className="flex-1 text-left">
                    <div className="text-lg font-bold" style={{ color: 'var(--theme-text)' }}>Back to Home</div>
                    <div className="text-sm font-medium" style={{ color: 'var(--theme-text-secondary)' }}>Return to main menu</div>
                </div>
                <div className="text-2xl" style={{ color: 'var(--theme-text-secondary)' }}>←</div>
            </button>

            {/* Header */}
            <div className="text-center mb-6 z-10">
                <h1 className="text-5xl font-black drop-shadow-xl mb-2 animate-pulse" style={{ color: 'var(--theme-text)' }}>
                    🏆 GAME OVER! 🏆
                </h1>
                <p className="font-bold text-xl" style={{ color: 'var(--theme-text-secondary)' }}>
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
                            className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold text-white mb-2 border-4 border-white shadow-xl"
                            style={{ backgroundColor: second.color }}
                        >
                            {second.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="bg-gradient-to-b from-gray-300 to-gray-400 w-28 h-28 rounded-t-2xl flex flex-col items-center justify-center border-t border-white/30"
                            style={{ boxShadow: '0 6px 0 rgba(0,0,0,0.2)' }}>
                            <span className="text-3xl font-bold text-gray-800">2nd</span>
                            <span className="text-lg font-bold text-gray-700">{room.scores[second.id] || 0}</span>
                            <span className="text-sm text-gray-600">points</span>
                        </div>
                        <p className="mt-2 font-bold text-lg" style={{ color: 'var(--theme-text)' }}>{second.name}</p>
                    </div>
                )}

                {/* 1st Place - THE WINNER */}
                {first && (
                    <div className="flex flex-col items-center pop-in" style={{ animationDelay: '0.1s' }}>
                        <div className="text-6xl mb-2 animate-bounce">👑</div>
                        <div
                            className="w-32 h-32 rounded-full flex items-center justify-center text-4xl font-bold text-white mb-2 border-4 border-yellow-300 shadow-xl"
                            style={{
                                backgroundColor: first.color,
                                boxShadow: '0 8px 0 rgba(0,0,0,0.2), 0 0 30px rgba(255, 215, 0, 0.5)'
                            }}
                        >
                            {first.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="bg-gradient-to-b from-yellow-400 to-yellow-500 w-36 h-36 rounded-t-2xl flex flex-col items-center justify-center border-t border-white/30"
                            style={{ boxShadow: '0 6px 0 rgba(0,0,0,0.2)' }}>
                            <span className="text-4xl font-bold text-yellow-900">1st</span>
                            <span className="text-2xl font-bold text-yellow-800">{room.scores[first.id] || 0}</span>
                            <span className="text-sm text-yellow-700">points</span>
                        </div>
                        <p className="mt-2 font-black text-2xl" style={{ color: 'var(--theme-text)' }}>{first.name}</p>
                    </div>
                )}

                {/* 3rd Place */}
                {third && (
                    <div className="flex flex-col items-center pop-in" style={{ animationDelay: '0.5s' }}>
                        <div className="text-4xl mb-2">🥉</div>
                        <div
                            className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white mb-2 border-4 border-white shadow-xl"
                            style={{ backgroundColor: third.color }}
                        >
                            {third.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="bg-gradient-to-b from-orange-300 to-orange-400 w-24 h-20 rounded-t-2xl flex flex-col items-center justify-center border-t border-white/30"
                            style={{ boxShadow: '0 6px 0 rgba(0,0,0,0.2)' }}>
                            <span className="text-2xl font-bold text-orange-900">3rd</span>
                            <span className="text-lg font-bold text-orange-800">{room.scores[third.id] || 0}</span>
                            <span className="text-xs text-orange-700">points</span>
                        </div>
                        <p className="mt-2 font-bold text-lg" style={{ color: 'var(--theme-text)' }}>{third.name}</p>
                    </div>
                )}
            </div>

            {/* All Scores */}
            <div className="rounded-[2rem] p-6 mb-6 w-full max-w-md shadow-2xl z-10"
                style={{
                    backgroundColor: 'var(--theme-card-bg)',
                    border: '2px solid var(--theme-border)'
                }}>
                <h3 className="text-xl font-bold mb-4 text-center" style={{ color: 'var(--theme-text)' }}>📊 Final Scores</h3>
                <div className="space-y-2">
                    {sortedPlayers.map((player, i) => (
                        <div
                            key={player.id}
                            className="flex items-center justify-between p-3 rounded-2xl transition-transform"
                            style={{
                                backgroundColor: i === 0 ? 'var(--theme-accent-alpha-20)' : 'var(--theme-bg-secondary)',
                                border: i === 0 ? '2px solid var(--theme-accent)' : 'none'
                            }}
                        >
                            <div className="flex items-center gap-3">
                                <span className="font-bold w-6" style={{ color: 'var(--theme-text-secondary)' }}>#{i + 1}</span>
                                <div
                                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm"
                                    style={{ backgroundColor: player.color }}
                                >
                                    {player.name.charAt(0).toUpperCase()}
                                </div>
                                <span className="font-bold" style={{ color: 'var(--theme-text)' }}>{player.name}</span>
                                {player.id === currentPlayerId && (
                                    <span className="text-xs opacity-60 font-bold" style={{ color: 'var(--theme-text)' }}>(You)</span>
                                )}
                            </div>
                            <span className="font-black text-lg" style={{ color: i === 0 ? 'var(--theme-accent)' : 'var(--theme-text)' }}>
                                {room.scores[player.id] || 0}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Play Again Button */}
            {isHost ? (
                <button
                    onClick={handlePlayAgain}
                    className="z-10 w-full max-w-sm text-white px-10 py-5 rounded-[2rem] font-black text-2xl shadow-2xl hover:scale-105 active:scale-95 transition-all"
                    style={{
                        background: 'linear-gradient(135deg, var(--theme-accent) 0%, #FFD700 100%)'
                    }}
                >
                    🎮 Play Again!
                </button>
            ) : (
                <p className="z-10 font-bold animate-pulse text-lg" style={{ color: 'var(--theme-text-secondary)' }}>
                    Waiting for host to start new game...
                </p>
            )}

            {/* Rewards Modal */}
            {showStatsModal && earnedStats && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 pop-in">
                    <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-sm mx-4 text-center border-4 border-yellow-400 shadow-2xl relative overflow-hidden"
                        style={{
                            backgroundColor: 'var(--theme-card-bg)',
                            borderColor: 'var(--theme-accent)'
                        }}>
                        {/* Shine effect */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none" />

                        <div className="text-6xl mb-4 animate-bounce">🎁</div>
                        <h2 className="text-3xl font-black mb-2" style={{ color: 'var(--theme-text)' }}>Round Rewards</h2>
                        <p className="mb-6 font-medium" style={{ color: 'var(--theme-text-secondary)' }}>Great game! Here's what you earned:</p>

                        <div className="space-y-4 mb-8">
                            {/* Coins */}
                            <div className="rounded-2xl p-4 border-2 flex items-center justify-between"
                                style={{
                                    backgroundColor: 'var(--theme-bg-secondary)',
                                    borderColor: 'var(--theme-border)'
                                }}>
                                <div className="flex items-center gap-3">
                                    <span className="text-3xl">🪙</span>
                                    <span className="font-bold" style={{ color: 'var(--theme-text)' }}>Coins</span>
                                </div>
                                <div className="text-2xl font-black text-green-500">+{earnedStats.coins}</div>
                            </div>

                            {/* XP */}
                            <div className="rounded-2xl p-4 border-2 flex items-center justify-between"
                                style={{
                                    backgroundColor: 'var(--theme-bg-secondary)',
                                    borderColor: 'var(--theme-border)'
                                }}>
                                <div className="flex items-center gap-3">
                                    <span className="text-3xl">✨</span>
                                    <span className="font-bold" style={{ color: 'var(--theme-text)' }}>XP</span>
                                </div>
                                <div className="text-2xl font-black text-purple-500">+{earnedStats.xp}</div>
                            </div>
                        </div>

                        <button
                            onClick={handleContinue}
                            className="w-full text-white py-4 rounded-xl font-bold text-lg hover:scale-105 active:scale-95 transition-all shadow-xl"
                            style={{
                                backgroundColor: 'var(--theme-accent)'
                            }}
                        >
                            Continue
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
