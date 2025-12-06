import React, { useState } from 'react';
import { GameCanvas } from '../game/GameCanvas';
import type { Player, DrawingStroke } from '../../types';
import { vibrate, HapticPatterns } from '../../utils/haptics';

interface AvatarEditorScreenProps {
    player: Player;
    onSave: (strokes: DrawingStroke[], color: string, frame: string) => void;
    onCancel: () => void;
}

const COLORS = ['#FF69B4', '#9B59B6', '#3498DB', '#1ABC9C', '#F1C40F', '#E67E22', '#E74C3C', '#34495E', '#000000'];

const FRAMES = [
    { id: 'none', name: 'Simple', class: '' },
    { id: 'glow', name: 'Glow', class: 'shadow-[0_0_15px_currentColor]' },
    { id: 'border', name: 'Bold', class: 'border-4 border-current' },
    { id: 'dash', name: 'Dash', class: 'border-4 border-dashed border-current' },
    { id: 'double', name: 'Double', class: 'border-double border-8 border-current' },
    { id: 'ring', name: 'Ring', class: 'ring-4 ring-current ring-offset-2' }
];

export const AvatarEditorScreen: React.FC<AvatarEditorScreenProps> = ({
    player,
    onSave,
    onCancel
}) => {
    const [strokes, setStrokes] = useState<DrawingStroke[]>(player.avatarStrokes || []);
    const [brushColor, setBrushColor] = useState(player.color || '#FF69B4');
    const [selectedFrame, setSelectedFrame] = useState(FRAMES.find(f => f.class === player.frame)?.id || 'none');
    const [brushSize] = useState(8);
    const [isEraser, setIsEraser] = useState(false);
    const [history, setHistory] = useState<DrawingStroke[][]>([player.avatarStrokes || []]);

    const handleStrokesChange = (newStrokes: DrawingStroke[]) => {
        setStrokes(newStrokes);
        // Add to history if different
        if (JSON.stringify(newStrokes) !== JSON.stringify(history[history.length - 1])) {
            const newHistory = [...history, newStrokes];
            if (newHistory.length > 20) newHistory.shift(); // Limit history
            setHistory(newHistory);
        }
    };

    const handleUndo = () => {
        if (history.length > 1) {
            const newHistory = history.slice(0, -1);
            setHistory(newHistory);
            setStrokes(newHistory[newHistory.length - 1]);
            vibrate(HapticPatterns.light);
        }
    };

    const handleSave = () => {
        const frameClass = FRAMES.find(f => f.id === selectedFrame)?.class || '';
        onSave(strokes, brushColor, frameClass);
        vibrate(HapticPatterns.success);
    };

    return (
        <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col safe-area-inset-top">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-gray-800/80 backdrop-blur">
                <button
                    onClick={onCancel}
                    className="px-4 py-2 text-white font-bold bg-white/10 rounded-xl hover:bg-white/20 transition-all"
                >
                    Cancel
                </button>
                <h2 className="text-xl font-black text-white">Edit Avatar</h2>
                <button
                    onClick={handleSave}
                    className="px-6 py-2 bg-green-500 text-white font-bold rounded-xl shadow-lg hover:bg-green-600 active:scale-95 transition-all"
                >
                    Save
                </button>
            </div>

            {/* Canvas Area */}
            <div className="flex-1 relative bg-gray-800 flex items-center justify-center p-4">
                <div className="relative aspect-square w-full max-w-sm rounded-[2rem] overflow-hidden bg-white shadow-2xl">
                    <div className={`absolute inset-0 pointer-events-none z-10 rounded-[2rem] ${FRAMES.find(f => f.id === selectedFrame)?.class}`} style={{ color: brushColor }}></div>
                    <GameCanvas
                        imageUrl="" // No background image for avatar
                        brushColor={brushColor}
                        brushSize={brushSize}
                        isDrawingEnabled={true}
                        strokes={strokes}
                        onStrokesChange={handleStrokesChange}
                        isEraser={isEraser}
                    />
                </div>
            </div>

            {/* Tools Area */}
            <div className="bg-gray-800 p-4 space-y-4 pb-8 safe-area-inset-bottom">

                {/* Tools Row */}
                <div className="flex items-center justify-center gap-4">
                    <button
                        onClick={handleUndo}
                        disabled={history.length <= 1}
                        className={`p-3 rounded-xl transition-all ${history.length <= 1 ? 'bg-white/5 text-white/30' : 'bg-white/10 text-white hover:bg-white/20'}`}
                    >
                        ↩ Undo
                    </button>

                    <button
                        onClick={() => setIsEraser(!isEraser)}
                        className={`p-3 rounded-xl font-bold transition-all ${isEraser ? 'bg-red-500 text-white shadow-lg scale-105' : 'bg-white/10 text-white hover:bg-white/20'}`}
                    >
                        🧽 Eraser
                    </button>

                    <button
                        onClick={() => {
                            setStrokes([]);
                            setHistory([[]]);
                        }}
                        className="p-3 bg-white/10 text-red-400 rounded-xl font-bold hover:bg-white/20 hover:text-red-300 transition-all"
                    >
                        🗑 Clear
                    </button>
                </div>

                {/* Colors */}
                <div className="flex justify-center gap-2 overflow-x-auto py-2">
                    {COLORS.map(c => (
                        <button
                            key={c}
                            onClick={() => {
                                setBrushColor(c);
                                setIsEraser(false);
                            }}
                            className={`w-10 h-10 rounded-full border-2 transition-all ${brushColor === c && !isEraser ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-80'}`}
                            style={{ backgroundColor: c }}
                        />
                    ))}
                </div>

                {/* Frames */}
                <div className="overflow-x-auto">
                    <div className="flex gap-2 min-w-min px-2">
                        {FRAMES.map(f => (
                            <button
                                key={f.id}
                                onClick={() => setSelectedFrame(f.id)}
                                className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${selectedFrame === f.id ? 'bg-purple-500 text-white shadow-lg' : 'bg-white/10 text-white hover:bg-white/20'}`}
                            >
                                {f.name}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
