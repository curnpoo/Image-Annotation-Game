import React from 'react';
import { vibrate } from '../../utils/haptics';

interface ToolbarProps {
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

export const Toolbar: React.FC<ToolbarProps> = ({
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

    // Determine brushes (always have default if empty)
    const effectiveBrushes = availableBrushes.length > 0 ? availableBrushes : [
        { id: 'default', name: 'Simple', emoji: '🖊️' } // Default brush
    ];

    // Glassmorphic button styles
    const buttonBase = "relative flex items-center justify-center rounded-xl transition-all active:scale-90 duration-200";
    const glassButton = `${buttonBase} bg-white/10 border border-white/20 text-white/90 hover:bg-white/20`;
    const glassButtonActive = `${buttonBase} bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.4)] scale-105 border-transparent`;
    const glassButtonDanger = `${buttonBase} bg-red-500/20 border border-red-500/30 text-red-200 hover:bg-red-500/40`;

    return (
        <div className="flex flex-col gap-2 w-full max-w-sm mx-auto pointer-events-auto">

            {/* Main Glass Island */}
            <div className="glass-panel p-2 rounded-[1.5rem] flex flex-col gap-2 shadow-2xl backdrop-blur-xl border border-white/20 transition-all">

                {/* Top Row: Colors (Scrollable) */}
                <div className="w-full overflow-x-auto no-scrollbar pb-1 pt-1 px-1 touch-scroll-allowed">
                    <div className="flex gap-2 min-w-min mx-auto bg-black/20 rounded-2xl p-2 inset-shadow">
                        {effectiveColors.map((color) => {
                            const isSelected = !isEraser && brushColor === color;
                            return (
                                <button
                                    key={color}
                                    onClick={() => {
                                        vibrate();
                                        onColorChange(color);
                                    }}
                                    className={`relative rounded-full transition-all duration-300 flex-shrink-0 ${isSelected ? 'scale-110 shadow-lg' : 'hover:scale-110'}`}
                                    style={{
                                        backgroundColor: color,
                                        width: isSelected ? '36px' : '32px',
                                        height: isSelected ? '36px' : '32px',
                                        border: isSelected ? '3px solid white' : (color === '#FFFFFF' ? '2px solid #aaa' : '2px solid rgba(255,255,255,0.2)'),
                                        boxShadow: isSelected ? '0 0 10px rgba(0,0,0,0.3)' : 'none'
                                    }}
                                />
                            );
                        })}
                    </div>
                </div>

                {/* Middle Row: Tools & Sizes */}
                <div className="flex items-stretch justify-between gap-2 h-12">

                    {/* Sizes Group */}
                    <div className="flex bg-black/20 rounded-xl p-1 gap-1 flex-1 justify-center">
                        {SIZES.map((s) => (
                            <button
                                key={s.label}
                                onClick={() => {
                                    vibrate();
                                    onSizeChange(s.size);
                                }}
                                className={`w-10 h-full rounded-lg text-lg font-bold flex items-center justify-center transition-all ${brushSize === s.size ? 'bg-white text-black shadow-md' : 'text-white/50 hover:text-white hover:bg-white/10'}`}
                            >
                                <span style={{ transform: `scale(${s.label === 'S' ? 0.6 : s.label === 'M' ? 0.8 : 1})` }}>
                                    ●
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Tools Group */}
                    <div className="flex gap-1 flex-1 justify-between">
                        <button
                            onClick={() => {
                                vibrate();
                                onEraserToggle();
                            }}
                            className={`flex-1 ${isEraser ? glassButtonActive : glassButton}`}
                            title="Eraser"
                        >
                            <span className="text-lg">🧼</span>
                        </button>
                        <button
                            onClick={() => {
                                vibrate();
                                onEyedropperToggle();
                            }}
                            className={`flex-1 ${isEyedropper ? glassButtonActive : glassButton}`}
                            title="Eyedropper"
                        >
                            <span className="text-lg">👁️</span>
                        </button>
                    </div>
                </div>

                {/* Bottom Row: Actions & Brushes */}
                <div className="flex items-center gap-2 h-12">
                    {/* Brushes (Dropdown-like or scroll if many) */}
                    {effectiveBrushes.length > 1 && onTypeChange ? (
                        <div className="flex-1 overflow-x-auto no-scrollbar rounded-xl bg-black/20 p-1 flex gap-1 items-center touch-scroll-allowed">
                            {effectiveBrushes.map(brush => (
                                <button
                                    key={brush.id}
                                    onClick={() => {
                                        vibrate();
                                        onTypeChange(brush.id);
                                    }}
                                    className={`px-3 h-full rounded-lg flex items-center gap-1 whitespace-nowrap transition-all ${brushType === brush.id && !isEraser
                                        ? 'bg-white text-black shadow-sm font-bold'
                                        : 'text-white/60 hover:text-white hover:bg-white/10'}`}
                                >
                                    <span>{brush.emoji}</span>
                                    <span className="text-xs">{brush.name}</span>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="flex-1"></div> // Spacer
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => {
                                vibrate();
                                onUndo();
                            }}
                            className={`${glassButton} w-12 h-12 !rounded-xl !border-white/10 bg-white/5`}
                            title="Undo"
                        >
                            <span className="text-xl">↩️</span>
                        </button>
                        <button
                            onClick={() => {
                                vibrate();
                                onClear();
                            }}
                            className={`${glassButtonDanger} w-12 h-12 !rounded-xl`}
                            title="Clear All"
                        >
                            <span className="text-xl">🗑️</span>
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

