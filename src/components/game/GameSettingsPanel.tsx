import React from 'react';
import type { GameSettings } from '../../types';

interface GameSettingsPanelProps {
    settings: GameSettings;
    onSettingsChange: (settings: Partial<GameSettings>) => void;
    isHost: boolean;
}

const TIMER_OPTIONS = [10, 20, 30, 60];
const ROUND_OPTIONS = [3, 5, 7, 10];

export const GameSettingsPanel: React.FC<GameSettingsPanelProps> = ({
    settings,
    onSettingsChange,
    isHost
}) => {
    return (
        <div className="backdrop-blur-sm rounded-2xl p-4 space-y-4"
            style={{
                backgroundColor: 'var(--theme-card-bg)',
                border: '2px solid var(--theme-border)'
            }}>
            <h3 className="text-base font-bold text-purple-400 flex items-center gap-2 mb-2">
                ⚙️ Game Settings
            </h3>

            {/* Timer Duration */}
            <div className="space-y-2">
                <label className="text-sm font-medium" style={{ color: 'var(--theme-text-secondary)' }}>
                    ⏱️ Drawing Time
                </label>
                <div className="flex gap-2">
                    {TIMER_OPTIONS.map((seconds) => (
                        <button
                            key={seconds}
                            onClick={() => isHost && onSettingsChange({ timerDuration: seconds })}
                            disabled={!isHost}
                            className={`flex-1 py-1.5 px-2 rounded-full font-bold text-sm transition-all border ${settings.timerDuration === seconds
                                ? 'scale-105'
                                : isHost
                                    ? 'hover:opacity-80'
                                    : 'opacity-50 cursor-not-allowed'
                                }`}
                            style={{
                                borderColor: settings.timerDuration === seconds ? 'var(--theme-accent)' : 'var(--theme-border)',
                                color: settings.timerDuration === seconds ? 'var(--theme-button-text)' : 'var(--theme-text-secondary)',
                            }}
                        >
                            {seconds}s
                        </button>
                    ))}
                </div>
            </div>

            {/* Number of Rounds */}
            <div className="space-y-2">
                <label className="text-sm font-medium" style={{ color: 'var(--theme-text-secondary)' }}>
                    🔄 Number of Rounds
                </label>
                <div className="flex gap-2">
                    {ROUND_OPTIONS.map((rounds) => (
                        <button
                            key={rounds}
                            onClick={() => isHost && onSettingsChange({ totalRounds: rounds })}
                            disabled={!isHost}
                            className={`flex-1 py-1.5 px-2 rounded-full font-bold text-sm transition-all border ${settings.totalRounds === rounds
                                ? 'scale-105'
                                : isHost
                                    ? 'hover:opacity-80'
                                    : 'opacity-50 cursor-not-allowed'
                                }`}
                            style={{
                                backgroundColor: 'transparent',
                                borderColor: settings.totalRounds === rounds ? 'var(--theme-accent)' : 'var(--theme-border)',
                                color: settings.totalRounds === rounds ? 'var(--theme-button-text)' : 'var(--theme-text-secondary)',
                            }}
                        >
                            {rounds}
                        </button>
                    ))}
                </div>
            </div>


            {/* Sabotage Toggle */}
            <div className="flex items-center justify-between">
                <label className="text-sm font-medium flex items-center gap-2" style={{ color: 'var(--theme-text-secondary)' }}>
                    😈 Enable Sabotage
                </label>
                <button
                    onClick={() => isHost && onSettingsChange({ enableSabotage: !settings.enableSabotage })}
                    disabled={!isHost}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.enableSabotage ? 'bg-purple-500' : 'bg-gray-700'
                        } ${!isHost ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                    <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.enableSabotage ? 'translate-x-6' : 'translate-x-1'
                            }`}
                    />
                </button>
            </div>

            {
                !isHost && (
                    <p className="text-xs text-center italic" style={{ color: 'var(--theme-text-secondary)' }}>
                        Only the host can change settings
                    </p>
                )
            }
        </div >
    );
};
