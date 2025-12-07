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
            className="rounded-[2rem] p-6 shadow-xl mb-8 relative overflow-hidden transition-all hover:scale-[1.01] cursor-pointer bg-white/5 backdrop-blur-md border border-white/10"
            style={{
                boxShadow: `0 4px 20px -5px ${tier.color}40`,
                borderColor: `${tier.color}40`
            }}
        >
            {/* Tier glow effect */}
            <div
                className="absolute inset-0 opacity-20 pointer-events-none"
                style={{
                    background: `radial-gradient(circle at top right, ${tier.color}, transparent 70%)`
                }}
            />

            <div className="flex items-start gap-5 relative z-10">
                {/* Larger Avatar */}
                <div className="w-[120px] h-[120px] flex-shrink-0 card-90s p-1 bg-white/10 border-none">
                    <AvatarDisplay
                        strokes={player.avatarStrokes}
                        avatar={player.avatar}
                        frame={player.frame}
                        color={player.color}
                        backgroundColor={player.backgroundColor}
                        size={112}
                    />
                </div>

                {/* Player Info */}
                <div className="flex-1 min-w-0">
                    {/* Name */}
                    <h2 className="text-2xl font-black truncate mb-2 drop-shadow-md" style={{ color: 'var(--theme-text)' }}>{player.name}</h2>

                    {/* Level & Tier Badge */}
                    <div className="flex items-center gap-2 mb-3">
                        <span
                            className="text-sm font-black px-3 py-1 rounded-lg flex items-center gap-1 shadow-sm"
                            style={{
                                backgroundColor: tier.color,
                                color: tier.name === 'Gold' || tier.name === 'Bronze' ? '#000' : '#fff'
                            }}
                        >
                            {tier.icon} LVL {level}
                        </span>
                        <span
                            className="text-xs font-bold px-2 py-1 rounded-md border"
                            style={{
                                backgroundColor: `${tier.color}10`,
                                color: tier.color,
                                borderColor: `${tier.color}40`
                            }}
                        >
                            {tier.name}
                        </span>
                    </div>

                    {/* XP Progress Bar */}
                    <div className="mb-3">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="flex-1 h-3 rounded-full overflow-hidden bg-black/20 backdrop-blur-sm border border-white/5">
                                <div
                                    className="h-full transition-all duration-500 ease-out relative overflow-hidden"
                                    style={{
                                        width: `${progressPercent}%`,
                                        backgroundColor: tier.color,
                                        boxShadow: `0 0 10px ${tier.color}`
                                    }}
                                >
                                    <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]"></div>
                                </div>
                            </div>
                        </div>
                        <div className="text-xs font-bold opacity-70" style={{ color: 'var(--theme-text-secondary)' }}>
                            {xpProgress} / {xpNeeded} XP
                        </div>
                    </div>

                    {/* Stats Row */}
                    <div className="flex items-center gap-4 text-sm font-bold">
                        <div
                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-white/5"
                            style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}
                        >
                            <span>🏆</span>
                            <span style={{ color: 'var(--theme-text)' }}>{stats.gamesWon} Wins</span>
                        </div>
                        <div
                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-white/5"
                            style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}
                        >
                            <span>💰</span>
                            <span style={{ color: 'var(--theme-text)' }}>{formatCurrency(balance)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tier bonus indicator (if applicable) */}
            {tier.xpBonus > 0 && (
                <div
                    className="absolute top-3 right-3 text-xs font-bold px-3 py-1 rounded-full border shadow-sm backdrop-blur-sm"
                    style={{
                        backgroundColor: `${tier.color}20`,
                        color: tier.color,
                        borderColor: `${tier.color}40`
                    }}
                >
                    +{Math.round(tier.xpBonus * 100)}% XP
                </div>
            )}
        </div>
    );
};
