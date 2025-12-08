import React from 'react';
import { vibrate } from '../../utils/haptics';

interface BentoToolbarProps {
    brushColor: string;
    brushSize: number;
    brushType?: string;
    isEraser: boolean;
    onColorChange: (color: string) => void;
    onSizeChange: (size: number) => void;
    onTypeChange?: (type: string) => void;
    onEraserToggle: () => void;
    onUndo: () => void;
    onClear: () => void;
    isEyedropper: boolean;
    onEyedropperToggle: () => void;

    // Unlocked items
    availableColors?: { id: string; name: string }[];
    availableBrushes?: { id: string; name: string; emoji: string }[];
}

const SIZES = [
    { label: 'S', size: 5, emoji: '•' },
    { label: 'M', size: 12, emoji: '●' },
    { label: 'L', size: 24, emoji: '⬤' },
];

export const BentoToolbar: React.FC<BentoToolbarProps> = ({
    brushColor,
    brushSize,
    brushType = 'default',
    isEraser,
    onColorChange,
    onSizeChange,
    onTypeChange,
    onEraserToggle,
    onUndo,
    onClear,
    isEyedropper,
    onEyedropperToggle,
    availableColors = [],
    availableBrushes = []
}) => {
    // Determine which colors to show (default if empty/undefined)
    const effectiveColors = availableColors.length > 0 ? availableColors.map(c => c.id) : [
        '#FFFFFF', '#000000', '#FF69B4', '#FF0000', '#FF8C00', '#FFE135', '#32CD32', '#00D9FF', '#4169E1', '#9B59B6'
    ];

    // Glass/Video Game UI Texture primitives
    const cardBase = "bg-black/40 backdrop-blur-xl rounded-3xl border border-white/10 shadow-lg p-2.5 flex flex-col gap-2 relative overflow-hidden";
    const buttonBase = "relative flex items-center justify-center rounded-2xl transition-all active:scale-90 duration-200 touch-manipulation";
    const activeToolClass = "bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.5)] scale-105 z-10 font-black";
    const inactiveToolClass = "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border border-white/5";

    return (
        <div className="w-full max-w-lg mx-auto pointer-events-auto grid grid-cols-4 gap-3 p-2 safe-area-bottom-padding select-none">

            {/* Card 1: Main Tools (Vertical Stack on Left? Or just first column?) 
                Let's try a layout:
                [ Tools (1col) ] [           Palette & Sizes (2cols)           ] [ Actions (1col) ]
            */}

            {/* Column 1: Core Tools (Brush, Eraser, Eyedropper) */}
            <div className={`col-span-1 ${cardBase} items-center justify-between`}>
                <button
                    onClick={() => {
                        vibrate();
                        // Reset to brush (turn off eraser/eyedropper)
                        if (isEraser) onEraserToggle();
                        if (isEyedropper) onEyedropperToggle();
                    }}
                    className={`w-full aspect-square ${!isEraser && !isEyedropper ? activeToolClass : inactiveToolClass} ${buttonBase}`}
                    title="Brush"
                >
                    <span className="text-2xl">🖌️</span>
                </button>

                <button
                    onClick={() => {
                        vibrate();
                        onEraserToggle();
                    }}
                    className={`w-full aspect-square ${isEraser ? activeToolClass : inactiveToolClass} ${buttonBase}`}
                    title="Eraser"
                >
                    <span className="text-2xl">🧼</span>
                </button>

                <button
                    onClick={() => {
                        vibrate();
                        onEyedropperToggle();
                    }}
                    className={`w-full aspect-square ${isEyedropper ? activeToolClass : inactiveToolClass} ${buttonBase}`}
                    title="Eyedropper"
                >
                    <span className="text-2xl">👁️</span>
                </button>
            </div>

            {/* Column 2 & 3: Palette & Properties - The "Console" */}
            <div className={`col-span-2 ${cardBase} gap-3`}>

                {/* Top: Colors Scroll */}
                <div className="w-full h-12 bg-black/20 rounded-2xl p-1.5 overflow-x-auto no-scrollbar flex gap-2 items-center touch-scroll-allowed mask-gradient-x">
                    {effectiveColors.map((color) => {
                        const isSelected = !isEraser && brushColor === color;
                        return (
                            <button
                                key={color}
                                onClick={() => {
                                    vibrate();
                                    onColorChange(color);
                                }}
                                className={`relative flex-shrink-0 rounded-full transition-all duration-300 ${isSelected ? 'scale-110 shadow-lg' : 'hover:scale-110 opacity-80 hover:opacity-100'}`}
                                style={{
                                    backgroundColor: color,
                                    width: isSelected ? '32px' : '28px',
                                    height: isSelected ? '32px' : '28px',
                                    border: isSelected ? '3px solid white' : (color === '#FFFFFF' ? '2px solid #aaa' : '2px solid rgba(255,255,255,0.1)'),
                                }}
                            />
                        );
                    })}
                </div>

                {/* Bottom: Size & Brush Type */}
                <div className="flex flex-1 gap-2">
                    {/* Sizes Segment Control */}
                    <div className="flex-1 bg-black/20 rounded-xl p-1 flex justify-between items-center gap-1">
                        {SIZES.map((s) => (
                            <button
                                key={s.label}
                                onClick={() => {
                                    vibrate();
                                    onSizeChange(s.size);
                                }}
                                className={`h-full flex-1 rounded-lg flex items-center justify-center transition-all ${brushSize === s.size ? 'bg-white text-black shadow-sm font-bold' : 'text-white/40 hover:text-white'}`}
                            >
                                <span style={{ transform: `scale(${s.label === 'S' ? 0.6 : s.label === 'M' ? 0.8 : 1})` }}>
                                    ●
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Brush Type Selector (if available) */}
                    {availableBrushes.length > 1 && onTypeChange && (
                        <div className="flex-1 bg-black/20 rounded-xl p-1 flex gap-1 overflow-x-auto no-scrollbar">
                            {availableBrushes.map((b) => (
                                <button
                                    key={b.id}
                                    onClick={() => {
                                        vibrate();
                                        onTypeChange(b.id);
                                    }}
                                    className={`h-full flex-1 min-w-[30px] rounded-lg flex items-center justify-center transition-all ${brushType === b.id && !isEraser ? 'bg-white text-black shadow-sm' : 'text-white/40 hover:text-white'}`}
                                    title={b.name}
                                >
                                    <span className="text-sm">{b.emoji}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Column 4: Meta Actions (Undo, Clear, etc) */}
            <div className={`col-span-1 ${cardBase} items-center justify-between bg-red-500/5 border-red-200/5`}>
                <button
                    onClick={() => {
                        vibrate();
                        onUndo();
                    }}
                    className={`w-full aspect-square ${buttonBase} bg-white/5 border border-white/5 text-white/80 hover:bg-white/10`}
                    title="Undo"
                >
                    <span className="text-xl">↩️</span>
                </button>

                <div className="h-px w-full bg-white/10"></div>

                <button
                    onClick={() => {
                        vibrate();
                        onClear();
                    }}
                    className={`w-full aspect-square ${buttonBase} bg-red-500/10 border border-red-500/20 text-red-300 hover:bg-red-500/20`}
                    title="Clear"
                >
                    <span className="text-xl">🗑️</span>
                </button>
            </div>

        </div>
    );
}
