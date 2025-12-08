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
            className="h-[100dvh] w-full flex flex-col items-center justify-start p-4 pb-safe relative overflow-y-auto overflow-x-hidden"
            style={{
                paddingTop: 'max(2rem, env(safe-area-inset-top) + 1rem)',
                backgroundColor: 'var(--theme-bg-primary)'
            }}
        >
            <div className={`w-full max-w-md relative z-10 flex flex-col gap-4 ${mounted ? 'slide-up' : 'opacity-0'}`}>
                {/* Home Button Card */}
                <button
                    onClick={onBack}
                    className="w-full rounded-[2rem] p-4 shadow-lg border-2 flex items-center gap-4 hover:brightness-110 active:scale-95 transition-all"
                    style={{
                        backgroundColor: 'var(--theme-card-bg)',
                        borderColor: 'var(--theme-border)'
                    }}
                >
                    <div className="text-3xl">🏠</div>
                    <div className="flex-1 text-left">
                        <div className="text-lg font-bold" style={{ color: 'var(--theme-text)' }}>Back to Home</div>
                        <div className="text-sm font-medium" style={{ color: 'var(--theme-text-secondary)' }}>Return to main menu</div>
                    </div>
                    <div className="text-2xl" style={{ color: 'var(--theme-text-secondary)' }}>←</div>
                </button>

                <div className="rounded-[2rem] p-8 space-y-8 shadow-2xl"
                    style={{
                        backgroundColor: 'var(--theme-card-bg)',
                        color: 'var(--theme-text)',
                        border: '2px solid var(--theme-border)'
                    }}>

                    <div className="text-center space-y-2">
                        <div className="text-4xl bounce-scale">👋</div>
                        <h2 className="text-3xl font-black" style={{ color: 'var(--theme-text)' }}>
                            Hi, {playerName}!
                        </h2>
                    </div>

                    <div className="space-y-6">
                        <button
                            onClick={onCreateRoom}
                            className="w-full text-black font-black text-xl py-5 rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all"
                            style={{
                                background: 'linear-gradient(135deg, var(--theme-accent) 0%, #FFA726 100%)'
                            }}
                        >
                            🎨 Create New Room
                        </button>

                        <div className="relative flex items-center justify-center">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t-2 border-dashed" style={{ borderColor: 'var(--theme-border)' }}></div>
                            </div>
                            <span className="relative px-4 py-1 text-sm font-bold rounded-full border-2"
                                style={{
                                    backgroundColor: 'var(--theme-bg-secondary)',
                                    color: 'var(--theme-text-secondary)',
                                    borderColor: 'var(--theme-border)'
                                }}>
                                OR
                            </span>
                        </div>

                        <form onSubmit={handleJoin} className="space-y-4">
                            <div className="space-y-3">
                                <label className="block text-lg font-bold text-center" style={{ color: 'var(--theme-text)' }}>
                                    🔗 Join existing room
                                </label>
                                <div className="flex gap-2 w-full">
                                    <input
                                        type="text"
                                        value={roomCode}
                                        onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                                        placeholder="ABCD"
                                        className="flex-1 min-w-0 text-center uppercase tracking-widest font-mono text-xl py-3 rounded-2xl border-2 focus:outline-none"
                                        style={{
                                            backgroundColor: 'var(--theme-bg-secondary)',
                                            color: 'var(--theme-text)',
                                            borderColor: 'var(--theme-border)'
                                        }}
                                        maxLength={6}
                                    />
                                    <button
                                        type="submit"
                                        disabled={roomCode.length < 4}
                                        className="px-6 py-3 rounded-2xl font-bold text-lg transition-all flex-shrink-0 shadow-md hover:scale-105 active:scale-95 disabled:opacity-50 disabled:grayscale disabled:pointer-events-none"
                                        style={{
                                            backgroundColor: 'var(--theme-accent)',
                                            color: '#000000'
                                        }}
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
                        <div className="rounded-[2rem] p-6 shadow-xl border-2"
                            style={{
                                backgroundColor: 'var(--theme-card-bg)',
                                borderColor: 'var(--theme-border)'
                            }}>
                            <h3 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--theme-text)' }}>
                                🕒 Recent Games
                            </h3>
                            <div className="space-y-3">
                                {history.map((game) => (
                                    <div key={game.roomCode}
                                        className="p-4 rounded-2xl border-2 transition-all"
                                        style={{
                                            backgroundColor: 'var(--theme-bg-secondary)',
                                            borderColor: game.isActive ? 'var(--theme-accent)' : 'transparent',
                                            opacity: game.isActive ? 1 : 0.7
                                        }}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-2xl font-black" style={{ color: 'var(--theme-text)' }}>{game.roomCode}</span>
                                                    {game.isActive ? (
                                                        <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                                                            Active
                                                        </span>
                                                    ) : (
                                                        <span className="bg-gray-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                                                            {getInactiveStatusText(game)}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    {game.hostName && (
                                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold border opacity-80"
                                                            style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-secondary)' }}>
                                                            👤 <span className="truncate max-w-[80px]">{game.hostName}</span>
                                                        </span>
                                                    )}
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold border opacity-80"
                                                        style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-secondary)' }}>
                                                        👥 {game.playerCount}
                                                    </span>
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold border opacity-80"
                                                        style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-secondary)' }}>
                                                        🔄 Rd {game.roundNumber}
                                                    </span>
                                                </div>

                                                {/* Status/Result Message */}
                                                {game.winnerName ? (
                                                    <div className="text-sm font-bold text-yellow-500 mt-2">
                                                        🏆 Winner: {game.winnerName}
                                                    </div>
                                                ) : game.leaderName ? (
                                                    <div className="text-sm font-bold text-purple-500 mt-2">
                                                        👑 Leader: {game.leaderName}
                                                    </div>
                                                ) : null}
                                            </div>

                                            {game.isActive ? (
                                                <button
                                                    onClick={() => onJoinRoom(game.roomCode)}
                                                    className="px-4 py-2 rounded-xl font-bold text-black hover:scale-105 transition-all shadow-md"
                                                    style={{ backgroundColor: 'var(--theme-accent)' }}
                                                >
                                                    Join
                                                </button>
                                            ) : (
                                                <button disabled className="px-4 py-2 rounded-xl bg-gray-300 text-gray-500 font-bold cursor-not-allowed opacity-50">
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
