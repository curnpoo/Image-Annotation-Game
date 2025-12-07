import React, { useState } from 'react';
import type { Player, DrawingStroke } from '../../types';
import { GameCanvas } from '../game/GameCanvas';

interface ProfileSetupScreenProps {
    onComplete: (player: Omit<Player, 'id' | 'joinedAt' | 'lastSeen'>) => void;
    initialName?: string;
}

const PLAYER_COLORS = [
    { id: '#000000', name: 'Black' },
    { id: '#FFFFFF', name: 'White' },
    { id: '#808080', name: 'Gray' },
    { id: '#3B82F6', name: 'Blue' },
    { id: '#EF4444', name: 'Red' }
];

const FRAMES = [
    { id: 'none', name: 'Simple', class: 'border-2 border-current' },
    { id: 'glow', name: 'Glow', class: 'shadow-[0_0_15px_currentColor]' },
    { id: 'border', name: 'Bold', class: 'border-4 border-current' },
    { id: 'dash', name: 'Dash', class: 'border-4 border-dashed border-current' },
    { id: 'double', name: 'Double', class: 'border-double border-8 border-current' },
    { id: 'ring', name: 'Ring', class: 'ring-4 ring-current ring-offset-2' }
];

const TRANSPARENT_PIXEL = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

export const ProfileSetupScreen: React.FC<ProfileSetupScreenProps> = ({ onComplete, initialName = '' }) => {
    const [name, setName] = useState(initialName);
    const [strokes, setStrokes] = useState<DrawingStroke[]>([]);
    const [color, setColor] = useState(PLAYER_COLORS[0].id);
    const [backgroundColor, setBackgroundColor] = useState('#ffffff');
    const [frame, setFrame] = useState(FRAMES[0].id);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            onComplete({
                name: name.trim(),
                avatarStrokes: strokes,
                color,
                backgroundColor,
                frame: FRAMES.find(f => f.id === frame)?.class || ''
            });
        }
    };

    const handleClear = () => {
        setStrokes([]);
    };

    const handleUndo = () => {
        setStrokes(prev => prev.slice(0, -1));
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center p-4">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="bg-gray-50 p-6 border-b border-gray-100 text-center">
                    <h1 className="text-2xl font-black text-gray-800">
                        Create Your Profile
                    </h1>
                    <p className="text-sm text-gray-500 font-medium">Get ready to play!</p>
                </div>

                <div className="overflow-y-auto p-6 space-y-8 flex-1">
                    <form id="profile-form" onSubmit={handleSubmit} className="space-y-8">
                        {/* Name Input */}
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider text-center">Your Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Enter Name"
                                className="w-full px-4 py-4 rounded-2xl bg-gray-100 border-2 border-transparent focus:bg-white focus:border-purple-500 focus:outline-none text-xl font-bold text-center text-gray-900 placeholder-gray-400 transition-all"
                                maxLength={12}
                                autoFocus
                            />
                        </div>

                        {/* Avatar Creator */}
                        <div className="space-y-4">
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider text-center">Draw Your Avatar</label>

                            {/* Canvas Container */}
                            <div className="flex justify-center">
                                <div
                                    className={`relative w-48 h-48 rounded-3xl overflow-hidden shadow-lg transition-all ${FRAMES.find(f => f.id === frame)?.class}`}
                                    style={{
                                        color: color,
                                        backgroundColor: backgroundColor
                                    }}
                                >
                                    <GameCanvas
                                        imageUrl={TRANSPARENT_PIXEL}
                                        brushColor={color === '#FFFFFF' && backgroundColor === '#FFFFFF' ? '#000000' : color} // Auto-contrast if white-on-white
                                        brushSize={5}
                                        isDrawingEnabled={true}
                                        strokes={strokes}
                                        onStrokesChange={setStrokes}
                                    />
                                </div>
                            </div>

                            {/* Canvas Controls */}
                            <div className="flex justify-center gap-2">
                                <button
                                    type="button"
                                    onClick={handleUndo}
                                    className="px-4 py-2 bg-gray-100 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-200 transition-colors flex items-center gap-1"
                                    disabled={strokes.length === 0}
                                >
                                    <span>↩</span> Undo
                                </button>
                                <button
                                    type="button"
                                    onClick={handleClear}
                                    className="px-4 py-2 bg-red-50 rounded-xl text-xs font-bold text-red-500 hover:bg-red-100 transition-colors flex items-center gap-1"
                                    disabled={strokes.length === 0}
                                >
                                    <span>🗑️</span> Clear
                                </button>
                            </div>
                        </div>

                        {/* Styling Options */}
                        <div className="bg-gray-50 rounded-3xl p-5 space-y-6">
                            {/* Color Selection */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Paint Color</label>
                                    <span className="text-xs font-bold text-gray-900">{PLAYER_COLORS.find(c => c.id === color)?.name}</span>
                                </div>
                                <div className="flex justify-between gap-2">
                                    {PLAYER_COLORS.map(c => (
                                        <button
                                            key={c.id}
                                            type="button"
                                            onClick={() => setColor(c.id)}
                                            className={`w-10 h-10 rounded-full transition-all flex items-center justify-center ${color === c.id ? 'scale-110 shadow-md ring-2 ring-purple-500 ring-offset-2' : 'hover:scale-105 opacity-80 hover:opacity-100'}`}
                                            style={{
                                                backgroundColor: c.id,
                                                border: c.id === '#FFFFFF' ? '1px solid #e5e7eb' : 'none'
                                            }}
                                        >
                                            {color === c.id && (
                                                <span className={`text-xs ${c.id === '#FFFFFF' ? 'text-black' : 'text-white'}`}>✓</span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Background Color Selection (Simpler version for setup) */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Background</label>
                                </div>
                                <div className="flex gap-2 justify-center">
                                    {[
                                        '#ffffff', // White
                                        '#f3f4f6', // Gray-100
                                        '#e5e7eb', // Gray-200
                                        '#000000', // Black
                                        '#1e1b4b', // Dark Indigo
                                    ].map(bg => (
                                        <button
                                            key={bg}
                                            type="button"
                                            onClick={() => setBackgroundColor(bg)}
                                            className={`w-8 h-8 rounded-full border border-gray-200 transition-all ${backgroundColor === bg ? 'scale-110 shadow-md ring-2 ring-purple-500 ring-offset-1' : 'opacity-70 hover:opacity-100'}`}
                                            style={{ backgroundColor: bg }}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Frame Selection */}
                            <div className="space-y-3">
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider text-center">Frame Style</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {FRAMES.map(f => (
                                        <button
                                            key={f.id}
                                            type="button"
                                            onClick={() => setFrame(f.id)}
                                            className={`
                                                py-2 px-1 rounded-xl flex flex-col items-center justify-center gap-1 transition-all
                                                ${frame === f.id ? 'bg-white shadow-sm ring-1 ring-purple-500' : 'hover:bg-gray-200'}
                                            `}
                                        >
                                            <div
                                                className={`w-8 h-8 rounded-full bg-white flex items-center justify-center border border-gray-100 ${f.class}`}
                                                style={{ color: color }}
                                            >
                                                <div className="w-4 h-4 rounded-full bg-gray-100" />
                                            </div>
                                            <span className={`text-[10px] font-bold ${frame === f.id ? 'text-purple-600' : 'text-gray-500'}`}>
                                                {f.name}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <div className="p-4 bg-white border-t border-gray-100">
                    <button
                        type="submit"
                        form="profile-form"
                        disabled={!name.trim()}
                        className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold text-lg shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                        Start Playing 🚀
                    </button>
                </div>
            </div>
        </div>
    );
};
