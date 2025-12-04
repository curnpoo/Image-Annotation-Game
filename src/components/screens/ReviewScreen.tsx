import React, { useState, useEffect } from 'react';
import type { GameRoom, DrawingStroke } from '../../types';

interface ReviewScreenProps {
    room: GameRoom;
    currentPlayerId: string;
    onNextRound: () => void;
}

export const ReviewScreen: React.FC<ReviewScreenProps> = ({ room, currentPlayerId, onNextRound }) => {
    const [visibleLayers, setVisibleLayers] = useState<Set<string>>(new Set());
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Show all layers by default
    useEffect(() => {
        const allPlayerIds = room.annotations.map(a => a.playerId);
        setVisibleLayers(new Set(allPlayerIds));
    }, [room.annotations]);

    const toggleLayer = (playerId: string) => {
        const newLayers = new Set(visibleLayers);
        if (newLayers.has(playerId)) {
            newLayers.delete(playerId);
        } else {
            newLayers.add(playerId);
        }
        setVisibleLayers(newLayers);
    };

    return (
        <div className="min-h-screen bg-90s-animated flex flex-col md:flex-row relative overflow-hidden">
            {/* Decorative bubbles */}
            <div className="absolute top-10 left-5 text-4xl bubble-float z-20 pointer-events-none">🎉</div>
            <div className="absolute top-32 right-8 text-5xl bubble-float z-20 pointer-events-none" style={{ animationDelay: '0.5s' }}>🏆</div>

            {/* Main Image Area */}
            <div className={`flex-1 relative flex items-center justify-center p-4 overflow-hidden ${mounted ? 'pop-in' : 'opacity-0'}`}>
                <div className="relative w-full max-w-4xl aspect-[4/3] max-h-[80vh] bg-white rounded-[2rem] overflow-hidden"
                    style={{
                        boxShadow: '0 15px 0 rgba(155, 89, 182, 0.4), 0 30px 60px rgba(0, 0, 0, 0.3)',
                        border: '6px solid transparent',
                        backgroundImage: 'linear-gradient(white, white), linear-gradient(135deg, #FF69B4, #9B59B6, #00D9FF)',
                        backgroundOrigin: 'border-box',
                        backgroundClip: 'padding-box, border-box'
                    }}>
                    {/* Base Image */}
                    {room.currentImage && (
                        <img
                            src={room.currentImage.url}
                            alt="Original"
                            className="absolute inset-0 w-full h-full object-contain"
                        />
                    )}

                    {/* Annotation Layers */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none">
                        {room.annotations.map((annotation) => (
                            visibleLayers.has(annotation.playerId) && (
                                <g key={annotation.playerId} className="gpu-accelerate">
                                    {annotation.drawingData.map((stroke: DrawingStroke, i: number) => (
                                        <path
                                            key={i}
                                            d={`M ${stroke.points.map(p => `${p.x},${p.y}`).join(' L ')}`}
                                            stroke={stroke.color}
                                            strokeWidth={stroke.size}
                                            fill="none"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            opacity="0.8"
                                        />
                                    ))}
                                </g>
                            )
                        ))}
                    </svg>
                </div>
            </div>

            {/* Sidebar Controls */}
            <div className={`w-full md:w-80 bg-white flex flex-col h-[40vh] md:h-screen ${mounted ? 'slide-up' : 'opacity-0'}`}
                style={{
                    boxShadow: '-10px 0 30px rgba(0, 0, 0, 0.1)',
                    borderLeft: '4px solid #FF69B4'
                }}>
                <div className="p-6 border-b-4 border-dashed border-pink-200 bg-gradient-to-r from-pink-50 to-purple-50">
                    <h2 className="text-3xl font-bold"
                        style={{
                            background: 'linear-gradient(135deg, #FF69B4, #9B59B6)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                        }}>
                        🎨 Review Time!
                    </h2>
                    <p className="text-purple-400 font-medium">Round {room.roundNumber}</p>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3 stagger-children">
                    {room.annotations.map((annotation, index) => (
                        <button
                            key={annotation.playerId}
                            onClick={() => toggleLayer(annotation.playerId)}
                            className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all pop-in jelly-hover ${visibleLayers.has(annotation.playerId)
                                    ? 'bg-gradient-to-r from-pink-100 to-purple-100 border-4 border-pink-300'
                                    : 'bg-gray-50 border-4 border-transparent hover:bg-gray-100 opacity-50'
                                }`}
                            style={{ animationDelay: `${index * 0.1}s` }}
                        >
                            <div className="flex items-center space-x-3">
                                <div
                                    className="w-5 h-5 rounded-full"
                                    style={{
                                        backgroundColor: annotation.playerColor,
                                        boxShadow: `0 0 10px ${annotation.playerColor}`
                                    }}
                                />
                                <span className="font-bold text-gray-700 text-lg">
                                    {annotation.playerName}
                                    {annotation.playerId === currentPlayerId && (
                                        <span className="ml-2 text-sm bg-pink-200 text-pink-600 px-2 py-0.5 rounded-full">
                                            You!
                                        </span>
                                    )}
                                </span>
                            </div>
                            <div className="text-2xl">
                                {visibleLayers.has(annotation.playerId) ? '👁️' : '🙈'}
                            </div>
                        </button>
                    ))}
                </div>

                <div className="p-6 border-t-4 border-dashed border-pink-200 bg-gradient-to-r from-pink-50 to-purple-50">
                    <button
                        onClick={onNextRound}
                        className="w-full btn-90s bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 text-white font-bold text-xl py-4 jelly-hover"
                    >
                        🚀 Next Round →
                    </button>
                    <p className="text-center text-sm text-purple-400 mt-3 font-medium">
                        Anyone can start the next round!
                    </p>
                </div>
            </div>
        </div>
    );
};
