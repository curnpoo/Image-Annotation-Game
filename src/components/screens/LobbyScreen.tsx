import React, { useState, useEffect } from 'react';
import type { GameRoom, GameSettings } from '../../types';
import { SettingsModal } from '../common/SettingsModal';
import { GameSettingsPanel } from '../game/GameSettingsPanel';
import { AvatarDisplay } from '../common/AvatarDisplay';
import { vibrate, HapticPatterns } from '../../utils/haptics';
import { AuthService } from '../../services/auth';
import { StorageService } from '../../services/storage';
import { getThemeContainerStyle } from '../../utils/themes';

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
    const [copied, setCopied] = useState(false);
    const [, setTick] = useState(0); // Force update for idle timer

    // Theme Support
    const currentUser = AuthService.getCurrentUser();
    const activeTheme = currentUser?.cosmetics?.activeTheme || 'default';
    const cardStyle = getThemeContainerStyle(activeTheme);

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

    const copyRoomCode = () => {
        vibrate(HapticPatterns.success);
        navigator.clipboard.writeText(room.roomCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const isIdle = (lastSeen?: number) => {
        if (!lastSeen) return true;
        return Date.now() - lastSeen > 10000; // 10 seconds
    };

    // If somehow we are in LobbyScreen but the game is active, show Rejoin
    if (room.status !== 'lobby') {
        return (
            <div className="min-h-screen bg-90s-animated flex flex-col items-center justify-center p-4">
                <div className="bg-white rounded-2xl p-8 shadow-2xl text-center max-w-md w-full">
                    <h2 className="text-2xl font-bold mb-4 text-purple-600">Game in Progress!</h2>
                    <p className="mb-6 text-gray-600">The game is currently in the <strong>{room.status}</strong> phase.</p>
                    <button
                        onClick={onJoinGame}
                        className="w-full bg-gradient-to-r from-green-400 to-emerald-500 text-white font-bold py-4 rounded-xl shadow-lg hover:scale-105 transition-transform"
                    >
                        🚀 Rejoin Game
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col pb-safe overflow-y-auto"
            style={{ paddingTop: 'max(1.5rem, env(safe-area-inset-top) + 1rem)' }}>

            <div className="w-full max-w-md mx-auto space-y-4 px-4 pb-8">
                {/* Header Actions */}
                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={onBack}
                        className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border-2 border-white/20 hover:bg-white/20 active:scale-95 transition-all text-center group"
                    >
                        <div className="text-3xl mb-1 group-hover:scale-110 transition-transform">🏠</div>
                        <div className="font-bold text-white text-sm">Home</div>
                    </button>
                    <button
                        onClick={() => setShowSettings(true)}
                        className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border-2 border-white/20 hover:bg-white/20 active:scale-95 transition-all text-center group"
                    >
                        <div className="text-3xl mb-1 group-hover:scale-110 transition-transform">⚙️</div>
                        <div className="font-bold text-white text-sm">Settings</div>
                    </button>
                </div>

                {/* Room Code Card */}
                <div className="flex justify-between items-center shadow-xl transition-all duration-300"
                    style={cardStyle}>
                    <div>
                        <div className="text-xs uppercase tracking-wider font-bold mb-1 opacity-70">Room Code</div>
                        <div className="text-4xl font-mono font-black tracking-widest">{room.roomCode}</div>
                    </div>
                    <button
                        onClick={copyRoomCode}
                        className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${copied
                            ? 'bg-green-400 text-white'
                            : 'bg-black/10 hover:bg-black/20 text-current'
                            }`}
                    >
                        {copied ? '✓ Copied!' : '📋 Copy'}
                    </button>
                </div>

                {/* Game Settings - Host Only */}
                {isHost && (
                    <GameSettingsPanel
                        settings={room.settings}
                        onSettingsChange={(settings) => StorageService.updateSettings(room.roomCode, settings)}
                        isHost={isHost}
                    />
                )}

                {/* Players List */}
                <div className="shadow-xl transition-all duration-300"
                    style={cardStyle}>
                    <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
                        👥 Players
                        <span className="bg-black/10 px-3 py-1 rounded-full text-sm">
                            {room.players.length}
                        </span>
                    </h3>
                    <div className="space-y-2">
                        {Array.isArray(room.players) && room.players.map((p, index) => {
                            if (!p) return null;
                            return (
                                <div
                                    key={p.id}
                                    className="bg-gray-50 p-3 rounded-xl flex items-center justify-between"
                                    style={{ animationDelay: `${index * 0.1}s` }}
                                >
                                    <div className="flex items-center gap-3">
                                        <AvatarDisplay
                                            strokes={p.avatarStrokes}
                                            avatar={p.avatar}
                                            frame={p.frame}
                                            color={p.color}
                                            size={40}
                                        />
                                        <div>
                                            <div className="font-bold text-gray-800">
                                                {p.name} {p.id === room.hostId && '👑'}
                                            </div>
                                            {p.id === currentPlayerId && (
                                                <div className="text-xs text-purple-500 font-bold">YOU</div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className={`px-3 py-1 rounded-full text-xs font-bold ${room.playerStates && room.playerStates[p.id]?.status === 'ready'
                                            ? 'bg-green-100 text-green-600'
                                            : isIdle(p.lastSeen)
                                                ? 'bg-gray-100 text-gray-400'
                                                : 'bg-yellow-100 text-yellow-600'
                                            }`}>
                                            {room.playerStates && room.playerStates[p.id]?.status === 'ready'
                                                ? 'READY!'
                                                : isIdle(p.lastSeen)
                                                    ? '💤'
                                                    : 'WAITING...'}
                                        </div>
                                        {isHost && p.id !== currentPlayerId && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (window.confirm(`Kick ${p.name}?`)) {
                                                        onKick(p.id);
                                                    }
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

                    {/* Leave Room Button */}
                    <button
                        onClick={onLeave}
                        className="w-full mt-4 bg-red-100 text-red-600 font-bold py-3 rounded-xl hover:bg-red-200 transition-all flex items-center justify-center gap-2"
                    >
                        <span>🚪</span> Leave Room
                    </button>
                </div>

                {/* Start Game Area - Only host can start */}
                {isHost ? (
                    <button
                        onClick={onStartGame}
                        disabled={room.players.length < 2}
                        className={`w-full rounded-3xl p-6 text-center relative transition-transform ${room.players.length < 2
                            ? 'opacity-75 cursor-not-allowed grayscale bg-gray-100'
                            : 'bg-white cursor-pointer hover:scale-[1.02]'
                            }`}
                        style={{
                            boxShadow: room.players.length < 2
                                ? '0 4px 0 rgba(150, 150, 150, 0.2)'
                                : '0 10px 0 rgba(255, 140, 0, 0.3), 0 20px 40px rgba(0, 0, 0, 0.15)',
                            border: room.players.length < 2
                                ? '4px solid #ccc'
                                : '4px solid #FF8C00',
                            background: room.players.length < 2
                                ? '#f5f5f5'
                                : 'linear-gradient(135deg, #fff7ed, #fffbeb)'
                        }}>
                        <div className="space-y-2 pointer-events-none">
                            <div className="text-4xl">🚀</div>
                            <h3 className="text-2xl font-bold"
                                style={{
                                    background: room.players.length < 2
                                        ? '#999'
                                        : 'linear-gradient(135deg, #FF8C00, #FF69B4)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent'
                                }}>
                                Start Game!
                            </h3>
                            <p className={`font-medium text-sm ${room.players.length < 2 ? 'text-gray-500' : 'text-orange-400'}`}>
                                {room.players.length < 2 ? '⚠️ Need at least 2 players' : 'Click to begin!'}
                            </p>
                        </div>
                    </button>
                ) : (
                    <div className="bg-white/90 rounded-2xl p-6 text-center shadow-lg">
                        <div className="text-4xl mb-2 animate-pulse">⏳</div>
                        <p className="font-bold text-purple-600">
                            Waiting for host to start the game...
                        </p>
                    </div>
                )}

                <div className="text-center text-sm text-white/80 font-medium drop-shadow-lg pt-2">
                    ✨ Fill in the blank and vote for the best drawing! ✨
                </div>
            </div>

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
        </div>
    );
};
