import React from 'react';

interface ToolbarProps {
    brushColor: string;
    brushSize: number;
    onColorChange: (color: string) => void;
    onSizeChange: (size: number) => void;
    onUndo: () => void;
    onClear: () => void;
}

const COLORS = [
    '#FF69B4', // Hot Pink
    '#FF0000', // Red
    '#FF8C00', // Orange
    '#FFE135', // Yellow
    '#32CD32', // Lime Green
    '#00D9FF', // Cyan
    '#4169E1', // Blue
    '#9B59B6', // Purple
    '#000000', // Black
    '#FFFFFF', // White
];

const SIZES = [
    { label: 'S', size: 3, emoji: '✏️' },
    { label: 'M', size: 8, emoji: '🖊️' },
    { label: 'L', size: 15, emoji: '🖌️' },
];

export const Toolbar: React.FC<ToolbarProps> = ({
    brushColor,
    brushSize,
    onColorChange,
    onSizeChange,
    onUndo,
    onClear,
}) => {
    return (
        <div className="rounded-[1.5rem] p-2 sm:p-3 flex items-center justify-between gap-2 sm:gap-3 w-full max-w-lg overflow-x-auto gpu-accelerate"
            style={{
                background: 'linear-gradient(135deg, #fff 0%, #f8f4ff 100%)',
                boxShadow: '0 -5px 30px rgba(155, 89, 182, 0.2), 0 8px 0 rgba(155, 89, 182, 0.2)',
                border: '4px solid transparent',
                backgroundImage: 'linear-gradient(white, white), linear-gradient(135deg, #FF69B4, #9B59B6, #00D9FF)',
                backgroundOrigin: 'border-box',
                backgroundClip: 'padding-box, border-box'
            }}>

            {/* Sizes */}
            <div className="flex space-x-1 sm:space-x-2 pr-2 sm:pr-3 border-r-4 border-dashed border-pink-200">
                {SIZES.map((s) => (
                    <button
                        key={s.label}
                        onClick={() => onSizeChange(s.size)}
                        className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl font-bold flex items-center justify-center transition-all jelly-hover text-sm sm:text-base ${brushSize === s.size
                            ? 'bg-gradient-to-br from-pink-500 to-purple-500 text-white scale-110'
                            : 'bg-gradient-to-br from-pink-100 to-purple-100 text-purple-600 hover:scale-105'
                            }`}
                        style={{
                            boxShadow: brushSize === s.size
                                ? '0 4px 0 rgba(155, 89, 182, 0.4)'
                                : '0 3px 0 rgba(155, 89, 182, 0.2)'
                        }}
                    >
                        {s.emoji}
                    </button>
                ))}
            </div>

            {/* Colors - scrollable row */}
            <div className="flex space-x-1 sm:space-x-2 flex-1 justify-center overflow-x-auto py-1 stagger-children">
                {COLORS.map((color) => (
                    <button
                        key={color}
                        onClick={() => onColorChange(color)}
                        className={`w-7 h-7 sm:w-9 sm:h-9 rounded-full transition-all flex-shrink-0 pop-in ${brushColor === color
                            ? 'scale-125 ring-2 sm:ring-4 ring-purple-400 ring-offset-1 sm:ring-offset-2'
                            : 'hover:scale-110'
                            }`}
                        style={{
                            backgroundColor: color,
                            boxShadow: brushColor === color
                                ? `0 0 15px ${color}, 0 3px 0 rgba(0,0,0,0.2)`
                                : `0 2px 0 rgba(0,0,0,0.2)`,
                            border: color === '#FFFFFF' ? '2px solid #ddd' : 'none'
                        }}
                    />
                ))}
            </div>

            {/* Actions */}
            <div className="flex space-x-1 sm:space-x-2 pl-2 sm:pl-3 border-l-4 border-dashed border-pink-200">
                <button
                    onClick={onUndo}
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-br from-yellow-100 to-orange-100 text-lg sm:text-xl flex items-center justify-center transition-all hover:scale-105 jelly-hover"
                    style={{
                        boxShadow: '0 3px 0 rgba(255, 140, 0, 0.3)'
                    }}
                    title="Undo"
                >
                    ↩️
                </button>
                <button
                    onClick={onClear}
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-br from-red-100 to-pink-100 text-lg sm:text-xl flex items-center justify-center transition-all hover:scale-105 jelly-hover"
                    style={{
                        boxShadow: '0 3px 0 rgba(255, 105, 180, 0.3)'
                    }}
                    title="Clear"
                >
                    🗑️
                </button>
            </div>
        </div>
    );
};
