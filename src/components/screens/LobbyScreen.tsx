import React, { useState, useEffect } from 'react';
import type { GameRoom } from '../../types';

interface LobbyScreenProps {
    room: GameRoom;
    currentPlayerId: string;
    onUploadImage: (file: File) => void;
}

export const LobbyScreen: React.FC<LobbyScreenProps> = ({ room, currentPlayerId, onUploadImage }) => {
    const [mounted, setMounted] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            onUploadImage(e.target.files[0]);
        }
    };

    const copyRoomCode = () => {
        navigator.clipboard.writeText(room.roomCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="min-h-screen bg-90s-animated p-4 flex flex-col items-center relative overflow-hidden">
            {/* Decorative bubbles */}
            <div className="absolute top-10 left-5 text-4xl bubble-float">🎈</div>
            <div className="absolute top-32 right-8 text-5xl bubble-float" style={{ animationDelay: '0.5s' }}>🎪</div>
            <div className="absolute bottom-40 left-10 text-4xl bubble-float" style={{ animationDelay: '1s' }}>🎯</div>

            <div className={`w-full max-w-md space-y-6 relative z-10 py-8 ${mounted ? 'slide-up' : 'opacity-0'}`}>
                {/* Room Header */}
                <div className="bg-white rounded-[2rem] p-6 flex justify-between items-center"
                    style={{
                        boxShadow: '0 10px 0 rgba(0, 217, 255, 0.3), 0 20px 40px rgba(0, 0, 0, 0.15)',
                        border: '4px solid transparent',
                        backgroundImage: 'linear-gradient(white, white), linear-gradient(135deg, #00D9FF, #32CD32)',
                        backgroundOrigin: 'border-box',
                        backgroundClip: 'padding-box, border-box'
                    }}>
                    <div>
                        <div className="text-sm text-cyan-500 uppercase tracking-wider font-bold">🏠 Room Code</div>
                        <div className="text-4xl font-mono font-bold rainbow-text">{room.roomCode}</div>
                    </div>
                    <button
                        onClick={copyRoomCode}
                        className={`px-5 py-3 rounded-2xl font-bold transition-all jelly-hover ${copied
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

                {/* Players List */}
                <div className="bg-white rounded-[2rem] p-6 space-y-4"
                    style={{
                        boxShadow: '0 10px 0 rgba(155, 89, 182, 0.3), 0 20px 40px rgba(0, 0, 0, 0.15)',
                        border: '4px solid transparent',
                        backgroundImage: 'linear-gradient(white, white), linear-gradient(135deg, #FF69B4, #9B59B6)',
                        backgroundOrigin: 'border-box',
                        backgroundClip: 'padding-box, border-box'
                    }}>
                    <h3 className="text-xl font-bold flex items-center"
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
                    <div className="space-y-3 stagger-children">
                        {room.players.map((player, index) => (
                            <div
                                key={player.id}
                                className="flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-pink-50 to-purple-50 pop-in"
                                style={{ animationDelay: `${index * 0.1}s` }}
                            >
                                <div className="flex items-center space-x-3">
                                    <div
                                        className="w-4 h-4 rounded-full animate-pulse"
                                        style={{
                                            backgroundColor: player.color,
                                            boxShadow: `0 0 10px ${player.color}`
                                        }}
                                    />
                                    <span className={`font-bold text-lg ${player.id === currentPlayerId ? 'text-pink-600' : 'text-gray-700'}`}>
                                        {player.name}
                                        {player.id === currentPlayerId && (
                                            <span className="ml-2 text-sm bg-pink-100 text-pink-500 px-2 py-0.5 rounded-full">
                                                ⭐ You
                                            </span>
                                        )}
                                    </span>
                                </div>
                                <div className="text-xl">{index === 0 ? '👑' : '🎮'}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Upload Area */}
                <div className="bg-white rounded-[2rem] p-8 text-center relative cursor-pointer hover:scale-[1.02] transition-transform"
                    style={{
                        boxShadow: '0 10px 0 rgba(255, 140, 0, 0.3), 0 20px 40px rgba(0, 0, 0, 0.15)',
                        border: '4px dashed #FF8C00',
                        background: 'linear-gradient(135deg, #fff7ed, #fffbeb)'
                    }}>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="space-y-4 pointer-events-none">
                        <div className="text-6xl bounce-scale">📤</div>
                        <div>
                            <h3 className="text-2xl font-bold"
                                style={{
                                    background: 'linear-gradient(135deg, #FF8C00, #FF69B4)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent'
                                }}>
                                Upload Image to Start!
                            </h3>
                            <p className="text-orange-400 font-medium mt-1">👆 Tap or drag & drop</p>
                        </div>
                        <p className="text-sm text-orange-300 font-medium">JPG, PNG, GIF up to 5MB</p>
                    </div>
                </div>

                <div className="text-center text-lg text-white/80 font-medium drop-shadow-lg">
                    ✨ Anyone can upload an image to start the round! ✨
                </div>
            </div>
        </div>
    );
};
