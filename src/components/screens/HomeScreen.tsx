import React, { useState } from 'react';
import { CurrencyService, formatCurrency } from '../../services/currency';
import { XPService } from '../../services/xp';
import { AvatarDisplay } from '../common/AvatarDisplay';
import { AdminModal } from '../common/AdminModal';
import type { Player } from '../../types';

interface HomeScreenProps {
    player: Player;
    onPlay: () => void;
    onProfile: () => void;
    onSettings: () => void;
    onStore: () => void;
    onCasino: () => void;
    lastGameDetails?: {
        roomCode: string;
        hostName: string;
        playerCount: number;
    } | null;
    onRejoin?: (code: string) => void;
    isBrowsing?: boolean;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
    player,
    onPlay,
    onProfile,
    onSettings,
    onStore,
    onCasino,
    lastGameDetails,
    onRejoin,
    isBrowsing = false
}) => {
    const balance = CurrencyService.getCurrency();
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
            {/* Header with player info - Profile Card */}
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-4 shadow-lg border-2 border-purple-200 mb-6">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16">
                        <AvatarDisplay
                            strokes={player.avatarStrokes}
                            avatar={player.avatar}
                            frame={player.frame}
                            color={player.color}
                            size={64}
                        />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                            <h2 className="text-xl font-black text-gray-800">{player.name}</h2>
                            <div className="text-green-600 font-bold">{formatCurrency(balance)}</div>
                        </div>
                        {/* Level & XP */}
                        <div className="flex items-center gap-2">
                            <span className="bg-purple-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                LVL {XPService.getLevel()}
                            </span>
                            <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                                <div
                                    className="bg-gradient-to-r from-purple-400 to-purple-600 h-full transition-all duration-300"
                                    style={{ width: `${XPService.getLevelProgress()}%` }}
                                />
                            </div>
                            <span className="text-xs text-gray-500 font-medium">
                                {XPService.getLevelProgress()}/100 XP
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Navigation Cards */}
            <div className="flex-1 flex flex-col justify-center">
                <div className="grid grid-cols-2 gap-4 max-w-md mx-auto w-full">
                    {/* Large Play Button - spans 2 columns */}
                    <button
                        onClick={onPlay}
                        className={`col-span-2 bg-gradient-to-br ${cards[0].color} rounded-3xl p-6 shadow-xl border-4 ${cards[0].border} 
                            transform transition-all duration-200 hover:scale-[1.02] active:scale-95 jelly-hover`}
                    >
                        <div className="text-5xl mb-2">{cards[0].emoji}</div>
                        <div className="text-3xl font-black text-white drop-shadow-lg">{cards[0].label}</div>
                        <div className="text-white/80 text-sm font-medium">{cards[0].description}</div>
                    </button>

                    {/* Other cards - 2x2 grid */}
                    {cards.slice(1).map(card => (
                        <button
                            key={card.id}
                            onClick={card.onClick}
                            className={`bg-gradient-to-br ${card.color} rounded-2xl p-4 shadow-xl border-3 ${card.border}
                                transform transition-all duration-200 hover:scale-[1.03] active:scale-95 jelly-hover`}
                        >
                            <div className="text-3xl mb-1">{card.emoji}</div>
                            <div className="text-lg font-bold text-white drop-shadow">{card.label}</div>
                            <div className="text-white/70 text-xs">{card.description}</div>
                        </button>
                    ))}

                    {/* Rejoin Card (6th Card) */}
                    {lastGameDetails && onRejoin && (
                        <button
                            onClick={() => onRejoin(lastGameDetails.roomCode)}
                            className="col-span-2 bg-white rounded-2xl p-4 shadow-lg border-2 border-orange-200 flex items-center justify-between group active:scale-95 transition-all"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-xl group-hover:rotate-12 transition-transform">
                                    🔙
                                </div>
                                <div className="text-left">
                                    <div className="text-xs font-bold text-orange-400 uppercase tracking-wider">Rejoin Game</div>
                                    <div className="text-gray-800 font-bold">Host: {lastGameDetails.hostName}</div>
                                    <div className="text-xs text-gray-500">{lastGameDetails.playerCount} Players • {lastGameDetails.roomCode}</div>
                                </div>
                            </div>
                            <div className="text-orange-400 font-bold text-sm">Join →</div>
                        </button>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="text-center text-white/60 text-xs mt-4">
                Draw. Vote. Win! 🎨
            </div>

            {/* Admin Modal */}
            {showAdminModal && (
                <AdminModal onClose={() => setShowAdminModal(false)} />
            )}
        </div>
    );
};
