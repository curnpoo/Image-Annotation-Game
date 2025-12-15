import React, { useState } from 'react';
import type { Player, DrawingStroke } from '../../types';
import { GameCanvas } from '../game/GameCanvas';
import { Toolbar } from '../game/Toolbar';
import { ZoomResetButton } from '../game/ZoomResetButton';
import { AvatarService } from '../../services/avatarService';
import { CosmeticsService } from '../../services/cosmetics';
import { useZoomPan } from '../../hooks/useZoomPan';
import { vibrate, HapticPatterns } from '../../utils/haptics';
import { FRAMES, THEMES } from '../../constants/cosmetics';

interface ProfileSetupScreenProps {
    onComplete: (player: Omit<Player, 'id' | 'joinedAt' | 'lastSeen'>) => void;
    initialName?: string;
}

export const ProfileSetupScreen: React.FC<ProfileSetupScreenProps> = ({ onComplete, initialName = '' }) => {
    const [name, setName] = useState(initialName || ''); // Ensure string
    const [strokes, setStrokes] = useState<DrawingStroke[]>([]);
    
    // Editor State
    const [brushColor, setBrushColor] = useState('#FF69B4');
    const [backgroundColor, setBackgroundColor] = useState('#ffffff');
    const [selectedFrame, setSelectedFrame] = useState('none');
    
    const [brushSize, setBrushSize] = useState(8);
    const [brushType, setBrushType] = useState('default');
    const [isEraser, setIsEraser] = useState(false);
    const [isEyedropper, setIsEyedropper] = useState(false);
    const [history, setHistory] = useState<DrawingStroke[][]>([[]]);
    
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

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        
        if (!name.trim()) {
            vibrate(HapticPatterns.error);
            return;
        }

        // Generate Avatar Image
        const avatarImageUrl = AvatarService.renderToDataUrl(
            strokes,
            'transparent', // Keep transparent for dynamic preview flexibility, or bake it in? 
            // Current app logic seems to prefer transparent + css background for flexibility,
            // but for portability, we might want baked. Let's follow AvatarEditorScreen which uses transparent.
            200
        );

        onComplete({
            name: name.trim(),
            avatarStrokes: strokes,
            color: brushColor,
            backgroundColor,
            frame: selectedFrame, // Pass ID
            avatarImageUrl
        });
        vibrate(HapticPatterns.success);
    };

    return (
        <div className="fixed inset-0 bg-gray-900 overflow-hidden flex flex-col items-center justify-center safe-area-padding">
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-gray-900 to-black z-0">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
            </div>

            <div className="z-10 w-full max-w-md h-full flex flex-col p-4 animate-slide-up">
                
                {/* Header Section */}
                <div className="text-center mb-4 shrink-0">
                    <h1 className="text-3xl font-black text-white drop-shadow-md rainbow-text">
                        Create Profile
                    </h1>
                </div>

                {/* Name Input */}
                <div className="w-full mb-4 shrink-0">
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your Name"
                        maxLength={12}
                        className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-2xl focus:border-white/50 focus:bg-white/20 focus:outline-none font-bold text-center text-2xl text-white placeholder-white/30 transition-all shadow-lg"
                        autoCapitalize="words"
                        autoCorrect="off"
                        autoComplete="off"
                    />
                </div>

                {/* Avatar Editor Area - Flexible Height */}
                <div className="flex-1 min-h-0 relative flex flex-col items-center justify-center mb-4">
                    
                    {/* Canvas Container */}
                    <div 
                        {...bind()} 
                        className="relative aspect-square w-full max-w-[280px] max-h-[40vh] touch-none mb-4"
                    >
                        {/* Zoom Reset */}
                        <ZoomResetButton 
                            scale={scale} 
                            isVisible={isZoomed} 
                            onReset={resetZoom} 
                        />

                        {/* Avatar Circle */}
                        <div 
                            className="w-full h-full rounded-full overflow-hidden shadow-2xl ring-4 ring-white/10 relative"
                            style={{ ...contentStyle, background: backgroundColor }}
                        >
                            {/* Frame Overlay */}
                            <div className={`absolute inset-0 pointer-events-none z-10 rounded-full ${FRAMES.find(f => f.id === selectedFrame)?.className || ''}`}></div>

                            <GameCanvas
                                imageUrl="" // Empty for new avatar
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

                    {/* Controls Section */}
                    <div className="w-full space-y-3">
                        
                        {/* Mode Switcher Buttons */}
                        <div className="flex justify-center gap-3">
                            <button
                                onClick={() => setColorMode('brush')}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${colorMode === 'brush' ? 'bg-blue-500 text-white shadow-lg scale-105' : 'bg-white/5 text-white/70 hover:bg-white/10 border border-white/10'}`}
                            >
                                🖌️ Brush
                            </button>
                            <button
                                onClick={() => setColorMode('background')}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${colorMode === 'background' ? 'bg-purple-500 text-white shadow-lg scale-105' : 'bg-white/5 text-white/70 hover:bg-white/10 border border-white/10'}`}
                            >
                                🎨 Theme
                            </button>
                        </div>

                        {/* Frames (Horizontal Scroll) */}
                        <div className="w-full overflow-x-auto no-scrollbar pb-1">
                            <div className="flex gap-2 min-w-min px-2 justify-center">
                                {FRAMES.map(f => (
                                    <button
                                        key={f.id}
                                        onClick={() => setSelectedFrame(f.id)}
                                        className={`w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-lg border-2 transition-all ${selectedFrame === f.id ? 'border-purple-500 scale-110 shadow-lg' : 'border-gray-700 opacity-70 hover:opacity-100'}`}
                                    >
                                        <div className={`${f.className} w-full h-full rounded-full`}></div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Toolbar (or Theme Picker) */}
                        <div className="relative">
                            <div className={colorMode === 'background' ? 'opacity-30 pointer-events-none blur-[1px] transition-all' : 'transition-all'}>
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
                                    onTypeChange={setBrushType}
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

                             {/* Theme/Background Picker Overlay */}
                             {colorMode === 'background' && (
                                <div className="absolute inset-0 bg-gray-900/95 backdrop-blur-md rounded-[1.5rem] p-4 z-20 animate-fade-in border border-white/10 flex flex-col">
                                    <h3 className="text-white text-xs font-bold uppercase tracking-wider text-center mb-3">Choose Background</h3>
                                    <div className="grid grid-cols-5 gap-3 overflow-y-auto pr-1 custom-scrollbar flex-1 content-start">
                                        {backgroundOptions.map(option => (
                                            <button
                                                key={option.id}
                                                onClick={() => setBackgroundColor(option.value)}
                                                className={`aspect-square rounded-full border-2 transition-all relative overflow-hidden group
                                                ${backgroundColor === option.value ? 'border-white scale-110 shadow-lg' : 'border-transparent hover:scale-105'}`}
                                                style={{ background: option.value }}
                                            >
                                                {option.preview && (
                                                    <span className="absolute inset-0 flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100">
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
                </div>

                {/* Footer Action */}
                <button
                    onClick={handleSubmit}
                    disabled={!name.trim()}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-2xl font-black text-xl shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale shrink-0 relative overflow-hidden group"
                >
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                    <span className="relative flex items-center justify-center gap-2">
                        Start Playing 🚀
                    </span>
                </button>
            </div>
        </div>
    );
};


