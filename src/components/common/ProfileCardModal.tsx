import React, { useState, useEffect } from 'react';
import { AvatarDisplay } from './AvatarDisplay';
import { XPService } from '../../services/xp';
import { BadgeService } from '../../services/badgeService';
import { FriendsService } from '../../services/friendsService';
import { AuthService } from '../../services/auth';
import { formatCurrency } from '../../services/currency';
import type { UserAccount } from '../../types';

interface ProfileCardModalProps {
    user: UserAccount;
    onClose: () => void;
    onInvite?: (userId: string) => void; // Optional invite action (for lobby)
    roomCode?: string | null; // If in a game, show invite button
}

export const ProfileCardModal: React.FC<ProfileCardModalProps> = ({
    user,
    onClose,
    onInvite,
    roomCode
}) => {
    const [friendButtonState, setFriendButtonState] = useState<'add' | 'remove' | 'confirm' | 'pending'>('add');
    const [isLoading, setIsLoading] = useState(false);
    const [showNameHistory, setShowNameHistory] = useState(false);
    const [inviteCooldown, setInviteCooldown] = useState(0);

    const currentUser = AuthService.getCurrentUser();
    const isOwnProfile = currentUser?.id === user.id;

    const tier = XPService.getTierForLevel(user.xp ? Math.floor(user.xp / 100) : 0);
    const level = user.xp ? Math.floor(user.xp / 100) : 0;
    const activeBadgeInfo = user.cosmetics?.activeBadge
        ? BadgeService.getBadgeInfo(user.cosmetics.activeBadge)
        : null;

    useEffect(() => {
        const checkStatus = async () => {
            if (FriendsService.isFriend(user.id)) {
                setFriendButtonState('remove');
            } else {
                const pending = await FriendsService.isFriendRequestPending(user.id);
                setFriendButtonState(pending ? 'pending' : 'add');
            }
        };
        checkStatus();
    }, [user.id]);

    // Update invite cooldown timer
    useEffect(() => {
        if (!roomCode) return;

        const updateCooldown = () => {
            const remaining = FriendsService.getInviteCooldown(user.id);
            setInviteCooldown(remaining);
        };

        updateCooldown();
        const interval = setInterval(updateCooldown, 1000);
        return () => clearInterval(interval);
    }, [user.id, roomCode]);

    const handleFriendAction = async () => {
        if (isLoading) return;

        if (friendButtonState === 'add') {
            setIsLoading(true);
            const result = await FriendsService.sendFriendRequest(user.id);
            setIsLoading(false);
            if (result.success) {
                setFriendButtonState('pending');
            } else {
                // Maybe show error?
                console.error(result.error);
            }
        } else if (friendButtonState === 'remove') {
            // Show confirmation
            setFriendButtonState('confirm');
        } else if (friendButtonState === 'confirm') {
            setIsLoading(true);
            const result = await FriendsService.removeFriend(user.id);
            setIsLoading(false);
            if (result.success) {

                setFriendButtonState('add');
            }
        }
    };

    const handleInvite = async () => {
        if (!roomCode || !onInvite) return;
        if (!FriendsService.canInvite(user.id)) return;

        onInvite(user.id);
    };

    const getFriendButtonStyle = () => {
        switch (friendButtonState) {
            case 'add':
                return {
                    bg: '#22c55e',
                    text: 'white',
                    label: '➕ Add Friend'
                };
            case 'remove':
                return {
                    bg: '#ef4444',
                    text: 'white',
                    label: '✕ Remove Friend'
                };
            case 'confirm':
                return {
                    bg: '#dc2626',
                    text: 'white',
                    label: 'Are you sure?'
                };
            case 'pending':
                return {
                    bg: '#94a3b8',
                    text: 'white',
                    label: '🕒 Request Sent'
                };
        }
    };

    const btnStyle = getFriendButtonStyle();

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={onClose}
        >
            <div
                className="relative rounded-3xl p-6 shadow-2xl w-full max-w-sm pop-in overflow-hidden"
                style={{
                    backgroundColor: 'var(--theme-card-bg)',
                    border: `4px solid ${tier.color}`
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Tier glow effect */}
                <div
                    className="absolute inset-0 opacity-20 pointer-events-none"
                    style={{
                        background: `radial-gradient(circle at top right, ${tier.color}, transparent 60%)`
                    }}
                />

                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center z-10 transition-colors"
                    style={{
                        backgroundColor: 'var(--theme-bg-secondary)',
                        color: 'var(--theme-text)'
                    }}
                >
                    ✕
                </button>

                {/* Avatar */}
                <div className="flex justify-center mb-4 relative z-10">
                    <div className="relative">
                        <AvatarDisplay
                            strokes={user.avatarStrokes}
                            avatar={user.avatar}
                            frame={user.frame}
                            color={user.color}
                            backgroundColor={user.backgroundColor}
                            size={120}
                        />
                        {activeBadgeInfo && (
                            <span
                                className="absolute -bottom-2 -right-2 text-3xl drop-shadow-md"
                                title={activeBadgeInfo.name}
                            >
                                {activeBadgeInfo.emoji}
                            </span>
                        )}
                    </div>
                </div>

                {/* Username with history dropdown */}
                <div className="text-center mb-4 relative z-10">
                    <div className="relative inline-block">
                        <button
                            onClick={() => user.usernameHistory?.length && setShowNameHistory(!showNameHistory)}
                            className="text-2xl font-black flex items-center gap-2 mx-auto"
                            style={{ color: 'var(--theme-text)' }}
                        >
                            {user.username}
                            {user.usernameHistory && user.usernameHistory.length > 0 && (
                                <span className="text-sm opacity-50">▼</span>
                            )}
                        </button>

                        {/* Username history dropdown */}
                        {showNameHistory && user.usernameHistory && (
                            <div
                                className="absolute top-full left-1/2 -translate-x-1/2 mt-2 rounded-xl p-3 shadow-xl z-20 min-w-[160px]"
                                style={{ backgroundColor: 'var(--theme-bg-secondary)' }}
                            >
                                <div className="text-xs font-bold opacity-60 mb-2" style={{ color: 'var(--theme-text-secondary)' }}>
                                    Previous Names
                                </div>
                                {user.usernameHistory.map((name, idx) => (
                                    <div
                                        key={idx}
                                        className="text-sm font-medium py-1"
                                        style={{ color: 'var(--theme-text)' }}
                                    >
                                        {name}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Level & Tier */}
                    <div className="flex items-center justify-center gap-2 mt-2">
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
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 mb-6 relative z-10">
                    <div
                        className="rounded-xl p-3 text-center"
                        style={{ backgroundColor: 'var(--theme-bg-secondary)' }}
                    >
                        <div className="text-xl mb-1">🏆</div>
                        <div className="text-lg font-bold" style={{ color: 'var(--theme-text)' }}>
                            {user.stats?.gamesWon || 0}
                        </div>
                        <div className="text-xs font-medium opacity-60" style={{ color: 'var(--theme-text-secondary)' }}>
                            Wins
                        </div>
                    </div>
                    <div
                        className="rounded-xl p-3 text-center"
                        style={{ backgroundColor: 'var(--theme-bg-secondary)' }}
                    >
                        <div className="text-xl mb-1">🎮</div>
                        <div className="text-lg font-bold" style={{ color: 'var(--theme-text)' }}>
                            {user.stats?.gamesPlayed || 0}
                        </div>
                        <div className="text-xs font-medium opacity-60" style={{ color: 'var(--theme-text-secondary)' }}>
                            Games
                        </div>
                    </div>
                    <div
                        className="rounded-xl p-3 text-center"
                        style={{ backgroundColor: 'var(--theme-bg-secondary)' }}
                    >
                        <div className="text-xl mb-1">💰</div>
                        <div className="text-lg font-bold" style={{ color: 'var(--theme-text)' }}>
                            {formatCurrency(user.stats?.totalCurrencyEarned || 0)}
                        </div>
                        <div className="text-xs font-medium opacity-60" style={{ color: 'var(--theme-text-secondary)' }}>
                            Earned
                        </div>
                    </div>
                    <div
                        className="rounded-xl p-3 text-center"
                        style={{ backgroundColor: 'var(--theme-bg-secondary)' }}
                    >
                        <div className="text-xl mb-1">⭐</div>
                        <div className="text-lg font-bold" style={{ color: 'var(--theme-text)' }}>
                            {user.stats?.roundsWon || 0}
                        </div>
                        <div className="text-xs font-medium opacity-60" style={{ color: 'var(--theme-text-secondary)' }}>
                            Rounds Won
                        </div>
                    </div>
                </div>

                {/* Action buttons */}
                <div className="space-y-3 relative z-10">
                    {/* Invite button (only in lobby context) */}
                    {roomCode && onInvite && !isOwnProfile && (
                        <button
                            onClick={handleInvite}
                            disabled={inviteCooldown > 0}
                            className={`w-full py-3 px-4 rounded-xl font-bold transition-all ${inviteCooldown > 0 ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-95'
                                }`}
                            style={{
                                backgroundColor: inviteCooldown > 0 ? 'var(--theme-bg-secondary)' : '#6366f1',
                                color: inviteCooldown > 0 ? 'var(--theme-text-secondary)' : 'white'
                            }}
                        >
                            {inviteCooldown > 0 ? `⏱️ Wait ${inviteCooldown}s` : '📨 Invite to Game'}
                        </button>
                    )}

                    {/* Add/Remove Friend button */}
                    {!isOwnProfile && (
                        <button
                            onClick={handleFriendAction}
                            disabled={isLoading || friendButtonState === 'pending'}
                            className={`w-full py-3 px-4 rounded-xl font-bold transition-all ${isLoading || friendButtonState === 'pending' ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-95'
                                }`}
                            style={{
                                backgroundColor: btnStyle.bg,
                                color: btnStyle.text
                            }}
                        >
                            {isLoading ? '...' : btnStyle.label}
                        </button>
                    )}

                    {/* Cancel confirm button */}
                    {friendButtonState === 'confirm' && (
                        <button
                            onClick={() => setFriendButtonState('remove')}
                            className="w-full py-2 px-4 rounded-xl font-medium transition-all"
                            style={{
                                backgroundColor: 'var(--theme-bg-secondary)',
                                color: 'var(--theme-text)'
                            }}
                        >
                            Cancel
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
