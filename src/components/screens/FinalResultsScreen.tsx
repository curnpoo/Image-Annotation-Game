import React, { useState, useEffect } from 'react';
import { XPService } from '../../services/xp';
import { AuthService } from '../../services/auth';
import { StatsService } from '../../services/stats';
import { StatsHistoryService } from '../../services/statsHistory';
import { GalleryService } from '../../services/galleryService';
import { ChallengeService } from '../../services/challenges';
import type { GameRoom } from '../../types';
import { Confetti } from '../common/Confetti';
import { AvatarDisplay } from '../common/AvatarDisplay';
import { vibrate, HapticPatterns } from '../../utils/haptics';


interface FinalResultsScreenProps {
    room: GameRoom;
    currentPlayerId: string;
    showToast: (message: string, type: 'success' | 'error' | 'info') => void;
    onShowRewards: (action: 'home' | 'replay') => void;
}

export const FinalResultsScreen: React.FC<FinalResultsScreenProps> = ({
    room,
    currentPlayerId,
    showToast,
    onShowRewards
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

                // Award Currency (e.g., 50 coins for playing, +100 for winning)
                const currencyEarned = 50 + (isWinner ? 100 : 0);
                const newCurrency = (currentUser.currency || 0) + currencyEarned;

                const newStats = {
                    ...currentStats,
                    gamesPlayed: currentStats.gamesPlayed + 1,
                    gamesWon: currentStats.gamesWon + (isWinner ? 1 : 0),
                    totalXPEarned: currentStats.totalXPEarned + 100,
                    totalCurrencyEarned: currentStats.totalCurrencyEarned + currencyEarned,
                    highestLevel: Math.max(currentStats.highestLevel, newLevel || 1)
                };

                // Track currency earned in stats
                await StatsService.recordCurrencyEarned(currencyEarned);

                // Update Challenges
                ChallengeService.updateProgress('play_game', 1);
                ChallengeService.updateProgress('earn_currency', currencyEarned);

                // Track sabotage stats only if sabotage round was the final round
                // (Earlier rounds' sabotage is tracked in ResultsScreen)
                if (room.sabotageRound === room.roundNumber) {
                    if (room.saboteurId === currentPlayerId) {
                        await StatsService.recordWasSaboteur();
                         ChallengeService.updateProgress('sabotage', 1);
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

    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
    const [saveError, setSaveError] = useState<string>('');

    // Save to Gallery (Separate Effect to ensure robustness even if rewards processed)
    useEffect(() => {
        const saveToGallery = async () => {
            console.log('[FinalResults] Attempting to save to gallery...');
            setSaveStatus('saving');
            
            // CRITICAL: Include round count in key so "Play Again" games still save
            // Old key was just roomCode, which blocked saves for replays
            const roundCount = room.roundResults?.length || 0;
            const galleryKey = `saved_gallery_${room.roomCode}_r${roundCount}`;
            
            if (sessionStorage.getItem(galleryKey)) {
                console.log('[FinalResults] Game already saved in this session (skipped).', { galleryKey });
                setSaveStatus('success');
                return;
            }

            try {
                await GalleryService.saveGameToGallery(room, currentPlayerId);
                sessionStorage.setItem(galleryKey, 'true');
                console.log('[FinalResults] Game saved to gallery successfully, marking session.', { galleryKey });
                setSaveStatus('success');
            } catch (err: any) {
                console.error('[FinalResults] Failed to save game to gallery:', err);
                setSaveStatus('error');
                setSaveError(err.message || 'Unknown error');
            }
        };
        
        // Only save if we are a player in the game and status is idle (first run)
        const isPlayer = room.playerStates[currentPlayerId];
        if (isPlayer && saveStatus === 'idle') {
            saveToGallery();
        } else if (!isPlayer) {
             console.warn('[FinalResults] Not a player in this game, skipping gallery save.', { currentPlayerId });
        }
    }, [room, currentPlayerId]); // Warning: logic ensures single run via status check

    const handleRetrySave = async () => {
        setSaveStatus('saving');
        setSaveError('');
        const roundCount = room.roundResults?.length || 0;
        const galleryKey = `saved_gallery_${room.roomCode}_r${roundCount}`;
        try {
            await GalleryService.saveGameToGallery(room, currentPlayerId);
            sessionStorage.setItem(galleryKey, 'true');
            setSaveStatus('success');
            showToast('Saved to gallery!', 'success');
        } catch (err: any) {
            console.error('Retry failed:', err);
            setSaveStatus('error');
            setSaveError(err.message || 'Retry failed');
            showToast('Save failed', 'error');
        }
    };

    const handleGoHome = () => {
        onShowRewards('home');
    };

    const handlePlayAgain = async () => {
        // If there are other players, trigger the global rewards phase
        if (room.players.length > 1) {
            try {
                // This updates room status to 'rewards', which App.tsx catches
                await import('../../services/storage').then(m => m.StorageService.triggerRewards(room.roomCode));
            } catch (err) {
                console.error('Failed to trigger rewards:', err);
                // Fallback to local
                onShowRewards('replay');
            }
        } else {
            // Just me, show local immediately
            onShowRewards('replay');
        }
    };


    const isHost = room.hostId === currentPlayerId;

    // Sort players by score
    const sortedPlayers = [...room.players].sort(
        (a, b) => (room.scores[b.id] || 0) - (room.scores[a.id] || 0)
    );

    const [first, second, third] = sortedPlayers;

    return (
        <div
            className={`min-h-[100dvh] h-[100dvh] w-full flex flex-col items-center p-4 relative overflow-x-hidden overflow-y-auto ${mounted ? 'pop-in' : 'opacity-0'}`}
            style={{
                paddingTop: 'max(1.5rem, env(safe-area-inset-top) + 1rem)',
                paddingBottom: 'max(2rem, env(safe-area-inset-bottom) + 1rem)',
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
                        <div className="mb-2 relative">
                             <AvatarDisplay
                                playerId={second.id}
                                avatar={second.avatar}
                                strokes={second.avatarStrokes}
                                color={second.color}
                                backgroundColor={second.backgroundColor || '#ffffff'}
                                size={96} // w-24 = 96px
                                className="border-4 border-white shadow-xl"
                                imageUrl={second.avatarImageUrl}
                            />
                            <div className="absolute -bottom-2 -right-2 bg-gray-400 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold border-2 border-white shadow-sm">
                                2
                            </div>
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
                        <div className="mb-2 relative">
                            <AvatarDisplay
                                playerId={first.id}
                                avatar={first.avatar}
                                strokes={first.avatarStrokes}
                                color={first.color}
                                backgroundColor={first.backgroundColor || '#ffffff'}
                                size={128} // w-32 = 128px
                                className="border-4 border-yellow-300 shadow-xl"
                                imageUrl={first.avatarImageUrl}
                            />
                            <div className="absolute -bottom-3 -right-2 bg-yellow-400 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-xl border-2 border-white shadow-sm">
                                1
                            </div>
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
                        <div className="mb-2 relative">
                            <AvatarDisplay
                                playerId={third.id}
                                avatar={third.avatar}
                                strokes={third.avatarStrokes}
                                color={third.color}
                                backgroundColor={third.backgroundColor || '#ffffff'}
                                size={80} // w-20 = 80px
                                className="border-4 border-white shadow-xl"
                                imageUrl={third.avatarImageUrl}
                            />
                            <div className="absolute -bottom-2 -right-2 bg-orange-400 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold border-2 border-white shadow-sm">
                                3
                            </div>
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
                                <AvatarDisplay
                                    playerId={player.id}
                                    avatar={player.avatar}
                                    strokes={player.avatarStrokes}
                                    color={player.color}
                                    backgroundColor={player.backgroundColor || '#ffffff'}
                                    size={32}
                                    className="shadow-sm"
                                    imageUrl={player.avatarImageUrl}
                                />
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

            {/* Gallery Save Status - Debug/Feedback */}
            <div className="mt-4 flex flex-col items-center gap-2">
                <div className="flex items-center gap-2 text-sm text-white/50">
                    {saveStatus === 'saving' && <span className="animate-pulse">Saving to Gallery...</span>}
                    {saveStatus === 'success' && (
                        <span className="text-green-400">
                            ✓ Saved to History <span className="text-white/30 text-xs">({currentPlayerId ? currentPlayerId.slice(0, 6) : '?'})</span>
                        </span>
                    )}
                    {saveStatus === 'error' && (
                        <div className="flex flex-col items-center gap-1">
                            <span className="text-red-400">⚠ Save Failed</span>
                            {saveError && <span className="text-xs text-red-300/70">{saveError}</span>}
                            <button
                                onClick={handleRetrySave}
                                className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-full text-xs text-white transition-colors"
                            >
                                Retry Save
                            </button>
                        </div>
                    )}
                </div>
            </div>



            {/* Play Again Button */}
            {isHost ? (
                <button
                    onClick={handlePlayAgain}
                    className="z-10 w-full max-w-sm text-white px-10 py-5 rounded-[2rem] font-black text-2xl shadow-2xl hover:scale-105 active:scale-95 transition-all"
                    style={{
                        background: 'linear-gradient(135deg, var(--theme-accent) 0%, #FFA726 100%)'
                    }}
                >
                    🎮 Play Again!
                </button>
            ) : (
                <p className="z-10 font-bold animate-pulse text-lg" style={{ color: 'var(--theme-text-secondary)' }}>
                    Waiting for host to start new game...
                </p>
            )}


        </div>
    );
};
