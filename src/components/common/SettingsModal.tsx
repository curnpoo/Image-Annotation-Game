import React, { useState } from 'react';
import type { Player, DrawingStroke } from '../../types';
import { GameCanvas } from '../game/GameCanvas';

interface SettingsModalProps {
    player: Player;
    roomCode: string | null;
    isHost?: boolean;
    onClose: () => void;
    onUpdateProfile: (profileData: Partial<Player>) => void;
    onLeaveGame?: () => void;
    onEndGame?: () => void;
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

const TRANSPARENT_PIXEL = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

export const SettingsModal: React.FC<SettingsModalProps> = ({
    player,
    roomCode,
    isHost,
    onClose,
    onUpdateProfile,
    onLeaveGame,
    onEndGame
}) => {
    const [name, setName] = useState(player.name);
    const [strokes, setStrokes] = useState<DrawingStroke[]>(player.avatarStrokes || []);
    const [color, setColor] = useState(player.color);
    const [frame, setFrame] = useState(FRAMES.find(f => f.class === player.frame)?.id || 'none');

    const handleSave = () => {
        if (name.trim()) {
            onUpdateProfile({
                name: name.trim(),
                avatarStrokes: strokes,
                color,
                frame: FRAMES.find(f => f.id === frame)?.class || ''
            });
            onClose();
        }
    };

    const handleClear = () => {
        setStrokes([]);
    };

    const handleUndo = () => {
        setStrokes(prev => prev.slice(0, -1));
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto border-4 border-purple-500 pop-in flex flex-col">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
                    <div className="flex items-center gap-2">
                        {onLeaveGame && (
                            <button
                                onClick={() => {
                                    if (confirm('Go back to home? This will leave the current game.')) {
                                        onLeaveGame();
                                        onClose();
                                    }
                                }}
                                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-lg transition-colors"
                                title="Back to Home"
                            >
                                🏠
                            </button>
                        )}
                        <h2 className="text-2xl font-bold text-purple-600">Settings ⚙️</h2>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Room Code */}
                    {roomCode && (
                        <div className="bg-purple-50 p-4 rounded-xl text-center">
                            <p className="text-sm text-purple-600 font-bold mb-1">ROOM CODE</p>
                            <p className="text-3xl font-black tracking-widest text-purple-800 select-all">{roomCode}</p>
                        </div>
                    )}

                    {/* Name */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">NAME</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-2 rounded-xl border-2 border-purple-200 focus:border-purple-500 focus:outline-none font-bold"
                            maxLength={12}
                        />
                    </div>

                    {/* Drawing Canvas */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">YOUR AVATAR</label>
                        <div className="flex justify-center mb-2">
                            <div
                                className={`w-48 h-48 rounded-full bg-white overflow-hidden relative shadow-sm ${FRAMES.find(f => f.id === frame)?.class}`}
                                style={{ color: color, border: '2px solid #eee' }}
                            >
                                <GameCanvas
                                    imageUrl={TRANSPARENT_PIXEL}
                                    brushColor={color}
                                    brushSize={5}
                                    isDrawingEnabled={true}
                                    strokes={strokes}
                                    onStrokesChange={setStrokes}
                                />
                            </div>
                        </div>
                        <div className="flex justify-center gap-2 mb-4">
                            <button
                                onClick={handleUndo}
                                className="px-3 py-1 bg-gray-200 rounded-lg text-sm font-bold hover:bg-gray-300"
                                disabled={strokes.length === 0}
                            >
                                ↩ Undo
                            </button>
                            <button
                                onClick={handleClear}
                                className="px-3 py-1 bg-red-100 text-red-600 rounded-lg text-sm font-bold hover:bg-red-200"
                                disabled={strokes.length === 0}
                            >
                                🗑️ Clear
                            </button>
                        </div>
                    </div>

                    {/* Color */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">COLOR</label>
                        <div className="flex justify-between gap-2 flex-wrap">
                            {COLORS.map(c => (
                                <button
                                    key={c}
                                    onClick={() => setColor(c)}
                                    className={`w-8 h-8 rounded-full transition-transform hover:scale-110 ${color === c ? 'ring-4 ring-offset-2 ring-gray-400' : ''}`}
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Frame */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">FRAME</label>
                        <div className="grid grid-cols-3 gap-2">
                            {FRAMES.map(f => (
                                <button
                                    key={f.id}
                                    onClick={() => setFrame(f.id)}
                                    className={`px-2 py-1 rounded-lg text-xs font-bold transition-colors ${frame === f.id ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                >
                                    {f.name}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-gray-100 sticky bottom-0 bg-white space-y-4">
                    <button
                        onClick={handleSave}
                        disabled={!name.trim()}
                        className="w-full btn-90s bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl font-bold text-lg shadow-lg disabled:opacity-50"
                    >
                        Save Changes
                    </button>

                    {/* Danger Zone */}
                    {(onLeaveGame || (isHost && onEndGame)) && (
                        <div className="pt-4 border-t border-gray-100">
                            <div className="space-y-3">
                                {onLeaveGame && (
                                    <button
                                        onClick={() => {
                                            if (confirm('Are you sure you want to leave the game?')) {
                                                onLeaveGame();
                                                onClose();
                                            }
                                        }}
                                        className="w-full py-3 rounded-xl font-bold text-red-600 bg-red-50 hover:bg-red-100 border-2 border-transparent hover:border-red-200 transition-all"
                                    >
                                        Leave Game 🏃‍♂️
                                    </button>
                                )}

                                {isHost && onEndGame && (
                                    <button
                                        onClick={() => {
                                            if (confirm('Are you sure you want to end the game for everyone?')) {
                                                onEndGame();
                                                onClose();
                                            }
                                        }}
                                        className="w-full py-3 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 shadow-lg transition-all"
                                    >
                                        End Game 🛑
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
