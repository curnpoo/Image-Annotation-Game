import React, { useState, useEffect } from 'react';
import type { Player, DrawingStroke } from '../../types';
import { GameCanvas } from '../game/GameCanvas';
import { AvatarDisplay } from './AvatarDisplay';

interface SettingsModalProps {
    player: Player;
    players?: Player[];
    roomCode: string | null;
    isHost?: boolean;
    onClose: () => void;
    onUpdateProfile: (profileData: Partial<Player>) => void;
    onLeaveGame?: () => void;
    onEndGame?: () => void;
    onGoHome?: () => void;
    onKick?: (playerId: string) => void;
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
    players = [],
    roomCode,
    isHost,
    onClose,
    onUpdateProfile,
    onLeaveGame,
    onEndGame,
    onGoHome,
    onKick
}) => {
    const [name, setName] = useState(player.name);
    const [strokes, setStrokes] = useState<DrawingStroke[]>(player.avatarStrokes || []);
    const [color, setColor] = useState(player.color);
    const [frame, setFrame] = useState(FRAMES.find(f => f.class === player.frame)?.id || 'none');
    const [showHomeConfirm, setShowHomeConfirm] = useState(false);
    const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);

    useEffect(() => {
        if ('Notification' in window) {
            setNotificationsEnabled(Notification.permission === 'granted');
        }
    }, []);

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

    const requestNotifications = async () => {
        if (!('Notification' in window)) return;
        const permission = await Notification.requestPermission();
        setNotificationsEnabled(permission === 'granted');
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto border-4 border-purple-500 pop-in flex flex-col">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
                    <div className="flex items-center gap-3">
                        <h2 className="text-2xl font-bold text-purple-600">Settings</h2>
                        {roomCode && (
                            <div className="bg-purple-100 text-purple-600 px-3 py-1 rounded-lg font-mono font-bold text-lg shadow-sm border border-purple-200">
                                {roomCode}
                            </div>
                        )}
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
                </div>

                <div className="p-6 space-y-6">


                    {/* Notifications Toggle */}
                    {('Notification' in window) && (
                        <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl">
                            <div>
                                <div className="font-bold text-gray-700">Notifications</div>
                                <div className="text-xs text-gray-500">Get alerted when it's your turn</div>
                            </div>
                            <button
                                onClick={requestNotifications}
                                disabled={notificationsEnabled}
                                className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${notificationsEnabled
                                    ? 'bg-green-100 text-green-600'
                                    : 'bg-purple-500 text-white hover:bg-purple-600 shadow-md'
                                    }`}
                            >
                                {notificationsEnabled ? '✓ Enabled' : 'Enable'}
                            </button>
                        </div>
                    )}

                    {/* Manage Players (Host Only or View Only) */}
                    {players.length > 0 && (
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">PLAYERS ({players.length})</label>
                            <div className="bg-gray-50 rounded-xl p-2 max-h-40 overflow-y-auto custom-scrollbar space-y-2">
                                {players.map(p => (
                                    <div key={p.id} className="flex items-center justify-between bg-white p-2 rounded-lg border border-gray-100 shadow-sm">
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            <AvatarDisplay
                                                strokes={p.avatarStrokes}
                                                avatar={p.avatar}
                                                frame={p.frame}
                                                color={p.color}
                                                size={32}
                                            />
                                            <span className="font-bold text-sm truncate" style={{ color: p.color }}>
                                                {p.name} {p.id === player.id && '(You)'}
                                            </span>
                                        </div>
                                        {isHost && p.id !== player.id && onKick && (
                                            <button
                                                onClick={() => {
                                                    if (window.confirm(`Kick ${p.name}?`)) {
                                                        onKick(p.id);
                                                    }
                                                }}
                                                className="bg-red-100 text-red-500 hover:bg-red-500 hover:text-white p-1 rounded-lg transition-colors text-xs font-bold px-2"
                                            >
                                                Kick
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
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
                                className={`w-72 h-72 rounded-full bg-white overflow-hidden relative shadow-sm ${FRAMES.find(f => f.id === frame)?.class}`}
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

                <div className="p-4 border-t border-gray-100 sticky bottom-0 bg-white space-y-3">
                    <button
                        onClick={handleSave}
                        disabled={!name.trim()}
                        className="w-full btn-90s bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2 rounded-xl font-bold text-base shadow-lg disabled:opacity-50 hover:scale-[1.02] active:scale-95 transition-all"
                    >
                        Save Changes
                    </button>

                    {/* Danger Zone */}
                    {(onLeaveGame || (isHost && onEndGame)) && (
                        <div className="pt-2 border-t border-gray-100">
                            <div className="grid grid-cols-2 gap-2">
                                {onGoHome ? (
                                    <button
                                        onClick={() => setShowHomeConfirm(true)}
                                        className="py-2.5 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 border-2 border-transparent transition-all text-sm"
                                    >
                                        🏠 Go Home
                                    </button>
                                ) : <div />}

                                {onLeaveGame && !isHost && (
                                    <button
                                        onClick={() => setShowLeaveConfirm(true)}
                                        className="py-2.5 rounded-xl font-bold text-red-600 bg-red-50 hover:bg-red-100 border-2 border-transparent hover:border-red-200 transition-all text-sm"
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
                                        className="py-2.5 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 shadow-lg transition-all text-sm"
                                    >
                                        End Game 🛑
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Emergency Reset - Always visible */}
                    <div className="pt-2 text-center">
                        <button
                            onClick={() => {
                                if (confirm('This will clear all data and reload the app. Use this if the game is broken. Continue?')) {
                                    localStorage.clear();
                                    sessionStorage.clear();
                                    window.location.reload();
                                }
                            }}
                            className="text-xs font-bold text-gray-400 hover:text-red-500 transition-colors p-2"
                        >
                            RESET ACCOUNT 🔄
                        </button>
                    </div>
                </div>

                {/* Custom Confirmations */}
                {showHomeConfirm && (
                    <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center p-6 z-20 rounded-3xl">
                        <div className="text-center space-y-4 animate-pop-in">
                            <div className="text-4xl">🏠</div>
                            <h3 className="text-xl font-bold text-gray-800">Go back to Home?</h3>
                            <p className="text-gray-600 text-sm">
                                You're not leaving the game! You can rejoin anytime from the home screen.
                            </p>
                            <div className="flex gap-2 justify-center">
                                <button
                                    onClick={() => setShowHomeConfirm(false)}
                                    className="px-4 py-2 rounded-xl bg-gray-100 font-bold text-gray-600 hover:bg-gray-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        onGoHome?.();
                                        onClose();
                                    }}
                                    className="px-4 py-2 rounded-xl bg-purple-500 text-white font-bold hover:bg-purple-600"
                                >
                                    Go Home
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {showLeaveConfirm && (
                    <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center p-6 z-20 rounded-3xl">
                        <div className="text-center space-y-4 animate-pop-in">
                            <div className="text-4xl">⚠️</div>
                            <h3 className="text-xl font-bold text-red-600">Leave Game?</h3>
                            <p className="text-gray-600 text-sm">
                                This will remove you from the game. You'll need the room code to rejoin.
                            </p>
                            <div className="flex gap-2 justify-center">
                                <button
                                    onClick={() => setShowLeaveConfirm(false)}
                                    className="px-4 py-2 rounded-xl bg-gray-100 font-bold text-gray-600 hover:bg-gray-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        onLeaveGame?.();
                                        onClose();
                                    }}
                                    className="px-4 py-2 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600"
                                >
                                    Leave Game
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
