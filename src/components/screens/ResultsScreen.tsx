import React, { useState, useEffect, useMemo } from 'react';
import { XPService } from '../../services/xp';
import { AuthService } from '../../services/auth';
import type { GameRoom, Player } from '../../types';
import { AvatarDisplay } from '../common/AvatarDisplay';
import { Confetti } from '../common/Confetti';
import { vibrate, HapticPatterns } from '../../utils/haptics';

interface ResultsScreenProps {
    room: GameRoom;
    currentPlayerId: string;
    player: Player;
    onNextRound: () => void;
    showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

// Fun award definitions
const AWARDS = [
    { id: 'most-strokes', emoji: '🖌️', label: 'Brush Master', desc: 'Most strokes used' },
    { id: 'minimal', emoji: '✨', label: 'Minimalist', desc: 'Fewest strokes' },
    { id: 'big-brush', emoji: '🎨', label: 'Big Painter', desc: 'Largest avg brush size' },
    { id: 'fine-artist', emoji: '🔬', label: 'Fine Artist', desc: 'Smallest avg brush size' },
    { id: 'colorful', emoji: '🌈', label: 'Rainbow', desc: 'Most colors used' },
];

export const ResultsScreen: React.FC<ResultsScreenProps> = ({
    room,
    currentPlayerId,
    onNextRound,
    player, // Destructure player prop
    showToast // Destructure showToast prop
}) => {
    const [mounted, setMounted] = useState(false);
    const [showPodium, setShowPodium] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);

    // Track if we've already processed this round's results to avoid double XP
    const [processedRound, setProcessedRound] = useState<number>(-1);

    useEffect(() => {
        if (!room.roundResults || room.roundResults.length === 0) return;

        const latestResult = room.roundResults[room.roundResults.length - 1];

        // Only process if we haven't seen this round yet
        if (latestResult.roundNumber !== processedRound) {
            setProcessedRound(latestResult.roundNumber);

            // Find my rank
            const myRankIndex = latestResult.rankings.findIndex(r => r.playerId === player.id);
            if (myRankIndex !== -1) {
                const rank = myRankIndex + 1; // 1st, 2nd, 3rd
                let xpAward = 0;
                let wonRound = false;

                if (rank === 1) {
                    xpAward = 50;
                    wonRound = true;
                } else if (rank === 2) {
                    xpAward = 30;
                } else if (rank === 3) {
                    xpAward = 15;
                } else {
                    xpAward = 5; // Participation
                }

                // Double XP check
                if (room.isDoublePoints) xpAward *= 2;

                const { leveledUp, newLevel } = XPService.addXP(xpAward);

                // Show toast for significant XP
                setTimeout(() => {
                    if (leveledUp) {
                        showToast(`🎉 Level Up! Level ${newLevel}!`, 'success');
                    } else if (xpAward >= 15) {
                        showToast(`+${xpAward} XP! ${rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'}`, 'success');
                    }
                }, 1000); // Slight delay to let animations start

                // Update Stats
                const currentStats = AuthService.getCurrentUser()?.stats || {
                    gamesPlayed: 0, gamesWon: 0, roundsWon: 0, roundsLost: 0,
                    timesSabotaged: 0, timesSaboteur: 0, totalCurrencyEarned: 0,
                    totalXPEarned: 0, highestLevel: 1
                };

                const newStats = {
                    ...currentStats,
                    roundsWon: currentStats.roundsWon + (wonRound ? 1 : 0),
                    roundsLost: currentStats.roundsLost + (wonRound ? 0 : 1),
                    totalXPEarned: currentStats.totalXPEarned + xpAward,
                    highestLevel: Math.max(currentStats.highestLevel, newLevel || 1)
                };

                // Sync to AuthService (local + eventually firebase)
                if (AuthService.getCurrentUser()) {
                    AuthService.updateUser(player.id, { stats: newStats, xp: XPService.getXP() });
                }
            }
        }
    }, [room.roundResults, processedRound, player.id, room.isDoublePoints, showToast, room.roundNumber]); // Added room.roundNumber to dependencies for completeness

    useEffect(() => {
        setMounted(true);
        setTimeout(() => {
            setShowPodium(true);
            setShowConfetti(true);
            vibrate(HapticPatterns.success);
        }, 500);
    }, []);

    const latestResult = room.roundResults[room.roundResults.length - 1];
    const isHost = room.hostId === currentPlayerId;

