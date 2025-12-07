import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { GameRoom, Player } from '../../types';
import { GameCanvas } from '../game/GameCanvas';
import { Toolbar } from '../game/Toolbar';

import { CosmeticsService } from '../../services/cosmetics';
import type { DrawingStroke } from '../../types';

interface DrawingScreenProps {
    room: GameRoom;
    player: Player;
    isMyTimerRunning: boolean;
    isReadying: boolean;
    onReady: () => void;

    // Drawing props
    brushColor: string;
    brushSize: number;
    brushType?: string;
    isEraser: boolean;
    isEyedropper: boolean;
    setBrushColor: (color: string) => void;
    setBrushSize: (size: number) => void;
    setBrushType?: (type: string) => void;
    setStrokes: (strokes: DrawingStroke[]) => void;
    setIsEraser: (isEraser: boolean) => void;
    setIsEyedropper: (isEyedropper: boolean) => void;
    handleUndo: () => void;
    handleClear: () => void;
    handleEraserToggle: () => void;
    handleEyedropperToggle: () => void;
    handleColorPick: (color: string) => void;
    strokes: DrawingStroke[];
}

type TransitionState = 'idle' | 'countdown' | 'go';

export const DrawingScreen: React.FC<DrawingScreenProps> = ({
    room,
    player,
    isMyTimerRunning,
    isReadying,
    onReady,
    brushColor,
    brushSize,
    brushType = 'default',
    isEraser,
    isEyedropper,
    setBrushColor,
    setBrushSize,
    setBrushType,
    setStrokes,
    setIsEraser,
    setIsEyedropper,
    handleUndo,
    handleClear,
    handleEraserToggle,
    handleEyedropperToggle,
    handleColorPick,
    strokes
}) => {
    const playerState = room.playerStates[player.id];
    const hasSubmitted = playerState?.status === 'submitted';

    // Transition State
    const [transitionState, setTransitionState] = useState<TransitionState>('idle');
    const [countdownValue, setCountdownValue] = useState(3);

    // Get unlockables
    const availableBrushes = CosmeticsService.getAvailableBrushes();

    const unfinishedPlayers = useMemo(() => {
        return room.players.filter(p =>
            room.playerStates[p.id]?.status !== 'submitted'
        );
    }, [room.players, room.playerStates]);

    const isSabotaged = room.sabotageTargetId === player.id && room.sabotageTriggered;
    const sabotageEffect = room.sabotageEffect;

    // Handler: Click "I'm Ready" button - go straight to countdown
    const handleReadyClick = useCallback(() => {
        setTransitionState('countdown');
        setCountdownValue(3);
    }, []);

    const hasCalledReadyRef = React.useRef(false);

    // Effect: Manage transition sequence
    useEffect(() => {
        if (transitionState === 'countdown') {
            if (countdownValue > 0) {
                // Show current number, then decrement after 1 second
                const timer = setTimeout(() => {
                    setCountdownValue(prev => prev - 1);
                }, 1000);
                return () => clearTimeout(timer);
            } else {
                // countdownValue is 0, wait a moment then show GO
                const timer = setTimeout(() => {
                    setTransitionState('go');
                }, 800);
                return () => clearTimeout(timer);
            }
        }

        if (transitionState === 'go') {
            // Immediately start
            if (!hasCalledReadyRef.current) {
                hasCalledReadyRef.current = true;
                onReady();
            }
        }
    }, [transitionState, countdownValue, onReady]);

    // Effect: Reduce Colors
    const effectiveAvailableColors = useMemo(() => {
        if (isSabotaged && sabotageEffect?.type === 'reduce_colors') {
            return [
                { id: '#000000', name: 'Black', price: 0 },
                { id: '#FFFFFF', name: 'White', price: 0 },
                { id: '#FF0000', name: 'Red', price: 0 },
                { id: '#555555', name: 'Gray', price: 0 }
            ];
        }
        return CosmeticsService.getAvailableColors();
    }, [isSabotaged, sabotageEffect]);

    // Effect: Visual Distortion
    const baseContainerClass = "w-full h-full flex flex-col overflow-hidden relative";
    const sabotageClass = (isSabotaged && sabotageEffect?.type === 'visual_distortion')
        ? "animate-shake-hard"
        : "";
    const containerClass = `${baseContainerClass} ${sabotageClass}`;

    const canvasBlurClass = "transition-all duration-500";

    return (
        <div className={containerClass}>
            {/* Blurrable Canvas Content */}
            <div className={`flex-1 relative w-full max-w-lg mx-auto flex flex-col justify-center items-center min-h-0 ${canvasBlurClass}`}>

                {/* Canvas Area */}
                <div className="relative w-full z-0 bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-gray-100 aspect-square">

                    {/* Base Image */}
                    {room.currentImage && (
                        <img
                            src={room.currentImage.url}
                            alt="Round base"
                            className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
                        />
                    )}

                    {/* Block Overlay */}
                    {room.block && (
                        <div
                            className="absolute pointer-events-none"
                            style={{
                                left: `${room.block.x}%`,
                                top: `${room.block.y}%`,
                                width: `${room.block.size}%`,
                                height: `${room.block.size}%`,
                                borderRadius: room.block.type === 'circle' ? '50%' : '8px',
                                boxShadow: 'inset 0 0 20px rgba(0,0,0,0.1)',
                                backgroundColor: '#ffffff',
                                zIndex: 10
                            }}
                        />
                    )}

                    <GameCanvas
                        imageUrl={room.currentImage?.url || ''}
                        isDrawingEnabled={isMyTimerRunning && !hasSubmitted}
                        brushColor={brushColor}
                        brushSize={brushSize}
                        isEraser={isEraser}
                        strokes={strokes}
                        onStrokesChange={setStrokes}
                        isEyedropper={isEyedropper}
                        onColorPick={handleColorPick}
                    />

                    {/* Show "submitted" overlay */}
                    {hasSubmitted && (
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-30 animate-fade-in">
                            <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-6 text-center max-w-sm mx-4 shadow-2xl animate-bounce-gentle border border-white/50">
                                <div className="text-5xl mb-3 animate-pulse-slow">✅</div>
                                <h3 className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-emerald-600 text-2xl mb-2">Drawing Submitted!</h3>
                                <p className="text-gray-500 text-sm mb-6 font-medium">Waiting for everyone else...</p>

                                {/* List unfinished players */}
                                {unfinishedPlayers.length > 0 && (
                                    <div className="bg-amber-900/20 rounded-2xl p-4 border border-amber-800/30">
                                        <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest mb-3">Still Drawing</p>
                                        <div className="flex flex-wrap justify-center gap-2">
                                            {unfinishedPlayers.map(p => (
                                                <div key={p.id} className="flex items-center gap-2 bg-amber-800 pl-1 pr-3 py-1 rounded-full shadow-md animate-pulse-slow">
                                                    <div className="w-6 h-6 rounded-full bg-amber-700 flex items-center justify-center text-sm shadow-inner">
                                                        {p.avatar || '👤'}
                                                    </div>
                                                    <span className="text-xs font-bold text-white truncate max-w-[100px]">{p.name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Transition Overlays - OUTSIDE the blurred content */}
            {!isMyTimerRunning && !hasSubmitted && (
                <>
                    {/* Idle State: Show "I'm Ready" modal */}
                    {transitionState === 'idle' && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                            <div className="bg-white rounded-3xl p-8 text-center max-w-sm mx-4 shadow-2xl pop-in border-4 border-purple-500">
                                <div className="text-6xl mb-4 animate-bounce">🎨</div>
                                <h3 className="text-2xl font-bold text-purple-600 mb-2">It's Drawing Time!</h3>
                                <p className="text-gray-500 mb-6">You have {room.settings.timerDuration} seconds to draw.</p>
                                <button
                                    onClick={handleReadyClick}
                                    disabled={isReadying}
                                    className="w-full btn-90s bg-gradient-to-r from-lime-400 to-emerald-500 text-black px-8 py-4 rounded-xl font-bold text-xl jelly-hover shadow-lg disabled:opacity-70 disabled:grayscale"
                                >
                                    I'M READY! 🚀
                                </button>
                            </div>
                        </div>
                    )}



                    {/* Countdown State: Large numbers */}
                    {transitionState === 'countdown' && countdownValue > 0 && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-50 animate-fade-in">
                            <div className="text-9xl font-black text-white drop-shadow-2xl animate-ping-once" key={countdownValue}>
                                {countdownValue}
                            </div>
                        </div>
                    )}

                    {/* GO! State */}
                    {transitionState === 'go' && (
                        <div className="absolute inset-0 bg-gradient-to-br from-lime-500/70 to-emerald-600/70 flex items-center justify-center z-50 animate-fade-in">
                            <div className="text-8xl font-black text-white drop-shadow-2xl animate-ping-once">
                                GO! 🚀
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Toolbar - BELOW the image */}
            {isMyTimerRunning && !hasSubmitted && (
                <div className="flex-shrink-0 z-30 pb-4 px-2 pop-in pointer-events-auto w-full max-w-lg mx-auto">
                    <Toolbar
                        brushColor={brushColor}
                        brushSize={brushSize}
                        brushType={brushType}
                        isEraser={isEraser}
                        onColorChange={(color) => {
                            setBrushColor(color);
                            setIsEraser(false);
                            setIsEyedropper(false);
                        }}
                        onSizeChange={setBrushSize}
                        onTypeChange={(type) => {
                            if (setBrushType) {
                                setBrushType(type);
                                setIsEraser(false);
                                setIsEyedropper(false);
                            }
                        }}
                        onEraserToggle={handleEraserToggle}
                        onUndo={handleUndo}
                        onClear={handleClear}
                        isEyedropper={isEyedropper}
                        onEyedropperToggle={handleEyedropperToggle}
                        availableColors={effectiveAvailableColors}
                        availableBrushes={availableBrushes}
                    />
                </div>
            )}
        </div>
    );
};
