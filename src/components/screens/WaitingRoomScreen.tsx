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
        <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-y-auto pb-safe"
            style={{ backgroundColor: 'var(--theme-bg-primary)' }}>
            {/* Decorative elements */}
            <div className="fixed top-10 left-10 text-6xl animate-bounce pointer-events-none z-0">⏳</div>
            <div className="fixed bottom-10 right-10 text-6xl animate-pulse pointer-events-none z-0">🎮</div>

            <div className={`rounded-[2rem] p-8 max-w-md w-full text-center relative z-10 my-auto shadow-2xl ${mounted ? 'pop-in' : 'opacity-0'}`}
                style={{
                    backgroundColor: 'var(--theme-card-bg)',
                    border: '2px solid var(--theme-border)'
                }}>

                <h1 className="text-3xl font-black mb-4" style={{ color: 'var(--theme-text)' }}>
                    Waiting Room
                </h1>

                <div className="mb-6 flex justify-center">
                    <AvatarDisplay
                        strokes={me?.avatarStrokes}
                        avatar={me?.avatar}
                        frame={me?.frame}
                        color={me?.color}
                        backgroundColor={me?.backgroundColor}
                        size={80}
                        className="shadow-lg"
                        playerId={me?.id}
                        imageUrl={me?.avatarImageUrl}
                    />
                </div>

                <div className="rounded-2xl p-6 mb-6"
                    style={{
                        backgroundColor: 'var(--theme-bg-secondary)',
                        border: '1px solid var(--theme-border)'
                    }}>
                    <p className="font-medium mb-2" style={{ color: 'var(--theme-text-secondary)' }}>
                        The game is currently in progress.
                    </p>
                    <p className="text-xl font-bold animate-pulse" style={{ color: 'var(--theme-accent)' }}>
                        You'll join in Round {currentRound} of {totalRounds}!
                    </p>
                </div>

                <div className="space-y-4">
                    <div className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--theme-text-secondary)' }}>
                        Current Status
                    </div>
                    <div className="inline-block px-4 py-2 rounded-full font-bold shadow-sm"
                        style={{
                            backgroundColor: 'var(--theme-bg-secondary)',
                            color: 'var(--theme-text)',
                            border: '1px solid var(--theme-border)'
                        }}>
                        {room.status === 'uploading' ? '📸 Uploading Image' :
                            room.status === 'drawing' ? '🎨 Drawing Phase' :
                                room.status === 'voting' ? '🗳️ Voting Phase' :
                                    room.status === 'results' ? '🏆 Viewing Results' : 'Game in Progress'}
                    </div>
                </div>

                {/* Show who hasn't finished yet */}
                {room.status === 'drawing' && (
                    <div className="mt-4">
                        <div className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--theme-text-secondary)' }}>
                            Still Drawing ({room.players.filter(p => room.playerStates?.[p.id]?.status !== 'submitted').length})
                        </div>
                        <div className="flex flex-wrap justify-center gap-2 max-h-32 overflow-y-auto custom-scrollbar">
                            {room.players
                                .filter(p => room.playerStates?.[p.id]?.status !== 'submitted')
                                .map(p => (
                                    <div key={p.id} className="flex items-center gap-2 px-3 py-1.5 rounded-xl shadow-sm transition-all"
                                        style={{
                                            backgroundColor: 'var(--theme-bg-secondary)',
                                            border: '1px solid var(--theme-border)'
                                        }}>
                                        <AvatarDisplay
                                            strokes={p.avatarStrokes}
                                            avatar={p.avatar}
                                            color={p.color}
                                            backgroundColor={p.backgroundColor}
                                            size={24}
                                            className="flex-shrink-0"
                                            playerId={p.id}
                                            imageUrl={p.avatarImageUrl}
                                        />
                                        <span className="text-xs font-bold truncate max-w-[90px]" style={{ color: 'var(--theme-text)' }}>{p.name}</span>
                                    </div>
                                ))}
                        </div>
                    </div>
                )}

                {/* Show who is uploading */}
                {room.status === 'uploading' && (
                    <div className="mt-4">
                        <div className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--theme-text-secondary)' }}>
                            Waiting for Uploader
                        </div>
                        {(() => {
                            const uploader = room.players.find(p => p.id === (room.currentUploaderId || room.hostId));
                            return uploader ? (
                                <div className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl shadow-sm animate-bounce-gentle"
                                    style={{
                                        backgroundColor: 'var(--theme-bg-secondary)',
                                        border: '1px solid var(--theme-border)'
                                    }}>
                                    <span className="text-2xl">{uploader.avatar || '📸'}</span>
                                    <div className="text-left">
                                        <div className="font-bold" style={{ color: 'var(--theme-text)' }}>{uploader.name}</div>
                                        <div className="text-xs font-medium opacity-80" style={{ color: 'var(--theme-accent)' }}>Picking an image...</div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-sm italic" style={{ color: 'var(--theme-text-secondary)' }}>Unknown Uploader</div>
                            );
                        })()}
                    </div>
                )}

                <div className="mt-8 pt-6 border-t-2 space-y-4" style={{ borderColor: 'var(--theme-border)' }}>
                    <p className="text-sm opacity-60 font-medium" style={{ color: 'var(--theme-text-secondary)' }}>
                        Sit tight! You've been added to the queue.
                        <br />
                        You'll join automatically in the next round.
                    </p>

                    {/* Join Now Button - Allow for any active game state */}
                    {(room.status !== 'lobby') && (
                        <button
                            onClick={onJoinGame}
                            className="w-full text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-transform flex items-center justify-center gap-2"
                            style={{
                                backgroundColor: 'var(--theme-accent)'
                            }}
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
