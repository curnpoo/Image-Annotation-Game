import React, { useState, useEffect } from 'react';
import type { GameRoom, GameSettings } from '../../types';
import { SettingsModal } from '../common/SettingsModal';
import { GameSettingsPanel } from '../game/GameSettingsPanel';
import { LobbyPlayerRow } from '../game/LobbyPlayerRow';
import { ShareDropdown } from '../common/ShareDropdown';
import { InviteFriendsModal } from '../common/InviteFriendsModal';
import { StorageService } from '../../services/storage';
import { usePresence } from '../../hooks/usePresence';

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

    const [isStarting, setIsStarting] = useState(false);

    const handleStartGame = async () => {
        setIsStarting(true);
        try {
            await onStartGame();
        } catch (error) {
            console.error("Failed to start game", error);
            setIsStarting(false);
        }
    };

    return (
        <div className="min-h-[100dvh] flex flex-col pb-safe overflow-y-auto px-4"
            style={{ paddingTop: 'max(1rem, env(safe-area-inset-top) + 0.5rem)' }}>

            <div className="w-full max-w-md mx-auto space-y-4 pb-8">
                {/* Top Navigation Bar */}
                <div className="flex justify-between gap-4">
                    <button
                        onClick={onBack}
                        className="flex-1 bg-white p-4 rounded-2xl border-2 border-white/10 hover:bg-white/10 transition-all flex flex-col items-center justify-center gap-1 shadow-lg active:scale-95"
                        style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-card-bg)' }}
                    >
                        <span className="text-2xl">🏠</span>
                        <span className="font-bold text-sm text-[var(--theme-text)]">Home</span>
                    </button>
                    <button
                        onClick={() => setShowSettings(true)}
                        className="flex-1 bg-white p-4 rounded-2xl border-2 border-white/10 hover:bg-white/10 transition-all flex flex-col items-center justify-center gap-1 shadow-lg active:scale-95"
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
                            className="flex-shrink-0 flex-1"
                            buttonClassName="w-full h-full min-h-[60px] flex flex-col items-center justify-center p-2 rounded-xl border-2 transition-colors active:scale-95 gap-1"
                            buttonStyle={{
                                backgroundColor: 'var(--theme-button-bg)',
                                borderColor: 'var(--theme-border)',
                                color: 'var(--theme-button-text)'
                            }}
                            label={
                                <div className="flex flex-col items-center leading-none">
                                    <span className="text-xl mb-0.5">📤</span>
                                    <span className="text-[10px] font-bold uppercase tracking-wider">Share</span>
                                </div>
                            }
                        />
                        <button
                            onClick={() => setShowInviteModal(true)}
                            className="flex-1 w-full h-full min-h-[60px] flex flex-col items-center justify-center p-2 rounded-xl border-2 transition-all hover:scale-105 active:scale-95 gap-1"
                            style={{
                                backgroundColor: '#6366f1',
                                borderColor: '#4f46e5',
                                color: 'white'
                            }}
                            title="Invite Friends"
                        >
                            <span className="text-xl leading-none mb-0.5">📨</span>
                            <span className="text-[10px] font-bold uppercase tracking-wider leading-none">Invite</span>
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
                <div className="p-6 rounded-[2rem] shadow-xl min-h-[200px] flex flex-col"
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

                        {/* ... (existing imports, no changes there, handled by replacing block) */}

                        {/* ... */}

                        {Array.isArray(room.players) && room.players.map((p) => {
                            const playerStatus = room.playerStates && room.playerStates[p.id]?.status === 'ready' ? 'ready' : 'waiting';

                            return (
                                <LobbyPlayerRow
                                    key={p.id}
                                    player={p}
                                    isHost={p.id === room.hostId}
                                    isCurrentPlayer={p.id === currentPlayerId}
                                    isIdle={isIdle(p.id)}
                                    playerStatus={playerStatus}
                                    cardColor={p.cosmetics?.activeCardColor}
                                    onKickStart={() => setKickTarget(p.id)}
                                    showKickButton={isHost && p.id !== currentPlayerId}
                                />
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
                        onClick={handleStartGame}
                        disabled={room.players.length < 2 || isStarting}
                        className={`w-full p-6 rounded-[2rem] text-center shadow-xl transition-all ${room.players.length < 2 || isStarting ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-95'
                            }`}
                        style={{
                            backgroundColor: 'var(--theme-card-bg)',
                            border: '2px solid var(--theme-border)'
                        }}
                    >
                        {isStarting ? (
                            <>
                                <div className="text-4xl mb-2 animate-spin">⏳</div>
                                <h3 className="text-xl font-bold text-[var(--theme-text)]">Starting...</h3>
                            </>
                        ) : (
                            <>
                                <div className="text-4xl mb-2">🚀</div>
                                <h3 className="text-xl font-bold text-[var(--theme-text)]">
                                    {room.players.length < 2 ? 'Waiting for players...' : 'Start Game!'}
                                </h3>
                            </>
                        )}
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
                    onGoHome={onBack}
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
