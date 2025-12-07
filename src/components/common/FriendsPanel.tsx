import React, { useState, useEffect } from 'react';
import { AvatarDisplay } from './AvatarDisplay';
import { ProfileCardModal } from './ProfileCardModal';
import { FriendsService } from '../../services/friendsService';
import { XPService } from '../../services/xp';
import { BadgeService } from '../../services/badgeService';
import type { UserAccount, Player, FriendRequest } from '../../types';
import { vibrate } from '../../utils/haptics';

interface FriendsPanelProps {
    player: Player;
    openRequestsTrigger?: number;
    onJoinRoom?: (code: string) => void;
}

export const FriendsPanel: React.FC<FriendsPanelProps> = ({ player: _player, onJoinRoom }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [friends, setFriends] = useState<UserAccount[]>([]);
    const [requests, setRequests] = useState<FriendRequest[]>([]);
    const [sentRequests, setSentRequests] = useState<(FriendRequest & { toUser?: UserAccount })[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const [activeTab, setActiveTab] = useState<'friends' | 'requests'>('friends');
    const [selectedFriend, setSelectedFriend] = useState<UserAccount | null>(null);
    const [showSearch, setShowSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResult, setSearchResult] = useState<UserAccount | null>(null);
    const [searchError, setSearchError] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    const loadData = async (isInitial = false) => {
        if (isInitial) setIsLoading(true);
        else setIsRefreshing(true);

        try {
            const [friendsList, requestsList, sentList] = await Promise.all([
                FriendsService.getFriends(),
                FriendsService.getFriendRequests(),
                FriendsService.getSentFriendRequests()
            ]);
            setFriends(friendsList);
            setRequests(requestsList);
            setSentRequests(sentList);
        } catch (err) {
            console.error('Failed to load friends data:', err);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        loadData(true);
    }, []);

    useEffect(() => {
        let unsubscribe: (() => void) | undefined;

        if (isExpanded) {
            setIsRefreshing(true);
            // Subscribe to friends updates
            unsubscribe = FriendsService.subscribeToFriends((updatedFriends) => {
                setFriends(updatedFriends);
                setIsRefreshing(false);
            });

            // Also fetch requests regularly (or just once on expand)
            // For now, we'll just fetch requests once when expanded
            FriendsService.getFriendRequests().then(setRequests);
            FriendsService.getSentFriendRequests().then(setSentRequests);
        } else {
            // Unsubscribe when collapsed
            if (unsubscribe) {
                unsubscribe();
                unsubscribe = undefined;
            }
        }

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [isExpanded]);

    // Update selected friend when friends list changes
    useEffect(() => {
        if (selectedFriend) {
            const updatedFriend = friends.find(f => f.id === selectedFriend.id);
            if (updatedFriend) {
                // Only update if there are changes to avoid potential loop (though object identity check helps)
                if (JSON.stringify(updatedFriend) !== JSON.stringify(selectedFriend)) {
                    setSelectedFriend(updatedFriend);
                }
            }
        }
    }, [friends, selectedFriend]);

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;

        setIsSearching(true);
        setSearchError('');
        setSearchResult(null);
        vibrate();

        const user = await FriendsService.searchUserByUsername(searchQuery.trim());

        if (user) {
            setSearchResult(user);
            vibrate();
        } else {
            setSearchError('User not found');
            vibrate();
        }

        setIsSearching(false);
    };

    const handleFriendClick = (friend: UserAccount) => {
        vibrate();
        setSelectedFriend(friend);
    };

    const handleCloseProfile = () => {
        setSelectedFriend(null);
        setSearchResult(null);
        loadData(false);
    };

    const handleAcceptRequest = async (requestId: string) => {
        vibrate();
        await FriendsService.acceptFriendRequest(requestId);
        loadData(false);
    };

    const handleDeclineRequest = async (requestId: string) => {
        vibrate();
        await FriendsService.declineFriendRequest(requestId);
        loadData(false);
    };

    return (
        <>
            {/* Friends Button / Panel */}
            <div
                className="rounded-3xl shadow-2xl overflow-hidden transition-all duration-300 backdrop-blur-xl bg-black/60 border border-white/10"
                style={{
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)'
                }}
            >
                {/* Header Button */}
                <button
                    onClick={() => {
                        vibrate();
                        setIsExpanded(!isExpanded);
                    }}
                    className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors group"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl shadow-inner group-hover:scale-110 transition-transform bg-green-500/20 border border-green-500/30 text-green-400">
                            👥
                        </div>
                        <div className="text-left">
                            <div className="font-bold text-white">Friends</div>
                            <div className="text-xs text-white/50 font-medium">
                                {friends.length} friend{friends.length !== 1 ? 's' : ''}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {isRefreshing && (
                            <div className="w-3 h-3 rounded-full border-2 border-green-500 border-t-transparent animate-spin" />
                        )}
                        <div
                            className="text-green-400 font-black transition-transform duration-300 opacity-80 group-hover:opacity-100"
                            style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                        >
                            ▼
                        </div>
                    </div>
                </button>

                {/* Expanded Panel */}
                {isExpanded && (
                    <div className="border-t border-white/10 animate-in slide-in-from-top-2 duration-200">
                        {/* Segment Controller Tabs */}
                        <div className="p-3">
                            <div className="flex p-1 bg-black/40 rounded-xl border border-white/10">
                                <button
                                    onClick={() => {
                                        vibrate();
                                        setActiveTab('friends');
                                    }}
                                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-bold transition-all duration-300 ${activeTab === 'friends'
                                        ? 'bg-white/10 text-white shadow-lg border border-white/10'
                                        : 'text-white/40 hover:text-white/70'}`}
                                >
                                    Friends ({friends.length})
                                </button>
                                <button
                                    onClick={() => {
                                        vibrate();
                                        setActiveTab('requests');
                                    }}
                                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-bold transition-all duration-300 ${activeTab === 'requests'
                                        ? 'bg-white/10 text-white shadow-lg border border-white/10'
                                        : 'text-white/40 hover:text-white/70'}`}
                                >
                                    Requests ({requests.length})
                                </button>
                            </div>
                        </div>

                        {/* Search Toggle (Only on Friends tab) */}
                        {activeTab === 'friends' && (
                            <div className="px-3 pb-3">
                                <button
                                    onClick={() => {
                                        vibrate();
                                        setShowSearch(!showSearch);
                                    }}
                                    className={`w-full py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 font-bold transition-all border ${showSearch
                                        ? 'bg-white/5 border-white/10 text-white/70'
                                        : 'bg-green-500/20 border-green-500/30 text-green-400 hover:bg-green-500/30'}`}
                                >
                                    {showSearch ? '✕ Close Search' : '➕ Add Friend'}
                                </button>
                            </div>
                        )}

                        {/* Search Input */}
                        {showSearch && (
                            <div className="p-4 border-b border-white/10 animate-in fade-in slide-in-from-top-2 bg-black/20">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                        placeholder="Enter username..."
                                        className="flex-1 px-4 py-2 rounded-xl bg-white/5 border border-white/10 focus:border-green-500/50 focus:outline-none font-bold text-white placeholder-white/20"
                                        autoFocus
                                    />
                                    <button
                                        onClick={handleSearch}
                                        disabled={isSearching}
                                        className="px-4 py-2 rounded-xl font-bold transition-colors bg-green-500 text-white disabled:opacity-50 shadow-lg shadow-green-500/20"
                                    >
                                        {isSearching ? '...' : '🔍'}
                                    </button>
                                </div>
                                {searchError && (
                                    <div className="mt-2 text-sm text-red-400 font-bold px-1 animate-pulse">
                                        ❌ {searchError}
                                    </div>
                                )}
                                {/* Search Result Preview */}
                                {searchResult && (
                                    <button
                                        onClick={() => handleFriendClick(searchResult)}
                                        className="mt-3 w-full p-3 rounded-xl flex items-center gap-3 transition-colors bg-white/10 hover:bg-white/20 border border-white/10 animate-in fade-in"
                                    >
                                        <AvatarDisplay
                                            strokes={searchResult.avatarStrokes}
                                            avatar={searchResult.avatar}
                                            color={searchResult.color}
                                            backgroundColor={searchResult.backgroundColor}
                                            size={40}
                                        />
                                        <div className="flex-1 text-left">
                                            <div className="font-bold text-white text-lg">
                                                {searchResult.username}
                                            </div>
                                            <div className="text-xs text-white/50 font-bold uppercase tracking-wider">
                                                Tap to view
                                            </div>
                                        </div>
                                        <div className="text-white/30 text-xl">→</div>
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Lists */}
                        <div className="max-h-[300px] overflow-y-auto custom-scrollbar bg-black/20">
                            {isLoading && !friends.length ? (
                                <div className="p-6 text-center">
                                    <div className="text-2xl animate-pulse mb-2">⏳</div>
                                    <div className="text-xs font-bold uppercase tracking-widest text-white/30">Loading...</div>
                                </div>
                            ) : (
                                <>
                                    {activeTab === 'requests' && (
                                        requests.length === 0 && sentRequests.length === 0 ? (
                                            <div className="p-8 text-center animate-in fade-in">
                                                <div className="text-4xl mb-3 grayscale opacity-50">📭</div>
                                                <div className="text-sm font-medium text-white/40">
                                                    No pending requests
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="p-3 space-y-4 animate-in fade-in">
                                                {requests.length > 0 && (
                                                    <div>
                                                        <div className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2 px-2">
                                                            Received
                                                        </div>
                                                        <div className="space-y-2">
                                                            {requests.map((req) => (
                                                                <div
                                                                    key={req.id}
                                                                    className="p-3 rounded-2xl flex items-center justify-between border border-white/10 bg-white/5 active:scale-[0.98] transition-all"
                                                                >
                                                                    <div className="font-bold text-white px-2">
                                                                        {req.fromUsername}
                                                                    </div>
                                                                    <div className="flex gap-2">
                                                                        <button
                                                                            onClick={() => handleAcceptRequest(req.id)}
                                                                            className="px-4 py-2 rounded-xl bg-green-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-green-500/20 active:scale-95 transition-transform"
                                                                        >
                                                                            Accept
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleDeclineRequest(req.id)}
                                                                            className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/10 text-white/50 hover:bg-red-500/20 hover:text-red-400 active:scale-95 transition-all text-sm font-bold"
                                                                        >
                                                                            ✕
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {sentRequests.length > 0 && (
                                                    <div>
                                                        <div className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2 px-2">
                                                            Sent
                                                        </div>
                                                        <div className="space-y-2">
                                                            {sentRequests.map((req) => (
                                                                <div
                                                                    key={req.id}
                                                                    className="p-3 rounded-2xl flex items-center justify-between opacity-60 border border-white/5 bg-white/5"
                                                                >
                                                                    <div className="flex items-center gap-3">
                                                                        {req.toUser && (
                                                                            <AvatarDisplay
                                                                                strokes={req.toUser.avatarStrokes}
                                                                                avatar={req.toUser.avatar}
                                                                                color={req.toUser.color}
                                                                                backgroundColor={req.toUser.backgroundColor}
                                                                                size={36}
                                                                            />
                                                                        )}
                                                                        <div>
                                                                            <div className="font-bold text-white text-sm">
                                                                                {req.toUser?.username || 'Unknown User'}
                                                                            </div>
                                                                            <div className="text-[10px] font-bold text-white/40 uppercase tracking-wider">
                                                                                Pending
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    )}

                                    {activeTab === 'friends' && (
                                        friends.length === 0 ? (
                                            <div className="p-8 text-center animate-in fade-in">
                                                <div className="text-4xl mb-3 grayscale opacity-50">🫂</div>
                                                <div className="text-sm font-medium text-white/40">
                                                    No friends yet<br />
                                                    <span className="text-green-400 font-bold mt-1 block">Add someone above!</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="p-2 space-y-2 animate-in fade-in">
                                                {friends.map((friend) => {
                                                    const level = XPService.getLevelFromXP(friend.xp || 0);
                                                    const tier = XPService.getTierForLevel(level);

                                                    // Only show badge if level >= 5
                                                    const activeBadge = (level >= 5 && friend.cosmetics?.activeBadge)
                                                        ? BadgeService.getBadgeInfo(friend.cosmetics.activeBadge)
                                                        : null;

                                                    const cardColor = friend.cosmetics?.activeCardColor;

                                                    return (
                                                        <button
                                                            key={friend.id}
                                                            onClick={() => handleFriendClick(friend)}
                                                            className="w-full p-3 rounded-2xl flex items-center gap-3 relative overflow-hidden transition-all hover:scale-[1.02] active:scale-95 border border-white/5 bg-white/5 hover:bg-white/10 group"
                                                            style={{
                                                                borderLeft: cardColor ? `4px solid ${cardColor}` : `4px solid ${tier.color}`,
                                                                background: cardColor
                                                                    ? `linear-gradient(90deg, ${cardColor}10, rgba(255, 255, 255, 0.02) 100%)`
                                                                    : undefined
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
                                                                    <span className="absolute -bottom-1 -right-1 text-lg drop-shadow-md filter grayscale-[0.3] group-hover:grayscale-0 transition-all">
                                                                        {activeBadge.emoji}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="flex-1 text-left min-w-0 z-10">
                                                                <div className="font-black text-white truncate text-base tracking-tight group-hover:tracking-normal transition-all">
                                                                    {friend.username}
                                                                </div>
                                                                <div className="flex items-center gap-1 mt-1">
                                                                    <span
                                                                        className="text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest opacity-70"
                                                                        style={{
                                                                            backgroundColor: `${tier.color}20`,
                                                                            color: tier.color
                                                                        }}
                                                                    >
                                                                        {tier.name}
                                                                    </span>
                                                                    {friend.currentRoomCode && (
                                                                        <span
                                                                            className="text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest bg-green-500/10 text-green-400 flex items-center gap-1 border border-green-500/20"
                                                                        >
                                                                            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                                                                            Playing
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="text-white/20 text-xl group-hover:text-white/50 transition-colors z-10">→</div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )
                                    )}
                                </>
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
                    onJoin={onJoinRoom}
                />
            )}
        </>
    );
};
