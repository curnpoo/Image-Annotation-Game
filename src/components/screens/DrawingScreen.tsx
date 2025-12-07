import React, { useMemo } from 'react';
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

    // Get unlockables
    const availableBrushes = CosmeticsService.getAvailableBrushes();

    const unfinishedPlayers = useMemo(() => {
        return room.players.filter(p =>
            room.playerStates[p.id]?.status === 'drawing'
        );
    }, [room.players, room.playerStates]);


    const isSabotaged = room.sabotageTargetId === player.id && room.sabotageTriggered;
    const sabotageEffect = room.sabotageEffect;

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
    const containerClass = (isSabotaged && sabotageEffect?.type === 'visual_distortion')
        ? "absolute inset-0 flex flex-col pt-20 pb-4 px-4 overflow-hidden pointer-events-none animate-shake-hard filter blur-[1px]"
        : "absolute inset-0 flex flex-col pt-20 pb-4 px-4 overflow-hidden pointer-events-none";

    return (
        <div className={containerClass}>
            {/* Canvas Container */}
            <div className="flex-1 relative w-full h-full max-w-lg mx-auto pointer-events-auto">

                {/* Helper Text */}
                {!hasSubmitted && isMyTimerRunning && (
                    <div className="text-center mb-2 pop-in">
                        <p className="font-bold text-gray-400 text-sm bg-white/80 backdrop-blur-sm inline-block px-4 py-1 rounded-full shadow-sm">
                            {room.roundNumber === 1
                                ? "Start the chain! Draw something awesome! 🎨"
                                : "Add to the drawing! Keep it going! 🔗"}
                        </p>
                    </div>
                )}

                {/* Canvas Area */}
                <div className="absolute inset-0 z-0 bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-gray-100">

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
                        strokes={strokes} // Use passed strokes prop
                        onStrokesChange={setStrokes}
                        isEyedropper={isEyedropper} // Prop name is isEyedropper
                        onColorPick={handleColorPick}
                    />

                    {/* Show "waiting" overlay if not ready */}
                    {!isMyTimerRunning && !hasSubmitted && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-30">
                            <div className="bg-white rounded-3xl p-8 text-center max-w-sm mx-4 shadow-2xl pop-in border-4 border-purple-500">
                                <div className="text-6xl mb-4 animate-bounce">🎨</div>
                                <h3 className="text-2xl font-bold text-purple-600 mb-2">It's Drawing Time!</h3>
                                <p className="text-gray-500 mb-6">You have {room.settings.timerDuration} seconds to draw.</p>
                                <button
                                    onClick={onReady}
                                    disabled={isReadying}
                                    className="w-full btn-90s bg-gradient-to-r from-lime-400 to-emerald-500 text-black px-8 py-4 rounded-xl font-bold text-xl jelly-hover shadow-lg disabled:opacity-70 disabled:grayscale"
                                >
                                    {isReadying ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                            STARTING...
                                        </span>
                                    ) : (
                                        "I'M READY! 🚀"
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Show "submitted" overlay */}
                    {hasSubmitted && (
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center z-30">
                            <div className="bg-white rounded-2xl p-6 text-center max-w-sm mx-4 shadow-xl animate-bounce-gentle">
                                <div className="text-4xl mb-2">✅</div>
                                <h3 className="font-bold text-green-600 text-xl mb-2">Drawing Submitted!</h3>
                                <p className="text-gray-500 text-sm mb-4">Waiting for others...</p>

                                {/* List unfinished players */}
                                {unfinishedPlayers.length > 0 && (
                                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Still Drawing</p>
                                        <div className="flex flex-wrap justify-center gap-2">
                                            {unfinishedPlayers.map(p => (
                                                <div key={p.id} className="flex items-center gap-1 bg-white border border-gray-200 px-2 py-1 rounded-lg shadow-sm">
                                                    <span className="text-xs">{p.avatar || '👤'}</span>
                                                    <span className="text-xs font-semibold text-gray-600 truncate max-w-[80px]">{p.name}</span>
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
