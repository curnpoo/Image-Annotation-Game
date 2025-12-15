import React, { useState, useEffect, useMemo } from 'react';
import { XPService } from '../../services/xp';
import { AuthService } from '../../services/auth';
import { StatsService } from '../../services/stats';
import { ChallengeService } from '../../services/challenges';
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

                // Track sabotage stats if applicable for this round
                if (room.saboteurId === player.id && room.roundNumber === room.sabotageRound) {
                    StatsService.recordWasSaboteur();
                    ChallengeService.updateProgress('sabotage', 1);
                }
                if (room.sabotageTargetId === player.id && room.sabotageTriggered && room.roundNumber === room.sabotageRound) {
                    StatsService.recordSabotaged();
                }

                // Update Round Challenges
                if (wonRound) {
                    ChallengeService.updateProgress('win_round', 1);
                }

                // Track Correct Voting (voted for the winner)
                // We use room.votes from the current state.
                // NOTE: This assumes room.votes hasn't been cleared yet.
                const winnerId = latestResult.rankings[0]?.playerId;
                const myVoteId = room.votes?.[player.id];
                
                if (winnerId && myVoteId === winnerId && winnerId !== player.id) {
                     ChallengeService.updateProgress('vote_correctly', 1);
                }

                // Sync to AuthService (local + eventually firebase)
                if (AuthService.getCurrentUser()) {
                    AuthService.updateUser(player.id, { stats: newStats, xp: XPService.getXP() });
                }
            }
        }
    }, [room.roundResults, processedRound, player.id, room.isDoublePoints, showToast, room.roundNumber]);

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
            <div className="min-h-screen flex items-center justify-center"
                style={{ backgroundColor: 'var(--theme-bg-primary)' }}>
                <div className="text-2xl font-bold" style={{ color: 'var(--theme-text)' }}>Loading results...</div>
            </div>
        );
    }

    // Get top 3
    const [first, second, third] = latestResult.rankings;

    const getPlayer = (playerId: string) => room.players.find(p => p.id === playerId);

    return (
        <div className={`min-h-[100dvh] w-full relative overflow-x-hidden flex flex-col items-center ${mounted ? 'pop-in' : 'opacity-0'}`}
            style={{
                backgroundColor: 'var(--theme-bg-primary)',
            }}>

            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-[pulse_6s_ease-in-out_infinite]" />
                <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-[pulse_8s_ease-in-out_infinite_1s]" />
            </div>

            {/* Confetti! */}
            {showConfetti && <Confetti />}

            {/* Main Content Container - padding bottom for fixed footer */}
            <div className="w-full flex flex-col items-center z-10 p-4"
                style={{
                    paddingTop: 'max(4rem, env(safe-area-inset-top))',
                    paddingBottom: 'max(8rem, calc(6rem + env(safe-area-inset-bottom)))' // Space for fixed button
                }}>

                {/* Header */}
                <div className="text-center mb-6 shrink-0 relative">
                    <h1 className="text-4xl font-black drop-shadow-xl mb-1 animate-[float_4s_ease-in-out_infinite]"
                        style={{ color: 'var(--theme-text)' }}>
                        🏆 Round {room.roundNumber}!
                    </h1>
                    <p className="font-medium text-sm px-3 py-1 rounded-full bg-white/10 backdrop-blur-md inline-block border border-white/10"
                        style={{ color: 'var(--theme-text-secondary)' }}>
                        Round {room.roundNumber} of {room.settings.totalRounds}
                    </p>
                </div>

                {/* Podium - Responsive Height */}
                <div className={`flex items-end justify-center w-full max-w-lg mb-8 shrink-0 relative perspective-1000 min-h-[180px] ${showPodium ? 'opacity-100' : 'opacity-0'}`}>

                    {/* 2nd Place */}
                    {second && (() => {
                        const p = getPlayer(second.playerId);
                        return (
                            <div className="flex flex-col items-center z-10 -mr-4 transform translate-y-4"
                                style={{
                                    transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
                                    transform: showPodium ? 'translateY(0)' : 'translateY(100px)',
                                    transitionDelay: '0.2s'
                                }}>
                                <div className="mb-2 relative">
                                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-3xl animate-[bounce_2s_infinite]">🥈</div>
                                    <AvatarDisplay
                                        strokes={p?.avatarStrokes}
                                        avatar={p?.avatar}
                                        frame={p?.frame}
                                        color={p?.color}
                                        backgroundColor={p?.backgroundColor}
                                        size={70}
                                        className="shadow-xl ring-4 ring-gray-300 relative z-10"
                                        playerId={p?.id}
                                        imageUrl={p?.avatarImageUrl}
                                    />
                                </div>
                                <div className="w-24 h-32 bg-gradient-to-b from-gray-300 via-gray-400 to-gray-500 rounded-t-lg flex flex-col items-center justify-start pt-4 border-t border-white/40 shadow-2xl relative"
                                    style={{ transform: 'rotateY(10deg)' }}>
                                    <div className="absolute inset-0 bg-white/20 rounded-t-lg" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 10%, 0 40%)' }}></div>
                                    <span className="text-3xl font-black text-gray-800 drop-shadow-sm">2nd</span>
                                    <span className="text-xs font-bold text-gray-700 mt-1">{second.votes} votes</span>
                                </div>
                                <p className="mt-2 font-bold text-sm max-w-[80px] truncate leading-tight" style={{ color: 'var(--theme-text)' }}>{second.playerName}</p>
                            </div>
                        );
                    })()}

                    {/* 1st Place */}
                    {first && (() => {
                        const p = getPlayer(first.playerId);
                        return (
                            <div className="flex flex-col items-center z-20 mx-2 -mb-2"
                                style={{
                                    transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
                                    transform: showPodium ? 'translateY(0) scale(1.1)' : 'translateY(100px) scale(0.9)',
                                    transitionDelay: '0s'
                                }}>
                                <div className="mb-3 relative">
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-4xl animate-[bounce_2s_infinite_0.5s]">👑</div>
                                    <AvatarDisplay
                                        strokes={p?.avatarStrokes}
                                        avatar={p?.avatar}
                                        frame={p?.frame}
                                        color={p?.color}
                                        backgroundColor={p?.backgroundColor}
                                        size={90}
                                        className="shadow-[0_0_20px_rgba(255,215,0,0.5)] ring-4 ring-yellow-400 relative z-10"
                                        playerId={p?.id}
                                        imageUrl={p?.avatarImageUrl}
                                    />
                                    {/* Glow effect back */}
                                    <div className="absolute inset-0 bg-yellow-400/30 blur-xl rounded-full -z-10 animate-pulse"></div>
                                </div>
                                <div className="w-28 h-40 bg-gradient-to-b from-yellow-300 via-yellow-400 to-yellow-600 rounded-t-lg flex flex-col items-center justify-start pt-5 border-t border-white/50 shadow-2xl"
                                    style={{
                                        boxShadow: '0 10px 30px rgba(0,0,0,0.3), inset 0 2px 5px rgba(255,255,255,0.4)',
                                    }}>
                                    <div className="absolute inset-0 bg-white/20 rounded-t-lg" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 15%, 0 30%)' }}></div>
                                    <span className="text-4xl font-black text-yellow-900 drop-shadow-sm">1st</span>
                                    <span className="text-sm font-bold text-yellow-800 mt-1">{first.votes} votes</span>
                                    <span className="text-[10px] font-bold text-yellow-800 bg-yellow-200/50 px-2 py-0.5 rounded-full mt-2">+{first.points} pts</span>
                                </div>
                                <p className="mt-3 font-bold text-lg max-w-[100px] truncate leading-tight" style={{ color: 'var(--theme-text)' }}>{first.playerName}</p>
                            </div>
                        );
                    })()}

                    {/* 3rd Place */}
                    {third && (() => {
                        const p = getPlayer(third.playerId);
                        return (
                            <div className="flex flex-col items-center z-10 -ml-4 transform translate-y-6"
                                style={{
                                    transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
                                    transform: showPodium ? 'translateY(0)' : 'translateY(100px)',
                                    transitionDelay: '0.4s'
                                }}>
                                <div className="mb-2 relative">
                                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-2xl animate-[bounce_2s_infinite_1s]">🥉</div>
                                    <AvatarDisplay
                                        strokes={p?.avatarStrokes}
                                        avatar={p?.avatar}
                                        frame={p?.frame}
                                        color={p?.color}
                                        backgroundColor={p?.backgroundColor}
                                        size={60}
                                        className="shadow-xl ring-4 ring-orange-300 relative z-10"
                                        playerId={p?.id}
                                        imageUrl={p?.avatarImageUrl}
                                    />
                                </div>
                                <div className="w-20 h-24 bg-gradient-to-b from-orange-300 via-orange-400 to-orange-600 rounded-t-lg flex flex-col items-center justify-start pt-3 border-t border-white/40 shadow-2xl"
                                    style={{ transform: 'rotateY(-10deg)' }}>
                                    <div className="absolute inset-0 bg-white/20 rounded-t-lg" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 10%, 0 40%)' }}></div>
                                    <span className="text-2xl font-black text-orange-900 drop-shadow-sm">3rd</span>
                                    <span className="text-xs font-bold text-orange-800 mt-1">{third.votes} votes</span>
                                </div>
                                <p className="mt-2 font-bold text-sm max-w-[70px] truncate leading-tight" style={{ color: 'var(--theme-text)' }}>{third.playerName}</p>
                            </div>
                        );
                    })()}
                </div>

                {/* Stats & Leaderboard Container */}
                <div className="w-full max-w-md space-y-4 px-2">

                    {/* Fun Awards - Horizontal Scroll if needed */}
                    {awards.length > 0 && (
                        <div className="flex flex-nowrap gap-3 overflow-x-auto pb-2 scrollbar-hide px-2">
                            {awards.map((a, i) => (
                                <div key={i} className="flex-none bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-3 flex flex-col items-center min-w-[100px] shadow-lg">
                                    <div className="text-2xl mb-1 animate-[tada_3s_infinite_2s]">{a.award.emoji}</div>
                                    <div className="text-[10px] uppercase font-bold tracking-wider opacity-70" style={{ color: 'var(--theme-text)' }}>{a.award.label}</div>
                                    <div className="text-xs font-bold truncate max-w-full" style={{ color: 'var(--theme-text-secondary)' }}>{a.playerName}</div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Glassmorphic Leaderboard */}
                    <div className="rounded-3xl p-1 shadow-2xl backdrop-blur-xl border border-white/10 overflow-hidden"
                        style={{ backgroundColor: 'var(--theme-card-bg)' }}>
                        <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
                            <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2" style={{ color: 'var(--theme-text)' }}>
                                📊 Leaderboard
                            </h3>
                            <button className="text-xs font-bold opacity-50 hover:opacity-100 transition-opacity" style={{ color: 'var(--theme-text)' }}>
                                View All
                            </button>
                        </div>

                        <div className="max-h-[30vh] overflow-y-auto p-2 space-y-2 custom-scrollbar">
                            {room.players
                                .sort((a, b) => (room.scores[b.id] || 0) - (room.scores[a.id] || 0))
                                .map((player, i) => (
                                    <div key={player.id}
                                        className="flex items-center justify-between p-3 rounded-2xl transition-all hover:bg-white/5 group"
                                        style={{ backgroundColor: 'var(--theme-bg-secondary)' }}>
                                        <div className="flex items-center gap-3">
                                            <span className={`font-black w-6 text-center ${i < 3 ? 'text-lg' : 'text-sm opacity-50'}`}
                                                style={{ color: i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : 'var(--theme-text)' }}>
                                                #{i + 1}
                                            </span>
                                            <AvatarDisplay
                                                strokes={player.avatarStrokes}
                                                avatar={player.avatar}
                                                frame={player.frame}
                                                color={player.color}
                                                backgroundColor={player.backgroundColor}
                                                size={36}
                                                className="shadow-sm group-hover:scale-110 transition-transform"
                                                playerId={player.id}
                                                imageUrl={player.avatarImageUrl}
                                            />
                                            <div className="flex flex-col">
                                                <span className="font-bold text-sm leading-tight" style={{ color: 'var(--theme-text)' }}>{player.name}</span>
                                                <span className="text-[10px] font-medium opacity-60" style={{ color: 'var(--theme-text)' }}>Level {XPService.getLevelFromXP(player.xp || 0)}</span>
                                            </div>
                                        </div>
                                        <div className="font-black text-lg tabular-nums tracking-tight" style={{ color: 'var(--theme-accent)' }}>
                                            {room.scores[player.id] || 0}
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Fixed Bottom Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 p-4 pt-6 bg-gradient-to-t from-black/20 to-transparent z-50 flex justify-center backdrop-blur-[2px]"
                style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}>
                {isHost ? (
                    <button
                        onClick={onNextRound}
                        className="w-full max-w-sm relative group overflow-hidden rounded-2xl shadow-[0_0_40px_rgba(var(--theme-accent-rgb),0.4)] hover:shadow-[0_0_60px_rgba(var(--theme-accent-rgb),0.6)] transition-all duration-300"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-[var(--theme-accent)] to-[#FFD700] animate-[shimmer_2s_infinite]"></div>
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-white/20 transition-opacity"></div>
                        <div className="relative px-8 py-4 flex items-center justify-center gap-3">
                            <span className="font-black text-xl text-black tracking-wide uppercase">Next Round</span>
                            <span className="text-2xl animate-[bounce_1s_infinite]">➡️</span>
                        </div>
                    </button>
                ) : (
                    <div className="bg-white/10 backdrop-blur-md border border-white/10 px-6 py-3 rounded-full flex items-center gap-3 animate-pulse">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-ping"></div>
                        <span className="font-bold text-sm" style={{ color: 'var(--theme-text-secondary)' }}>
                            Waiting for host...
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};