    // Compute fun awards based on stroke data
    const awards = useMemo(() => {
        const playerAwards: { playerId: string; playerName: string; award: typeof AWARDS[0] }[] = [];

        const playerStats = room.players.map(p => {
            const drawing = room.playerStates[p.id]?.drawing;
            const strokes = drawing?.strokes || [];
            const strokeCount = strokes.length;
            const avgBrushSize = strokes.length > 0
                ? strokes.reduce((sum, s) => sum + (s.size || 4), 0) / strokes.length
                : 4;
            const uniqueColors = new Set(strokes.map(s => s.color)).size;

            return { player: p, strokeCount, avgBrushSize, uniqueColors };
        }).filter(s => s.strokeCount > 0);

        if (playerStats.length >= 2) {
            // Most Strokes
            const mostStrokes = playerStats.reduce((a, b) => a.strokeCount > b.strokeCount ? a : b);
            playerAwards.push({ playerId: mostStrokes.player.id, playerName: mostStrokes.player.name, award: AWARDS[0] });

            // Fewest Strokes (Minimalist)
            const fewestStrokes = playerStats.reduce((a, b) => a.strokeCount < b.strokeCount ? a : b);
            if (fewestStrokes.player.id !== mostStrokes.player.id) {
                playerAwards.push({ playerId: fewestStrokes.player.id, playerName: fewestStrokes.player.name, award: AWARDS[1] });
            }

            // Biggest Brush
            const bigBrush = playerStats.reduce((a, b) => a.avgBrushSize > b.avgBrushSize ? a : b);
            if (!playerAwards.find(a => a.playerId === bigBrush.player.id)) {
                playerAwards.push({ playerId: bigBrush.player.id, playerName: bigBrush.player.name, award: AWARDS[2] });
            }

            // Most Colorful
            const colorful = playerStats.reduce((a, b) => a.uniqueColors > b.uniqueColors ? a : b);
            if (colorful.uniqueColors > 1 && !playerAwards.find(a => a.playerId === colorful.player.id)) {
                playerAwards.push({ playerId: colorful.player.id, playerName: colorful.player.name, award: AWARDS[4] });
            }
        }

        return playerAwards;
    }, [room.players, room.playerStates]);

    if (!latestResult) {
        return (
            <div className="min-h-screen bg-90s-animated flex items-center justify-center">
                <div className="text-2xl font-bold text-white">Loading results...</div>
            </div>
        );
    }

    // Get top 3
    const [first, second, third] = latestResult.rankings;

    const getPlayer = (playerId: string) => room.players.find(p => p.id === playerId);

