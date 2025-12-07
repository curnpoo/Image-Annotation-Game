import React, { useState } from 'react';
import type { Player } from '../../types';
import { AvatarDisplay } from '../common/AvatarDisplay';
import { CurrencyService, formatCurrency } from '../../services/currency';

interface ProfileScreenProps {
    player: Player;
    onBack: () => void;
    onUpdateProfile: (updates: Partial<Player>) => void;
    onEditAvatar: () => void;
    onShowStats?: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
    player,
    onBack,
    onUpdateProfile,
    onEditAvatar,
    onShowStats
}) => {
    const [name, setName] = useState(player.name);

    const balance = CurrencyService.getCurrency();

    const handleSave = () => {
        if (name.trim()) {
            onUpdateProfile({
                name: name.trim()
            });
            onBack();
        }
    };



    return (
        <div
            className="min-h-screen flex flex-col"
            style={{
                paddingTop: 'max(1.5rem, env(safe-area-inset-top) + 1rem)',
                paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
                backgroundColor: 'var(--theme-bg-primary)'
            }}
        >
            {/* Home Button Card */}
            <button
                onClick={onBack}
                className="mx-4 mb-4 rounded-[2rem] p-4 border-2 flex items-center gap-4 hover:brightness-110 active:scale-95 transition-all shadow-lg"
                style={{
                    backgroundColor: 'var(--theme-card-bg)',
                    borderColor: 'var(--theme-border)'
                }}
            >
                <div className="text-3xl">🏠</div>
                <div className="flex-1 text-left">
                    <div className="text-lg font-bold" style={{ color: 'var(--theme-text)' }}>Back to Home</div>
                    <div className="text-sm font-medium" style={{ color: 'var(--theme-text-secondary)' }}>Return to main menu</div>
                </div>
                <div className="text-2xl" style={{ color: 'var(--theme-text-secondary)' }}>←</div>
            </button>

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 mb-2">
                <h1 className="text-2xl font-black drop-shadow-lg" style={{ color: 'var(--theme-text)' }}>👤 PROFILE</h1>
                <div className="flex items-center gap-2">
                    <button
                        onClick={onShowStats}
                        className="px-3 py-2 rounded-xl font-bold transition-all border-2"
                        style={{
                            backgroundColor: 'var(--theme-bg-secondary)',
                            color: 'var(--theme-text)',
                            borderColor: 'var(--theme-border)'
                        }}
                    >
                        📊 Stats
                    </button>
                    <div className="px-4 py-2 rounded-xl font-bold text-white shadow-md"
                        style={{ backgroundColor: 'var(--theme-accent)' }}>
                        {formatCurrency(balance)}
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
                {/* Name Input */}
                <div className="rounded-[2rem] p-4 shadow-lg"
                    style={{
                        backgroundColor: 'var(--theme-card-bg)',
                        border: '2px solid var(--theme-border)'
                    }}>
                    <label className="block text-sm font-bold mb-2" style={{ color: 'var(--theme-text-secondary)' }}>NAME</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        maxLength={15}
                        className="w-full px-4 py-3 rounded-2xl border-2 focus:outline-none font-bold text-center text-lg"
                        style={{
                            backgroundColor: 'var(--theme-bg-secondary)',
                            color: 'var(--theme-text)',
                            borderColor: 'var(--theme-border)'
                        }}
                    />
                </div>

                {/* Avatar Display */}
                <div className="rounded-[2rem] p-4 shadow-lg"
                    style={{
                        backgroundColor: 'var(--theme-card-bg)',
                        border: '2px solid var(--theme-border)'
                    }}>
                    <label className="block text-sm font-bold mb-2" style={{ color: 'var(--theme-text-secondary)' }}>YOUR AVATAR</label>
                    <button
                        onClick={onEditAvatar}
                        className="w-full flex flex-col items-center p-4 rounded-3xl border-2 border-dashed transition-all group hover:scale-[1.02]"
                        style={{
                            borderColor: 'var(--theme-border)',
                            backgroundColor: 'var(--theme-bg-secondary)'
                        }}
                    >
                        <div className="w-32 h-32 relative mb-2 group-hover:scale-105 transition-transform">
                            <AvatarDisplay
                                strokes={player.avatarStrokes}
                                avatar={player.avatar}
                                frame={player.frame}
                                color={player.color}
                                size={128}
                            />
                            <div className="absolute bottom-0 right-0 text-white p-2 rounded-full shadow-lg"
                                style={{ backgroundColor: 'var(--theme-accent)' }}>
                                ✏️
                            </div>
                        </div>
                        <span className="font-bold" style={{ color: 'var(--theme-accent)' }}>Tap to Edit Avatar</span>
                    </button>
                </div>
            </div>

            <div className="p-4 safe-area-inset-bottom">
                <button
                    onClick={handleSave}
                    className="w-full py-4 text-white font-bold text-xl rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all"
                    style={{
                        background: 'linear-gradient(135deg, var(--theme-accent) 0%, #FFD700 100%)'
                    }}
                >
                    Save Changes
                </button>
            </div>
        </div>
    );
};
