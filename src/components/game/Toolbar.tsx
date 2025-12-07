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
        { id: 'default', name: 'Standard', emoji: '🖊️' }
    ];

    return (
        <div className="flex flex-col items-center gap-2 w-full max-w-md mx-auto pointer-events-auto">

            {/* Brushes Row (if more than 1) - ABOVE colors */}
            {effectiveBrushes.length > 1 && onTypeChange && (
                <div className="bg-white rounded-2xl p-2 shadow-xl border-2 border-purple-500 w-full animate-slide-up overflow-x-auto no-scrollbar">
                    <div className="flex gap-2 justify-center min-w-min">
                        {effectiveBrushes.map(brush => (
                            <button
                                key={brush.id}
                                onClick={() => {
                                    vibrate();
                                    onTypeChange(brush.id);
                                }}
                                className={`px-3 py-1 rounded-xl flex items-center gap-1 transition-all whitespace-nowrap ${brushType === brush.id && !isEraser
                                    ? 'bg-purple-500 text-white shadow-md'
                                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                            >
                                <span className="text-lg">{brush.emoji}</span>
                                <span className="text-xs font-bold">{brush.name}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Colors - 2-Row Grid for Fast Access */}
            <div className="bg-white rounded-2xl px-3 py-2 shadow-xl border-2 border-purple-500 w-full animate-slide-up">
                <div className="grid grid-cols-5 gap-3 justify-items-center">
                    {effectiveColors.map((color) => (
                        <button
                            key={color}
                            onClick={() => {
                                vibrate();
                                onColorChange(color);
                            }}
                            className={`rounded-full transition-all flex-shrink-0 ${!isEraser && brushColor === color
                                ? 'scale-105 ring-2 ring-purple-400 ring-offset-2'
                                : 'hover:scale-105 active:scale-95'
                                }`}
                            style={{
                                backgroundColor: color,
                                border: color === '#FFFFFF' ? '2px solid #ccc' : '2px solid rgba(0,0,0,0.1)',
                                boxShadow: !isEraser && brushColor === color ? '0 0 8px rgba(155, 89, 182, 0.5)' : 'none',
                                width: '40px',
                                height: '40px',
                            }}
                        />
                    ))}
                </div>
            </div>

            {/* Controls Bar */}
            <div className="bg-white rounded-2xl p-2 flex items-center gap-1 w-full shadow-lg border-2 border-purple-200">
                {/* Sizes */}
                <div className="flex gap-1">
                    {SIZES.map((s) => (
                        <button
                            key={s.label}
                            onClick={() => {
                                vibrate();
                                onSizeChange(s.size);
                            }}
                            className={`w-9 h-9 rounded-xl font-bold flex items-center justify-center transition-all ${brushSize === s.size
                                ? 'bg-purple-500 text-white shadow-md'
                                : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                                }`}
                        >
                            {s.emoji}
                        </button>
                    ))}
                </div>

                {/* Divider */}
                <div className="w-px h-8 bg-gray-200 mx-1" />

                {/* Action Tools */}
                <div className="flex gap-1">
                    <button
                        onClick={() => {
                            vibrate();
                            onUndo();
                        }}
                        className="w-10 h-10 bg-white rounded-xl shadow-md flex items-center justify-center text-lg active:scale-95 transition-transform border border-gray-100"
                        title="Undo"
                    >
                        ↩️
                    </button>
                    <button
                        onClick={() => {
                            vibrate();
                            onClear();
                        }}
                        className="w-10 h-10 bg-red-50 text-red-600 rounded-xl shadow-md flex items-center justify-center text-lg active:scale-95 transition-transform border border-red-100"
                        title="Clear All"
                    >
                        🗑️
                    </button>
                </div>

                {/* Divider */}
                <div className="w-px h-8 bg-gray-200 mx-1" />

                {/* Selection Tools */}
                <div className="flex gap-1">
                    <button
                        onClick={() => {
                            vibrate();
                            onEyedropperToggle();
                        }}
                        className={`w-10 h-10 rounded-xl shadow-md flex items-center justify-center text-lg active:scale-95 transition-all border ${isEyedropper
                            ? 'bg-cyan-100 border-cyan-400 ring-2 ring-cyan-300'
                            : 'bg-white border-gray-100'
                            }`}
                        title="Eyedropper"
                    >
                        👁️
                    </button>
                    <button
                        onClick={() => {
                            vibrate();
                            onEraserToggle();
                        }}
                        className={`w-10 h-10 rounded-xl shadow-md flex items-center justify-center text-lg active:scale-95 transition-all border ${isEraser
                            ? 'bg-pink-100 border-pink-400 ring-2 ring-pink-300'
                            : 'bg-white border-gray-100'
                            }`}
                        title="Eraser"
                    >
                        🧼
                    </button>
                </div>
            </div>
        </div>
    );
};

