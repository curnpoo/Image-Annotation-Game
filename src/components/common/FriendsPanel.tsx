import React, { useState, useEffect } from 'react';
import { AvatarDisplay } from './AvatarDisplay';
import { ProfileCardModal } from './ProfileCardModal';
import { FriendsService } from '../../services/friendsService';
import { XPService } from '../../services/xp';
import { BadgeService } from '../../services/badgeService';
import type { UserAccount, Player, FriendRequest } from '../../types';

interface FriendsPanelProps {
    player: Player;
    openRequestsTrigger?: number;
}

export const FriendsPanel: React.FC<FriendsPanelProps> = ({ player: _player, openRequestsTrigger }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        if (openRequestsTrigger && openRequestsTrigger > 0) {
            setIsExpanded(true);
            setActiveTab('requests');
            loadData();
        }
    }, [openRequestsTrigger]);

    // Check for auto-open (hacky solution: check URL or global event, but prop is better)
    // For now we just fix the rendering.

    const [friends, setFriends] = useState<UserAccount[]>([]);
    const [requests, setRequests] = useState<FriendRequest[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'friends' | 'requests'>('friends');
    const [selectedFriend, setSelectedFriend] = useState<UserAccount | null>(null);
    const [showSearch, setShowSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResult, setSearchResult] = useState<UserAccount | null>(null);
    const [searchError, setSearchError] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    const loadData = async () => {
        setIsLoading(true);
        const [friendsList, requestsList] = await Promise.all([
            FriendsService.getFriends(),
            FriendsService.getFriendRequests()
        ]);
        setFriends(friendsList);
        setRequests(requestsList);
        setIsLoading(false);
    };

    useEffect(() => {
        if (isExpanded) {
            loadData();
        }
    }, [isExpanded]);

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;

        setIsSearching(true);
        setSearchError('');
        setSearchResult(null);

        const user = await FriendsService.searchUserByUsername(searchQuery.trim());

        if (user) {
            setSearchResult(user);
        } else {
            setSearchError('User not found');
        }

        setIsSearching(false);
    };

    const handleFriendClick = (friend: UserAccount) => {
        setSelectedFriend(friend);
    };

    const handleCloseProfile = () => {
        setSelectedFriend(null);
        setSearchResult(null);
        // Refresh friends list in case of changes
        loadData();
    };

    const handleAcceptRequest = async (requestId: string) => {
        await FriendsService.acceptFriendRequest(requestId);
        loadData();
    };

    const handleDeclineRequest = async (requestId: string) => {
        await FriendsService.declineFriendRequest(requestId);
        loadData();
    };

    return (
        <>
            {/* Friends Button / Panel */}
            <div
                className="rounded-[1.5rem] shadow-lg overflow-hidden transition-all duration-300"
                style={{
                    backgroundColor: 'var(--theme-card-bg)',
                    border: '2px solid #22c55e'
                }}
            >
                {/* Header Button */}
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
                            style={{ backgroundColor: '#22c55e20' }}
                        >
                            👥
                        </div>
                        <div className="text-left">
                            <div className="font-bold text-[var(--theme-text)]">Friends</div>
                            <div className="text-xs text-[var(--theme-text-secondary)]">
                                {friends.length} friend{friends.length !== 1 ? 's' : ''}
                            </div>
                        </div>
                    </div>
                    <div
                        className="text-[#22c55e] font-bold transition-transform duration-300"
                        style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                    >
                        ▼
                    </div>
                </button>

                {/* Expanded Panel */}
                {isExpanded && (
                    <div className="border-t" style={{ borderColor: 'var(--theme-border)' }}>
                        <div className="flex border-b" style={{ borderColor: 'var(--theme-border)' }}>
                            <button
                                onClick={() => setActiveTab('friends')}
                                className={`flex-1 p-3 font-bold transition-colors ${activeTab === 'friends' ? 'text-white' : 'text-[var(--theme-text-secondary)]'}`}
                                style={{ backgroundColor: activeTab === 'friends' ? '#22c55e' : 'transparent' }}
                            >
                                Friends ({friends.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('requests')}
                                className={`flex-1 p-3 font-bold transition-colors ${activeTab === 'requests' ? 'text-white' : 'text-[var(--theme-text-secondary)]'}`}
                                style={{ backgroundColor: activeTab === 'requests' ? '#22c55e' : 'transparent' }}
                            >
                                Requests ({requests.length})
                            </button>
                        </div>

                        {/* Search Toggle (Only on Friends tab) */}
                        {activeTab === 'friends' && (
                            <button
                                onClick={() => setShowSearch(!showSearch)}
                                className="w-full p-3 flex items-center justify-center gap-2 font-bold transition-colors hover:bg-white/5"
                                style={{
                                    color: '#22c55e',
                                    borderBottom: '1px solid var(--theme-border)'
                                }}
                            >
                                {showSearch ? '✕ Close' : '➕ Add Friend'}
                            </button>
                        )}

                        {/* Search Input */}
                        {showSearch && (
                            <div className="p-4 border-b" style={{ borderColor: 'var(--theme-border)' }}>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                        placeholder="Enter username..."
                                        className="flex-1 px-4 py-2 rounded-xl border-2 font-medium"
                                        style={{
                                            backgroundColor: 'var(--theme-bg-secondary)',
                                            borderColor: 'var(--theme-border)',
                                            color: 'var(--theme-text)'
                                        }}
                                    />
                                    <button
                                        onClick={handleSearch}
                                        disabled={isSearching}
                                        className="px-4 py-2 rounded-xl font-bold transition-colors"
                                        style={{
                                            backgroundColor: '#22c55e',
                                            color: 'white'
                                        }}
                                    >
                                        {isSearching ? '...' : '🔍'}
                                    </button>
                                </div>
                                {searchError && (
                                    <div className="mt-2 text-sm text-red-500 font-medium">
                                        {searchError}
                                    </div>
                                )}
                                {/* Search Result Preview */}
                                {searchResult && (
                                    <button
                                        onClick={() => setSelectedFriend(searchResult)}
                                        className="mt-3 w-full p-3 rounded-xl flex items-center gap-3 transition-colors hover:bg-white/5"
                                        style={{ backgroundColor: 'var(--theme-highlight)' }}
                                    >
                                        <AvatarDisplay
                                            strokes={searchResult.avatarStrokes}
                                            avatar={searchResult.avatar}
                                            color={searchResult.color}
                                            backgroundColor={searchResult.backgroundColor}
                                            size={40}
                                        />
                                        <div className="flex-1 text-left">
                                            <div className="font-bold text-[var(--theme-text)]">
                                                {searchResult.username}
                                            </div>
                                            <div className="text-xs text-[var(--theme-text-secondary)]">
                                                Tap to view profile
                                            </div>
                                        </div>
                                        <div className="text-[var(--theme-text-secondary)]">→</div>
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Lists */}
                        <div className="max-h-[300px] overflow-y-auto">
                            {isLoading && (
                                <div className="p-6 text-center">
                                    <div className="text-2xl animate-pulse">⏳</div>
                                    <div className="text-sm text-[var(--theme-text-secondary)] mt-2">Loading...</div>
                                </div>
                            )}

                            {!isLoading && activeTab === 'requests' && (
                                requests.length === 0 ? (
                                    <div className="p-6 text-center">
                                        <div className="text-3xl mb-2">📭</div>
                                        <div className="text-sm text-[var(--theme-text-secondary)]">
                                            No pending requests
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-2 space-y-2">
                                        {requests.map((req) => (
                                            <div
                                                key={req.id}
                                                className="p-3 rounded-xl flex items-center justify-between"
                                                style={{ backgroundColor: 'var(--theme-highlight)' }}
                                            >
                                                <div className="font-bold text-[var(--theme-text)]">
                                                    {req.fromUsername}
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleAcceptRequest(req.id)}
                                                        className="px-3 py-1 rounded-lg bg-green-500 text-white font-bold text-sm hover:scale-105 transition-transform"
                                                    >
                                                        Accept
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeclineRequest(req.id)}
                                                        className="px-3 py-1 rounded-lg bg-red-500 text-white font-bold text-sm hover:scale-105 transition-transform"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )
                            )}

                            {!isLoading && activeTab === 'friends' && (
                                friends.length === 0 ? (
                                    <div className="p-6 text-center">
                                        <div className="text-3xl mb-2">🫂</div>
                                        <div className="text-sm text-[var(--theme-text-secondary)]">
                                            No friends yet<br />
                                            <span className="text-[#22c55e]">Add someone above!</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-2 space-y-2">
                                        {friends.map((friend) => {
                                            const tier = XPService.getTierForLevel(friend.xp ? Math.floor(friend.xp / 100) : 0);
                                            const activeBadge = friend.cosmetics?.activeBadge
                                                ? BadgeService.getBadgeInfo(friend.cosmetics.activeBadge)
                                                : null;
                                            const cardColor = friend.cosmetics?.activeCardColor;

                                            return (
                                                <button
                                                    key={friend.id}
                                                    onClick={() => handleFriendClick(friend)}
                                                    className="w-full p-3 rounded-xl flex items-center gap-3 relative overflow-hidden transition-all hover:scale-[1.02] active:scale-95 shadow-sm"
                                                    style={{
                                                        backgroundColor: 'var(--theme-highlight)',
                                                        borderLeft: cardColor ? `6px solid ${cardColor}` : `4px solid ${tier.color}`,
                                                        background: cardColor
                                                            ? `linear-gradient(90deg, ${cardColor}15, var(--theme-highlight) 60%)`
                                                            : 'var(--theme-highlight)'
                                                    }}
                                                >
                                                    <div className="relative z-10">
                                                        <AvatarDisplay
                                                            strokes={friend.avatarStrokes}
                                                            avatar={friend.avatar}
                                                            color={friend.color}
                                                            backgroundColor={friend.backgroundColor}
                                                            size={48}
                                                        />
                                                        {activeBadge && (
                                                            <span className="absolute -bottom-1 -right-1 text-lg drop-shadow-md">
                                                                {activeBadge.emoji}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 text-left min-w-0 z-10">
                                                        <div className="font-bold text-[var(--theme-text)] truncate flex items-center gap-2">
                                                            {friend.username}
                                                        </div>
                                                        <div className="flex items-center gap-1 mt-0.5">
                                                            <span
                                                                className="text-[10px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider opacity-80"
                                                                style={{
                                                                    backgroundColor: `${tier.color}20`,
                                                                    color: tier.color
                                                                }}
                                                            >
                                                                {tier.icon} Lvl {friend.xp ? Math.floor(friend.xp / 100) : 0}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="text-[var(--theme-text-secondary)] opacity-50 text-sm z-10">→</div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Profile Card Modal */}
            {selectedFriend && (
                <ProfileCardModal
                    user={selectedFriend}
                    onClose={handleCloseProfile}
                />
            )}
        </>
    );
};
