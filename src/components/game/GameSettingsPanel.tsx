import React from 'react';
import { HorizontalPicker } from '../common/HorizontalPicker';
import type { GameSettings } from '../../types';

interface GameSettingsPanelProps {
    settings: GameSettings;
    onSettingsChange: (settings: Partial<GameSettings>) => void;
    isHost: boolean;
}

const TIMER_OPTIONS = [10, 20, 30, 40, 50, 60];
const ROUND_OPTIONS = [1, 3, 5, 7];

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
            <h3 className="text-base font-bold flex items-center gap-2 mb-2" style={{ color: '#F3E5AB' }}>
                ⚙️ Game Settings
            </h3>

            {/* Timer Duration */}
            <div className="space-y-2">
                <label className="text-sm font-medium" style={{ color: 'var(--theme-text-secondary)' }}>
                    ⏱️ Drawing Time
                </label>
                <div className="py-2">
                    <HorizontalPicker
                        min={10}
                        max={60}
                        value={settings.timerDuration}
                        onChange={(val) => isHost && onSettingsChange({ timerDuration: val })}
                        disabled={!isHost}
                        options={TIMER_OPTIONS}
                        suffix="s"
                    />
                </div>
            </div>

            {/* Number of Rounds */}
            <div className="space-y-2">
                <label className="text-sm font-medium" style={{ color: 'var(--theme-text-secondary)' }}>
                    🔄 Number of Rounds
                </label>
                <div className="py-2">
                    <HorizontalPicker
                        min={1}
                        max={7}
                        value={settings.totalRounds}
                        onChange={(val) => isHost && onSettingsChange({ totalRounds: val })}
                        disabled={!isHost}
                        options={ROUND_OPTIONS}
                    />
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
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${!isHost ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                        }`}
                    style={{
                        backgroundColor: settings.enableSabotage ? '#F3E5AB' : '#374151'
                    }}
                >
                    <span
                        className={`inline-block h-4 w-4 transform rounded-full transition-transform ${settings.enableSabotage ? 'translate-x-6' : 'translate-x-1'
                            }`}
                        style={{
                            backgroundColor: settings.enableSabotage ? '#4A3B2A' : '#FFFFFF'
                        }}
                    />
                </button>
            </div>

            {!isHost && (
                <p className="text-xs text-center italic" style={{ color: 'var(--theme-text-secondary)' }}>
                    Only the host can change settings
                </p>
            )}
        </div >
    );
};
