import React, { useState } from 'react';
import { GameCanvas } from '../game/GameCanvas';
import { Toolbar } from '../game/Toolbar';
import { ZoomResetButton } from '../game/ZoomResetButton';
import type { Player, DrawingStroke } from '../../types';
import { vibrate, HapticPatterns } from '../../utils/haptics';
import { CosmeticsService } from '../../services/cosmetics';
import { AvatarService } from '../../services/avatarService';
import { useZoomPan } from '../../hooks/useZoomPan';
import { FRAMES, THEMES } from '../../constants/cosmetics';

interface AvatarEditorScreenProps {
    player: Player;
    onSave: (strokes: DrawingStroke[], color: string, backgroundColor: string, frame: string, avatarImageUrl?: string) => void;
    onCancel: () => void;
}

export const AvatarEditorScreen: React.FC<AvatarEditorScreenProps> = ({
    player,
    onSave,
    onCancel
}) => {
    const [strokes, setStrokes] = useState<DrawingStroke[]>(player.avatarStrokes || []);
    const [brushColor, setBrushColor] = useState(player.color || '#FF69B4');
    // New state for background color
    const [backgroundColor, setBackgroundColor] = useState(player.backgroundColor || '#ffffff');
    const [selectedFrame, setSelectedFrame] = useState(player.frame || 'none');
    const [brushSize, setBrushSize] = useState(8);
    const [brushType, setBrushType] = useState('default');
    const [isEraser, setIsEraser] = useState(false);
    const [isEyedropper, setIsEyedropper] = useState(false);
    const [history, setHistory] = useState<DrawingStroke[][]>([player.avatarStrokes || []]);
    // Toggle for color picker mode (brush vs background)
    const [colorMode, setColorMode] = useState<'brush' | 'background'>('brush');


    // Data from Cosmetics
    const availableBrushes = CosmeticsService.getAllBrushes();
    const availableColors = CosmeticsService.getAllColors();

    const backgroundOptions = [
        ...availableColors.map(c => ({ id: c.id, name: c.name, value: c.id, preview: '', type: 'color' })),
        ...THEMES.map(t => ({ id: t.id, name: t.name, value: t.value, preview: t.preview, type: 'theme' }))
    ];

    // iOS-like pinch-to-zoom for canvas
    const { scale, isZoomed, isPinching, resetZoom, bind, contentStyle } = useZoomPan({
        minScale: 1,
        maxScale: 4
    });

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


        // Render avatar to image for display with proper brush effects
        const avatarImageUrl = AvatarService.renderToDataUrl(
            strokes,
            'transparent', // Use transparent background for the image to allow dynamic background changes in UI
            200
        );

        // Pass background color to save
        onSave(strokes, brushColor, backgroundColor, selectedFrame, avatarImageUrl);
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
                {/* Zoom container with pinch gesture handlers */}
                <div
                    {...bind()}
                    className="relative aspect-square w-full max-w-sm"
                    style={{ touchAction: 'none', overflow: 'hidden' }}
                >
                    {/* Zoom Reset Button */}
                    <ZoomResetButton
                        scale={scale}
                        isVisible={isZoomed}
                        onReset={resetZoom}
                    />

                    {/* Zoomable content wrapper */}
                    <div
                        className="relative w-full h-full rounded-3xl overflow-hidden shadow-2xl"
                        style={{ ...contentStyle, background: backgroundColor }} // Changed to background for gradients
                    >
                        {/* Frame Overlay */}
                        <div className={`absolute inset-0 pointer-events-none z-10 rounded-3xl ${FRAMES.find(f => f.id === selectedFrame)?.className || ''}`}></div>
                        
                        <GameCanvas
                            imageUrl=""
                            brushColor={brushColor}
                            brushSize={brushSize}
                            brushType={brushType}
                            isDrawingEnabled={!isPinching}
                            strokes={strokes}
                            onStrokesChange={handleStrokesChange}
                            isEraser={isEraser}
                            isEyedropper={isEyedropper}
                            onColorPick={(c) => {
                                setBrushColor(c);
                                setIsEraser(false);
                                setIsEyedropper(false);
                            }}
                            zoomScale={scale}
                        />
                    </div>
                </div>
            </div>

            {/* Tools Area using Toolbar */}
            <div className="bg-gray-800 px-4 pb-8 safe-area-inset-bottom space-y-4">
                
                {/* Mode Switcher (Brush / Theme) */}
                <div className="flex justify-center gap-4">
                     <button
                        onClick={() => setColorMode('brush')}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${colorMode === 'brush' ? 'bg-blue-500 text-white shadow-lg' : 'bg-white/10 text-white hover:bg-white/20'}`}
                    >
                        🖌️ Brush
                    </button>
                    <button
                        onClick={() => setColorMode('background')}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${colorMode === 'background' ? 'bg-blue-500 text-white shadow-lg' : 'bg-white/10 text-white hover:bg-white/20'}`}
                    >
                        🎨 Theme
                    </button>
                </div>

                {/* Frames - More prominent UI - Filtered by Ownership */}
                <div className="overflow-x-auto no-scrollbar py-2">
                    <div className="flex gap-3 min-w-min px-2">
                        {FRAMES.filter(f => f.price === 0 || CosmeticsService.isUnlocked(f.id, f.price)).map(f => (
                            <button
                                key={f.id}
                                onClick={() => setSelectedFrame(f.id)}
                                className={`flex flex-col items-center gap-1 min-w-[4.5rem] p-2 rounded-xl transition-all border-2 
                                    ${selectedFrame === f.id ? 'bg-purple-500/20 border-purple-500' : 'bg-gray-700/50 border-transparent hover:bg-gray-700'}`}
                            >
                                <div className={`w-10 h-10 rounded-full bg-gray-800 ${f.className || ''} flex items-center justify-center text-lg`}>
                                    {f.id !== 'none' && !f.className?.includes('border') && !f.className?.includes('shadow') ? f.preview : null}
                                </div>
                                <span className="text-[10px] font-bold text-gray-300 whitespace-nowrap">{f.name}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className={colorMode === 'background' ? 'pointer-events-none opacity-50 blur-sm transition-all' : 'transition-all'}>
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

                     {/* Theme/Background Picker (Overlay when mode is background) */}
                 {colorMode === 'background' && (
                     <div className="absolute bottom-8 left-4 right-4 bg-gray-900/95 backdrop-blur-xl p-4 rounded-3xl shadow-2xl border border-white/10 animate-fade-in z-20">
                         <h3 className="text-white font-bold mb-3 text-center">Choose Theme</h3>
                         <div className="grid grid-cols-5 gap-3 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                             {backgroundOptions
                                .filter(o => o.type === 'color' || (o.type === 'theme' && CosmeticsService.isUnlocked(o.id, THEMES.find(t => t.id === o.id)?.price || 0)))
                                .map(option => (
                                 <button
                                     key={option.id}
                                     onClick={() => setBackgroundColor(option.value)}
                                     className={`aspect-square rounded-full border-2 transition-all relative overflow-hidden group
                                        ${backgroundColor === option.value ? 'border-white scale-110 shadow-lg' : 'border-transparent hover:scale-105'}`}
                                     style={{ background: option.value }}
                                     aria-label={option.name}
                                 >
                                    {option.preview && (
                                        <span className="absolute inset-0 flex items-center justify-center text-shadow opacity-0 group-hover:opacity-100 transition-opacity">
                                            {option.preview}
                                        </span>
                                    )}
                                 </button>
                             ))}
                         </div>
                     </div>
                 )}
            </div>
        </div>
    );
};
