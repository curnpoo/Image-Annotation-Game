import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { GameRoom, Player } from '../../types';
import { GameCanvas } from '../game/GameCanvas';
import { BentoToolbar } from '../game/BentoToolbar';
import { DrawingHeader } from '../game/DrawingHeader';
import { SabotageOverlay } from '../game/SabotageOverlay';
import { ZoomResetButton } from '../game/ZoomResetButton';
import { AvatarDisplay } from '../common/AvatarDisplay';
import { useZoomPan } from '../../hooks/useZoomPan';

import { CosmeticsService } from '../../services/cosmetics';
import { PowerupHUD } from '../game/PowerupHUD';
import type { DrawingStroke } from '../../types';

interface DrawingScreenProps {
    room: GameRoom;
    player: Player;
    isMyTimerRunning: boolean;
    isReadying: boolean;
    onReady: () => void;
    timerEndsAt: number | null;
    onTimeUp: () => void;
    timerDuration: number;
    onShowSettings: () => void;
    submittedCount?: number;
    totalPlayers?: number;

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
    hasSubmitted?: boolean;
}

type TransitionState = 'idle' | 'countdown' | 'go' | 'fading' | 'drawing';

export const DrawingScreen: React.FC<DrawingScreenProps> = ({
    room,
    player,
    isMyTimerRunning,
    isReadying,
    onReady,
    timerEndsAt,
    onTimeUp,
    timerDuration,
    onShowSettings,
    submittedCount = 0,
    totalPlayers = 0,
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
    strokes,
    hasSubmitted: propHasSubmitted
}) => {
    const playerState = room.playerStates?.[player.id];
    // Use prop if available (includes optimistic state), otherwise fall back to room state
    const hasSubmitted = propHasSubmitted ?? (playerState?.status === 'submitted' || false);

    // iOS-like pinch-to-zoom for canvas
    const { scale, isZoomed, isPinching, resetZoom, bind, contentStyle } = useZoomPan({
        minScale: 1,
        maxScale: 4
    });

    // Effect: Lock scrolling and gestures
    useEffect(() => {
        const originalOverflow = document.body.style.overflow;
        const originalOverscroll = document.body.style.overscrollBehavior;

        // Lock body
        document.body.style.overflow = 'hidden';
        document.body.style.overscrollBehavior = 'none';

        // Prevent native validation/scroll
        const preventTouch = (e: TouchEvent) => {
            const target = e.target as HTMLElement;
            // Allow scrolling in specific marked containers
            if (target.closest('.touch-scroll-allowed')) return;

            // Otherwise, kill all scrolling/rubber-banding
            if (e.touches.length > 1) return;
            e.preventDefault();
        };

        document.addEventListener('touchmove', preventTouch, { passive: false });

        return () => {
            document.body.style.overflow = originalOverflow;
            document.body.style.overscrollBehavior = originalOverscroll;
            document.removeEventListener('touchmove', preventTouch);
        };
    }, []);

    // Transition State
    const [transitionState, setTransitionState] = useState<TransitionState>(() => {
        // If timer is already running on mount (e.g. refresh), start in drawing state
        return isMyTimerRunning ? 'drawing' : 'idle';
    });
    const [countdownValue, setCountdownValue] = useState(3);

    // Sync transition state if timer starts externally (restoration)
    useEffect(() => {
        if (isMyTimerRunning && transitionState === 'idle') {
            setTransitionState('drawing');
        }
    }, [isMyTimerRunning]);

    // Get unlockables
    const availableBrushes = CosmeticsService.getAvailableBrushes();

    const unfinishedPlayers = useMemo(() => {
        return room.players.filter(p =>
            room.playerStates[p.id]?.status !== 'submitted' &&
            // Also exclude self if we have optimistically submitted
            (hasSubmitted ? p.id !== player.id : true)
        );
    }, [room.players, room.playerStates, hasSubmitted, player.id]);

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
                // countdownValue is 0, show GO
                const timer = setTimeout(() => {
                    setTransitionState('go');
                }, 600);
                return () => clearTimeout(timer);
            }
        }

        if (transitionState === 'go') {
            // Call onReady and start fading
            if (!hasCalledReadyRef.current) {
                hasCalledReadyRef.current = true;
                onReady();
            }
            // After a brief moment, start fading out the overlay
            const timer = setTimeout(() => {
                setTransitionState('fading');
            }, 400);
            return () => clearTimeout(timer);
        }

        if (transitionState === 'fading') {
            // After fade animation completes, fully transition to drawing
            const timer = setTimeout(() => {
                setTransitionState('drawing');
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [transitionState, countdownValue, onReady]);

    // Effect: Reduce Colors (Monochrome Madness)
    const effectiveAvailableColors = useMemo(() => {
        if (isSabotaged && sabotageEffect?.type === 'reduce_colors') {
            return [
                { id: '#000000', name: 'Black', price: 0 },
                { id: '#FFFFFF', name: 'White', price: 0 },
                { id: '#333333', name: 'Dark Gray', price: 0 },
                { id: '#888888', name: 'Gray', price: 0 },
                { id: '#CCCCCC', name: 'Light Gray', price: 0 }
            ];
        }
        return CosmeticsService.getAvailableColors();
    }, [isSabotaged, sabotageEffect]);

    // Effect: Sabotage Notification
    useEffect(() => {
        if (isSabotaged) {
             // Dispatch a custom event or use a toast if available via props (not available here directly?)
             // DrawingScreen doesn't have showToast prop, but we can standard alerts or just rely on the visual overlay.
             // Actually, the overlay already says "SABOTAGED!" in SabotageOverlay.tsx which is likely rendered by GameCanvas or above?
             // Wait, SabotageOverlay.tsx is NOT used in DrawingScreen.tsx yet. I need to check where it is used.
             // It seems I need to add SabotageOverlay to DrawingScreen.tsx or verify if it's there.
             // Looking at previous file view of DrawingScreen.tsx, it DOES NOT import SabotageOverlay.
             // I should add it.
        }
    }, [isSabotaged]);

    // Effect: Visual Distortion & Animation
    const baseContainerClass = "fixed inset-0 w-full h-[100dvh] overflow-hidden flex flex-col items-center justify-center bg-black/5"; // Added bg for depth
    const sabotageClass = (isSabotaged && sabotageEffect?.type === 'visual_distortion')
        ? "animate-shake-hard"
        : "";
    const containerClass = `${baseContainerClass} ${sabotageClass}`;

    // Active Powerup Effects
    const flashBangEffect = room.activeEffects?.find(e => 
        e.type === 'flash_bang' && 
        (e.expiresAt || 0) > Date.now() &&
        e.triggeredBy !== player.id
    );

    // Determine if we should show UI elements (timer/toolbar)
    const showDrawingUI = isMyTimerRunning && !hasSubmitted;

    return (
        <div className={containerClass}>
            {/* Background Bubbles (Ported from Entry Flow for consistency) */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                <div className="bubble bg-white/10 w-64 h-64 -left-10 -top-10 animation-delay-0 blur-xl rounded-full absolute animate-float"></div>
                <div className="bubble bg-purple-500/10 w-96 h-96 right-0 bottom-0 animation-delay-2000 blur-3xl rounded-full absolute animate-float-slow"></div>
            </div>



            {/* Canvas Area - Maximized */}
            <div className="relative w-full h-full max-w-lg mx-auto flex flex-col p-4 pt-32 safe-area-padding">

                {/* Header - Fixed Top (Bento Style) */}
                <DrawingHeader
                    room={room}
                    player={player}
                    onSettings={onShowSettings}
                    onDone={onTimeUp}
                    timerEndsAt={timerEndsAt || Date.now() + 10000}
                    timerDuration={timerDuration}
                    onTimeUp={onTimeUp}
                    hasSubmitted={hasSubmitted}
                    submittedCount={submittedCount}
                    totalPlayers={totalPlayers}
                />
                
                {/* Spacer to push content down (approx height of header + padding) */}
                <div className="h-32 w-full flex-none"></div>

                {/* Spacer for vertical center alignment if needed, or just let flex-1 do it */}

                {/* Main Drawing Surface - Centered in remaining space */}
                <div className="flex-1 w-full flex flex-col items-center justify-center py-2 min-h-0">
                    {/* Zoom container with pinch gesture handlers */}
                    <div
                        {...bind()}
                        className="relative w-[95%] aspect-square"
                        style={{ touchAction: 'none', overflow: 'hidden' }}
                    >
                        {/* Zoom Reset Button */}
                        <ZoomResetButton
                            scale={scale}
                            isVisible={isZoomed && showDrawingUI}
                            onReset={resetZoom}
                        />

                        {/* Zoomable content wrapper */}
                        <div
                            className="relative w-full h-full bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-white/20 ring-4 ring-black/5"
                            style={contentStyle}
                        >
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
                                    className="absolute pointer-events-none shadow-inner"
                                    style={{
                                        left: `${room.block.x}%`,
                                        top: `${room.block.y}%`,
                                        width: `${room.block.size}%`,
                                        height: `${room.block.size}%`,
                                        borderRadius: room.block.type === 'circle' ? '50%' : '12px',
                                        backgroundColor: '#ffffff',
                                        zIndex: 10
                                    }}
                                />
                            )}
                            <GameCanvas
                                    imageUrl={room.currentImage?.url || ''}
                                    brushColor={brushColor}
                                    brushSize={brushSize}
                                    brushType={brushType}
                                    isDrawingEnabled={showDrawingUI && transitionState === 'drawing' && !isPinching}
                                    strokes={strokes}
                                    onStrokesChange={setStrokes}
                                    isEraser={isEraser}
                                    isEyedropper={isEyedropper}
                                    onColorPick={handleColorPick}
                                    zoomScale={scale}
                                    sabotageType={isSabotaged ? sabotageEffect?.type : undefined}
                                />

                            {/* Submitted Overlay */}
                            {hasSubmitted && (
                                <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-30 animate-fade-in">
                                    <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 text-center max-w-xs mx-4 shadow-2xl animate-bounce-gentle border border-white/50 relative overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-tr from-green-400/10 to-transparent pointer-events-none"></div>
                                        <div className="text-6xl mb-4 animate-pulse-slow drop-shadow-md">✅</div>
                                        <h3 className="font-black text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-emerald-600 text-3xl mb-2">Done!</h3>
                                        <p className="text-gray-500 font-bold mb-6">Waiting for others...</p>

                                        {/* List unfinished players */}
                                        {unfinishedPlayers.length > 0 && (
                                            <div className="bg-amber-50 rounded-2xl p-4 border-2 border-amber-100 transition-all duration-300">
                                                <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-3">Still Drawing</p>
                                                <div className="flex flex-col gap-2 items-center">
                                                    <div className="flex flex-wrap justify-center gap-3">
                                                        {unfinishedPlayers.slice(0, 3).map(p => (
                                                            <div key={p.id} className="flex flex-col items-center" title={p.name}>
                                                                <AvatarDisplay
                                                                    strokes={p.avatarStrokes}
                                                                    avatar={p.avatar}
                                                                    color={p.color}
                                                                    backgroundColor={p.backgroundColor}
                                                                    size={40}
                                                                    className="border-2 border-amber-300 shadow-sm mb-1"
                                                                    playerId={p.id}
                                                                />
                                                                <span className="font-bold text-gray-600 text-[10px] bg-white/80 px-2 py-0.5 rounded-full backdrop-blur-sm border border-amber-100 shadow-sm max-w-[80px] truncate">
                                                                    {p.name}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    {unfinishedPlayers.length > 3 && (
                                                        <div className="text-xs font-bold text-amber-600/80 bg-amber-100/50 px-3 py-1 rounded-full mt-1">
                                                            and {unfinishedPlayers.length - 3} more...
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Toolbar - Pinned Bottom */}
                <div
                    className="flex-none w-full mt-auto z-40 transition-all duration-500 ease-out safe-area-bottom-padding"
                    style={{
                        transform: showDrawingUI && transitionState === 'drawing' ? 'translateY(0)' : 'translateY(100px)',
                        opacity: showDrawingUI && transitionState === 'drawing' ? 1 : 0
                    }}
                >
                    <BentoToolbar
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

            </div>

            {/* Transition Overlays */}

            {/* Idle State: "I'm Ready" */}
            {transitionState === 'idle' && !isMyTimerRunning && !hasSubmitted && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 animate-fade-in safe-area-padding">
                    <div className="bg-white/95 backdrop-blur-xl rounded-[2.5rem] p-8 text-center max-w-sm mx-6 shadow-2xl pop-in border-4 border-white/30 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 pointer-events-none"></div>

                        <div className="relative">
                            <div className="text-7xl mb-6 animate-bounce drop-shadow-xl">🎨</div>
                            <h3 className="text-3xl font-black bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent mb-3">Artist Ready?</h3>
                            <p className="text-gray-500 font-medium mb-8 text-lg">
                                You have <span className="text-purple-600 font-bold">{room.settings.timerDuration}s</span> to make a masterpiece.
                            </p>
                            <button
                                onClick={handleReadyClick}
                                disabled={isReadying}
                                className="w-full btn-90s bg-gradient-to-r from-green-400 to-emerald-500 text-white py-5 rounded-2xl font-black text-2xl shadow-green-500/30 shadow-lg border-2 border-white/20 jelly-hover active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
                            >
                                LET'S DRAW! 🚀
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Countdown State: 3D Numbers */}
            {transitionState === 'countdown' && countdownValue > 0 && (
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
                    <div className="text-[12rem] font-black text-white drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)] animate-ping-once rainbow-text" key={countdownValue}>
                        {countdownValue}
                    </div>
                </div>
            )}

            {/* GO! State */}
            {(transitionState === 'go' || transitionState === 'fading') && (
                <div
                    className={`absolute inset-0 bg-gradient-to-br from-lime-400/90 to-emerald-600/90 backdrop-blur-md flex items-center justify-center z-50 transition-opacity duration-500 ${transitionState === 'fading' ? 'backdrop-blur-none' : ''}`}
                    style={{ 
                        opacity: transitionState === 'fading' ? 0 : 1,
                        pointerEvents: transitionState === 'fading' ? 'none' : 'auto'
                    }}
                >
                    <div
                        className="text-9xl font-black text-white drop-shadow-2xl transition-all duration-500 animate-bounce-gentle"
                        style={{
                            transform: transitionState === 'fading' ? 'scale(1.5)' : 'scale(1)',
                            opacity: transitionState === 'fading' ? 0 : 1
                        }}
                    >
                        GO! 🚀
                    </div>
                </div>
            )}
            {/* Sabotage Overlay - Placed last to ensure it overlays everything */}
            <SabotageOverlay 
                isActive={!!isSabotaged} 
                effectName={
                    isSabotaged && sabotageEffect?.type === 'reduce_colors' ? 'Monochrome Madness' :
                    isSabotaged && sabotageEffect?.type === 'visual_distortion' ? 'Shake & Blur' :
                    isSabotaged && sabotageEffect?.type === 'subtract_time' ? 'Time Thief' :
                    undefined
                }
                showBanner={false}
            />

            {/* Flash Bang Effect */}
            {flashBangEffect && (
                <div className="absolute inset-0 z-[60] bg-white animate-pulse pointer-events-none mix-blend-hard-light duration-75" />
            )}

            {/* Powerup HUD - Top Right below header */}
            <div className="absolute top-28 right-4 z-40">
                <PowerupHUD 
                    roomCode={room.roomCode}
                    playerId={player.id}
                    activePowerups={player.activePowerups || []}
                    isDrawing={true}
                />
            </div>
        </div>
    );
};
