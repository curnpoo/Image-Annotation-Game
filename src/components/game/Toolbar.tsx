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
        { id: 'default', name: 'Simple', emoji: '🖊️' }
    ];

    // Consistent button style for toolbar
    const toolButtonBase = "w-12 h-12 rounded-xl shadow-md flex items-center justify-center text-xl active:scale-95 transition-all";
    const toolButtonDefault = `${toolButtonBase} bg-gray-50 border-2 border-gray-200 text-gray-600 hover:bg-gray-100`;
    const toolButtonDanger = `${toolButtonBase} bg-red-50 border-2 border-red-200 text-red-600 hover:bg-red-100`;

    return (
        <div className="flex flex-col items-center gap-2 w-full max-w-md mx-auto pointer-events-auto">

            {/* Brushes Row (if more than 1) - ABOVE colors */}
            {effectiveBrushes.length > 1 && onTypeChange && (
                <div className="rounded-2xl p-2 shadow-xl w-full animate-slide-up overflow-x-auto no-scrollbar touch-scroll-allowed" style={{ backgroundColor: 'var(--theme-card-bg)', border: '2px solid var(--theme-accent)' }}>
                    <div className="flex gap-2 justify-center min-w-min">
                        {effectiveBrushes.map(brush => (
                            <button
                                key={brush.id}
                                onClick={() => {
                                    vibrate();
                                    onTypeChange(brush.id);
                                }}
                                className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all whitespace-nowrap font-bold ${brushType === brush.id && !isEraser
                                    ? 'text-white shadow-lg'
                                    : 'hover:opacity-80'}`}
                                style={{
                                    backgroundColor: brushType === brush.id && !isEraser ? 'var(--theme-accent)' : 'var(--theme-bg-secondary)',
                                    color: brushType === brush.id && !isEraser ? '#000' : 'var(--theme-text-secondary)'
                                }}
                            >
                                <span className="text-lg">{brush.emoji}</span>
                                <span className="text-sm">{brush.name}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Colors - 2-Row Grid for Fast Access */}
            <div className="rounded-2xl px-3 py-3 shadow-xl w-full animate-slide-up" style={{ backgroundColor: 'var(--theme-card-bg)', border: '2px solid var(--theme-accent)' }}>
                <div className="grid grid-cols-5 gap-3 justify-items-center">
                    {effectiveColors.map((color) => {
                        const isSelected = !isEraser && brushColor === color;
                        return (
                            <button
                                key={color}
                                onClick={() => {
                                    vibrate();
                                    onColorChange(color);
                                }}
                                className="rounded-full transition-all flex-shrink-0"
                                style={{
                                    backgroundColor: color,
                                    border: isSelected ? '3px solid white' : (color === '#FFFFFF' ? '2px solid #aaa' : '2px solid rgba(0,0,0,0.15)'),
                                    boxShadow: isSelected ? '0 0 0 3px var(--theme-accent), 0 4px 12px rgba(0,0,0,0.3)' : '0 2px 4px rgba(0,0,0,0.1)',
                                    width: isSelected ? '48px' : '40px',
                                    height: isSelected ? '48px' : '40px',
                                    transform: isSelected ? 'scale(1.15)' : 'scale(1)',
                                }}
                            />
                        );
                    })}
                </div>
            </div>

            {/* Controls Bar */}
            <div className="rounded-2xl p-3 flex items-center justify-between w-full shadow-lg" style={{ backgroundColor: 'var(--theme-card-bg)', border: '2px solid var(--theme-border)' }}>
                {/* Sizes */}
                <div className="flex gap-2">
                    {SIZES.map((s) => (
                        <button
                            key={s.label}
                            onClick={() => {
                                vibrate();
                                onSizeChange(s.size);
                            }}
                            className="w-12 h-12 rounded-xl font-bold flex items-center justify-center transition-all text-lg"
                            style={{
                                backgroundColor: brushSize === s.size ? 'var(--theme-accent)' : 'var(--theme-bg-secondary)',
                                color: brushSize === s.size ? '#000' : 'var(--theme-text-secondary)',
                                border: brushSize === s.size ? '2px solid var(--theme-accent)' : '2px solid var(--theme-border)',
                                boxShadow: brushSize === s.size ? '0 4px 8px rgba(0,0,0,0.2)' : 'none'
                            }}
                        >
                            {s.emoji}
                        </button>
                    ))}
                </div>

                {/* Divider */}
                <div className="w-px h-10 mx-2" style={{ backgroundColor: 'var(--theme-border)' }} />

                {/* Action Tools */}
                <div className="flex gap-2">
                    <button
                        onClick={() => {
                            vibrate();
                            onUndo();
                        }}
                        className={toolButtonDefault}
                        title="Undo"
                    >
                        ↩️
                    </button>
                    <button
                        onClick={() => {
                            vibrate();
                            onClear();
                        }}
                        className={toolButtonDanger}
                        title="Clear All"
                    >
                        🗑️
                    </button>
                </div>

                {/* Divider */}
                <div className="w-px h-10 mx-2" style={{ backgroundColor: 'var(--theme-border)' }} />

                {/* Selection Tools */}
                <div className="flex gap-2">
                    <button
                        onClick={() => {
                            vibrate();
                            onEyedropperToggle();
                        }}
                        className={`${toolButtonBase} border-2`}
                        style={{
                            backgroundColor: isEyedropper ? '#cffafe' : 'var(--theme-bg-secondary)',
                            borderColor: isEyedropper ? '#22d3ee' : 'var(--theme-border)',
                            boxShadow: isEyedropper ? '0 0 0 2px #22d3ee' : 'none'
                        }}
                        title="Eyedropper"
                    >
                        👁️
                    </button>
                    <button
                        onClick={() => {
                            vibrate();
                            onEraserToggle();
                        }}
                        className={`${toolButtonBase} border-2`}
                        style={{
                            backgroundColor: isEraser ? '#fce7f3' : 'var(--theme-bg-secondary)',
                            borderColor: isEraser ? '#f472b6' : 'var(--theme-border)',
                            boxShadow: isEraser ? '0 0 0 2px #f472b6' : 'none'
                        }}
                        title="Eraser"
                    >
                        🧼
                    </button>
                </div>
            </div>
        </div>
    );
};

