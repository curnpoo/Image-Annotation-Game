import React from 'react';
import { XPService } from '../../services/xp';
import { CurrencyService, formatCurrency } from '../../services/currency';
import { StatsService } from '../../services/stats';
import { AvatarDisplay } from './AvatarDisplay';
import type { Player } from '../../types';

interface ProfileStatusCardProps {
    player: Player;
    onClick?: () => void;
}

export const ProfileStatusCard: React.FC<ProfileStatusCardProps> = ({ player, onClick }) => {
    const level = XPService.getLevel();
    const tier = XPService.getTier();
    const xpProgress = XPService.getLevelProgress();
    const xpNeeded = XPService.getXPForNextLevel();
    const progressPercent = XPService.getLevelProgressPercent();
    const balance = CurrencyService.getCurrency();
    const stats = StatsService.getStats();

    return (
        <div
            onClick={onClick}
            className="rounded-[2rem] p-6 shadow-xl mb-8 relative overflow-hidden transition-all hover:scale-[1.01] cursor-pointer"
            style={{
                backgroundColor: 'var(--theme-card-bg)',
                border: `4px solid ${tier.color}`,
                color: 'var(--theme-text)',
                boxShadow: `0 4px 20px ${tier.color}40`
            }}
        >
            {/* Tier glow effect */}
            <div
                className="absolute inset-0 opacity-10 pointer-events-none"
                style={{
                    background: `radial-gradient(circle at top right, ${tier.color}, transparent 60%)`
                }}
            />

            <div className="flex items-start gap-5 relative z-10">
                {/* Larger Avatar */}
                <div className="w-[120px] h-[120px] flex-shrink-0">
                    <AvatarDisplay
                        strokes={player.avatarStrokes}
                        avatar={player.avatar}
                        frame={player.frame}
                        color={player.color}
                        backgroundColor={player.backgroundColor}
                        size={120}
                    />
                </div>

                {/* Player Info */}
                <div className="flex-1 min-w-0">
                    {/* Name */}
                    <h2 className="text-2xl font-black truncate mb-2">{player.name}</h2>

                    {/* Level & Tier Badge */}
                    <div className="flex items-center gap-2 mb-3">
                        <span
                            className="text-sm font-black px-3 py-1 rounded-lg flex items-center gap-1"
                            style={{
                                backgroundColor: tier.color,
                                color: tier.name === 'Gold' || tier.name === 'Bronze' ? '#000' : '#fff'
                            }}
                        >
                            {tier.icon} LVL {level}
                        </span>
                        <span
                            className="text-xs font-bold px-2 py-1 rounded-md"
                            style={{
                                backgroundColor: `${tier.color}30`,
                                color: tier.color
                            }}
                        >
                            {tier.name}
                        </span>
                    </div>

                    {/* XP Progress Bar */}
                    <div className="mb-3">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="flex-1 h-3 rounded-full overflow-hidden bg-black/20">
                                <div
                                    className="h-full transition-all duration-500 ease-out"
                                    style={{
                                        width: `${progressPercent}%`,
                                        backgroundColor: tier.color,
                                        boxShadow: `0 0 10px ${tier.color}`
                                    }}
                                />
                            </div>
                        </div>
                        <div className="text-xs font-bold opacity-70">
                            {xpProgress} / {xpNeeded} XP
                        </div>
                    </div>

                    {/* Stats Row */}
                    <div className="flex items-center gap-4 text-sm font-bold">
                        <div
                            className="flex items-center gap-1 px-2 py-1 rounded-lg"
                            style={{ backgroundColor: 'var(--theme-bg-secondary)' }}
                        >
                            <span>🏆</span>
                            <span>{stats.gamesWon} Wins</span>
                        </div>
                        <div
                            className="flex items-center gap-1 px-2 py-1 rounded-lg"
                            style={{ backgroundColor: 'var(--theme-bg-secondary)' }}
                        >
                            <span>💰</span>
                            <span>{formatCurrency(balance)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tier bonus indicator (if applicable) */}
            {tier.xpBonus > 0 && (
                <div
                    className="absolute top-3 right-3 text-xs font-bold px-2 py-1 rounded-full"
                    style={{
                        backgroundColor: `${tier.color}30`,
                        color: tier.color
                    }}
                >
                    +{Math.round(tier.xpBonus * 100)}% XP
                </div>
            )}
        </div>
    );
};
