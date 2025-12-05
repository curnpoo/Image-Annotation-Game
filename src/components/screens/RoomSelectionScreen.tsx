import React, { useState, useEffect } from 'react';
import { StorageService } from '../../services/storage';
import type { GameRoom } from '../../types';

interface RoomSelectionScreenProps {
    playerName: string;
    onCreateRoom: () => void;
    onJoinRoom: (roomCode: string) => void;
    onBack: () => void;
}

export const RoomSelectionScreen: React.FC<RoomSelectionScreenProps> = ({
    playerName,
    onCreateRoom,
    onJoinRoom,
    onBack,
}) => {
    const [roomCode, setRoomCode] = useState('');
    const [mounted, setMounted] = useState(false);
    const [lastRoom, setLastRoom] = useState<GameRoom | null>(null);

    useEffect(() => {
        setMounted(true);

        const checkLastRoom = async () => {
            const code = StorageService.getRoomCode();
            if (code) {
                const room = await StorageService.getRoom(code);
                if (room) {
                    setLastRoom(room);
                }
            }
        };
        checkLastRoom();
    }, []);

    const handleDismissLastRoom = () => {
        setLastRoom(null);
        StorageService.leaveRoom(); // Clear from storage
    };

    const handleJoin = (e: React.FormEvent) => {
        e.preventDefault();
        if (roomCode.length >= 4) {
            onJoinRoom(roomCode.toUpperCase());
        }
    };

    return (
        <div className="min-h-screen bg-90s-animated flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-10 right-10 text-5xl bubble-float">🏠</div>
            <div className="absolute bottom-20 left-10 text-4xl bubble-float" style={{ animationDelay: '0.5s' }}>🚪</div>
            <div className="absolute top-32 left-16 text-3xl bubble-float" style={{ animationDelay: '1s' }}>🔑</div>

            <div className={`w-full max-w-md relative z-10 ${mounted ? 'slide-up' : 'opacity-0'}`}>
                <div className="bg-white rounded-[2rem] p-8 space-y-8"
                    style={{
                        boxShadow: '0 15px 0 rgba(155, 89, 182, 0.3), 0 30px 60px rgba(0, 0, 0, 0.2)',
                        border: '5px solid transparent',
                        backgroundImage: 'linear-gradient(white, white), linear-gradient(135deg, #00D9FF, #9B59B6, #FF69B4)',
                        backgroundOrigin: 'border-box',
                        backgroundClip: 'padding-box, border-box'
                    }}>

                    <div className="text-center space-y-2">
                        <div className="text-4xl bounce-scale">👋</div>
                        <h2 className="text-3xl font-bold"
                            style={{
                                background: 'linear-gradient(135deg, #00D9FF, #9B59B6)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent'
                            }}>
                            Hi, {playerName}!
                        </h2>
                        <button
                            onClick={onBack}
                            className="text-sm text-pink-500 hover:text-pink-600 font-bold hover:scale-110 transition-transform"
                        >
                            ← Not you? Change name
                        </button>
                    </div>

                    <div className="space-y-6">
                        <button
                            onClick={onCreateRoom}
                            className="w-full btn-90s bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 text-white font-bold text-xl py-5 jelly-hover"
                        >
                            🎨 Create New Room
                        </button>

                        <div className="relative flex items-center justify-center">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t-4 border-dashed border-purple-200"></div>
                            </div>
                            <span className="relative bg-white px-6 py-2 text-lg text-purple-400 font-bold rounded-full border-4 border-purple-200">
                                ✨ or ✨
                            </span>
                        </div>

                        <form onSubmit={handleJoin} className="space-y-4">
                            <div className="space-y-2">
                                <label className="block text-lg font-bold text-purple-600 text-center">
                                    🔗 Join existing room
                                </label>
                                <div className="flex gap-2 w-full">
                                    <input
                                        type="text"
                                        value={roomCode}
                                        onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                                        placeholder="ABCD"
                                        className="input-90s flex-1 min-w-0 text-center uppercase tracking-widest font-mono border-cyan-300 focus:border-cyan-500"
                                        style={{
                                            background: 'linear-gradient(to bottom, #fff, #f0f8ff)'
                                        }}
                                        maxLength={6}
                                    />
                                    <button
                                        type="submit"
                                        disabled={roomCode.length < 4}
                                        className={`px-4 py-3 rounded-2xl font-bold text-lg transition-all flex-shrink-0 ${roomCode.length >= 4
                                            ? 'btn-90s bg-gradient-to-r from-lime-400 to-emerald-500 text-white'
                                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                            }`}
                                    >
                                        Go!
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            {/* Quick Join Popup */}
            {lastRoom && (
                <div className="fixed bottom-0 left-0 right-0 p-4 z-50 slide-up">
                    <div className="max-w-md mx-auto bg-white rounded-2xl shadow-2xl border-4 border-purple-500 p-4 flex items-center justify-between gap-4">
                        <div className="flex-1">
                            <h3 className="font-bold text-purple-600 text-sm uppercase tracking-wider">Found previous game!</h3>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-black">{lastRoom.roomCode}</span>
                                <span className="text-sm text-gray-500">
                                    Round {lastRoom.roundNumber + 1} • {lastRoom.players.length} Players
                                </span>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={handleDismissLastRoom}
                                className="p-3 rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200 font-bold"
                            >
                                ✕
                            </button>
                            <button
                                onClick={() => onJoinRoom(lastRoom.roomCode)}
                                className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold shadow-lg hover:scale-105 transition-transform"
                            >
                                Rejoin 🚀
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
