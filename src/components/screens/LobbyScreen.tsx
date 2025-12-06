import React, { useState, useEffect } from 'react';
import type { GameRoom, GameSettings } from '../../types';
import { GameSettingsPanel } from '../game/GameSettingsPanel';
import { AvatarDisplay } from '../common/AvatarDisplay';
import { vibrate, HapticPatterns } from '../../utils/haptics';

interface LobbyScreenProps {
    room: GameRoom;
    currentPlayerId: string;
    onStartGame: () => void;
    onSettingsChange: (settings: Partial<GameSettings>) => void;
    onLeave: () => void;
    onKick: (playerId: string) => void;
    onJoinGame: () => void;
}

export const LobbyScreen: React.FC<LobbyScreenProps> = ({
    room,
    currentPlayerId,
    onStartGame,
    onSettingsChange,
    onKick,
    onJoinGame
}) => {
    const [mounted, setMounted] = useState(false);
    const [copied, setCopied] = useState(false);
    const [, setTick] = useState(0); // Force update for idle timer

    useEffect(() => {
        setMounted(true);
        // Force update every second to check idle status
        const interval = setInterval(() => setTick(t => t + 1), 1000);
        return () => clearInterval(interval);
    }, []);

    if (!room || !room.players) {
        return <div>Error: Invalid room data</div>;
    }

    const isHost = room.hostId === currentPlayerId;

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
        <div className="min-h-screen bg-90s-animated flex flex-col p-4 relative overflow-hidden"
            style={{ paddingTop: 'max(1rem, env(safe-area-inset-top) + 1rem)' }}>
            {/* Header */}
            <div className="flex justify-between items-center mb-6 relative z-10">
                {/* Decorative bubbles */}
                <div className="absolute top-10 left-5 text-4xl bubble-float">🎈</div>
            </div>
            <div className="absolute top-32 right-8 text-5xl bubble-float" style={{ animationDelay: '0.5s' }}>🎪</div>
            <div className="absolute bottom-40 left-10 text-4xl bubble-float" style={{ animationDelay: '1s' }}>🎯</div>

            <div className={`w-full max-w-md space-y-5 relative z-10 py-6 ${mounted ? 'slide-up' : 'opacity-0'}`}>
                {/* Room Header */}
                <div className="bg-white rounded-[2rem] p-5 flex justify-between items-center"
                    style={{
                        boxShadow: '0 10px 0 rgba(0, 217, 255, 0.3), 0 20px 40px rgba(0, 0, 0, 0.15)',
                        border: '4px solid transparent',
                        backgroundImage: 'linear-gradient(white, white), linear-gradient(135deg, #00D9FF, #32CD32)',
                        backgroundOrigin: 'border-box',
                        backgroundClip: 'padding-box, border-box'
                    }}>
                    <div className="flex items-center gap-3">
                        <div>
                            <div className="text-sm text-cyan-500 uppercase tracking-wider font-bold">Room Code</div>
                            <div className="text-3xl font-mono font-bold rainbow-text">{room.roomCode}</div>
                        </div>
                    </div>
                    <button
                        onClick={copyRoomCode}
                        className={`px-4 py-2 rounded-xl font-bold transition-all jelly-hover text-sm ${copied
                            ? 'bg-green-400 text-white'
                            : 'bg-gradient-to-r from-cyan-400 to-emerald-400 text-white'
                            }`}
                        style={{
                            boxShadow: '0 4px 0 rgba(0, 0, 0, 0.2)'
                        }}
                    >
                        {copied ? '✓ Copied!' : '📋 Copy'}
                    </button>
                </div>

                {/* Round Info */}
                <div className="bg-white/90 rounded-2xl px-4 py-3 text-center"
                    style={{ boxShadow: '0 4px 0 rgba(155, 89, 182, 0.2)' }}>
                    <span className="font-bold text-purple-600">
                        Round {room.roundNumber + 1} of {room.settings.totalRounds}
                    </span>
                    {room.roundNumber > 0 && (
                        <span className="ml-3 text-gray-500">
                            Score: {room.scores[currentPlayerId] || 0} pts
                        </span>
                    )}
                </div>

                {/* Game Settings */}
                <GameSettingsPanel
                    settings={room.settings}
                    onSettingsChange={onSettingsChange}
                    isHost={isHost}
                />

                {/* Players List */}
                <div className="bg-white rounded-[2rem] p-5 space-y-3"
                    style={{
                        boxShadow: '0 10px 0 rgba(155, 89, 182, 0.3), 0 20px 40px rgba(0, 0, 0, 0.15)',
                        border: '4px solid transparent',
                        backgroundImage: 'linear-gradient(white, white), linear-gradient(135deg, #FF69B4, #9B59B6)',
                        backgroundOrigin: 'border-box',
                        backgroundClip: 'padding-box, border-box'
                    }}>
                    <h3 className="text-lg font-bold flex items-center"
                        style={{
                            background: 'linear-gradient(135deg, #FF69B4, #9B59B6)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                        }}>
                        👥 Players
                        <span className="ml-2 bg-gradient-to-r from-pink-400 to-purple-500 text-white px-3 py-1 rounded-full text-sm">
                            {room.players.length}
                        </span>
                    </h3>
                    <div className="space-y-2 stagger-children">
                        {Array.isArray(room.players) && room.players.map((p, index) => {
                            if (!p) return null;
                            return (
                                <div
                                    key={p.id}
                                    className="bg-white/50 backdrop-blur-sm p-4 rounded-xl flex items-center justify-between animate-slide-in"
                                    style={{ animationDelay: `${index * 0.1}s` }}
                                >
                                    <div className="flex items-center gap-4">
                                        <AvatarDisplay
                                            strokes={p.avatarStrokes}
                                            avatar={p.avatar}
                                            frame={p.frame}
                                            color={p.color}
                                            size={48}
                                        />
                                        <div>
                                            <div className="font-bold text-lg" style={{ color: p.color }}>
                                                {p.name} {p.id === room.hostId && '👑'}
                                            </div>
                                            {p.id === currentPlayerId && (
                                                <div className="text-xs text-gray-500 font-bold">YOU</div>
                                            )}
                                        </div>
                                    </div>
                                    <div className={`px-3 py-1 rounded-full text-sm font-bold ${room.playerStates && room.playerStates[p.id]?.status === 'ready'
                                        ? 'bg-green-100 text-green-600'
                                        : isIdle(p.lastSeen)
                                            ? 'bg-gray-100 text-gray-400'
                                            : 'bg-yellow-100 text-yellow-600'
                                        }`}>
                                        {room.playerStates && room.playerStates[p.id]?.status === 'ready'
                                            ? 'READY!'
                                            : isIdle(p.lastSeen)
                                                ? 'IDLE 💤'
                                                : 'WAITING...'}
                                    </div>

                                    {/* Kick Button (Host Only, can't kick self) */}
                                    {isHost && p.id !== currentPlayerId && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (window.confirm(`Kick ${p.name}?`)) {
                                                    onKick(p.id);
                                                }
                                            }}
                                            className="ml-2 bg-red-100 text-red-500 w-8 h-8 rounded-full hover:bg-red-500 hover:text-white transition-colors flex items-center justify-center font-bold shadow-sm"
                                            title="Kick Player"
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Start Game Area - Only host can start */}
                {isHost ? (
                    <button
                        onClick={onStartGame}
                        disabled={room.players.length < 3}
                        className={`w-full rounded-[2rem] p-6 text-center relative transition-transform group ${room.players.length < 3
                            ? 'opacity-75 cursor-not-allowed grayscale bg-gray-100'
                            : 'bg-white cursor-pointer hover:scale-[1.02]'
                            }`}
                        style={{
                            boxShadow: room.players.length < 3
                                ? '0 4px 0 rgba(150, 150, 150, 0.2)'
                                : '0 10px 0 rgba(255, 140, 0, 0.3), 0 20px 40px rgba(0, 0, 0, 0.15)',
                            border: room.players.length < 3
                                ? '4px solid #ccc'
                                : '4px solid #FF8C00',
                            background: room.players.length < 3
                                ? '#f5f5f5'
                                : 'linear-gradient(135deg, #fff7ed, #fffbeb)'
                        }}>
                        <div className="space-y-3 pointer-events-none">
                            <div className="text-5xl bounce-scale">🚀</div>
                            <div>
                                <h3 className="text-2xl font-bold"
                                    style={{
                                        background: room.players.length < 3
                                            ? '#999'
                                            : 'linear-gradient(135deg, #FF8C00, #FF69B4)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent'
                                    }}>
                                    Start Game!
                                </h3>
                                <p className={`font-medium mt-1 text-sm ${room.players.length < 3 ? 'text-gray-500' : 'text-orange-400'}`}>
                                    {room.players.length < 3 ? '⚠️ Need at least 3 players' : 'Click to begin Round 1'}
                                </p>
                            </div>
                        </div>
                    </button>
                ) : (
                    <div className="bg-white/90 rounded-2xl p-6 text-center"
                        style={{ boxShadow: '0 6px 0 rgba(155, 89, 182, 0.2)' }}>
                        <div className="text-4xl mb-2 animate-pulse">⏳</div>
                        <p className="font-bold text-purple-600">
                            Waiting for host to start the game...
                        </p>
                    </div>
                )}

                <div className="text-center text-sm text-white/80 font-medium drop-shadow-lg">
                    ✨ Fill in the blank and vote for the best drawing! ✨
                </div>
            </div>
        </div>
    );
};
