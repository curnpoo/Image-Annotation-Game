import React from 'react';
import { XPService, LEVEL_TIERS } from '../../services/xp';
import { StatsService } from '../../services/stats';
import { BadgeService } from '../../services/badgeService';
import { BADGES } from '../../constants/cosmetics';
import { AvatarDisplay } from '../common/AvatarDisplay';
import type { Player } from '../../types';

interface LevelProgressScreenProps {
    player: Player;
    onBack: () => void;
}

export const LevelProgressScreen: React.FC<LevelProgressScreenProps> = ({
    player,
    onBack
}) => {

    const level = XPService.getLevel();
    const tier = XPService.getTier();
    const totalXP = XPService.getXP();
    const xpProgress = XPService.getLevelProgress();
    const xpNeeded = XPService.getXPForNextLevel();
    const progressPercent = XPService.getLevelProgressPercent();
    const stats = StatsService.getStats();
    const unlockedBadges = BadgeService.getUnlockedBadges();

    // Get level badges
    const levelBadges = BADGES.filter(b => 'levelRequired' in b);

    // Find next tier
    const currentTierIndex = LEVEL_TIERS.findIndex(t => t.name === tier.name);
    const nextTier = LEVEL_TIERS[currentTierIndex + 1];

    return (
        <div
            className="fixed inset-0 flex flex-col overflow-y-auto"
            style={{
                background: `linear-gradient(180deg, ${tier.color}20 0%, var(--theme-bg-primary) 50%)`,
                paddingTop: 'max(1.5rem, env(safe-area-inset-top) + 1rem)',
                paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom) + 1rem)'
            }}
        >
            {/* Header Card Button */}
            <button
                onClick={onBack}
                className="mx-4 mb-4 rounded-[2rem] p-4 border-2 flex items-center gap-4 hover:brightness-110 active:scale-95 transition-all shadow-lg"
                style={{
                    backgroundColor: 'var(--theme-card-bg)',
                    borderColor: tier.color
                }}
            >
                <div className="text-3xl">{tier.icon}</div>
                <div className="flex-1 text-left">
                    <div className="text-lg font-bold" style={{ color: 'var(--theme-text)' }}>Level Progress</div>
                    <div className="text-sm font-medium" style={{ color: tier.color }}>{tier.name} Tier • Level {level}</div>
                </div>
                <div className="text-2xl" style={{ color: 'var(--theme-text-secondary)' }}>←</div>
            </button>


            {/* Main Level Card */}
            <div className="mx-4 mb-6">
                <div
                    className="rounded-[2rem] p-6 relative overflow-hidden"
                    style={{
                        backgroundColor: 'var(--theme-card-bg)',
                        border: `4px solid ${tier.color}`,
                        boxShadow: `0 8px 32px ${tier.color}40`
                    }}
                >
                    {/* Tier glow */}
                    <div
                        className="absolute inset-0 opacity-20 pointer-events-none"
                        style={{
                            background: `radial-gradient(circle at center, ${tier.color}, transparent 70%)`
                        }}
                    />

                    {/* Avatar & Level */}
                    <div className="relative z-10 flex flex-col items-center">
                        <div className="mb-4">
                            <AvatarDisplay
                                strokes={player.avatarStrokes}
                                avatar={player.avatar}
                                frame={player.frame}
                                color={player.color}
                                backgroundColor={player.backgroundColor}
                                size={140}
                            />
                        </div>

                        <h2 className="text-2xl font-black mb-2" style={{ color: 'var(--theme-text)' }}>
                            {player.name}
                        </h2>

                        {/* Tier Badge */}
                        <div
                            className="flex items-center gap-2 px-6 py-3 rounded-full mb-4"
                            style={{
                                backgroundColor: tier.color,
                                color: tier.name === 'Gold' || tier.name === 'Bronze' ? '#000' : '#fff',
                                boxShadow: `0 4px 20px ${tier.color}60`
                            }}
                        >
                            <span className="text-3xl">{tier.icon}</span>
                            <span className="text-2xl font-black">LEVEL {level}</span>
                        </div>

                        <div
                            className="text-lg font-bold mb-4"
                            style={{ color: tier.color }}
                        >
                            {tier.name} Tier
                        </div>

                        {/* XP Progress */}
                        <div className="w-full max-w-xs">
                            <div className="flex justify-between text-sm font-bold mb-2" style={{ color: 'var(--theme-text-secondary)' }}>
                                <span>XP Progress</span>
                                <span>{xpProgress} / {xpNeeded}</span>
                            </div>
                            <div className="h-4 rounded-full overflow-hidden bg-black/20">
                                <div
                                    className="h-full transition-all duration-500"
                                    style={{
                                        width: `${progressPercent}%`,
                                        backgroundColor: tier.color,
                                        boxShadow: `0 0 10px ${tier.color}`
                                    }}
                                />
                            </div>
                            <div className="text-center text-sm font-bold mt-2" style={{ color: 'var(--theme-text-secondary)' }}>
                                Total XP: {totalXP.toLocaleString()}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="mx-4 mb-6 grid grid-cols-2 gap-3">
                <div
                    className="rounded-2xl p-4 text-center"
                    style={{
                        backgroundColor: 'var(--theme-card-bg)',
                        border: '2px solid var(--theme-border)'
                    }}
                >
                    <div className="text-3xl mb-1">🏆</div>
                    <div className="text-2xl font-black" style={{ color: 'var(--theme-text)' }}>
                        {stats.gamesWon}
                    </div>
                    <div className="text-sm font-bold" style={{ color: 'var(--theme-text-secondary)' }}>
                        Games Won
                    </div>
                </div>
                <div
                    className="rounded-2xl p-4 text-center"
                    style={{
                        backgroundColor: 'var(--theme-card-bg)',
                        border: '2px solid var(--theme-border)'
                    }}
                >
                    <div className="text-3xl mb-1">🎮</div>
                    <div className="text-2xl font-black" style={{ color: 'var(--theme-text)' }}>
                        {stats.gamesPlayed}
                    </div>
                    <div className="text-sm font-bold" style={{ color: 'var(--theme-text-secondary)' }}>
                        Games Played
                    </div>
                </div>
            </div>

            {/* Level Badges */}
            <div className="mx-4 mb-6">
                <h3 className="text-lg font-black mb-3" style={{ color: 'var(--theme-text)' }}>
                    🎖️ Level Badges
                </h3>
                <div className="space-y-2">
                    {levelBadges.map((badge: any) => {
                        const isUnlocked = unlockedBadges.includes(badge.id);
                        const levelReq = badge.levelRequired;
                        return (
                            <div
                                key={badge.id}
                                className={`rounded-2xl p-3 flex items-center gap-3 transition-all ${isUnlocked ? '' : 'opacity-50'
                                    }`}
                                style={{
                                    backgroundColor: isUnlocked ? `${tier.color}20` : 'var(--theme-bg-secondary)',
                                    border: `2px solid ${isUnlocked ? tier.color : 'var(--theme-border)'}`
                                }}
                            >
                                <div className="text-3xl">{isUnlocked ? badge.emoji : '🔒'}</div>
                                <div className="flex-1">
                                    <div className="font-bold" style={{ color: 'var(--theme-text)' }}>
                                        {badge.name}
                                    </div>
                                    <div className="text-xs" style={{ color: 'var(--theme-text-secondary)' }}>
                                        {badge.description}
                                    </div>
                                </div>
                                <div
                                    className="text-xs font-bold px-2 py-1 rounded-full"
                                    style={{
                                        backgroundColor: level >= levelReq ? tier.color : 'var(--theme-bg-secondary)',
                                        color: level >= levelReq ? (tier.name === 'Gold' || tier.name === 'Bronze' ? '#000' : '#fff') : 'var(--theme-text-secondary)'
                                    }}
                                >
                                    LV {levelReq}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Next Tier */}
            {nextTier && (
                <div className="mx-4 mb-6">
                    <div
                        className="rounded-2xl p-4"
                        style={{
                            backgroundColor: 'var(--theme-card-bg)',
                            border: '2px solid var(--theme-border)'
                        }}
                    >
                        <h3 className="text-sm font-bold mb-2" style={{ color: 'var(--theme-text-secondary)' }}>
                            Next Tier: {nextTier.icon} {nextTier.name}
                        </h3>
                        <div className="flex items-center gap-2">
                            <div className="text-sm font-bold" style={{ color: 'var(--theme-text)' }}>
                                Level {nextTier.minLevel}
                            </div>
                            <div className="flex-1 h-2 rounded-full bg-black/20">
                                <div
                                    className="h-full rounded-full transition-all"
                                    style={{
                                        width: `${Math.min(100, (level / nextTier.minLevel) * 100)}%`,
                                        backgroundColor: nextTier.color
                                    }}
                                />
                            </div>
                            <div className="text-xs" style={{ color: 'var(--theme-text-secondary)' }}>
                                {nextTier.minLevel - level} levels to go
                            </div>
                        </div>
                        <div className="text-xs mt-2" style={{ color: nextTier.color }}>
                            Unlocks: +{Math.round(nextTier.xpBonus * 100)}% XP, +{Math.round(nextTier.currencyBonus * 100)}% coins, +{nextTier.timeBonus}s draw time
                        </div>
                    </div>
                </div>
            )}

            {/* Tier Power Bonuses */}
            {tier.xpBonus > 0 && (
                <div className="mx-4 mb-6">
                    <div
                        className="rounded-2xl p-4"
                        style={{
                            backgroundColor: `${tier.color}20`,
                            border: `2px solid ${tier.color}`
                        }}
                    >
                        <h3 className="text-sm font-bold mb-2" style={{ color: tier.color }}>
                            ⚡ {tier.name} Tier Bonuses Active
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            <div className="text-xs font-bold px-2 py-1 rounded-full bg-white/20">
                                +{Math.round(tier.xpBonus * 100)}% XP
                            </div>
                            <div className="text-xs font-bold px-2 py-1 rounded-full bg-white/20">
                                +{Math.round(tier.currencyBonus * 100)}% Coins
                            </div>
                            <div className="text-xs font-bold px-2 py-1 rounded-full bg-white/20">
                                +{tier.timeBonus}s Draw Time
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
