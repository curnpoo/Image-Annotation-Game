import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { AvatarDisplay } from './AvatarDisplay';
import { XPService } from '../../services/xp';
import { BadgeService } from '../../services/badgeService';
import { FriendsService } from '../../services/friendsService';
import { AuthService } from '../../services/auth';
import { StorageService } from '../../services/storage';
import { formatCurrency } from '../../services/currency';
import type { UserAccount } from '../../types';
import { vibrate, HapticPatterns } from '../../utils/haptics';

interface ProfileCardModalProps {
    user: UserAccount;
    onClose: () => void;
    onInvite?: (userId: string) => void;
    onJoin?: (roomCode: string) => void;
    roomCode?: string | null;
}

export const ProfileCardModal: React.FC<ProfileCardModalProps> = ({
    user,
    onClose,
    onInvite,
    onJoin,
    roomCode
}) => {
    const [friendButtonState, setFriendButtonState] = useState<'add' | 'remove' | 'confirm' | 'sent' | 'received'>('add');
    const [isLoading, setIsLoading] = useState(false);
    const [showNameHistory, setShowNameHistory] = useState(false);
    const [inviteCooldown, setInviteCooldown] = useState(0);
    const [roomPreview, setRoomPreview] = useState<{ playerCount: number, roundNumber: number, totalRounds: number, status: string, hostName: string } | null>(null);

    const currentUser = AuthService.getCurrentUser();
    const isOwnProfile = currentUser?.id === user.id;

    const level = XPService.getLevelFromXP(user.xp || 0);
    const tier = XPService.getTierForLevel(level);

    const activeBadgeInfo = (level >= 5 && user.cosmetics?.activeBadge)
        ? BadgeService.getBadgeInfo(user.cosmetics.activeBadge)
        : null;

    useEffect(() => {
        const checkStatus = async () => {
            if (FriendsService.isFriend(user.id)) {
                setFriendButtonState('remove');
            } else {
                const status = await FriendsService.getFriendRequestStatus(user.id);
                if (status === 'friend') setFriendButtonState('remove');
                else if (status === 'sent') setFriendButtonState('sent');
                else if (status === 'received') setFriendButtonState('received');
                else setFriendButtonState('add');
            }
        };
        checkStatus();
    }, [user.id]);

    useEffect(() => {
        if (user.currentRoomCode) {
            StorageService.getRoomPreview(user.currentRoomCode).then(setRoomPreview);
        }
    }, [user.currentRoomCode]);

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
        vibrate();

        if (friendButtonState === 'add') {
            setIsLoading(true);
            const result = await FriendsService.sendFriendRequest(user.id);
            setIsLoading(false);
            if (result.success) {
                setFriendButtonState('sent');
            } else {
                console.error(result.error);
                vibrate(HapticPatterns.error);
            }
        } else if (friendButtonState === 'remove') {
            setFriendButtonState('confirm');
        } else if (friendButtonState === 'confirm') {
            setIsLoading(true);
            const result = await FriendsService.removeFriend(user.id);
            setIsLoading(false);
            if (result.success) {
                setFriendButtonState('add');
            }
        } else if (friendButtonState === 'received') {
            setIsLoading(true);
            const result = await FriendsService.acceptFriendRequestFromUser(user.id);
            setIsLoading(false);
            if (result.success) {
                setFriendButtonState('remove');
            }
        }
    };

    const handleInvite = async () => {
        if (!roomCode || !onInvite) return;
        if (!FriendsService.canInvite(user.id)) return;

        vibrate(HapticPatterns.success);
        onInvite(user.id);
    };

    const getFriendButtonStyle = () => {
        switch (friendButtonState) {
            case 'add':
                return {
                    bg: 'bg-gradient-to-r from-green-500 to-emerald-600',
                    text: 'text-white',
                    label: '➕ Add Friend',
                    shadow: 'shadow-green-500/30'
                };
            case 'remove':
                return {
                    bg: 'bg-red-500/10 border border-red-500/20',
                    text: 'text-red-400',
                    label: '✕ Remove Friend',
                    shadow: 'shadow-none'
                };
            case 'confirm':
                return {
                    bg: 'bg-red-500 text-white',
                    text: 'text-white',
                    label: 'Confirm Remove?',
                    shadow: 'shadow-red-500/30'
                };
            case 'sent':
                return {
                    bg: 'bg-white/10 text-white/50 cursor-not-allowed',
                    text: 'text-white/50',
                    label: '🕒 Request Sent',
                    shadow: 'shadow-none'
                };
            case 'received':
                return {
                    bg: 'bg-green-500',
                    text: 'text-white',
                    label: '✅ Accept Request',
                    shadow: 'shadow-green-500/30'
                };
        }
    };

    const btnStyle = getFriendButtonStyle();

    return ReactDOM.createPortal(
        <div
            className="fixed inset-0 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
            style={{ zIndex: 9999 }}
            onClick={onClose}
        >
            <div
                className="relative rounded-3xl p-8 shadow-2xl w-full max-w-sm pop-in overflow-y-auto max-h-[85vh] overscroll-contain touch-pan-y glass-panel !bg-black/90 border border-white/20"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Decorative Tier Gradient */}
                <div
                    className="absolute top-0 inset-x-0 h-32 opacity-20 pointer-events-none blur-3xl"
                    style={{
                        background: `linear-gradient(180deg, ${tier.color}, transparent)`
                    }}
                />

                {/* Close button */}
                <button
                    onClick={() => {
                        vibrate();
                        onClose();
                    }}
                    className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center z-20 transition-all bg-white/10 hover:bg-white/20 text-white border border-white/10 active:scale-90"
                >
                    ✕
                </button>

                {/* Avatar */}
                <div className="flex justify-center mb-6 relative z-10 mt-4">
                    <div className="relative group">
                        <div className="absolute inset-0 bg-white/10 rounded-full blur-xl scale-110 group-hover:scale-125 transition-transform duration-500" />
                        <AvatarDisplay
                            strokes={user.avatarStrokes}
                            avatar={user.avatar}
                            frame={user.frame}
                            color={user.color}
                            backgroundColor={user.backgroundColor}
                            size={120}
                            playerId={user.id}
                        />
                        {activeBadgeInfo && (
                            <div className="absolute -bottom-2 -right-2 w-12 h-12 flex items-center justify-center bg-black/60 backdrop-blur-md rounded-full border border-white/20 shadow-lg text-2xl animate-bounce-gentle" title={activeBadgeInfo.name}>
                                {activeBadgeInfo.emoji}
                            </div>
                        )}
                    </div>
                </div>

                {/* Username with history dropdown */}
                <div className="text-center mb-6 relative z-10 px-4">
                    <div className="relative inline-block">
                        <button
                            onClick={() => {
                                if (user.usernameHistory?.length) {
                                    vibrate();
                                    setShowNameHistory(!showNameHistory);
                                }
                            }}
                            className="text-3xl font-black text-white flex items-center gap-2 mx-auto tracking-tight"
                        >
                            {user.username}
                            {user.usernameHistory && user.usernameHistory.length > 0 && (
                                <span className="text-sm opacity-50 bg-white/10 rounded-md px-1 py-0.5">▼</span>
                            )}
                        </button>

                        {/* Username history dropdown */}
                        {showNameHistory && user.usernameHistory && (
                            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 rounded-2xl p-4 shadow-2xl z-50 min-w-[200px] bg-black/95 border border-white/20 backdrop-blur-xl animate-in fade-in zoom-in-95">
                                <div className="text-[10px] font-bold opacity-50 mb-3 uppercase tracking-widest text-white">
                                    Previous Names
                                </div>
                                {user.usernameHistory.map((name, idx) => (
                                    <div key={idx} className="text-sm font-bold py-1.5 text-white/80 border-b border-white/5 last:border-0">
                                        {name}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Level & Tier */}
                    <div className="flex items-center justify-center gap-2 mt-4">
                        <div
                            className="text-xs font-black px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-lg border border-white/10"
                            style={{
                                backgroundColor: tier.color,
                                color: tier.name === 'Gold' || tier.name === 'Bronze' ? '#000' : '#fff',
                                textShadow: tier.name === 'Gold' ? 'none' : '0 1px 2px rgba(0,0,0,0.3)'
                            }}
                        >
                            <span className="text-base">{tier.icon}</span>
                            <span className="tracking-widest uppercase">LVL {level}</span>
                        </div>
                        <div
                            className="text-[10px] font-bold px-2 py-1.5 rounded-lg border border-white/10 bg-white/10 text-white/80 uppercase tracking-wider"
                        >
                            {tier.name} Tier
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 mb-8 relative z-10">
                    {[
                        { emoji: '🏆', val: user.stats?.gamesWon || 0, label: 'Wins' },
                        { emoji: '🎮', val: user.stats?.gamesPlayed || 0, label: 'Games' },
                        { emoji: '💰', val: formatCurrency(user.stats?.totalCurrencyEarned || 0), label: 'Earned' },
                        { emoji: '🔥', val: user.stats?.roundsWon || 0, label: 'Round Wins' }
                    ].map((stat, i) => (
                        <div key={i} className="rounded-2xl p-3 text-center bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                            <div className="text-xl mb-1 filter drop-shadow-md">{stat.emoji}</div>
                            <div className="text-lg font-black text-white tracking-tight">
                                {stat.val}
                            </div>
                            <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                                {stat.label}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Action buttons */}
                <div className="space-y-3 relative z-10">
                    {/* Invite button */}
                    {roomCode && onInvite && !isOwnProfile && (
                        <button
                            onClick={handleInvite}
                            disabled={inviteCooldown > 0}
                            className={`w-full py-4 px-6 rounded-2xl font-black text-sm uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-2 relative overflow-hidden group
                                ${inviteCooldown > 0
                                    ? 'bg-white/10 text-white/30 cursor-not-allowed border border-white/5'
                                    : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:scale-[1.02] active:scale-95 shadow-indigo-500/30'}`}
                        >
                            {inviteCooldown > 0 ? (
                                <span>Wait {inviteCooldown}s</span>
                            ) : (
                                <>
                                    <span className="text-lg group-hover:rotate-12 transition-transform">📨</span> Invite to Game
                                </>
                            )}
                        </button>
                    )}

                    {/* Add/Remove Friend button */}
                    {!isOwnProfile && (
                        <button
                            onClick={handleFriendAction}
                            disabled={isLoading || friendButtonState === 'sent'}
                            className={`w-full py-4 px-6 rounded-2xl font-black text-sm uppercase tracking-wider transition-all shadow-lg
                                ${btnStyle.bg} ${btnStyle.text} ${btnStyle.shadow}
                                ${isLoading || friendButtonState === 'sent' ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-95'}`}
                        >
                            {isLoading ? 'Processing...' : btnStyle.label}
                        </button>
                    )}

                    {/* Join Game Button */}
                    {!isOwnProfile && user.currentRoomCode && onJoin && (
                        <button
                            onClick={() => {
                                vibrate();
                                onJoin(user.currentRoomCode!);
                            }}
                            className="w-full py-4 px-6 rounded-2xl font-black transition-all hover:scale-[1.02] active:scale-95 text-white shadow-xl flex flex-col items-center justify-center gap-0.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 border border-white/20 relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-white/20 animate-pulse-slow"></div>
                            <div className="relative flex items-center gap-2 z-10 text-sm uppercase tracking-wider">
                                <span className="animate-bounce-gentle">🎮</span> Join Game
                            </div>
                            {roomPreview && (
                                <div className="relative z-10 text-[10px] opacity-90 font-bold bg-black/20 px-2 py-0.5 rounded-md mt-1">
                                    {roomPreview.playerCount} Players • Round {roomPreview.roundNumber}/{roomPreview.totalRounds}
                                </div>
                            )}
                        </button>
                    )}

                    {/* Cancel confirm button */}
                    {friendButtonState === 'confirm' && (
                        <button
                            onClick={() => {
                                vibrate();
                                setFriendButtonState('remove');
                            }}
                            className="w-full py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all text-white/50 hover:text-white hover:bg-white/5"
                        >
                            Cancel
                        </button>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};
