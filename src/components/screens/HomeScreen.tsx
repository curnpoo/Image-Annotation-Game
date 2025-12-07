import React, { useState, useEffect } from 'react';
import { ProfileStatusCard } from '../common/ProfileStatusCard';
import { FriendsPanel } from '../common/FriendsPanel';
import { AdminModal } from '../common/AdminModal';
import type { Player } from '../../types';

interface HomeScreenProps {
    player: Player;
    onPlay: () => void;
    onProfile: () => void;
    onSettings: () => void;
    onStore: () => void;
    onCasino: () => void;
    onLevelProgress: () => void;
    onGallery: () => void;
    lastGameDetails?: {
        roomCode: string;
        hostName: string;
        playerCount: number;
    } | null;
    onRejoin?: (code: string) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
    player,
    onPlay,
    onProfile,
    onSettings,
    onStore,
    onCasino,
    onLevelProgress,
    onGallery,
    lastGameDetails,
    onRejoin
}) => {
    const [showAdminModal, setShowAdminModal] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Helper for admin button
    const isAdmin = player.name.trim().toLowerCase() === 'curren';

    return (
        <div
            className={`fixed inset-0 overflow-hidden flex flex-col items-center select-none ${mounted ? 'pop-in' : 'opacity-0'}`}
            style={{
                backgroundColor: 'var(--theme-bg-primary)',
                height: '100dvh',
                paddingTop: 'max(1rem, env(safe-area-inset-top))',
                paddingBottom: 'max(1rem, env(safe-area-inset-bottom))'
            }}
        >
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/10 rounded-full blur-[100px] animate-[pulse_10s_ease-in-out_infinite]" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-500/10 rounded-full blur-[100px] animate-[pulse_15s_ease-in-out_infinite_2s]" />
                {/* Floating particles */}
                <div className="absolute top-1/4 left-1/4 w-4 h-4 rounded-full bg-white/5 animate-[float_8s_ease-in-out_infinite]" />
                <div className="absolute top-3/4 right-1/4 w-6 h-6 rounded-full bg-white/5 animate-[float_12s_ease-in-out_infinite_1s]" />
            </div>

            {/* Content Container - Flex Column with careful spacing */}
            <div className="flex-1 w-full max-w-md flex flex-col z-10 p-5 gap-4 h-full relative">

                {/* Top Section: Profile & Friends */}
                <div className="flex flex-col gap-3 shrink-0">
                    <div className="animate-in slide-in-from-top-4 fade-in duration-500 delay-100">
                        <ProfileStatusCard player={player} onClick={onLevelProgress} />
                    </div>

                    <div className="animate-in slide-in-from-top-4 fade-in duration-500 delay-200">
                        <FriendsPanel player={player} onJoinRoom={onRejoin} />
                    </div>
                </div>

                {/* Main Action Grid - Expands to fill available space */}
                <div className="flex-1 min-h-0 flex flex-col justify-center gap-4">

                    {/* Primary Action: PLAY - Takes up significant space */}
                    <button
                        onClick={onPlay}
                        className="w-full relative group overflow-hidden rounded-[2rem] shadow-2xl border-4 transform transition-all duration-300 hover:scale-[1.02] active:scale-95 flex-1 min-h-[160px] max-h-[220px]"
                        style={{
                            backgroundColor: 'var(--theme-card-bg)', // Keep card bg
                            borderColor: 'var(--theme-accent)',
                            boxShadow: '0 20px 40px -10px rgba(0,0,0,0.5)'
                        }}
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-[var(--theme-accent)]/10 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-white/5 backdrop-blur-[1px]">
                            <div className="text-7xl mb-2 group-hover:rotate-12 group-hover:scale-110 transition-transform duration-300 drop-shadow-lg animate-[pulse_3s_infinite]">🎮</div>
                            <div className="text-5xl font-black text-[var(--theme-text)] drop-shadow-md tracking-tight">PLAY</div>
                            <div className="text-[var(--theme-text-secondary)] font-bold text-sm tracking-widest uppercase mt-2 opacity-80 group-hover:opacity-100">Start a new game</div>
                        </div>
                    </button>

                    {/* Rejoin Card (Conditional) */}
                    {lastGameDetails && onRejoin && (
                        <button
                            onClick={() => onRejoin(lastGameDetails.roomCode)}
                            className="w-full bg-orange-500/10 rounded-2xl p-3 border-2 border-orange-500/30 flex items-center justify-between group active:scale-95 transition-all animate-in zoom-in duration-300 shrink-0"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-xl group-hover:rotate-12 transition-transform shadow-lg">
                                    🔙
                                </div>
                                <div className="text-left">
                                    <div className="text-[10px] font-black text-orange-400 uppercase tracking-wider">Back to Game</div>
                                    <div className="text-[var(--theme-text)] font-bold truncate max-w-[120px]">{lastGameDetails.hostName}'s Room</div>
                                </div>
                            </div>
                            <div className="bg-orange-500 text-black font-black text-xs px-3 py-1.5 rounded-full uppercase tracking-wide">Join</div>
                        </button>
                    )}

                    {/* Secondary Actions Grid - Bento Style */}
                    <div className="grid grid-cols-2 gap-3 shrink-0 h-[35%] max-h-[250px]">
                        {[
                            { id: 'casino', label: 'CASINO', emoji: '🎰', onClick: onCasino, delay: '100ms', color: 'text-yellow-400' },
                            { id: 'store', label: 'STORE', emoji: '🛒', onClick: onStore, delay: '200ms', color: 'text-purple-400' },
                            { id: 'profile', label: 'PROFILE', emoji: '👤', onClick: onProfile, delay: '300ms', color: 'text-blue-400' },
                            { id: 'settings', label: 'SETTINGS', emoji: '⚙️', onClick: onSettings, delay: '400ms', color: 'text-gray-400' }
                        ].map((card, i) => (
                            <button
                                key={card.id}
                                onClick={card.onClick}
                                className={`
                                    bg-white/5 backdrop-blur-md rounded-2xl p-3 shadow-lg border border-white/10
                                    transform transition-all duration-200 hover:scale-[1.03] active:scale-95 
                                    flex flex-col items-center justify-center gap-2 group animate-in zoom-in fade-in fill-mode-backwards relative overflow-hidden
                                `}
                                style={{
                                    backgroundColor: 'var(--theme-card-bg)',
                                    animationDelay: card.delay
                                }}
                            >
                                <div className={`text-4xl group-hover:-translate-y-1 transition-transform duration-300 drop-shadow-md ${['settings', 'profile'].includes(card.id) ? '' : 'animate-[bounce_3s_infinite]'}`} style={{ animationDelay: `${i * 0.5}s` }}>{card.emoji}</div>
                                <div className="text-xs font-bold font-black tracking-wider uppercase opacity-80 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--theme-text)' }}>{card.label}</div>
                                <div className={`absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl`}></div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Bottom Bar: Match History & Footer */}
                <div className="shrink-0 pt-2 flex flex-col items-center gap-4">
                    {/* Match History Button */}
                    <button
                        onClick={onGallery}
                        className="w-full bg-white/5 hover:bg-white/10 rounded-2xl p-3 border border-white/10 flex items-center justify-between group active:scale-95 transition-all backdrop-blur-sm"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-pink-500/20 rounded-lg flex items-center justify-center text-sm group-hover:scale-110 transition-transform">
                                📊
                            </div>
                            <div className="text-[var(--theme-text)] font-bold text-sm">View Match History</div>
                        </div>
                        <div className="text-[var(--theme-text-secondary)] text-lg opacity-50 group-hover:translate-x-1 transition-transform">→</div>
                    </button>

                    <div className="text-[var(--theme-text-secondary)] text-[10px] font-bold tracking-[0.2em] opacity-30">
                        ANTIGRAVITY GAMES
                    </div>
                </div>
            </div>

            {/* Admin Modal */}
            {showAdminModal && (
                <AdminModal onClose={() => setShowAdminModal(false)} />
            )}

            {/* Hidden admin trigger */}
            {isAdmin && (
                <button
                    className="absolute top-0 right-0 w-16 h-16 z-50 opacity-0"
                    onDoubleClick={() => setShowAdminModal(true)}
                />
            )}
        </div>
    );
};

