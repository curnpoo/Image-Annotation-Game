import React from 'react';
import { HorizontalPicker } from '../common/HorizontalPicker';
import type { GameSettings } from '../../types';

interface GameSettingsPanelProps {
    settings: GameSettings;
    onSettingsChange: (settings: Partial<GameSettings>) => void;
    isHost: boolean;
}

const TIMER_OPTIONS = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120];
const ROUND_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export const GameSettingsPanel: React.FC<GameSettingsPanelProps> = ({
    settings,
    onSettingsChange,
    isHost
}) => {
    return (
        <div className="backdrop-blur-sm rounded-2xl p-3 space-y-2"
            style={{
                backgroundColor: 'var(--theme-card-bg)',
                border: '2px solid var(--theme-border)'
            }}>
            {/* Centered Heading */}
            <h3 className="text-base font-bold text-center" style={{ color: 'var(--theme-text)' }}>
                ⚙️ Game Settings
            </h3>

            {/* Side-by-Side Pickers */}
            <div className="grid grid-cols-2 gap-2">
                {/* Drawing Time */}
                <div className="space-y-1">
                    <label className="text-sm font-bold text-center block" style={{ color: 'var(--theme-text-secondary)' }}>
                        ⏱️ Time
                    </label>
                    <div className="relative">
                        {/* Left Arrow */}
                        <div className="absolute left-1 top-1/2 -translate-y-1/2 z-20 pointer-events-none opacity-60">
                            <span className="text-lg">◀</span>
                        </div>
                        {/* Right Arrow */}
                        <div className="absolute right-1 top-1/2 -translate-y-1/2 z-20 pointer-events-none opacity-60">
                            <span className="text-lg">▶</span>
                        </div>
                        <HorizontalPicker
                            min={10}
                            max={120}
                            value={settings.timerDuration}
                            onChange={(val) => isHost && onSettingsChange({ timerDuration: val })}
                            disabled={!isHost}
                            options={TIMER_OPTIONS}
                            suffix="s"
                            compact={true}
                        />
                    </div>
                </div>

                {/* Number of Rounds */}
                <div className="space-y-1">
                    <label className="text-sm font-bold text-center block" style={{ color: 'var(--theme-text-secondary)' }}>
                        🔄 Rounds
                    </label>
                    <div className="relative">
                        {/* Left Arrow */}
                        <div className="absolute left-1 top-1/2 -translate-y-1/2 z-20 pointer-events-none opacity-60">
                            <span className="text-lg">◀</span>
                        </div>
                        {/* Right Arrow */}
                        <div className="absolute right-1 top-1/2 -translate-y-1/2 z-20 pointer-events-none opacity-60">
                            <span className="text-lg">▶</span>
                        </div>
                        <HorizontalPicker
                            min={1}
                            max={10}
                            value={settings.totalRounds}
                            onChange={(val) => isHost && onSettingsChange({ totalRounds: val })}
                            disabled={!isHost}
                            options={ROUND_OPTIONS}
                            compact={true}
                        />
                    </div>
                </div>
            </div>

            {/* Sabotage Toggle */}
            <div className="flex items-center justify-between pt-1">
                <label className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--theme-text-secondary)' }}>
                    😈 Sabotage
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
