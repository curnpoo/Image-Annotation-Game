import React from 'react';
import type { PlayerStats } from '../../types';
import { StatsService } from '../../services/stats';
import { XPService } from '../../services/xp';
import { CurrencyService, formatCurrency } from '../../services/currency';

interface StatsModalProps {
    onClose: () => void;
}

export const StatsModal: React.FC<StatsModalProps> = ({ onClose }) => {
    const stats: PlayerStats = StatsService.getStats();
    const level = XPService.getLevel();
    const currency = CurrencyService.getCurrency();

    const statItems = [
        { label: 'Games Played', value: stats.gamesPlayed, emoji: '🎮' },
        { label: 'Games Won', value: stats.gamesWon, emoji: '🏆' },
        { label: 'Rounds Won', value: stats.roundsWon, emoji: '✅' },
        { label: 'Rounds Lost', value: stats.roundsLost, emoji: '❌' },
        { label: 'Times Sabotaged', value: stats.timesSabotaged, emoji: '💥' },
        { label: 'Times Saboteur', value: stats.timesSaboteur, emoji: '🎭' },
        { label: 'Total $ Earned', value: formatCurrency(stats.totalCurrencyEarned), emoji: '💰' },
        { label: 'Total XP Earned', value: stats.totalXPEarned, emoji: '⭐' },
        { label: 'Highest Level', value: stats.highestLevel, emoji: '📈' },
    ];

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div
                className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto"
                style={{
                    border: '4px solid transparent',
                    backgroundImage: 'linear-gradient(white, white), linear-gradient(135deg, #9B59B6, #3498DB)',
                    backgroundOrigin: 'border-box',
                    backgroundClip: 'padding-box, border-box'
                }}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-black text-gray-800">📊 Your Stats</h2>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-all"
                    >
                        ✕
                    </button>
                </div>

                {/* Current Status */}
                <div className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl p-4 mb-6 text-white text-center">
                    <div className="text-lg font-bold mb-1">Current Status</div>
                    <div className="flex justify-around">
                        <div>
                            <div className="text-2xl font-black">LVL {level}</div>
                            <div className="text-xs opacity-80">Level</div>
                        </div>
                        <div>
                            <div className="text-2xl font-black">{formatCurrency(currency)}</div>
                            <div className="text-xs opacity-80">Balance</div>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                    {statItems.map((item, i) => (
                        <div
                            key={i}
                            className="bg-gray-50 rounded-xl p-3 text-center"
                        >
                            <div className="text-2xl mb-1">{item.emoji}</div>
                            <div className="text-xl font-bold text-gray-800">{item.value}</div>
                            <div className="text-xs text-gray-500">{item.label}</div>
                        </div>
                    ))}
                </div>

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="w-full mt-6 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold py-3 rounded-xl hover:scale-[1.02] active:scale-95 transition-all"
                >
                    Close
                </button>
            </div>
        </div>
    );
};
