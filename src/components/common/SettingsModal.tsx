import React, { useState, useEffect } from 'react';
import type { Player } from '../../types';
import { requestPushPermission, storePushToken, isPushSupported } from '../../services/pushNotifications';
import { AuthService } from '../../services/auth';
import { StorageService } from '../../services/storage';

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
    const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
    const [showEndGameConfirm, setShowEndGameConfirm] = useState(false);
    const [kickTarget, setKickTarget] = useState<string | null>(null);
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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

    const handleLogout = () => {
        AuthService.logout();
        StorageService.clearSession(); // Clear persistent game session
        window.location.reload();
    };

    const handleDeleteAccount = async () => {
        await AuthService.deleteAccount();
        StorageService.clearSession();
        window.location.reload();
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
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                <div className="relative z-10 bg-white rounded-3xl p-6 shadow-2xl w-full max-w-sm text-center pop-in">
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
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                <div className="relative z-10 bg-white rounded-3xl p-6 shadow-2xl w-full max-w-sm text-center pop-in">
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

    if (showLogoutConfirm) {
        return (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                <div className="relative z-10 bg-white rounded-3xl p-6 shadow-2xl w-full max-w-sm text-center pop-in">
                    <div className="text-4xl mb-4">👋</div>
                    <h3 className="text-2xl font-black text-gray-800 mb-2">Log Out?</h3>
                    <p className="text-gray-600 mb-6 font-medium">You will return to the welcome screen.</p>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowLogoutConfirm(false)}
                            className="flex-1 py-3 px-6 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleLogout}
                            className="flex-1 py-3 px-6 bg-red-500 text-white font-bold rounded-xl shadow-lg hover:bg-red-600 active:scale-95 transition-all"
                        >
                            Log Out
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (showDeleteConfirm) {
        return (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                <div className="relative z-10 bg-white rounded-3xl p-6 shadow-2xl w-full max-w-sm text-center pop-in">
                    <div className="text-4xl mb-4">🗑️</div>
                    <h3 className="text-2xl font-black text-gray-800 mb-2">Delete Account?</h3>
                    <p className="text-gray-600 mb-6 font-medium">
                        This will <span className="text-red-600 font-bold">permanently delete</span> all your stats, currency, and cosmetics.
                        <br /><br />
                        <span className="text-xs uppercase font-bold text-gray-400">This cannot be undone.</span>
                    </p>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowDeleteConfirm(false)}
                            className="flex-1 py-3 px-6 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleDeleteAccount}
                            className="flex-1 py-3 px-6 bg-red-600 text-white font-bold rounded-xl shadow-lg hover:bg-red-700 active:scale-95 transition-all"
                        >
                            Delete Forever
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
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center pointer-events-none">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto" onClick={onClose} />
            <div className="relative z-10 w-full sm:w-[500px] sm:rounded-3xl rounded-t-3xl p-6 shadow-2xl pointer-events-auto max-h-[90vh] overflow-y-auto animate-slide-up" style={{ backgroundColor: 'var(--theme-card-bg, #fff)' }}>

                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-black" style={{ color: 'var(--theme-text)' }}>SETTINGS</h2>
                        {roomCode && (
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">Room Code:</span>
                                <span className="text-lg font-black font-mono text-purple-600 bg-purple-100 px-2 py-0.5 rounded-lg select-all">
                                    {roomCode}
                                </span>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-full flex items-center justify-center text-xl transition-colors"
                        style={{
                            backgroundColor: 'var(--theme-bg-secondary)',
                            color: 'var(--theme-text)',
                            border: '2px solid var(--theme-border)'
                        }}
                    >
                        ✕
                    </button>
                </div>

                <div className="space-y-6">
                    {/* Game Actions (Only if in a game) */}

                    {/* Name Edit */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--theme-text-secondary)' }}>Your Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            maxLength={15}
                            className="w-full px-4 py-3 rounded-xl border-2 focus:border-purple-500 focus:outline-none font-bold text-lg"
                            style={{ backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text)', borderColor: 'var(--theme-border)' }}
                            placeholder="Enter name"
                        />
                    </div>

                    <hr style={{ borderColor: 'var(--theme-border)' }} />

                    {/* Theme Toggle */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-500 uppercase tracking-wider">App Theme</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => onUpdateProfile({
                                    cosmetics: {
                                        activeTheme: 'premium-light',
                                        brushesUnlocked: player.cosmetics?.brushesUnlocked || [],
                                        colorsUnlocked: player.cosmetics?.colorsUnlocked || [],
                                        badges: player.cosmetics?.badges || [],
                                        purchasedItems: player.cosmetics?.purchasedItems || [],
                                        activeBrush: player.cosmetics?.activeBrush,
                                        activeColor: player.cosmetics?.activeColor
                                    }
                                })}
                                className={`py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 border-2 transition-all ${player.cosmetics?.activeTheme === 'premium-light' || player.cosmetics?.activeTheme === 'light'
                                    ? 'bg-orange-100 border-orange-400 text-orange-600'
                                    : 'bg-gray-50 border-gray-100 text-gray-400 hover:bg-gray-100'
                                    }`}
                            >
                                ☀️ Light
                            </button>
                            <button
                                onClick={() => onUpdateProfile({
                                    cosmetics: {
                                        activeTheme: 'premium-dark',
                                        brushesUnlocked: player.cosmetics?.brushesUnlocked || [],
                                        colorsUnlocked: player.cosmetics?.colorsUnlocked || [],
                                        badges: player.cosmetics?.badges || [],
                                        purchasedItems: player.cosmetics?.purchasedItems || [],
                                        activeBrush: player.cosmetics?.activeBrush,
                                        activeColor: player.cosmetics?.activeColor
                                    }
                                })}
                                className={`py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 border-2 transition-all ${(player.cosmetics?.activeTheme === 'premium-dark' || player.cosmetics?.activeTheme === 'dark' || !player.cosmetics?.activeTheme || player.cosmetics?.activeTheme === 'default')
                                    ? 'bg-gray-800 border-gray-600 text-white'
                                    : 'bg-gray-50 border-gray-100 text-gray-400 hover:bg-gray-100'
                                    }`}
                            >
                                🌙 Dark
                            </button>
                        </div>
                    </div>

                    <hr className="border-gray-100" />

                    {/* Notifications */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xl">
                                🔔
                            </div>
                            <div>
                                <div className="font-bold" style={{ color: 'var(--theme-text)' }}>Notifications</div>
                                <div className="text-xs" style={{ color: 'var(--theme-text-secondary)' }}>Get alerted for turns</div>
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
                            <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--theme-text-secondary)' }}>Manage Players</h3>
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
                            {/* Go Home - Available to everyone */}
                            <button
                                onClick={() => {
                                    if (onGoHome) onGoHome();
                                    onClose();
                                }}
                                className="w-full py-3 px-4 bg-blue-50 text-blue-600 font-bold rounded-xl border-2 border-blue-100 hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
                            >
                                🏠 Go Home (Keep Game Running)
                            </button>

                            {/* Host: End Game / Player: Leave Game */}
                            {isHost ? (
                                <button
                                    onClick={() => setShowEndGameConfirm(true)}
                                    className="w-full py-3 px-4 bg-red-50 text-red-600 font-bold rounded-xl border-2 border-red-100 hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                                >
                                    🛑 End Game & Kick Everyone
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

                    {/* Main Save Button */}
                    <button
                        onClick={handleSave}
                        className="w-full py-4 bg-black text-white font-bold text-xl rounded-2xl shadow-lg hover:bg-gray-800 active:scale-95 transition-all"
                    >
                        Save Settings
                    </button>

                    <hr className="border-gray-100" />

                    {/* Log Out Button - Universal */}
                    <button
                        onClick={() => setShowLogoutConfirm(true)}
                        className="w-full py-3 px-4 bg-gray-100 text-gray-500 font-bold rounded-xl hover:bg-gray-200 transition-colors text-sm"
                    >
                        Log Out
                    </button>

                    {/* Delete Account - Danger zone, well separated */}
                    <div className="pt-12 border-t border-red-100 mt-8">
                        <p className="text-xs text-gray-400 text-center mb-3 uppercase tracking-widest">Danger Zone</p>
                        <button
                            onClick={() => setShowDeleteConfirm(true)}
                            className="w-full py-2 text-xs text-red-400 hover:text-red-600 font-bold transition-colors uppercase tracking-widest"
                        >
                            🗑️ Delete Account Permanently
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
