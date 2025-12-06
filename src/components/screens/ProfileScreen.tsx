import React, { useState } from 'react';
import type { Player, DrawingStroke } from '../../types';
import { AvatarDisplay } from '../common/AvatarDisplay';
import { CurrencyService, formatCurrency } from '../../services/currency';
import { StatsModal } from '../common/StatsModal';

interface ProfileScreenProps {
    player: Player;
    onBack: () => void;
    onUpdateProfile: (updates: Partial<Player>) => void;
}

const COLORS = ['#FF69B4', '#9B59B6', '#3498DB', '#1ABC9C', '#F1C40F', '#E67E22', '#E74C3C', '#34495E', '#000000'];

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
    player,
    onBack,
    onUpdateProfile
}) => {
    const [name, setName] = useState(player.name);
    const [strokes] = useState<DrawingStroke[]>(player.avatarStrokes || []);
    const [color, setColor] = useState(player.color);
    const [showStats, setShowStats] = useState(false);

    const balance = CurrencyService.getCurrency();

    const handleSave = () => {
        if (name.trim()) {
            onUpdateProfile({
                name: name.trim(),
                avatarStrokes: strokes,
                color
            });
            onBack();
        }
    };

    return (
        <div
            className="min-h-screen bg-gradient-to-b from-blue-500 via-blue-600 to-blue-800 flex flex-col"
            style={{
                paddingTop: 'max(1.5rem, env(safe-area-inset-top) + 1rem)',
                paddingBottom: 'max(1rem, env(safe-area-inset-bottom))'
            }}
        >
            {/* Home Button Card */}
            <button
                onClick={onBack}
                className="mx-4 mb-4 bg-white/10 backdrop-blur-sm rounded-2xl p-4 border-2 border-white/20 flex items-center gap-4 hover:bg-white/20 active:scale-95 transition-all"
            >
                <div className="text-3xl">🏠</div>
                <div className="flex-1 text-left">
                    <div className="text-lg font-bold text-white">Back to Home</div>
                    <div className="text-white/60 text-sm">Return to main menu</div>
                </div>
                <div className="text-2xl text-white/60">←</div>
            </button>

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 mb-2">
                <h1 className="text-2xl font-black text-white drop-shadow-lg">👤 PROFILE</h1>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowStats(true)}
                        className="bg-white/20 text-white px-3 py-2 rounded-xl font-bold hover:bg-white/30 transition-all"
                    >
                        📊 Stats
                    </button>
                    <div className="bg-green-500 text-white px-4 py-2 rounded-xl font-bold">
                        {formatCurrency(balance)}
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
                {/* Name Input */}
                <div className="bg-white rounded-2xl p-4 shadow-lg">
                    <label className="block text-sm font-bold text-gray-700 mb-2">NAME</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        maxLength={15}
                        className="w-full px-4 py-3 bg-gray-50 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none font-bold text-center text-lg"
                    />
                </div>

                {/* Avatar Display */}
                <div className="bg-white rounded-2xl p-4 shadow-lg">
                    <label className="block text-sm font-bold text-gray-700 mb-2">YOUR AVATAR</label>
                    <div className="flex justify-center">
                        <div className="w-24 h-24">
                            <AvatarDisplay
                                strokes={strokes}
                                avatar={player.avatar}
                                frame={player.frame}
                                color={color}
                                size={96}
                            />
                        </div>
                    </div>
                    <p className="text-center text-xs text-gray-400 mt-2">Edit avatar in name-entry screen</p>
                </div>

                {/* Color Selection */}
                <div className="bg-white rounded-2xl p-4 shadow-lg">
                    <label className="block text-sm font-bold text-gray-700 mb-2">CARD COLOR</label>
                    <div className="flex flex-wrap justify-center gap-2">
                        {COLORS.map(c => (
                            <button
                                key={c}
                                onClick={() => setColor(c)}
                                className={`w-10 h-10 rounded-full border-4 transition-all ${color === c ? 'scale-110 border-blue-500' : 'border-transparent hover:scale-105'
                                    }`}
                                style={{ backgroundColor: c }}
                            />
                        ))}
                    </div>
                </div>

                {/* Preview */}
                <div className="flex justify-center py-4">
                    <div className="bg-white rounded-2xl p-4 shadow-lg">
                        <div className="text-center text-xs font-bold text-gray-400 mb-2">PREVIEW</div>
                        <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3" style={{ borderLeft: `4px solid ${color}` }}>
                            <AvatarDisplay
                                strokes={strokes}
                                avatar={player.avatar}
                                frame={player.frame}
                                color={color}
                                size={50}
                            />
                            <div>
                                <div className="font-bold text-gray-800">{name || 'Player'}</div>
                                <div className="text-xs text-gray-500">Ready to play!</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Save Button */}
                <button
                    onClick={handleSave}
                    disabled={!name.trim()}
                    className="w-full bg-gradient-to-r from-green-400 to-green-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50"
                >
                    ✓ SAVE CHANGES
                </button>
            </div>

            {/* Stats Modal */}
            {showStats && <StatsModal onClose={() => setShowStats(false)} />}
        </div>
    );
};
