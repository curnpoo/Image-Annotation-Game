import React, { useState } from 'react';
import { GameCanvas } from '../game/GameCanvas';
import { Toolbar } from '../game/Toolbar';
import type { Player, DrawingStroke } from '../../types';
import { vibrate, HapticPatterns } from '../../utils/haptics';
import { CosmeticsService } from '../../services/cosmetics';

interface AvatarEditorScreenProps {
    player: Player;
    onSave: (strokes: DrawingStroke[], color: string, frame: string) => void;
    onCancel: () => void;
}

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
    const [brushSize, setBrushSize] = useState(8);
    const [brushType, setBrushType] = useState('default');
    const [isEraser, setIsEraser] = useState(false);
    const [isEyedropper, setIsEyedropper] = useState(false);
    const [history, setHistory] = useState<DrawingStroke[][]>([player.avatarStrokes || []]);

    // Data from Cosmetics
    const availableBrushes = CosmeticsService.getAllBrushes();
    const availableColors = CosmeticsService.getAllColors();

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

    const handleClear = () => {
        setStrokes([]);
        setHistory([[]]);
        vibrate(HapticPatterns.light);
    };

    const handleSave = () => {
        const frameClass = FRAMES.find(f => f.id === selectedFrame)?.class || '';
        onSave(strokes, brushColor, frameClass);
        vibrate(HapticPatterns.success);
    };

    return (
        <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col safe-area-inset-top">
            {/* Header */}
            <div className="flex items-center justify-between px-4 pb-4 bg-gray-800/80 backdrop-blur"
                style={{ paddingTop: 'max(1rem, env(safe-area-inset-top) + 1rem)' }}>
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
                        imageUrl=""
                        brushColor={brushColor}
                        brushSize={brushSize}
                        brushType={brushType}
                        isDrawingEnabled={true}
                        strokes={strokes}
                        onStrokesChange={handleStrokesChange}
                        isEraser={isEraser}
                        isEyedropper={isEyedropper}
                        onColorPick={(c) => {
                            setBrushColor(c);
                            setIsEraser(false);
                            setIsEyedropper(false);
                        }}
                    />
                </div>
            </div>

            {/* Tools Area using Toolbar */}
            <div className="bg-gray-800 px-4 pb-8 safe-area-inset-bottom space-y-4">

                {/* Frames - Unique to Avatar Editor, kept separate */}
                <div className="overflow-x-auto no-scrollbar">
                    <div className="flex gap-2 min-w-min px-2 justify-center">
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

                <Toolbar
                    brushColor={brushColor}
                    brushSize={brushSize}
                    brushType={brushType}
                    isEraser={isEraser}
                    isEyedropper={isEyedropper}
                    onColorChange={(c) => {
                        setBrushColor(c);
                        setIsEraser(false);
                        setIsEyedropper(false);
                    }}
                    onSizeChange={setBrushSize}
                    onTypeChange={(t) => {
                        setBrushType(t);
                        setIsEraser(false);
                        setIsEyedropper(false);
                    }}
                    onEraserToggle={() => {
                        setIsEraser(!isEraser);
                        setIsEyedropper(false);
                    }}
                    onEyedropperToggle={() => {
                        setIsEyedropper(!isEyedropper);
                        setIsEraser(false);
                    }}
                    onUndo={handleUndo}
                    onClear={handleClear}
                    availableColors={availableColors}
                    availableBrushes={availableBrushes}
                />
            </div>
        </div>
    );
};
