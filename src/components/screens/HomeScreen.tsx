import React, { useState, useEffect } from 'react';
import { ProfileStatusCard } from '../common/ProfileStatusCard';
import { FriendsPanel } from '../common/FriendsPanel';
import { AdminModal } from '../common/AdminModal';
import { MonogramBackground } from '../common/MonogramBackground';
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
            className={`fixed inset-0 overflow-y-auto overflow-x-hidden flex flex-col items-center select-none ${mounted ? 'pop-in' : 'opacity-0'}`}
            style={{
                backgroundColor: 'var(--theme-bg-primary)',
                paddingTop: 'max(1rem, env(safe-area-inset-top))',
                paddingBottom: 'max(1rem, env(safe-area-inset-bottom))'
            }}
        >
            {/* Monogram Pattern - MUST be child element for backdrop-filter to blur it */}
            <MonogramBackground speed="slow" opacity={0.15} />

            {/* Color Accents (decorative glow) */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 fixed">
                <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/20 rounded-full blur-[120px] animate-[pulse_10s_ease-in-out_infinite]" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-500/20 rounded-full blur-[120px] animate-[pulse_15s_ease-in-out_infinite_2s]" />
                {/* Floating particles */}
                <div className="absolute top-1/4 left-1/4 w-4 h-4 rounded-full bg-white/10 animate-[float_8s_ease-in-out_infinite]" />
                <div className="absolute top-3/4 right-1/4 w-6 h-6 rounded-full bg-white/10 animate-[float_12s_ease-in-out_infinite_1s]" />
            </div>

            {/* Content Container - Flex Column with careful spacing */}
            <div className="flex-1 w-full max-w-md flex flex-col z-10 p-5 gap-4 min-h-full relative justify-center">

                {/* Top Section: Profile Only */}
                <div className="flex flex-col gap-2.5 shrink-0">
                    <div>
                        <ProfileStatusCard player={player} onClick={onLevelProgress} />
                    </div>
                </div>

                {/* Main Action Grid - Expands to fill available space */}
                <div className="flex-1 min-h-0 flex flex-col justify-center gap-3">

                    {/* Split Action Card: FRIENDS (Left) + PLAY (Right) */}
                    <div className="grid grid-cols-2 gap-3 h-[170px] shrink-0">
                        {/* Friends Panel - Left Side */}
                        <div className="min-w-0 transition-all duration-300">
                            <FriendsPanel
                                player={player}
                                onJoinRoom={onRejoin}
                                className="w-full h-full !rounded-[2.5rem] !bg-black/30 border-2 !border-green-500/20 hover:!border-green-500/40 cursor-pointer active:scale-95 !backdrop-blur-3xl"
                                style={{
                                    boxShadow: '0 0 20px rgba(34, 197, 94, 0.05)'
                                }}
                            />
                        </div>

                        {/* Play Button - Right Side (Special & Glowing) */}
                        <button
                            onClick={onPlay}
                            className="relative group overflow-hidden rounded-[2.5rem] shadow-2xl border-4 transform transition-all duration-300 hover:scale-[1.02] active:scale-95 flex flex-col items-center justify-center p-4 glass-panel !bg-black/40"
                            style={{
                                borderColor: 'var(--theme-accent)',
                                boxShadow: '0 0 50px -10px var(--theme-accent-glow), 0 20px 40px -10px rgba(0,0,0,0.6)'
                            }}
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-[var(--theme-accent)]/20 via-transparent to-transparent opacity-60 group-hover:opacity-100 transition-opacity" />
                            <div className="absolute inset-0 bg-[var(--theme-accent)]/5 animate-pulse" />

                            <div className="relative z-10 flex flex-col items-center justify-center gap-1">
                                <div className="text-5xl mb-1 group-hover:rotate-12 group-hover:scale-110 transition-transform duration-300 drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]">🎮</div>
                                <div className="text-3xl font-black text-[var(--theme-text)] drop-shadow-md tracking-tight">PLAY</div>
                                <div className="text-[var(--theme-text-secondary)] font-bold text-[9px] tracking-[0.2em] uppercase opacity-80 group-hover:opacity-100 bg-black/20 px-2 py-1 rounded-full border border-white/5">
                                    Start
                                </div>
                            </div>
                        </button>
                    </div>

                    {/* Rejoin Card (Conditional) */}
                    {lastGameDetails && onRejoin && (
                        <button
                            onClick={() => onRejoin(lastGameDetails.roomCode)}
                            className="w-full bg-orange-500/10 backdrop-blur-xl rounded-2xl p-3 border-2 border-orange-500/30 flex items-center justify-between group active:scale-95 transition-all shrink-0"
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

                    {/* Secondary Actions Grid - Bento Style (Adjusted for Pro/Max Sizing) */}
                    <div className="grid grid-cols-2 gap-3 flex-1 min-h-[200px]">
                        {[
                            { id: 'casino', label: 'CASINO', emoji: '🎰', onClick: onCasino, delay: '100ms', color: 'text-yellow-400', glow: 'bg-yellow-500' },
                            { id: 'store', label: 'STORE', emoji: '🛒', onClick: onStore, delay: '200ms', color: 'text-purple-400', glow: 'bg-purple-500' },
                            { id: 'profile', label: 'PROFILE', emoji: '👤', onClick: onProfile, delay: '300ms', color: 'text-blue-400', glow: 'bg-blue-500' },
                            { id: 'settings', label: 'SETTINGS', emoji: '⚙️', onClick: onSettings, delay: '400ms', color: 'text-gray-400', glow: 'bg-gray-500' }
                        ].map((card, i) => (
                            <button
                                key={card.id}
                                onClick={card.onClick}
                                className={`
                                    glass-panel rounded-3xl p-4 shadow-lg
                                    transform transition-all duration-200 hover:scale-[1.02] active:scale-95
                                    flex flex-col items-center justify-center gap-3 group relative
                                    !border-white/10
                                `}
                                style={{
                                    background: `linear-gradient(135deg, rgba(44, 36, 27, 0.85), rgba(30, 30, 30, 0.85))`,
                                    animationDelay: card.delay
                                }}
                            >
                                {/* Breathing Glow Background */}
                                <div
                                    className={`absolute top-1/2 left-1/2 w-20 h-20 rounded-full blur-[25px] ${card.glow} animate-breathe`}
                                    style={{ animationDelay: `${i * 0.5}s` }}
                                />

                                <div className={`text-5xl group-hover:-translate-y-1 transition-transform duration-300 drop-shadow-md z-10 relative`} style={{ animationDelay: `${i * 0.5}s` }}>{card.emoji}</div>
                                <div className="text-sm font-black tracking-widest uppercase opacity-80 group-hover:opacity-100 transition-opacity z-10 relative" style={{ color: 'var(--theme-text)' }}>{card.label}</div>
                                <div className={`absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl z-20`}></div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Bottom Bar: Match History & Footer */}
                <div className="shrink-0 pt-6 flex flex-col items-center gap-4">
                    {/* Match History Button */}
                    <button
                        onClick={onGallery}
                        className="w-full glass-panel rounded-2xl p-3 !border-white/10 flex items-center justify-between group active:scale-95 transition-all hover:brightness-110"
                        style={{ background: 'linear-gradient(135deg, rgba(44, 36, 27, 0.85), rgba(30, 30, 30, 0.85))' }}
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
                        BORED AT WORK GAMES
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

