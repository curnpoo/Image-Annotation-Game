import React, { useState, useEffect } from 'react';
import type { GameRoom, GameSettings } from '../../types';
import { SettingsModal } from '../common/SettingsModal';
import { GameSettingsPanel } from '../game/GameSettingsPanel';
import { AvatarDisplay } from '../common/AvatarDisplay';
import { ShareDropdown } from '../common/ShareDropdown';
import { InviteFriendsModal } from '../common/InviteFriendsModal';
import { StorageService } from '../../services/storage';
import { usePresence } from '../../hooks/usePresence';
import { XPService } from '../../services/xp';
import { BadgeService } from '../../services/badgeService';
import { formatCurrency } from '../../services/currency';

interface LobbyScreenProps {
    room: GameRoom;
    currentPlayerId: string;
    onStartGame: () => void;
    onSettingsChange: (settings: Partial<GameSettings>) => void;
    onLeave: () => void;
    onKick: (playerId: string) => void;
    onJoinGame: () => void;
    onBack: () => void;

}

export const LobbyScreen: React.FC<LobbyScreenProps> = ({
    room,
    currentPlayerId,
    onStartGame,
    // onSettingsChange, // Currently unused, but kept in interface for future use
    onKick,
    onJoinGame,
    onBack,
    onLeave
}) => {
    const [showSettings, setShowSettings] = useState(false);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [, setTick] = useState(0); // Force update for idle timer
    const [kickTarget, setKickTarget] = useState<string | null>(null); // Player being kicked

    // Theme Support
    // const currentUser = AuthService.getCurrentUser();
    // const activeTheme = currentUser?.cosmetics?.activeTheme || 'default';

    const { presence } = usePresence(room?.roomCode || null);

    useEffect(() => {
        // Force update every second to check idle status
        const interval = setInterval(() => setTick(t => t + 1), 1000);
        return () => clearInterval(interval);
    }, []);

    if (!room || !room.players) {
        return <div>Error: Invalid room data</div>;
    }

    const isHost = room.hostId === currentPlayerId;
    const currentPlayer = room.players.find(p => p.id === currentPlayerId);

    const isIdle = (playerId: string) => {
        const lastSeen = presence[playerId];
        if (!lastSeen) return true;
        return Date.now() - lastSeen > 10000; // 10 seconds
    };

    // If somehow we are in LobbyScreen but the game is active, show Rejoin
    if (room.status !== 'lobby') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4"
                style={{ backgroundColor: 'var(--theme-bg-primary)' }}>
                <div className="rounded-[2rem] p-8 shadow-2xl text-center max-w-md w-full"
                    style={{
                        backgroundColor: 'var(--theme-card-bg)',
                        border: '2px solid var(--theme-border)'
                    }}>
                    <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--theme-text)' }}>Game in Progress!</h2>
                    <p className="mb-6 font-medium" style={{ color: 'var(--theme-text-secondary)' }}>
                        The game is currently in the <strong style={{ color: 'var(--theme-accent)' }}>{room.status}</strong> phase.
                    </p>
                    <button
                        onClick={onJoinGame}
                        className="w-full text-white font-bold py-4 rounded-xl shadow-lg hover:scale-105 transition-transform"
                        style={{
                            backgroundColor: 'var(--theme-accent)'
                        }}
                    >
                        🚀 Rejoin Game
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col pb-safe overflow-y-auto px-4"
            style={{ paddingTop: 'max(1rem, env(safe-area-inset-top) + 0.5rem)' }}>

            <div className="w-full max-w-md mx-auto space-y-4 pb-8">
                {/* Top Navigation Bar */}
                <div className="flex justify-between gap-4">
                    <button
                        onClick={onBack}
                        className="flex-1 bg-white p-4 rounded-2xl border-2 border-white/10 hover:bg-white/10 transition-all flex flex-col items-center justify-center gap-1 shadow-lg"
                        style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-card-bg)' }}
                    >
                        <span className="text-2xl">🏠</span>
                        <span className="font-bold text-sm text-[var(--theme-text)]">Home</span>
                    </button>
                    <button
                        onClick={() => setShowSettings(true)}
                        className="flex-1 bg-white p-4 rounded-2xl border-2 border-white/10 hover:bg-white/10 transition-all flex flex-col items-center justify-center gap-1 shadow-lg"
                        style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-card-bg)' }}
                    >
                        <span className="text-2xl">⚙️</span>
                        <span className="font-bold text-sm text-[var(--theme-text)]">Settings</span>
                    </button>
                </div>

                {/* Room Code Card */}
                <div className="p-6 rounded-[2rem] shadow-xl relative"
                    style={{
                        backgroundColor: 'var(--theme-card-bg)',
                        border: '2px solid var(--theme-border)',
                        zIndex: 20
                    }}>
                    <div className="flex justify-between items-stretch gap-4">
                        <div>
                            <div className="text-[10px] font-bold tracking-widest opacity-60 mb-0 leading-none text-[var(--theme-text-secondary)]">ROOM CODE</div>
                            <div className="text-6xl font-black tracking-widest drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] bg-gradient-to-r from-lime-400 via-cyan-400 to-purple-500 bg-clip-text text-transparent">
                                {room.roomCode}
                            </div>
                        </div>
                        <ShareDropdown
                            roomCode={room.roomCode}
                            className="flex-shrink-0"
                            buttonClassName="w-12 h-12 flex items-center justify-center text-2xl rounded-xl border-2 transition-colors"
                            buttonStyle={{
                                backgroundColor: 'var(--theme-button-bg)',
                                borderColor: 'var(--theme-border)',
                                color: 'var(--theme-button-text)'
                            }}
                        />
                        <button
                            onClick={() => setShowInviteModal(true)}
                            className="w-12 h-12 flex items-center justify-center text-2xl rounded-xl border-2 transition-all hover:scale-105 active:scale-95"
                            style={{
                                backgroundColor: '#6366f1',
                                borderColor: '#4f46e5',
                                color: 'white'
                            }}
                            title="Invite Friends"
                        >
                            📨
                        </button>
                    </div>
                </div>

                {/* Game Settings - Host Only */}
                {isHost && (
                    <GameSettingsPanel
                        settings={room.settings}
                        onSettingsChange={(settings) => StorageService.updateSettings(room.roomCode, settings)}
                        isHost={isHost}
                    />
                )}

                {/* Players Card */}
                <div className="p-6 rounded-[2rem] shadow-xl min-h-[300px] flex flex-col"
                    style={{
                        backgroundColor: 'var(--theme-card-bg)',
                        border: '2px solid var(--theme-border)'
                    }}>
                    <div className="flex items-center gap-3 mb-6">
                        <h3 className="text-2xl font-bold text-[var(--theme-text)]">👥 Players</h3>
                        <span className="bg-white/10 px-3 py-1 rounded-full text-sm font-bold text-[var(--theme-text-secondary)]">
                            {room.players.length}
                        </span>
                    </div>

                    <div className="space-y-3 flex-1 overflow-y-auto max-h-[400px]">
                        {Array.isArray(room.players) && room.players.map((p) => {
                            const tier = XPService.getTierForLevel(p.level || 0);
                            const activeBadgeInfo = p.cosmetics?.activeBadge ? BadgeService.getBadgeInfo(p.cosmetics.activeBadge) : null;
                            const cardColor = p.cosmetics?.activeCardColor;

                            return (
                                <div key={p.id}
                                    className="flex items-center justify-between p-4 rounded-2xl mb-3 relative overflow-hidden transition-all shadow-sm"
                                    style={{
                                        backgroundColor: 'var(--theme-highlight)',
                                        borderLeft: cardColor ? `8px solid ${cardColor}` : 'none',
                                        background: cardColor ? `linear-gradient(90deg, ${cardColor}22, var(--theme-highlight) 30%)` : 'var(--theme-highlight)'
                                    }}>
                                    <div className="flex items-center gap-4 relative z-10">
                                        <div className="relative">
                                            <AvatarDisplay
                                                strokes={p.avatarStrokes}
                                                avatar={p.avatar}
                                                // frame={p.frame}
                                                color={p.color}
                                                size={56}
                                            />
                                            {p.id === room.hostId && (
                                                <span className="absolute -top-2 -right-2 text-xl filter drop-shadow-md">👑</span>
                                            )}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <div className="font-bold text-lg text-[var(--theme-text)] leading-tight">{p.name}</div>
                                                {/* Badge */}
                                                {activeBadgeInfo && (
                                                    <span title={activeBadgeInfo.name} className="text-xl drop-shadow-md cursor-help">
                                                        {activeBadgeInfo.emoji}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-2 mt-0.5">
                                                {/* Dynamic Stat Display */}
                                                {(p.cosmetics?.activeStat === 'wins' && p.stats) ? (
                                                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-black/5 dark:bg-white/10" title="Games Won">
                                                        <span className="text-xs">🏆</span>
                                                        <span className="text-[10px] font-black opacity-70 uppercase">{p.stats.gamesWon} Wins</span>
                                                    </div>
                                                ) : (p.cosmetics?.activeStat === 'earnings' && p.stats) ? (
                                                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-black/5 dark:bg-white/10" title="Total Earnings">
                                                        <span className="text-xs">💰</span>
                                                        <span className="text-[10px] font-black opacity-70 uppercase">{formatCurrency(p.stats.totalCurrencyEarned)}</span>
                                                    </div>
                                                ) : (p.cosmetics?.activeStat === 'none') ? (
                                                    null
                                                ) : (
                                                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-black/5 dark:bg-white/10" title={tier.name}>
                                                        <span className="text-xs">{tier.icon}</span>
                                                        <span className="text-[10px] font-black opacity-70 uppercase">Lvl {p.level || 0}</span>
                                                    </div>
                                                )}

                                                {p.id === currentPlayerId && (
                                                    <div className="text-[10px] font-bold tracking-wider opacity-60 text-[var(--theme-text)]">YOU</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 relative z-10">
                                        <div className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest ${isIdle(p.id) ? 'opacity-50' : ''
                                            }`}
                                            style={{ backgroundColor: '#D97706', color: '#3E2723' }}>
                                            {room.playerStates && room.playerStates[p.id]?.status === 'ready'
                                                ? 'READY!'
                                                : isIdle(p.id)
                                                    ? 'AWAY...'
                                                    : 'WAITING...'}
                                        </div>
                                        {isHost && p.id !== currentPlayerId && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setKickTarget(p.id);
                                                }}
                                                className="bg-red-100 text-red-500 w-7 h-7 rounded-full hover:bg-red-500 hover:text-white transition-colors flex items-center justify-center text-sm"
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <button
                        onClick={onLeave}
                        className="w-full mt-6 font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95"
                        style={{
                            backgroundColor: '#FF0000',
                            color: 'white',
                            boxShadow: '0 4px 0 #990000'
                        }}
                    >
                        <span className="text-lg">🚪</span> Leave Room
                    </button>
                </div>

                {/* Footer Status Card */}
                {isHost ? (
                    <button
                        onClick={onStartGame}
                        disabled={room.players.length < 2}
                        className={`w-full p-6 rounded-[2rem] text-center shadow-xl transition-all ${room.players.length < 2 ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02]'
                            }`}
                        style={{
                            backgroundColor: 'var(--theme-card-bg)',
                            border: '2px solid var(--theme-border)'
                        }}
                    >
                        <div className="text-4xl mb-2">🚀</div>
                        <h3 className="text-xl font-bold text-[var(--theme-text)]">
                            {room.players.length < 2 ? 'Waiting for players...' : 'Start Game!'}
                        </h3>
                    </button>
                ) : (
                    <div className="w-full p-6 rounded-[2rem] text-center shadow-xl"
                        style={{
                            backgroundColor: 'var(--theme-card-bg)',
                            border: '2px solid var(--theme-border)'
                        }}>
                        <div className="text-4xl mb-2 animate-bounce">⏳</div>
                        <p className="font-bold text-[var(--theme-text)] text-lg">
                            Waiting for host to start the game...
                        </p>
                    </div>
                )}

                <div className="text-center text-xs font-medium opacity-60 mt-4 text-[var(--theme-text-secondary)] flex items-center justify-center gap-2">
                    <span>✨</span> Annotate photos, vote for the best! <span>✨</span>
                </div>
            </div>

            {/* Kick Player Confirmation Modal */}
            {kickTarget && (() => {
                const targetPlayer = room.players.find(p => p.id === kickTarget);
                return (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                        <div className="relative z-10 rounded-3xl p-6 shadow-2xl w-full max-w-sm text-center pop-in" style={{ backgroundColor: 'var(--theme-card-bg)' }}>
                            <div className="text-4xl mb-4">🥾</div>
                            <h3 className="text-2xl font-black mb-2" style={{ color: 'var(--theme-text)' }}>Kick Player?</h3>
                            <p className="mb-6 font-medium" style={{ color: 'var(--theme-text-secondary)' }}>
                                Are you sure you want to kick <span className="text-purple-600 font-bold">{targetPlayer?.name}</span>?
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setKickTarget(null)}
                                    className="flex-1 py-3 px-6 font-bold rounded-xl transition-colors"
                                    style={{ backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text)' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        onKick(kickTarget);
                                        setKickTarget(null);
                                    }}
                                    className="flex-1 py-3 px-6 bg-red-500 text-white font-bold rounded-xl shadow-lg hover:bg-red-600 active:scale-95 transition-all"
                                >
                                    Kick
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {showSettings && currentPlayer && (
                <SettingsModal
                    player={currentPlayer}
                    roomCode={room.roomCode}
                    players={room.players}
                    isHost={isHost}
                    onClose={() => setShowSettings(false)}
                    onUpdateProfile={() => { /* Profile updates handled internally */ }}
                    onLeaveGame={onLeave}
                    onEndGame={isHost ? () => StorageService.closeRoom(room.roomCode) : undefined}
                    onKick={isHost ? (playerId: string) => StorageService.kickPlayer(room.roomCode, playerId) : undefined}

                />
            )}

            {showInviteModal && (
                <InviteFriendsModal
                    roomCode={room.roomCode}
                    onClose={() => setShowInviteModal(false)}
                />
            )}
        </div>
    );
};
