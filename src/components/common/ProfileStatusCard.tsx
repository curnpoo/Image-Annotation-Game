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
    // xpProgress and xpNeeded removed as they are unused
    const progressPercent = XPService.getLevelProgressPercent();
    const balance = CurrencyService.getCurrency();
    const stats = StatsService.getStats();

    return (
        <div
            onClick={onClick}
            className="rounded-[2rem] p-3 shadow-xl relative overflow-hidden transition-all hover:scale-[1.01] cursor-pointer bg-black/30 backdrop-blur-3xl border border-white/10 group"
            style={{
                boxShadow: `0 4px 20px -5px ${tier.color}40`,
                borderColor: `${tier.color}40`
            }}
        >
            {/* Tier glow effect */}
            <div
                className="absolute inset-0 opacity-20 pointer-events-none transition-opacity duration-500 group-hover:opacity-30"
                style={{
                    background: `radial-gradient(circle at top right, ${tier.color}, transparent 70%)`
                }}
            />

            <div className="grid grid-cols-[110px_1fr] gap-2.5 relative z-10">
                {/* Cell 1: Avatar (Tall on the left) */}
                <div className="bg-white/5 rounded-[1.75rem] p-1.5 flex items-center justify-center border border-white/5 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
                    <AvatarDisplay
                        strokes={player.avatarStrokes}
                        avatar={player.avatar}
                        frame={player.frame}
                        color={player.color}
                        backgroundColor={player.backgroundColor}
                        size={95}
                        className="!rounded-3xl"
                    />
                </div>

                {/* Right Side Column */}
                <div className="flex flex-col gap-1.5 min-w-0">

                    {/* Cell 2: Identity & Progress */}
                    <div className="bg-white/5 rounded-2xl p-2.5 flex flex-col justify-center gap-2 border border-white/5 relative overflow-hidden flex-1">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

                        {/* Name & Badges Row */}
                        <div className="flex flex-col gap-1">
                            <h2 className="text-xl font-black truncate leading-none drop-shadow-md" style={{ color: 'var(--theme-text)' }}>
                                {player.name}
                            </h2>
                            <div className="flex items-center gap-1.5">
                                <span
                                    className="text-[9px] font-black px-1.5 py-0.5 rounded flex items-center gap-1 shadow-sm"
                                    style={{
                                        backgroundColor: tier.color,
                                        color: tier.name === 'Gold' || tier.name === 'Bronze' ? '#000' : '#fff'
                                    }}
                                >
                                    {tier.icon} LVL {level}
                                </span>
                                <span
                                    className="text-[9px] font-bold px-1.5 py-0.5 rounded border opacity-80"
                                    style={{
                                        backgroundColor: `${tier.color}10`,
                                        color: tier.color,
                                        borderColor: `${tier.color}40`
                                    }}
                                >
                                    {tier.name}
                                </span>
                            </div>
                        </div>

                        {/* XP Progress Bar */}
                        <div className="relative w-full">
                            <div className="flex items-center justify-between text-[9px] font-bold mb-0.5 opacity-60">
                                <span>XP</span>
                                <span>{Math.floor(progressPercent)}%</span>
                            </div>
                            <div className="h-2 rounded-full overflow-hidden bg-black/40 border border-white/5">
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
                    </div>

                    {/* Cell 3: Stats Grid */}
                    <div className="grid grid-cols-2 gap-1.5">
                        <div
                            className="bg-black/20 rounded-xl p-1.5 border border-white/5 flex flex-col items-center justify-center text-center backdrop-blur-sm"
                        >
                            <span className="text-lg mb-0.5 filter drop-shadow-sm">🏆</span>
                            <span className="text-xs font-black leading-none" style={{ color: 'var(--theme-text)' }}>
                                {stats.gamesWon}
                            </span>
                            <span className="text-[8px] font-bold opacity-40 uppercase tracking-widest mt-0.5">Wins</span>
                        </div>

                        <div
                            className="bg-black/20 rounded-xl p-1.5 border border-white/5 flex flex-col items-center justify-center text-center backdrop-blur-sm"
                        >
                            <span className="text-lg mb-0.5 filter drop-shadow-sm">💰</span>
                            <span className="text-xs font-black leading-none" style={{ color: 'var(--theme-text)' }}>
                                {formatCurrency(balance).replace('$', '')}
                            </span>
                            <span className="text-[8px] font-bold opacity-40 uppercase tracking-widest mt-0.5">Cash</span>
                        </div>
                    </div>

                </div>
            </div>

            {/* Tier bonus indicator */}
            {tier.xpBonus > 0 && (
                <div
                    className="absolute top-0 right-0 rounded-bl-2xl px-3 py-1 text-[10px] font-black border-b border-l shadow-sm backdrop-blur-xl z-20"
                    style={{
                        backgroundColor: `${tier.color}20`,
                        color: tier.color,
                        borderColor: `${tier.color}30`
                    }}
                >
                    +{Math.round(tier.xpBonus * 100)}% XP
                </div>
            )}
        </div>
    );
};
