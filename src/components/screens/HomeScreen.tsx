import React, { useState } from 'react';
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

    const cards = [
        {
            id: 'play',
            label: 'PLAY',
            emoji: '🎮',
            color: 'from-green-400 to-emerald-600',
            border: 'border-green-500',
            onClick: onPlay,
            description: 'Start a game'
        },
        {
            id: 'casino',
            label: 'CASINO',
            emoji: '🎰',
            color: 'from-yellow-400 to-orange-500',
            border: 'border-yellow-500',
            onClick: onCasino,
            description: 'Try your luck'
        },
        {
            id: 'store',
            label: 'STORE',
            emoji: '🛒',
            color: 'from-purple-400 to-purple-600',
            border: 'border-purple-500',
            onClick: onStore,
            description: 'Buy cosmetics'
        },
        {
            id: 'gallery',
            label: 'GALLERY',
            emoji: '🖼️',
            color: 'from-pink-400 to-rose-600',
            border: 'border-pink-500',
            onClick: onGallery,
            description: 'Past drawings'
        },
        {
            id: 'profile',
            label: 'PROFILE',
            emoji: '👤',
            color: 'from-blue-400 to-blue-600',
            border: 'border-blue-500',
            onClick: onProfile,
            description: 'Customize avatar'
        },
        {
            id: 'settings',
            label: 'SETTINGS',
            emoji: '⚙️',
            color: 'from-gray-400 to-gray-600',
            border: 'border-gray-500',
            onClick: onSettings,
            description: 'App settings'
        }
    ];


    // Admin Card
    if (player.name.trim().toLowerCase() === 'curren') {
        cards.push({
            id: 'admin',
            label: 'ADMIN',
            emoji: '⚠️',
            color: 'from-red-400 to-red-600',
            border: 'border-red-500',
            onClick: () => setShowAdminModal(true),
            description: 'God Mode'
        });
    }

    return (
        <div
            className="min-h-screen flex flex-col p-4"
            style={{
                paddingTop: 'max(1.5rem, env(safe-area-inset-top) + 1rem)',
                paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom) + 1rem)'
            }}
        >
            {/* Header with player info - Profile Status Card */}
            <ProfileStatusCard player={player} onClick={onLevelProgress} />

            {/* Friends Panel */}
            <div className="max-w-md mx-auto w-full mb-4">
                <FriendsPanel player={player} />
            </div>

            {/* Main Navigation Cards */}
            <div className="flex-1 flex flex-col justify-center">
                <div className="grid grid-cols-2 gap-4 max-w-md mx-auto w-full">
                    {/* Large Play Button - spans 2 columns */}
                    <button
                        onClick={onPlay}
                        className="col-span-2 rounded-[2rem] p-8 shadow-2xl border-4 transform transition-all duration-200 hover:scale-[1.02] active:scale-95 group relative overflow-hidden"
                        style={{
                            backgroundColor: 'var(--theme-card-bg)', // Keep card bg
                            borderColor: 'var(--theme-accent)',
                        }}
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-[var(--theme-accent)]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="text-6xl mb-2 group-hover:rotate-12 transition-transform duration-300">🎮</div>
                        <div className="text-4xl font-black text-[var(--theme-text)] drop-shadow-sm">PLAY</div>
                        <div className="text-[var(--theme-text-secondary)] font-bold text-sm">Start a new game</div>
                    </button>

                    {/* Secondary Actions */}
                    {[
                        { id: 'casino', label: 'CASINO', emoji: '🎰', onClick: onCasino },
                        { id: 'store', label: 'STORE', emoji: '🛒', onClick: onStore },
                        { id: 'profile', label: 'PROFILE', emoji: '👤', onClick: onProfile },
                        { id: 'settings', label: 'SETTINGS', emoji: '⚙️', onClick: onSettings }
                    ].map(card => (

                        <button
                            key={card.id}
                            onClick={card.onClick}
                            className="bg-white rounded-[1.5rem] p-4 shadow-lg border-2 transform transition-all duration-200 hover:scale-[1.03] active:scale-95 flex flex-col items-center justify-center gap-1"
                            style={{
                                backgroundColor: 'var(--theme-card-bg)',
                                borderColor: 'var(--theme-border)',
                                color: 'var(--theme-text)'
                            }}
                        >
                            <div className="text-3xl mb-1">{card.emoji}</div>
                            <div className="text-sm font-bold opacity-90">{card.label}</div>
                        </button>
                    ))}

                    {/* Rejoin Card */}
                    {lastGameDetails && onRejoin && (
                        <button
                            onClick={() => onRejoin(lastGameDetails.roomCode)}
                            className="col-span-2 bg-white rounded-[1.5rem] p-4 shadow-lg border-2 flex items-center justify-between group active:scale-95 transition-all mt-2"
                            style={{
                                backgroundColor: 'var(--theme-card-bg)',
                                borderColor: 'var(--theme-accent)'
                            }}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-orange-100/20 rounded-full flex items-center justify-center text-xl group-hover:rotate-12 transition-transform">
                                    🔙
                                </div>
                                <div className="text-left">
                                    <div className="text-[10px] font-bold text-[var(--theme-accent)] uppercase tracking-wider">Rejoin Game</div>
                                    <div className="text-[var(--theme-text)] font-bold">{lastGameDetails.hostName}'s Game</div>
                                    <div className="text-xs text-[var(--theme-text-secondary)]">{lastGameDetails.playerCount} Players • {lastGameDetails.roomCode}</div>
                                </div>
                            </div>
                            <div className="text-[var(--theme-accent)] font-bold text-sm">Join →</div>
                        </button>
                    )}
                </div>

                {/* Match History Card - Full Width */}
                <button
                    onClick={onGallery}
                    className="w-full max-w-md mx-auto mt-4 rounded-[1.5rem] p-4 shadow-lg border-2 flex items-center justify-between group active:scale-95 transition-all"
                    style={{
                        backgroundColor: 'var(--theme-card-bg)',
                        borderColor: 'var(--theme-border)'
                    }}
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-pink-100/20 rounded-full flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                            📊
                        </div>
                        <div className="text-left">
                            <div className="text-[10px] font-bold text-pink-500 uppercase tracking-wider">Match History</div>
                            <div className="text-[var(--theme-text)] font-bold">View Past Games</div>
                            <div className="text-xs text-[var(--theme-text-secondary)]">Results, scores & drawings</div>
                        </div>
                    </div>
                    <div className="text-[var(--theme-text-secondary)] font-bold text-sm">View →</div>
                </button>
            </div>

            {/* Footer */}
            <div className="text-center text-[var(--theme-text-secondary)] text-xs font-bold tracking-widest opacity-50 mt-8">
                ANTIGRAVITY GAMES
            </div>

            {/* Admin Modal */}
            {showAdminModal && (
                <AdminModal onClose={() => setShowAdminModal(false)} />
            )}
        </div>
    );
};

