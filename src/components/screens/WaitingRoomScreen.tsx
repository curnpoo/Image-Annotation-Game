import React, { useState, useEffect } from 'react';
import type { GameRoom } from '../../types';
import { AvatarDisplay } from '../common/AvatarDisplay';

interface WaitingRoomScreenProps {
    room: GameRoom;
    currentPlayerId: string;
    onJoinGame: () => void;
}

export const WaitingRoomScreen: React.FC<WaitingRoomScreenProps> = ({
    room,
    currentPlayerId,
    onJoinGame
}) => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const currentRound = room.roundNumber + 1;
    const totalRounds = room.settings.totalRounds;
    const me = room.waitingPlayers?.find(p => p.id === currentPlayerId) || room.players.find(p => p.id === currentPlayerId);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-10 left-10 text-6xl animate-bounce">⏳</div>
            <div className="absolute bottom-10 right-10 text-6xl animate-pulse">🎮</div>

            <div className={`bg-white rounded-[2rem] p-8 max-w-md w-full text-center relative z-10 ${mounted ? 'pop-in' : 'opacity-0'}`}
                style={{
                    boxShadow: '0 10px 0 rgba(0, 0, 0, 0.2), 0 20px 40px rgba(0, 0, 0, 0.15)',
                    border: '4px solid #FF69B4'
                }}>

                <h1 className="text-3xl font-bold mb-4"
                    style={{
                        background: 'linear-gradient(135deg, #FF69B4, #9B59B6)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}>
                    Waiting Room
                </h1>

                <div className="mb-6 flex justify-center">
                    <AvatarDisplay
                        strokes={me?.avatarStrokes}
                        avatar={me?.avatar}
                        frame={me?.frame}
                        color={me?.color}
                        size={80}
                        className="shadow-lg"
                    />
                </div>

                <div className="bg-gray-100 rounded-xl p-6 mb-6">
                    <p className="text-gray-600 font-medium mb-2">
                        The game is currently in progress.
                    </p>
                    <p className="text-xl font-bold text-purple-600 animate-pulse">
                        You'll join in Round {currentRound} of {totalRounds}!
                    </p>
                </div>

                <div className="space-y-4">
                    <div className="text-sm text-gray-500 font-bold uppercase tracking-wider">
                        Current Status
                    </div>
                    <div className="inline-block bg-yellow-100 text-yellow-700 px-4 py-2 rounded-full font-bold">
                        {room.status === 'uploading' ? '📸 Uploading Image' :
                            room.status === 'drawing' ? '🎨 Drawing Phase' :
                                room.status === 'voting' ? '🗳️ Voting Phase' :
                                    room.status === 'results' ? '🏆 Viewing Results' : 'Game in Progress'}
                    </div>
                </div>

                {/* Show who hasn't finished yet */}
                {room.status === 'drawing' && (
                    <div className="mt-4">
                        <div className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-2">
                            Still Drawing ({room.players.filter(p => room.playerStates?.[p.id]?.status !== 'submitted').length})
                        </div>
                        <div className="flex flex-wrap justify-center gap-2 max-h-32 overflow-y-auto custom-scrollbar">
                            {room.players
                                .filter(p => room.playerStates?.[p.id]?.status !== 'submitted')
                                .map(p => (
                                    <div key={p.id} className="flex items-center gap-1 bg-white border border-gray-200 px-2 py-1 rounded-lg shadow-sm animate-pulse">
                                        <span className="text-xs">{p.avatar || '👤'}</span>
                                        <span className="text-xs font-semibold text-gray-600 truncate max-w-[80px]">{p.name}</span>
                                    </div>
                                ))}
                        </div>
                    </div>
                )}

                {/* Show who is uploading */}
                {room.status === 'uploading' && (
                    <div className="mt-4">
                        <div className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-2">
                            Waiting for Uploader
                        </div>
                        {(() => {
                            const uploader = room.players.find(p => p.id === (room.currentUploaderId || room.hostId));
                            return uploader ? (
                                <div className="flex items-center justify-center gap-2 bg-white border border-orange-200 px-4 py-2 rounded-xl shadow-sm animate-bounce-gentle">
                                    <span className="text-2xl">{uploader.avatar || '📸'}</span>
                                    <div className="text-left">
                                        <div className="font-bold text-gray-700">{uploader.name}</div>
                                        <div className="text-xs text-orange-500 font-medium">Picking an image...</div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-sm text-gray-400 italic">Unknown Uploader</div>
                            );
                        })()}
                    </div>
                )}

                <div className="mt-8 pt-6 border-t-2 border-gray-100 space-y-4">
                    <p className="text-gray-400 text-sm">
                        Sit tight! You've been added to the queue.
                        <br />
                        You'll join automatically in the next round.
                    </p>

                    {/* Join Now Button - Allow for any active game state */}
                    {(room.status !== 'lobby') && (
                        <button
                            onClick={onJoinGame}
                            className="w-full bg-gradient-to-r from-cyan-400 to-blue-500 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-transform flex items-center justify-center gap-2"
                        >
                            <span>🚀</span>
                            <span>Join Current Round</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
