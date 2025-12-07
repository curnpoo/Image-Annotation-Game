import React, { useState } from 'react';
import type { Player, SabotageType, SabotageEffect } from '../../types';
import { AvatarDisplay } from '../common/AvatarDisplay';

interface SabotageSelectionScreenProps {
    players: Player[];
    saboteurId: string;
    currentPlayerId: string;
    onSelect: (targetId: string, effect: SabotageEffect) => void;
}

const SABOTAGE_TYPES: { type: SabotageType; label: string; icon: string; description: string }[] = [
    {
        type: 'subtract_time',
        label: 'Time Thief',
        icon: '⏳',
        description: 'Steal their precious seconds!'
    },
    {
        type: 'reduce_colors',
        label: 'Color Blind',
        icon: '🎨',
        description: 'Restrict their color palette!'
    },
    {
        type: 'visual_distortion',
        label: 'Shake & Blur',
        icon: '😵',
        description: 'Make their canvas go crazy!'
    }
];

export const SabotageSelectionScreen: React.FC<SabotageSelectionScreenProps> = ({
    players,
    saboteurId,
    currentPlayerId,
    onSelect
}) => {
    const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
    const [selectedType, setSelectedType] = useState<SabotageType | null>(null);

    const isSaboteur = currentPlayerId === saboteurId;
    const saboteur = players.find(p => p.id === saboteurId);

    // Filter out potential targets (everyone except saboteur)
    const targets = players.filter(p => p.id !== saboteurId);

    const handleConfirm = () => {
        if (selectedTargetId && selectedType) {
            onSelect(selectedTargetId, { type: selectedType, intensity: 5 });
        }
    };

    if (!isSaboteur) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center animate-pulse">
                <div className="text-6xl mb-4">🤫</div>
                <h2 className="text-3xl font-bold text-white mb-2">Shhh...</h2>
                <p className="text-xl text-purple-200">
                    <span className="font-bold text-yellow-400">{saboteur?.name}</span> is picking a victim...
                </p>
                <div className="mt-8 text-sm opacity-60">Be afraid. Be very afraid.</div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full max-w-4xl mx-auto p-4 space-y-6">
            <header className="text-center">
                <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-purple-600 mb-2">
                    REVENGE TIME 😈
                </h1>
                <p className="text-gray-300">Choose a victim and how to punish them.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1 overflow-y-auto">
                {/* Step 1: Choose Victim */}
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-white border-b border-white/10 pb-2">
                        1. Pick a Victim
                    </h2>
                    <div className="grid grid-cols-2 gap-3">
                        {targets.map(p => (
                            <button
                                key={p.id}
                                onClick={() => setSelectedTargetId(p.id)}
                                className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${selectedTargetId === p.id
                                    ? 'border-red-500 bg-red-500/20 scale-105'
                                    : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/30'
                                    }`}
                            >
                                <AvatarDisplay
                                    strokes={p.avatarStrokes}
                                    avatar={p.avatar}
                                    color={p.color}
                                    backgroundColor={p.backgroundColor}
                                    size={48}
                                />
                                <span className="font-bold text-sm text-white truncate w-full text-center">
                                    {p.name}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Step 2: Choose Effect */}
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-white border-b border-white/10 pb-2">
                        2. Choose Torture
                    </h2>
                    <div className="space-y-3">
                        {SABOTAGE_TYPES.map(effect => (
                            <button
                                key={effect.type}
                                onClick={() => setSelectedType(effect.type)}
                                className={`w-full p-4 rounded-xl border-2 transition-all flex items-center gap-4 text-left ${selectedType === effect.type
                                    ? 'border-purple-500 bg-purple-500/20 scale-105'
                                    : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/30'
                                    }`}
                            >
                                <span className="text-3xl">{effect.icon}</span>
                                <div>
                                    <div className="font-bold text-white">{effect.label}</div>
                                    <div className="text-xs text-gray-400">{effect.description}</div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="pt-4 border-t border-white/10">
                <button
                    onClick={handleConfirm}
                    disabled={!selectedTargetId || !selectedType}
                    className={`w-full py-4 rounded-2xl font-black text-xl shadow-lg transition-all ${selectedTargetId && selectedType
                        ? 'bg-gradient-to-r from-red-500 to-purple-600 text-white hover:scale-105 hover:shadow-red-500/50'
                        : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                        }`}
                >
                    UNLEASH CHAOS ⚡️
                </button>
            </div>
        </div>
    );
};
