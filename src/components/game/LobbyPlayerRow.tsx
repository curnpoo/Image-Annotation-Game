import React, { memo } from 'react';
import type { Player } from '../../types';
import { AvatarDisplay } from '../common/AvatarDisplay';
import { BadgeService } from '../../services/badgeService';
import { XPService } from '../../services/xp';
import { formatCurrency } from '../../services/currency';

interface LobbyPlayerRowProps {
    player: Player;
    isHost: boolean;
    isCurrentPlayer: boolean;
    isIdle: boolean;
    playerStatus: string; // 'waiting' | 'ready' | 'submitted' etc, or normalized display text like 'READY!'
    cardColor?: string; // Passed from player.cosmetics.activeCardColor
    onKickStart?: () => void;
    showKickButton: boolean;
}

const LobbyPlayerRowBase: React.FC<LobbyPlayerRowProps> = ({
    player,
    isHost,
    isCurrentPlayer,
    isIdle,
    playerStatus,
    cardColor,
    onKickStart,
    showKickButton
}) => {
    // Calculate level from XP instead of using potentially stale player.level
    const calculatedLevel = player.xp ? XPService.getLevelFromXP(player.xp) : (player.level || 0);
    const tier = XPService.getTierForLevel(calculatedLevel);
    const activeBadgeInfo = player.cosmetics?.activeBadge ? BadgeService.getBadgeInfo(player.cosmetics.activeBadge) : null;

    // Determine status badge color and text
    const getStatusStyle = () => {
        if (playerStatus === 'ready') return { bg: '#D97706', color: '#3E2723', text: 'READY!' };
        if (isIdle) return { bg: '#D97706', color: '#3E2723', text: 'AWAY...', opacity: 0.5 };
        return { bg: '#D97706', color: '#3E2723', text: 'WAITING...' }; // Default waiting
    };

    const statusStyle = getStatusStyle();

    return (
        <div
            className="flex items-center justify-between p-4 rounded-2xl mb-3 relative overflow-hidden transition-all shadow-sm"
            style={{
                backgroundColor: 'var(--theme-highlight)',
                borderLeft: cardColor ? `8px solid ${cardColor}` : 'none',
                background: cardColor ? `linear-gradient(90deg, ${cardColor}22, var(--theme-highlight) 30%)` : 'var(--theme-highlight)'
            }}>
            <div className="flex items-center gap-4 relative z-10">
                <div className="relative">
                    <AvatarDisplay
                        strokes={player.avatarStrokes}
                        avatar={player.avatar}
                        color={player.color}
                        backgroundColor={player.backgroundColor || '#ffffff'}
                        size={56}
                        playerId={player.id}
                        imageUrl={player.avatarImageUrl}
                    />
                    {isHost && (
                        <span className="absolute -top-2 -right-2 text-xl filter drop-shadow-md">👑</span>
                    )}
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <div className="font-bold text-lg text-[var(--theme-text)] leading-tight">{player.name}</div>
                        {/* Badge */}
                        {activeBadgeInfo && (
                            <span title={activeBadgeInfo.name} className="text-xl drop-shadow-md cursor-help">
                                {activeBadgeInfo.emoji}
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-2 mt-0.5">
                        {/* Dynamic Stat Display */}
                        {(player.cosmetics?.activeStat === 'wins' && player.stats) ? (
                            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-black/5 dark:bg-white/10" title="Games Won">
                                <span className="text-xs">🏆</span>
                                <span className="text-[10px] font-black opacity-70 uppercase">{player.stats.gamesWon} Wins</span>
                            </div>
                        ) : (player.cosmetics?.activeStat === 'earnings' && player.stats) ? (
                            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-black/5 dark:bg-white/10" title="Total Earnings">
                                <span className="text-xs">💰</span>
                                <span className="text-[10px] font-black opacity-70 uppercase">{formatCurrency(player.stats.totalCurrencyEarned)}</span>
                            </div>
                        ) : (player.cosmetics?.activeStat === 'none') ? (
                            null
                        ) : (
                            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-black/5 dark:bg-white/10" title={tier.name}>
                                <span className="text-xs">{tier.icon}</span>
                                <span className="text-[10px] font-black opacity-70 uppercase">Lvl {calculatedLevel}</span>
                            </div>
                        )}

                        {isCurrentPlayer && (
                            <div className="text-[10px] font-bold tracking-wider opacity-60 text-[var(--theme-text)]">YOU</div>
                        )}
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-2 relative z-10">
                <div className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest ${statusStyle.opacity ? 'opacity-50' : ''}`}
                    style={{ backgroundColor: statusStyle.bg, color: statusStyle.color }}>
                    {statusStyle.text}
                </div>
                {showKickButton && onKickStart && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onKickStart();
                        }}
                        className="bg-red-100 text-red-500 w-7 h-7 rounded-full hover:bg-red-500 hover:text-white transition-colors flex items-center justify-center text-sm"
                    >
                        ✕
                    </button>
                )}
            </div>
        </div>
    );
};

// Custom comparison for performance
const arePropsEqual = (prev: LobbyPlayerRowProps, next: LobbyPlayerRowProps) => {
    return (
        prev.isIdle === next.isIdle &&
        prev.playerStatus === next.playerStatus &&
        prev.showKickButton === next.showKickButton &&
        prev.cardColor === next.cardColor &&
        prev.isHost === next.isHost &&
        prev.isCurrentPlayer === next.isCurrentPlayer &&
        // Deep compare player object using JSON stringify for relevant parts or ID check + modified check
        // Full JSON stringify is safer as cosmetics/stats might change
        JSON.stringify(prev.player) === JSON.stringify(next.player)
    );
};

export const LobbyPlayerRow = memo(LobbyPlayerRowBase, arePropsEqual);
