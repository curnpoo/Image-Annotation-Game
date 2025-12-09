import React, { useState, useEffect } from 'react';
import { AvatarDisplay } from './AvatarDisplay';
import { ProfileCardModal } from './ProfileCardModal';
import { FriendsService } from '../../services/friendsService';
import { XPService } from '../../services/xp';
import type { UserAccount } from '../../types';

interface InviteFriendsModalProps {
    roomCode: string;
    onClose: () => void;
    onInviteSent?: (userId: string, success: boolean) => void;
}

export const InviteFriendsModal: React.FC<InviteFriendsModalProps> = ({
    roomCode,
    onClose,
    onInviteSent
}) => {
    const [activeTab, setActiveTab] = useState<'friends' | 'search'>('friends');
    const [friends, setFriends] = useState<UserAccount[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResult, setSearchResult] = useState<UserAccount | null>(null);
    const [searchError, setSearchError] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null);
    const [invitingUserId, setInvitingUserId] = useState<string | null>(null);
    const [, setTick] = useState(0); // For cooldown updates

    useEffect(() => {
        loadFriends();
    }, []);

    // Update cooldown timers every second
    useEffect(() => {
        const interval = setInterval(() => setTick(t => t + 1), 1000);
        return () => clearInterval(interval);
    }, []);

    const loadFriends = async () => {
        setIsLoading(true);
        const friendsList = await FriendsService.getFriends();
        setFriends(friendsList);
        setIsLoading(false);
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;

        setIsSearching(true);
        setSearchError('');
        setSearchResult(null);
        // vibrate(); // Assuming vibrate() is defined elsewhere or needs to be added

        const users = await FriendsService.searchUsers(searchQuery.trim(), 1);
        const user = users.length > 0 ? users[0] : null;

        if (user) {
            setSearchResult(user);
            // vibrate(); // Assuming vibrate() is defined elsewhere or needs to be added
        } else {
            setSearchError('User not found');
            // vibrate(); // Assuming vibrate() is defined elsewhere or needs to be added
        }

        setIsSearching(false);
    };

    const handleInvite = async (userId: string) => {
        if (invitingUserId) return; // Prevent double-clicks

        setInvitingUserId(userId);
        const result = await FriendsService.sendInvite(userId, roomCode);
        setInvitingUserId(null);

        if (onInviteSent) {
            onInviteSent(userId, result.success);
        }

        // Refresh to update cooldowns
        setTick(t => t + 1);
    };

    const renderUserRow = (user: UserAccount, showInviteButton: boolean = true) => {
        const tier = XPService.getTierForLevel(user.xp ? Math.floor(user.xp / 100) : 0);
        const cooldown = FriendsService.getInviteCooldown(user.id);
        const isInviting = invitingUserId === user.id;

        return (
            <div
                key={user.id}
                className="p-3 rounded-xl flex items-center gap-3 mb-2"
                style={{ backgroundColor: 'var(--theme-highlight)' }}
            >
                {/* Clickable avatar/info to view profile */}
                <button
                    onClick={() => setSelectedUser(user)}
                    className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity"
                >
                    <div className="relative flex-shrink-0">
                        <AvatarDisplay
                            strokes={user.avatarStrokes}
                            avatar={user.avatar}
                            color={user.color}
                            backgroundColor={user.backgroundColor}
                            size={48}
                            playerId={user.id}
                        />
                    </div>
                    <div className="flex-1 text-left min-w-0">
                        <div className="font-bold text-[var(--theme-text)] truncate">
                            {user.username}
                        </div>
                        <div className="flex items-center gap-1">
                            <span
                                className="text-xs font-bold px-1.5 py-0.5 rounded"
                                style={{
                                    backgroundColor: `${tier.color}30`,
                                    color: tier.color
                                }}
                            >
                                {tier.icon} Lvl {user.xp ? Math.floor(user.xp / 100) : 0}
                            </span>
                        </div>
                    </div>
                </button>

                {/* Invite button */}
                {showInviteButton && (
                    <button
                        onClick={() => handleInvite(user.id)}
                        disabled={cooldown > 0 || isInviting}
                        className={`px-4 py-2 rounded-xl font-bold text-sm transition-all flex-shrink-0 ${cooldown > 0 || isInviting
                            ? 'opacity-50 cursor-not-allowed'
                            : 'hover:scale-105 active:scale-95'
                            }`}
                        style={{
                            backgroundColor: cooldown > 0 ? 'var(--theme-bg-secondary)' : '#6366f1',
                            color: cooldown > 0 ? 'var(--theme-text-secondary)' : 'white',
                            minWidth: '80px'
                        }}
                    >
                        {isInviting ? (
                            '...'
                        ) : cooldown > 0 ? (
                            `${cooldown}s`
                        ) : (
                            '📨 Invite'
                        )}
                    </button>
                )}
            </div>
        );
    };

    return (
        <>
            <div
                className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
                onClick={onClose}
            >
                <div
                    className="relative rounded-3xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden pop-in flex flex-col"
                    style={{ backgroundColor: 'var(--theme-card-bg)' }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--theme-border)' }}>
                        <h2 className="text-xl font-bold" style={{ color: 'var(--theme-text)' }}>
                            📨 Invite Players
                        </h2>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                            style={{
                                backgroundColor: 'var(--theme-bg-secondary)',
                                color: 'var(--theme-text)'
                            }}
                        >
                            ✕
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b" style={{ borderColor: 'var(--theme-border)' }}>
                        <button
                            onClick={() => setActiveTab('friends')}
                            className={`flex-1 py-3 font-bold text-sm transition-colors ${activeTab === 'friends' ? 'border-b-2' : 'opacity-60'
                                }`}
                            style={{
                                color: 'var(--theme-text)',
                                borderColor: activeTab === 'friends' ? '#6366f1' : 'transparent'
                            }}
                        >
                            👥 Friends
                        </button>
                        <button
                            onClick={() => setActiveTab('search')}
                            className={`flex-1 py-3 font-bold text-sm transition-colors ${activeTab === 'search' ? 'border-b-2' : 'opacity-60'
                                }`}
                            style={{
                                color: 'var(--theme-text)',
                                borderColor: activeTab === 'search' ? '#6366f1' : 'transparent'
                            }}
                        >
                            🔍 Search User
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-4">
                        {activeTab === 'friends' ? (
                            // Friends Tab
                            isLoading ? (
                                <div className="text-center py-8">
                                    <div className="text-3xl animate-pulse">⏳</div>
                                    <div className="text-sm text-[var(--theme-text-secondary)] mt-2">
                                        Loading friends...
                                    </div>
                                </div>
                            ) : friends.length === 0 ? (
                                <div className="text-center py-8">
                                    <div className="text-4xl mb-3">🫂</div>
                                    <div className="text-[var(--theme-text)] font-bold mb-1">
                                        No friends yet
                                    </div>
                                    <div className="text-sm text-[var(--theme-text-secondary)]">
                                        Switch to the Search tab to find and invite players
                                    </div>
                                </div>
                            ) : (
                                friends.map(friend => renderUserRow(friend))
                            )
                        ) : (
                            // Search Tab
                            <div>
                                <div className="flex gap-2 mb-4">
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                        placeholder="Enter username..."
                                        className="flex-1 px-4 py-3 rounded-xl border-2 font-medium"
                                        style={{
                                            backgroundColor: 'var(--theme-bg-secondary)',
                                            borderColor: 'var(--theme-border)',
                                            color: 'var(--theme-text)'
                                        }}
                                    />
                                    <button
                                        onClick={handleSearch}
                                        disabled={isSearching}
                                        className="px-5 py-3 rounded-xl font-bold transition-colors"
                                        style={{
                                            backgroundColor: '#6366f1',
                                            color: 'white'
                                        }}
                                    >
                                        {isSearching ? '...' : '🔍'}
                                    </button>
                                </div>

                                {searchError && (
                                    <div className="text-center py-4">
                                        <div className="text-2xl mb-2">😕</div>
                                        <div className="text-red-500 font-medium">{searchError}</div>
                                    </div>
                                )}

                                {searchResult && renderUserRow(searchResult)}

                                {!searchResult && !searchError && (
                                    <div className="text-center py-8 text-[var(--theme-text-secondary)]">
                                        <div className="text-3xl mb-2">🔍</div>
                                        <div className="text-sm">
                                            Search for a username to invite them
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Cooldown Info */}
                    <div className="p-3 border-t text-center text-xs font-medium" style={{
                        borderColor: 'var(--theme-border)',
                        color: 'var(--theme-text-secondary)'
                    }}>
                        ⏱️ 30 second cooldown between invites per player
                    </div>
                </div>
            </div>

            {/* Profile Card Modal (when clicking on a user) */}
            {selectedUser && (
                <ProfileCardModal
                    user={selectedUser}
                    onClose={() => setSelectedUser(null)}
                    roomCode={roomCode}
                    onInvite={handleInvite}
                />
            )}
        </>
    );
};
