import React, { useState, useEffect } from 'react';
import { StorageService } from '../../services/storage';
import type { RoomHistoryEntry } from '../../types';

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
    const [history, setHistory] = useState<(RoomHistoryEntry & { isActive: boolean })[]>([]);

    useEffect(() => {
        setMounted(true);

        const savedHistory = StorageService.getHistory();
        // Initialize with saved data, assuming inactive until verified
        setHistory(savedHistory.map(h => ({ ...h, isActive: false })));

        // Subscribe to each room for live updates
        const unsubscribes = savedHistory.map(entry => {
            return StorageService.subscribeToRoom(entry.roomCode, (room) => {
                setHistory(prev => {
                    return prev.map(h => {
                        if (h.roomCode !== entry.roomCode) return h;

                        if (!room) {
                            // Room does not exist (ended/closed)
                            return { ...h, isActive: false };
                        }

                        // Room exists (active)
                        // Check for winner if final
                        let winnerName = h.winnerName;
                        let endReason = h.endReason;

                        if (room.status === 'final' && room.scores) {
                            const winnerId = Object.entries(room.scores).sort(([, a], [, b]) => b - a)[0]?.[0];
                            const winner = room.players.find(p => p.id === winnerId);
                            if (winner) winnerName = winner.name;
                            endReason = 'finished';
                        }

                        return {
                            ...h,
                            isActive: true,
                            playerCount: room.players.length,
                            roundNumber: room.roundNumber,
                            hostName: room.players.find(p => p.id === room.hostId)?.name || h.hostName,
                            winnerName,
                            endReason
                        };
                    });
                });
            });
        });

        return () => {
            unsubscribes.forEach(unsub => unsub());
        };
    }, []);

    const handleJoin = (e: React.FormEvent) => {
        e.preventDefault();
        if (roomCode.length >= 4) {
            onJoinRoom(roomCode.toUpperCase());
        }
    };

    const getInactiveStatusText = (room: RoomHistoryEntry) => {
        if (room.endReason === 'cancelled') return 'Cancelled 🚫';
        if (room.endReason === 'early') return 'Ended Early 🛑';
        if (room.endReason === 'left') return 'Left Game 🏃‍♂️';
        if (room.winnerName) return 'Ended 🏁';
        return 'Ended 🏁';
    };

    return (
        <div
            className="min-h-screen flex flex-col items-center justify-start p-4 relative overflow-y-auto overflow-x-hidden"
            style={{ paddingTop: 'max(2rem, env(safe-area-inset-top) + 1rem)' }}
        >
            <div className={`w-full max-w-md relative z-10 flex flex-col gap-4 ${mounted ? 'slide-up' : 'opacity-0'}`}>
                {/* Home Button Card */}
                <button
                    onClick={onBack}
                    className="w-full bg-gradient-to-r from-gray-100 to-gray-200 rounded-2xl p-4 shadow-lg border-2 border-gray-300 flex items-center gap-4 hover:scale-[1.02] active:scale-95 transition-all"
                >
                    <div className="text-3xl">🏠</div>
                    <div className="flex-1 text-left">
                        <div className="text-lg font-bold text-gray-800">Back to Home</div>
                        <div className="text-gray-500 text-sm">Return to main menu</div>
                    </div>
                    <div className="text-2xl text-gray-400">←</div>
                </button>

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


                {/* Recent Games List */}
                {history.length > 0 && (
                    <div className="w-full slide-up" style={{ animationDelay: '0.2s' }}>
                        <div className="bg-white/90 backdrop-blur-sm rounded-[2rem] p-6 shadow-xl border-4 border-white">
                            <h3 className="text-xl font-bold text-purple-600 mb-4 flex items-center gap-2">
                                🕒 Recent Games
                            </h3>
                            <div className="space-y-3">
                                {history.map((game) => (
                                    <div key={game.roomCode}
                                        className={`p-4 rounded-xl border-2 transition-all ${game.isActive
                                            ? 'bg-white border-purple-200 hover:border-purple-400 shadow-sm'
                                            : 'bg-gray-50 border-gray-100 opacity-75'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-2xl font-black text-gray-800">{game.roomCode}</span>
                                                    {game.isActive ? (
                                                        <span className="bg-green-100 text-green-600 text-xs px-2 py-1 rounded-full font-bold">
                                                            ● Active
                                                        </span>
                                                    ) : (
                                                        <span className="bg-gray-100 text-gray-500 text-xs px-2 py-1 rounded-full font-bold">
                                                            ● {getInactiveStatusText(game)}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-sm text-gray-500 mt-1">
                                                    {game.hostName && <span className="font-medium text-purple-600 mr-2">Host: {game.hostName} •</span>}
                                                    {game.playerCount} Players • Round {game.roundNumber}
                                                </div>

                                                {/* Status/Result Message */}
                                                {game.winnerName ? (
                                                    <div className="text-sm font-bold text-amber-500 mt-1">
                                                        🏆 Winner: {game.winnerName}
                                                    </div>
                                                ) : game.leaderName ? (
                                                    <div className="text-sm font-bold text-purple-500 mt-1">
                                                        👑 Leader: {game.leaderName} (Ended early)
                                                    </div>
                                                ) : game.endReason === 'cancelled' ? (
                                                    <div className="text-sm italic text-gray-400 mt-1">
                                                        Ended before start
                                                    </div>
                                                ) : null}
                                            </div>

                                            {game.isActive ? (
                                                <button
                                                    onClick={() => onJoinRoom(game.roomCode)}
                                                    className="px-4 py-2 rounded-lg bg-purple-500 text-white font-bold hover:bg-purple-600 transition-colors shadow-md"
                                                >
                                                    Join
                                                </button>
                                            ) : (
                                                <button disabled className="px-4 py-2 rounded-lg bg-gray-200 text-gray-400 font-bold cursor-not-allowed">
                                                    Closed
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