    return (
        <div className={`min-h-screen bg-90s-animated flex flex-col items-center justify-start pt-16 sm:pt-20 p-4 ${mounted ? 'pop-in' : 'opacity-0'}`}
            style={{ paddingTop: 'max(4rem, env(safe-area-inset-top))' }}>
            {/* Confetti! */}
            {showConfetti && <Confetti />}

            {/* Header */}
            <div className="text-center mb-6">
                <h1 className="text-4xl font-bold text-white drop-shadow-lg mb-2">
                    🏆 Round {room.roundNumber} Results!
                </h1>
                <p className="text-white/80 font-medium">
                    Round {room.roundNumber} of {room.settings.totalRounds}
                </p>
            </div>

            {/* Podium */}
            <div className={`flex items-end justify-center gap-4 mb-8 transition-all duration-700 ${showPodium ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                {/* 2nd Place */}
                {second && (() => {
                    const p = getPlayer(second.playerId);
                    return (
                        <div className="flex flex-col items-center pop-in" style={{ animationDelay: '0.3s' }}>
                            <div className="text-4xl mb-2">🥈</div>
                            <div className="mb-2">
                                <AvatarDisplay
                                    strokes={p?.avatarStrokes}
                                    avatar={p?.avatar}
                                    frame={p?.frame}
                                    color={p?.color}
                                    size={80}
                                    className="shadow-md"
                                />
                            </div>
                            <div className="bg-gradient-to-b from-gray-300 to-gray-400 w-24 h-24 rounded-t-lg flex flex-col items-center justify-center"
                                style={{ boxShadow: '0 4px 0 rgba(0,0,0,0.2)' }}>
                                <span className="text-2xl font-bold text-gray-700">2nd</span>
                                <span className="text-sm text-gray-600">{second.votes} votes</span>
                                <span className="text-xs text-gray-500">+{second.points} pts</span>
                            </div>
                            <p className="mt-2 font-bold text-white text-sm">{second.playerName}</p>
                        </div>
                    );
                })()}

                {/* 1st Place */}
                {first && (() => {
                    const p = getPlayer(first.playerId);
                    return (
                        <div className="flex flex-col items-center pop-in" style={{ animationDelay: '0.1s' }}>
                            <div className="text-5xl mb-2 animate-bounce">🥇</div>
                            <div className="mb-2 relative">
                                <AvatarDisplay
                                    strokes={p?.avatarStrokes}
                                    avatar={p?.avatar}
                                    frame={p?.frame}
                                    color={p?.color}
                                    size={96}
                                    className="shadow-lg border-4 border-yellow-400"
                                />
                            </div>
                            <div className="bg-gradient-to-b from-yellow-400 to-yellow-500 w-28 h-32 rounded-t-lg flex flex-col items-center justify-center"
                                style={{ boxShadow: '0 4px 0 rgba(0,0,0,0.2)' }}>
                                <span className="text-3xl font-bold text-yellow-800">1st</span>
                                <span className="text-sm text-yellow-700">{first.votes} votes</span>
                                <span className="text-xs text-yellow-600">+{first.points} pts</span>
                            </div>
                            <p className="mt-2 font-bold text-white">{first.playerName}</p>
                        </div>
                    );
                })()}

                {/* 3rd Place */}
                {third && (() => {
                    const p = getPlayer(third.playerId);
                    return (
                        <div className="flex flex-col items-center pop-in" style={{ animationDelay: '0.5s' }}>
                            <div className="text-3xl mb-2">🥉</div>
                            <div className="mb-2">
                                <AvatarDisplay
                                    strokes={p?.avatarStrokes}
                                    avatar={p?.avatar}
                                    frame={p?.frame}
                                    color={p?.color}
                                    size={64}
                                    className="shadow-md"
                                />
                            </div>
                            <div className="bg-gradient-to-b from-orange-300 to-orange-400 w-20 h-16 rounded-t-lg flex flex-col items-center justify-center"
                                style={{ boxShadow: '0 4px 0 rgba(0,0,0,0.2)' }}>
                                <span className="text-xl font-bold text-orange-800">3rd</span>
                                <span className="text-xs text-orange-700">{third.votes} votes</span>
                                <span className="text-xs text-orange-600">+{third.points} pts</span>
                            </div>
                            <p className="mt-2 font-bold text-white text-sm">{third.playerName}</p>
                        </div>
                    );
                })()}
            </div>

            {/* Current Scores */}
            <div className="bg-white/90 rounded-2xl p-4 mb-6 w-full max-w-sm"
                style={{ boxShadow: '0 4px 0 rgba(155, 89, 182, 0.3)' }}>
                <h3 className="text-lg font-bold text-purple-600 mb-3 text-center">📊 Leaderboard</h3>
                <div className="space-y-2">
                    {room.players
                        .sort((a, b) => (room.scores[b.id] || 0) - (room.scores[a.id] || 0))
                        .map((player, i) => (
                            <div key={player.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-gray-400">#{i + 1}</span>
                                    <AvatarDisplay
                                        strokes={player.avatarStrokes}
                                        avatar={player.avatar}
                                        frame={player.frame}
                                        color={player.color}
                                        size={32}
                                    />
                                    <span className="font-medium">{player.name}</span>
                                </div>
                                <span className="font-bold text-purple-600">{room.scores[player.id] || 0} pts</span>
                            </div>
                        ))}
                </div>
            </div>

            {/* Fun Awards */}
            {awards.length > 0 && (
                <div className="bg-white/90 rounded-2xl p-4 mb-6 w-full max-w-sm"
                    style={{ boxShadow: '0 4px 0 rgba(255, 140, 0, 0.3)' }}>
                    <h3 className="text-lg font-bold text-orange-500 mb-3 text-center">🏅 Fun Awards</h3>
                    <div className="flex flex-wrap justify-center gap-2">
                        {awards.map((a, i) => (
                            <div key={i} className="bg-gradient-to-br from-yellow-50 to-orange-50 px-3 py-2 rounded-xl border-2 border-orange-200 text-center pop-in"
                                style={{ animationDelay: `${i * 0.1}s` }}>
                                <div className="text-2xl">{a.award.emoji}</div>
                                <div className="text-xs font-bold text-orange-600">{a.award.label}</div>
                                <div className="text-xs text-gray-500">{a.playerName}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Next Round Button */}
            {isHost ? (
                <button
                    onClick={onNextRound}
                    className="btn-90s bg-gradient-to-r from-green-400 to-emerald-500 text-white px-8 py-4 rounded-2xl font-bold text-xl jelly-hover"
                >
                    ➡️ Next Round
                </button>
            ) : (
                <p className="text-white/80 font-medium animate-pulse">
                    Waiting for host to start next round...
                </p>
            )}
        </div>
    );
};
