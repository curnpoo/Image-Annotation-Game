import React, { useState, useEffect } from 'react';
import { AvatarDisplay } from './AvatarDisplay';
import { ProfileCardModal } from './ProfileCardModal';
import { FriendsService } from '../../services/friendsService';
import { AuthService } from '../../services/auth';
import { XPService } from '../../services/xp';
import { BadgeService } from '../../services/badgeService';
import type { UserAccount, Player, FriendRequest } from '../../types';
import { vibrate } from '../../utils/haptics';

interface FriendsPanelProps {
    player: Player;
    openRequestsTrigger?: number;
    onJoinRoom?: (code: string) => void;
    className?: string;
    style?: React.CSSProperties;
}

export const FriendsPanel: React.FC<FriendsPanelProps> = ({ player: _player, onJoinRoom, className, style }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [friends, setFriends] = useState<UserAccount[]>([]);
    const [requests, setRequests] = useState<FriendRequest[]>([]);
    const [sentRequests, setSentRequests] = useState<(FriendRequest & { toUser?: UserAccount })[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const [activeTab, setActiveTab] = useState<'friends' | 'requests'>('friends');
    const [selectedFriend, setSelectedFriend] = useState<UserAccount | null>(null);
    const [showSearch, setShowSearch] = useState(false);
    const [browseMode, setBrowseMode] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<UserAccount[]>([]);
    const [allUsers, setAllUsers] = useState<UserAccount[]>([]);
    const [searchError, setSearchError] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [isLoadingBrowse, setIsLoadingBrowse] = useState(false);

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

    // Real-time subscription for friend requests (badge updates without refresh)
    useEffect(() => {
        const unsubscribe = FriendsService.subscribeToFriendRequests((updatedRequests) => {
            setRequests(updatedRequests);
        });

        return () => unsubscribe();
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
        if (!searchQuery.trim() && !browseMode) return;

        setIsSearching(true);
        setSearchError('');
        setSearchResults([]);
        vibrate();

        if (browseMode && !searchQuery.trim()) {
            // Browse mode without search - show all users
            const users = allUsers.filter(u => u.id !== currentUser?.id);
            setSearchResults(users);
        } else {
            // Search mode - search by username
            const users = await FriendsService.searchUsers(searchQuery.trim());
            const filtered = users.filter(u => u.id !== currentUser?.id);

            if (filtered.length > 0) {
                setSearchResults(filtered);
                vibrate();
            } else {
                setSearchError('No users found');
                vibrate();
            }
        }

        setIsSearching(false);
    };

    const handleBrowseToggle = async () => {
        vibrate();
        const newBrowseMode = !browseMode;
        setBrowseMode(newBrowseMode);

        if (newBrowseMode && allUsers.length === 0) {
            setIsLoadingBrowse(true);
            const users = await FriendsService.getAllUsers();
            setAllUsers(users);
            setSearchResults(users.filter(u => u.id !== currentUser?.id));
            setIsLoadingBrowse(false);
        } else if (newBrowseMode) {
            setSearchResults(allUsers.filter(u => u.id !== currentUser?.id));
        } else {
            setSearchResults([]);
            setSearchQuery('');
        }
    };

    const currentUser = AuthService.getCurrentUser();

    const handleFriendClick = (friend: UserAccount) => {
        vibrate();
        setSelectedFriend(friend);
    };

    const handleCloseProfile = () => {
        setSelectedFriend(null);
        // Only clear search results if not in browse mode
        if (!browseMode) {
            setSearchResults([]);
        }
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
            {/* Friends Trigger Card */}
            <button
                onClick={() => {
                    vibrate();
                    setIsExpanded(true);
                }}
                className={`flex flex-col items-center justify-center p-4 relative group rounded-[2.5rem] transition-all duration-300 backdrop-blur-md bg-black/70 border border-white/10 ${className || ''}`}
                style={{
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
                    ...style
                }}
            >
                <div className="absolute inset-0 bg-green-500/5 group-hover:bg-green-500/10 transition-colors rounded-[2.5rem]" />

                <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-inner mb-2 group-hover:scale-110 transition-transform bg-green-500/20 border border-green-500/30 text-green-400">
                    👥
                </div>

                <div className="text-center">
                    <div className="font-black text-white text-2xl tracking-tight">FRIENDS</div>
                    <div className="text-[10px] font-bold text-green-400/80 uppercase tracking-[0.2em] bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20 mt-1">
                        {friends.length} Online
                    </div>
                </div>

                {/* Notification Badge for Pending Requests */}
                {requests.length > 0 && (
                    <div className="absolute -top-1 -right-1 min-w-6 h-6 rounded-full bg-red-500 flex items-center justify-center text-white text-xs font-black shadow-lg shadow-red-500/50 animate-pulse border-2 border-black/50 z-10">
                        {requests.length}
                    </div>
                )}

                {/* Refreshing indicator */}
                {isRefreshing && (
                    <div className="absolute top-3 right-3">
                        <div className="w-3 h-3 rounded-full border-2 border-green-500 border-t-transparent animate-spin" />
                    </div>
                )}
            </button>

            {/* Friends Modal Overlay */}
            {isExpanded && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                        onClick={() => setIsExpanded(false)}
                    />

                    <div className="w-full max-w-lg bg-[#1a1a1a] border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] relative z-10">
                        {/* Modal Header */}
                        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/5">
                            <h2 className="text-xl font-black text-white flex items-center gap-2">
                                👥 Friends
                                <span className="text-base font-bold text-white/30 bg-white/10 px-2 py-0.5 rounded-lg">
                                    {friends.length}
                                </span>
                            </h2>
                            <button
                                onClick={() => setIsExpanded(false)}
                                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/50 hover:bg-white/20 active:scale-95 transition-all"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Flex Column for Content */}
                        <div className="flex-1 overflow-hidden flex flex-col bg-black/20">
                            {/* Tabs */}
                            <div className="p-3 pb-0">
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
                                        Friends
                                    </button>
                                    <button
                                        onClick={() => {
                                            vibrate();
                                            setActiveTab('requests');
                                        }}
                                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-bold transition-all duration-300 relative ${activeTab === 'requests'
                                            ? 'bg-white/10 text-white shadow-lg border border-white/10'
                                            : 'text-white/40 hover:text-white/70'}`}
                                    >
                                        Requests
                                        {requests.length > 0 && (
                                            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Search Toggle */}
                            {activeTab === 'friends' && (
                                <div className="px-3 pt-3 space-y-2">
                                    <button
                                        onClick={() => {
                                            vibrate();
                                            setShowSearch(!showSearch);
                                            if (showSearch) {
                                                setBrowseMode(false);
                                                setSearchResults([]);
                                                setSearchQuery('');
                                            }
                                        }}
                                        className={`w-full py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 font-bold transition-all border ${showSearch
                                            ? 'bg-white/5 border-white/10 text-white/70'
                                            : 'bg-green-500/10 border-green-500/20 text-green-400 hover:bg-green-500/20'}`}
                                    >
                                        {showSearch ? '✕ Close Search' : '➕ Add Friend'}
                                    </button>

                                    {/* Browse Mode Toggle */}
                                    {showSearch && (
                                        <button
                                            onClick={handleBrowseToggle}
                                            disabled={isLoadingBrowse}
                                            className={`w-full py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 font-bold transition-all border ${browseMode
                                                ? 'bg-purple-500/20 border-purple-500/30 text-purple-300'
                                                : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'}`}
                                        >
                                            {isLoadingBrowse ? '⏳ Loading...' : browseMode ? '🔍 Switch to Search' : '👥 Browse All Players'}
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Search Area */}
                            {showSearch && (
                                <div className="p-3">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => {
                                                setSearchQuery(e.target.value);
                                                setSearchError('');
                                            }}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                            placeholder={browseMode ? "Filter players..." : "Search by username..."}
                                            className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-green-500/50 focus:outline-none font-bold text-white placeholder-white/20"
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

                                    {/* Search Results List */}
                                    {searchResults.length > 0 && (
                                        <div className="mt-3 space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                                            <div className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2 px-2">
                                                {browseMode ? `${searchResults.length} Players` : `${searchResults.length} Result${searchResults.length !== 1 ? 's' : ''}`}
                                            </div>
                                            {searchResults.map((user) => (
                                                <button
                                                    key={user.id}
                                                    onClick={() => handleFriendClick(user)}
                                                    className="w-full p-3 rounded-xl flex items-center gap-3 transition-colors bg-white/10 hover:bg-white/20 border border-white/10"
                                                >
                                                    <AvatarDisplay
                                                        strokes={user.avatarStrokes}
                                                        avatar={user.avatar}
                                                        color={user.color}
                                                        backgroundColor={user.backgroundColor}
                                                        size={40}
                                                    />
                                                    <div className="flex-1 text-left">
                                                        <div className="font-bold text-white text-base">
                                                            @{user.username}
                                                        </div>
                                                        <div className="text-xs text-white/50 font-bold uppercase tracking-wider">
                                                            Tap to view
                                                        </div>
                                                    </div>
                                                    <div className="text-white/30 text-xl">→</div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Lists Content */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 touch-pan-y">
                                {isLoading && !friends.length ? (
                                    <div className="p-10 text-center text-white/30">
                                        <div className="text-3xl animate-pulse mb-3">⏳</div>
                                        <div className="text-xs font-bold uppercase tracking-widest">Loading...</div>
                                    </div>
                                ) : (
                                    <>
                                        {activeTab === 'requests' && (
                                            requests.length === 0 && sentRequests.length === 0 ? (
                                                <div className="p-10 text-center opacity-50">
                                                    <div className="text-4xl mb-3 grayscale">📭</div>
                                                    <div className="text-sm font-bold text-white/40">No pending requests</div>
                                                </div>
                                            ) : (
                                                <div className="space-y-4">
                                                    {/* Incoming Requests */}
                                                    {requests.length > 0 && (
                                                        <div>
                                                            <div className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2 px-2">
                                                                Received
                                                            </div>
                                                            <div className="space-y-2">
                                                                {requests.map((req) => (
                                                                    <div key={req.id} className="p-3 rounded-2xl flex items-center justify-between border border-white/10 bg-white/5">
                                                                        <div className="font-bold text-white px-2">
                                                                            {req.fromUsername}
                                                                        </div>
                                                                        <div className="flex gap-2">
                                                                            <button onClick={() => handleAcceptRequest(req.id)} className="px-4 py-2 rounded-xl bg-green-500 text-white font-bold text-xs uppercase shadow-lg shadow-green-500/20 active:scale-95">Accept</button>
                                                                            <button onClick={() => handleDeclineRequest(req.id)} className="w-8 h-8 rounded-xl bg-white/10 text-white/50 hover:bg-red-500/20 active:scale-95">✕</button>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                    {/* Sent Requests */}
                                                    {sentRequests.length > 0 && (
                                                        <div>
                                                            <div className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2 px-2">
                                                                Sent
                                                            </div>
                                                            <div className="space-y-2">
                                                                {sentRequests.map((req) => (
                                                                    <div key={req.id} className="p-3 rounded-2xl flex items-center justify-between opacity-60 border border-white/5 bg-white/5">
                                                                        <div className="flex items-center gap-3">
                                                                            {req.toUser && <AvatarDisplay strokes={req.toUser.avatarStrokes} avatar={req.toUser.avatar} color={req.toUser.color} backgroundColor={req.toUser.backgroundColor} size={36} />}
                                                                            <div>
                                                                                <div className="font-bold text-white text-sm">{req.toUser?.username || 'Unknown'}</div>
                                                                                <div className="text-[10px] font-bold text-white/40 uppercase">Pending</div>
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
                                                <div className="p-10 text-center">
                                                    <div className="text-4xl mb-3 grayscale opacity-50">🫂</div>
                                                    <div className="text-sm font-bold text-white/40">No friends yet</div>
                                                </div>
                                            ) : (
                                                <div className="space-y-2">
                                                    {friends.map((friend) => {
                                                        const level = XPService.getLevelFromXP(friend.xp || 0);
                                                        const tier = XPService.getTierForLevel(level);
                                                        const activeBadge = (level >= 5 && friend.cosmetics?.activeBadge) ? BadgeService.getBadgeInfo(friend.cosmetics.activeBadge) : null;
                                                        const cardColor = friend.cosmetics?.activeCardColor;

                                                        return (
                                                            <button
                                                                key={friend.id}
                                                                onClick={() => handleFriendClick(friend)}
                                                                className="w-full p-3 rounded-2xl flex items-center gap-3 relative overflow-hidden transition-all hover:scale-[1.02] active:scale-95 border border-white/5 bg-white/5 hover:bg-white/10 group"
                                                                style={{
                                                                    borderLeft: cardColor ? `4px solid ${cardColor}` : `4px solid ${tier.color}`,
                                                                    background: cardColor ? `linear-gradient(90deg, ${cardColor}10, rgba(255, 255, 255, 0.02) 100%)` : undefined
                                                                }}
                                                            >
                                                                <div className="relative z-10">
                                                                    <AvatarDisplay strokes={friend.avatarStrokes} avatar={friend.avatar} color={friend.color} backgroundColor={friend.backgroundColor} size={48} />
                                                                    {activeBadge && <span className="absolute -bottom-1 -right-1 text-lg drop-shadow-md">{activeBadge.emoji}</span>}
                                                                </div>
                                                                <div className="flex-1 text-left min-w-0 z-10">
                                                                    <div className="font-black text-white truncate text-base">{friend.username}</div>
                                                                    <div className="flex items-center gap-1 mt-1">
                                                                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest opacity-70" style={{ backgroundColor: `${tier.color}20`, color: tier.color }}>{tier.name}</span>
                                                                        {friend.currentRoomCode && (
                                                                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest bg-green-500/10 text-green-400 flex items-center gap-1 border border-green-500/20">
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
                    </div>
                </div>
            )}

            {/* Profile Card Modal Overlay (Kept separate to stack on top if needed, though usually replaces) */}
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
