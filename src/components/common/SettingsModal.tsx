import React, { useState, useEffect } from 'react';
import type { Player } from '../../types';
import { requestPushPermission, storePushToken, isPushSupported } from '../../services/pushNotifications';
import { AuthService } from '../../services/auth';

interface SettingsModalProps {
    player: Player;
    players?: Player[];
    roomCode: string | null;
    isHost?: boolean;
    onClose: () => void;
    onUpdateProfile: (profileData: Partial<Player>) => void;
    onLeaveGame?: () => void;
    onEndGame?: () => void;
    onKick?: (playerId: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
    player,
    players = [],
    roomCode,
    isHost,
    onClose,
    onUpdateProfile,
    onLeaveGame,
    onEndGame,
    onKick
}) => {
    const [name, setName] = useState(player.name);
    const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
    const [showEndGameConfirm, setShowEndGameConfirm] = useState(false);
    const [kickTarget, setKickTarget] = useState<string | null>(null);
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);

    useEffect(() => {
        if ('Notification' in window) {
            const isDisabledByUser = localStorage.getItem('notificationsDisabled') === 'true';
            setNotificationsEnabled(Notification.permission === 'granted' && !isDisabledByUser);
        }
    }, []);

    const handleSave = () => {
        if (name.trim()) {
            onUpdateProfile({
                name: name.trim()
            });
            onClose();
        }
    };

    const requestNotifications = async () => {
        try {
            if (isPushSupported()) {
                const token = await requestPushPermission();
                if (token) {
                    await storePushToken(player.id, token);
                    setNotificationsEnabled(true);
                    console.log('FCM enabled successfully!');
                }
            } else if ('Notification' in window) {
                // Fallback to basic notifications
                const permission = await Notification.requestPermission();
                setNotificationsEnabled(permission === 'granted');
            }
        } catch (error) {
            console.error('Failed to enable notifications:', error);
        }
    };

    const toggleNotifications = () => {
        if (notificationsEnabled) {
            localStorage.setItem('notificationsDisabled', 'true');
            setNotificationsEnabled(false);
        } else {
            localStorage.setItem('notificationsDisabled', 'false');
            requestNotifications();
        }
    };

    if (showLeaveConfirm) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                <div className="bg-white rounded-3xl p-6 shadow-2xl w-full max-w-sm text-center pop-in">
                    <div className="text-4xl mb-4">😰</div>
                    <h3 className="text-2xl font-black text-gray-800 mb-2">Leave Game?</h3>
                    <p className="text-gray-600 mb-6 font-medium">You'll lose your current progress!</p>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowLeaveConfirm(false)}
                            className="flex-1 py-3 px-6 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                        >
                            Stay
                        </button>
                        <button
                            onClick={onLeaveGame}
                            className="flex-1 py-3 px-6 bg-red-500 text-white font-bold rounded-xl shadow-lg hover:bg-red-600 active:scale-95 transition-all"
                        >
                            Leave
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (showEndGameConfirm) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                <div className="bg-white rounded-3xl p-6 shadow-2xl w-full max-w-sm text-center pop-in">
                    <div className="text-4xl mb-4">🛑</div>
                    <h3 className="text-2xl font-black text-gray-800 mb-2">End Game?</h3>
                    <p className="text-gray-600 mb-6 font-medium">This will kick everyone out and close the room.</p>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowEndGameConfirm(false)}
                            className="flex-1 py-3 px-6 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onEndGame}
                            className="flex-1 py-3 px-6 bg-red-500 text-white font-bold rounded-xl shadow-lg hover:bg-red-600 active:scale-95 transition-all"
                        >
                            End Game
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Kick Confirm Modal
    if (kickTarget) {
        const targetPlayer = players.find(p => p.id === kickTarget);
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                <div className="bg-white rounded-3xl p-6 shadow-2xl w-full max-w-sm text-center pop-in">
                    <div className="text-4xl mb-4">🥾</div>
                    <h3 className="text-2xl font-black text-gray-800 mb-2">Kick Player?</h3>
                    <p className="text-gray-600 mb-6 font-medium">
                        Are you sure you want to kick <span className="text-purple-600 font-bold">{targetPlayer?.name}</span>?
                    </p>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setKickTarget(null)}
                            className="flex-1 py-3 px-6 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => {
                                if (onKick) onKick(kickTarget);
                                setKickTarget(null);
                            }}
                            className="flex-1 py-3 px-6 bg-red-500 text-white font-bold rounded-xl shadow-lg hover:bg-red-600 active:scale-95 transition-all"
                        >
                            Kick
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center animate-fade-in">
            <div
                className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl slide-up max-h-[90vh] overflow-y-auto"
                style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-black text-gray-800">Settings</h2>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold hover:bg-gray-200 transition-colors"
                    >
                        ✕
                    </button>
                </div>

                <div className="space-y-6">
                    {/* Name Edit */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-500 uppercase tracking-wider">Your Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            maxLength={15}
                            className="w-full px-4 py-3 bg-gray-50 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none font-bold text-lg"
                            placeholder="Enter name"
                        />
                    </div>

                    <hr className="border-gray-100" />

                    {/* Notifications */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xl">
                                🔔
                            </div>
                            <div>
                                <div className="font-bold text-gray-800">Notifications</div>
                                <div className="text-xs text-gray-500">Get alerted for turns</div>
                            </div>
                        </div>
                        <button
                            onClick={toggleNotifications}
                            className={`w-14 h-8 rounded-full p-1 transition-colors duration-200 ease-in-out ${notificationsEnabled ? 'bg-green-500' : 'bg-gray-300'}`}
                        >
                            <div className={`bg-white w-6 h-6 rounded-full shadow-sm transform transition-transform duration-200 ease-in-out ${notificationsEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                        </button>
                    </div>

                    <hr className="border-gray-100" />

                    {/* Host Controls - Kick Player */}
                    {isHost && roomCode && players.length > 1 && (
                        <div className="space-y-2">
                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Manage Players</h3>
                            <div className="bg-gray-50 rounded-xl p-2 space-y-2">
                                {players.filter(p => p.id !== player.id).map(p => (
                                    <div key={p.id} className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-100">
                                        <span className="font-bold text-gray-700">{p.name}</span>
                                        <button
                                            onClick={() => setKickTarget(p.id)}
                                            className="px-3 py-1 bg-red-100 text-red-600 text-xs font-bold rounded-lg hover:bg-red-200"
                                        >
                                            Flick
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Game Actions */}
                    {roomCode && (
                        <div className="space-y-3">
                            {/* Host Controls */}
                            {isHost ? (
                                <button
                                    onClick={() => setShowEndGameConfirm(true)}
                                    className="w-full py-3 px-4 bg-red-50 text-red-600 font-bold rounded-xl border-2 border-red-100 hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                                >
                                    🏠 End Game & Return Home
                                </button>
                            ) : (
                                <button
                                    onClick={() => setShowLeaveConfirm(true)}
                                    className="w-full py-3 px-4 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                                >
                                    👋 Leave Game
                                </button>
                            )}
                        </div>
                    )}

                    {/* DEV: Money Grant Button */}
                    <button
                        onClick={async () => {
                            const current = AuthService.getCurrentUser();
                            if (current) {
                                const newBalance = (current.currency || 0) + 50;
                                await AuthService.updateUser(current.id, { currency: newBalance });
                                onUpdateProfile({ currency: newBalance });
                                // Just a little visual feedback
                                const btn = document.getElementById('grant-btn');
                                if (btn) {
                                    const originalText = btn.innerText;
                                    btn.innerText = '✅ Added $50!';
                                    setTimeout(() => btn.innerText = originalText, 1000);
                                }
                            }
                        }}
                        id="grant-btn"
                        className="w-full py-3 px-4 bg-green-50 text-green-700 font-bold rounded-xl border-2 border-green-100 hover:bg-green-100 transition-colors flex items-center justify-center gap-2"
                    >
                        💰 Get $50 (Test)
                    </button>

                    {/* Main Save Button */}
                    <button
                        onClick={handleSave}
                        className="w-full py-4 bg-black text-white font-bold text-xl rounded-2xl shadow-lg hover:bg-gray-800 active:scale-95 transition-all mt-4"
                    >
                        Save Settings
                    </button>
                </div>
            </div>
        </div>
    );
};
