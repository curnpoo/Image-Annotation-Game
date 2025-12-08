import React, { useState, useEffect, useCallback } from 'react';
import type { Player } from '../../types';
import { requestPushPermission, storePushToken, isPushSupported } from '../../services/pushNotifications';
import { AuthService } from '../../services/auth';
import { StorageService } from '../../services/storage';
import './transitions.css';
import { vibrate } from '../../utils/haptics';

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
    onKick,
}) => {
    const [name, setName] = useState(player.name);
    const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
    const [showEndGameConfirm, setShowEndGameConfirm] = useState(false);
    const [kickTarget, setKickTarget] = useState<string | null>(null);
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isClosing, setIsClosing] = useState(false);

    // Username editing
    const [isEditingUsername, setIsEditingUsername] = useState(false);
    const [newUsername, setNewUsername] = useState('');
    const [usernameError, setUsernameError] = useState('');
    const [usernameSuccess, setUsernameSuccess] = useState(false);
    const [isSavingUsername, setIsSavingUsername] = useState(false);
    const currentUser = AuthService.getCurrentUser();

    // Animated close handler - triggers exit animation before calling onClose
    const handleAnimatedClose = useCallback(() => {
        setIsClosing(true);
        setTimeout(() => {
            onClose();
        }, 200); // Match animation duration
    }, [onClose]);

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
            handleAnimatedClose();
        }
    };

    const handleUsernameChange = async () => {
        if (!newUsername.trim()) {
            setUsernameError('Username cannot be empty');
            return;
        }

        setIsSavingUsername(true);
        setUsernameError('');
        setUsernameSuccess(false);

        const result = await AuthService.changeUsername(newUsername);

        if (result.success) {
            setUsernameSuccess(true);
            setIsEditingUsername(false);
            setNewUsername('');
            // Force a refresh after 1 second to update UI
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } else {
            setUsernameError(result.error || 'Failed to change username');
        }

        setIsSavingUsername(false);
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
        vibrate();
        if (notificationsEnabled) {
            localStorage.setItem('notificationsDisabled', 'true');
            setNotificationsEnabled(false);
        } else {
            localStorage.setItem('notificationsDisabled', 'false');
            requestNotifications();
        }
    };

    // Helper for nested modal structure
    const ConfirmModal = ({
        icon,
        title,
        message,
        cancelText = "Cancel",
        confirmText,
        onCancel,
        onConfirm,
        isDanger = false
    }: {
        icon: string,
        title: string,
        message: React.ReactNode,
        cancelText?: string,
        confirmText: string,
        onCancel: () => void,
        onConfirm: () => void,
        isDanger?: boolean
    }) => (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in" onClick={onCancel}>
            <div
                className="relative z-10 glass-panel rounded-3xl p-8 shadow-2xl w-full max-w-sm text-center pop-in border border-white/20"
                onClick={e => e.stopPropagation()}
            >
                <div className="text-5xl mb-4 animate-bounce-gentle">{icon}</div>
                <h3 className="text-2xl font-black mb-2 text-white">{title}</h3>
                <div className="mb-8 font-medium text-white/70 text-lg leading-snug">{message}</div>
                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 py-4 px-6 font-bold rounded-2xl transition-all bg-white/10 hover:bg-white/20 text-white border border-white/10 active:scale-95"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`flex-1 py-4 px-6 font-black rounded-2xl shadow-lg active:scale-95 transition-all text-white border-2 border-white/20
                            ${isDanger
                                ? 'bg-gradient-to-br from-red-500 to-rose-600 shadow-red-500/30'
                                : 'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-indigo-500/30'}`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );

    if (showLeaveConfirm) {
        return <ConfirmModal
            icon="😰"
            title="Leave Game?"
            message="You'll lose your current progress!"
            cancelText="Stay"
            confirmText="Leave"
            onCancel={() => setShowLeaveConfirm(false)}
            onConfirm={() => {
                if (onLeaveGame) onLeaveGame();
                setShowLeaveConfirm(false);
                onClose();
            }}
            isDanger
        />;
    }

    if (showEndGameConfirm) {
        return <ConfirmModal
            icon="🛑"
            title="End Game?"
            message="This will kick everyone out and close the room."
            confirmText="End Game"
            onCancel={() => setShowEndGameConfirm(false)}
            onConfirm={() => {
                if (onEndGame) onEndGame();
                setShowEndGameConfirm(false);
                onClose();
            }}
            isDanger
        />;
    }

    if (showLogoutConfirm) {
        return <ConfirmModal
            icon="👋"
            title="Log Out?"
            message="You will return to the welcome screen."
            confirmText="Log Out"
            onCancel={() => setShowLogoutConfirm(false)}
            onConfirm={handleLogout}
            isDanger
        />;
    }

    if (showDeleteConfirm) {
        return <ConfirmModal
            icon="🗑️"
            title="Delete Account?"
            message={<span>This will <span className="text-red-400 font-bold">permanently delete</span> all your stats. <br /><br /><span className="text-xs uppercase font-bold text-white/50 tracking-widest">Cannot be undone</span></span>}
            confirmText="Delete Forever"
            onCancel={() => setShowDeleteConfirm(false)}
            onConfirm={handleDeleteAccount}
            isDanger
        />;
    }

    if (kickTarget) {
        const targetPlayer = players.find(p => p.id === kickTarget);
        return <ConfirmModal
            icon="🥾"
            title="Kick Player?"
            message={<span>Are you sure you want to kick <span className="text-purple-400 font-bold">{targetPlayer?.name}</span>?</span>}
            confirmText="Kick"
            onCancel={() => setKickTarget(null)}
            onConfirm={() => {
                if (onKick) onKick(kickTarget);
                setKickTarget(null);
            }}
            isDanger
        />;
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center pointer-events-none">
            <div
                className={`absolute inset-0 pointer-events-auto bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'}`}
                onClick={handleAnimatedClose}
            />
            <div
                className={`relative z-10 w-full sm:w-[500px] sm:rounded-3xl rounded-t-3xl p-6 shadow-2xl pointer-events-auto max-h-[85vh] overflow-y-auto overscroll-contain touch-pan-y
                glass-panel border-t border-x border-white/20 sm:border !bg-black/80 backdrop-blur-xl
                ${isClosing ? 'modal-slide-down' : 'modal-slide-up'}`}
            >

                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-3xl font-black text-white tracking-tight drop-shadow-md">SETTINGS</h2>
                        {roomCode && (
                            <div className="flex items-center gap-2 mt-2">
                                <span className="text-xs font-bold text-white/50 uppercase tracking-widest">Room Code</span>
                                <span className="text-lg font-black font-mono text-purple-300 bg-purple-500/20 border border-purple-500/30 px-3 py-1 rounded-lg select-all shadow-inner">
                                    {roomCode}
                                </span>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={handleAnimatedClose}
                        className="w-12 h-12 rounded-full flex items-center justify-center text-xl transition-all bg-white/10 hover:bg-white/20 active:scale-90 border border-white/10 text-white"
                    >
                        ✕
                    </button>
                </div>

                <div className="space-y-8">
                    {/* Name Edit */}
                    <div className="space-y-3">
                        <label className="text-xs font-bold uppercase tracking-widest text-white/50 ml-1">Display Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            maxLength={15}
                            className="w-full px-5 py-4 rounded-2xl bg-white/10 border-2 border-white/10 focus:border-purple-500/50 focus:bg-white/15 focus:outline-none font-bold text-xl text-white placeholder-white/20 transition-all"
                            placeholder="Enter name"
                        />
                    </div>

                    {/* Username Edit */}
                    {currentUser && (
                        <div className="space-y-3">
                            <label className="text-xs font-bold uppercase tracking-widest text-white/50 ml-1">Username</label>
                            {!isEditingUsername ? (
                                <div className="flex items-center gap-3">
                                    <div className="flex-1 px-5 py-4 rounded-2xl bg-white/5 border border-white/10 font-bold text-xl text-white/90">
                                        @{currentUser.username}
                                    </div>
                                    <button
                                        onClick={() => {
                                            vibrate();
                                            setIsEditingUsername(true);
                                            setNewUsername(currentUser.username);
                                        }}
                                        className="px-6 py-4 rounded-2xl font-bold transition-all bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/30 active:scale-95"
                                    >
                                        ✏️ Edit
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-3 p-4 rounded-2xl bg-white/5 border border-white/10">
                                    <input
                                        type="text"
                                        value={newUsername}
                                        onChange={(e) => {
                                            setNewUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''));
                                            setUsernameError('');
                                        }}
                                        maxLength={20}
                                        className="w-full px-5 py-4 rounded-xl bg-black/40 border-2 border-white/10 focus:border-indigo-500/50 focus:outline-none font-bold text-xl text-white placeholder-white/20"
                                        placeholder="new_username"
                                    />
                                    <div className="text-xs font-medium text-white/40 px-1">
                                        Lowercase letters, numbers, and underscores only
                                    </div>
                                    {usernameError && (
                                        <div className="text-sm font-bold text-red-400 px-1 animate-pulse">
                                            ❌ {usernameError}
                                        </div>
                                    )}
                                    {usernameSuccess && (
                                        <div className="text-sm font-bold text-green-400 px-1">
                                            ✅ Username changed! Reloading...
                                        </div>
                                    )}
                                    <div className="flex gap-3 pt-2">
                                        <button
                                            onClick={() => {
                                                setIsEditingUsername(false);
                                                setNewUsername('');
                                                setUsernameError('');
                                            }}
                                            className="flex-1 py-3 px-4 rounded-xl font-bold transition-all bg-white/10 hover:bg-white/20 text-white"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleUsernameChange}
                                            disabled={isSavingUsername || !newUsername.trim()}
                                            className="flex-1 py-3 px-4 rounded-xl font-bold transition-all disabled:opacity-50 bg-green-500 text-white shadow-lg shadow-green-500/20 hover:bg-green-600 active:scale-95"
                                        >
                                            {isSavingUsername ? 'Saving...' : 'Save'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Notifications */}
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-lg transition-all ${notificationsEnabled ? 'bg-purple-500/20 text-purple-300 shadow-purple-500/10' : 'bg-white/5 text-white/30'}`}>
                                🔔
                            </div>
                            <div>
                                <div className="font-bold text-lg text-white">Notifications</div>
                                <div className="text-xs font-medium text-white/50">Get alerted for your turn</div>
                            </div>
                        </div>
                        <button
                            onClick={toggleNotifications}
                            className={`w-16 h-9 rounded-full p-1 transition-all duration-300 ease-out border-2 ${notificationsEnabled ? 'bg-green-500 border-green-500' : 'bg-transparent border-white/20'}`}
                        >
                            <div className={`bg-white w-6 h-6 rounded-full shadow-sm transform transition-transform duration-300 ${notificationsEnabled ? 'translate-x-7' : 'translate-x-0'}`} />
                        </button>
                    </div>

                    {/* Host Controls - Kick Player */}
                    {isHost && roomCode && players.length > 1 && (
                        <div className="space-y-3">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-white/50 ml-1">Manage Players</h3>
                            <div className="rounded-2xl p-2 space-y-2 bg-black/20 border border-white/5 max-h-48 overflow-y-auto custom-scrollbar">
                                {players.filter(p => p.id !== player.id).map(p => (
                                    <div
                                        key={p.id}
                                        className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            {p.avatar && (
                                                <div className="w-8 h-8 rounded-full overflow-hidden border border-white/20">
                                                    <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" />
                                                </div>
                                            )}
                                            <span className="font-bold text-white text-sm">{p.name}</span>
                                        </div>
                                        <button
                                            onClick={() => setKickTarget(p.id)}
                                            className="px-3 py-1.5 bg-red-500/20 text-red-300 text-xs font-bold rounded-lg border border-red-500/30 hover:bg-red-500/40 active:scale-95 transition-all"
                                        >
                                            Kick
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Game Actions */}
                    {roomCode && (
                        <div className="space-y-3 pt-4 border-t border-white/10">
                            {/* Go Home - Available to everyone */}
                            <button
                                onClick={() => {
                                    vibrate();
                                    if (onGoHome) {
                                        onGoHome();
                                        onClose();
                                    } else {
                                        onClose();
                                    }
                                }}
                                className="w-full py-4 px-6 bg-blue-500/10 text-blue-300 font-black rounded-2xl border border-blue-500/30 hover:bg-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 uppercase tracking-wide text-sm"
                            >
                                🏠 Go Home (Background)
                            </button>

                            {/* Host: End Game / Player: Leave Game */}
                            {isHost ? (
                                <button
                                    onClick={() => {
                                        vibrate();
                                        setShowEndGameConfirm(true);
                                    }}
                                    className="w-full py-4 px-6 bg-red-500/10 text-red-400 font-black rounded-2xl border border-red-500/30 hover:bg-red-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 uppercase tracking-wide text-sm"
                                >
                                    🛑 End Game & Kick All
                                </button>
                            ) : (
                                <button
                                    onClick={() => {
                                        vibrate();
                                        setShowLeaveConfirm(true);
                                    }}
                                    className="w-full py-4 px-6 bg-white/5 text-white/70 font-black rounded-2xl border border-white/10 hover:bg-white/10 active:scale-95 transition-all uppercase tracking-wide text-sm"
                                >
                                    👋 Leave Game
                                </button>
                            )}

                        </div>
                    )}

                    {/* Main Save Button */}
                    <button
                        onClick={() => {
                            vibrate();
                            handleSave();
                        }}
                        className="w-full py-5 bg-gradient-to-r from-indigo-500 to-purple-600 border border-white/20 text-white font-black text-xl rounded-2xl shadow-xl shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-95 transition-all"
                    >
                        Save Settings
                    </button>

                    {/* Log Out Button */}
                    <button
                        onClick={() => {
                            vibrate();
                            setShowLogoutConfirm(true);
                        }}
                        className="w-full py-4 px-6 bg-white/5 text-white/50 hover:text-white font-black rounded-2xl border border-white/10 hover:bg-white/10 active:scale-95 transition-all uppercase tracking-wide text-sm flex items-center justify-center gap-2"
                    >
                        👋 Log Out
                    </button>

                    {/* Danger Zone */}
                    <div className="pt-8 mt-4 border-t border-white/5">
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => window.location.reload()}
                                className="w-full py-3 text-xs text-orange-400/70 hover:text-orange-400 font-bold transition-colors uppercase tracking-widest border border-orange-500/20 rounded-xl hover:bg-orange-500/10"
                            >
                                🔄 Refresh App
                            </button>
                            <button
                                onClick={() => setShowDeleteConfirm(true)}
                                className="w-full py-3 text-xs text-red-500/50 hover:text-red-500 font-bold transition-colors uppercase tracking-widest border border-red-500/10 rounded-xl hover:bg-red-500/10"
                            >
                                🗑️ Delete Account
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
