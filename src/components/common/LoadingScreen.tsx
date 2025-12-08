import React, { useState, useEffect } from 'react';
import type { LoadingStage } from '../../types';

const TIPS = [
    "💡 Tip: Vote for the funniest answer, not just the best drawing!",
    "💡 Tip: Creative answers usually get more votes. Bribes work too.",
    "💡 Tip: The eyedropper tool can be used to copy colors from the image.",
    "💡 Tip: You can rejoin a game if you accidentally close the tab.",
    "💡 Tip: Drawing hands is impossible. Just hide them in pockets.",
    "💡 Tip: Your FBI agent is judging your art style right now.",
];

interface LoadingScreenProps {
    onGoHome?: () => void;
    stages?: LoadingStage[];
    isOnline?: boolean;
    isSlow?: boolean;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
    onGoHome,
    stages = [],
    isOnline = true,
    isSlow = false
}) => {
    const [tip, setTip] = useState('');
    const [showStuckButton, setShowStuckButton] = useState(false);

    useEffect(() => {
        setTip(TIPS[Math.floor(Math.random() * TIPS.length)]);
        const timer = setTimeout(() => setShowStuckButton(true), 10000);
        return () => clearTimeout(timer);
    }, []);

    // Render individual stage item with spinning → checkmark animation
    const renderStageItem = (stage: LoadingStage, index: number) => {
        let icon: React.ReactNode;
        let textClass = 'text-white/40';
        let containerClass = 'transition-all duration-300';

        switch (stage.status) {
            case 'completed':
                icon = (
                    <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                        <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                );
                textClass = 'text-green-400/80 line-through';
                break;
            case 'loading':
                icon = (
                    <div className="w-6 h-6 rounded-full border-2 border-t-transparent border-[var(--theme-accent,#9B59B6)] animate-spin" />
                );
                textClass = 'text-white font-medium';
                containerClass += ' scale-[1.02]';
                break;
            case 'error':
                icon = (
                    <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center">
                        <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                );
                textClass = 'text-red-400 font-medium';
                break;
            default: // pending
                icon = (
                    <div className="w-6 h-6 rounded-full border-2 border-white/20" />
                );
        }

        return (
            <div
                key={stage.id}
                className={`flex items-center gap-4 py-2 ${containerClass}`}
                style={{ animationDelay: `${index * 100}ms` }}
            >
                <div className="flex-shrink-0 w-8 flex justify-center">
                    {icon}
                </div>
                <div className="flex-1 min-w-0">
                    <span className={`text-sm transition-all ${textClass}`}>
                        {stage.label}
                    </span>
                    {stage.error && (
                        <p className="text-xs text-red-400/70 mt-0.5">{stage.error}</p>
                    )}
                </div>
            </div>
        );
    };

    const hasStages = stages.length > 0;
    const visibleStages = stages.slice(0, 5);
    const hasMoreStages = stages.length > 5;

    return (
        <div
            className="fixed inset-0 flex flex-col items-center justify-center z-[2000] overflow-hidden"
            style={{
                backgroundColor: 'var(--theme-bg, #000000)',
                color: 'var(--theme-text, #ffffff)'
            }}
        >
            {/* Animated Background - Gradient Circles (matching HomeScreen) */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-15%] right-[-15%] w-[60%] h-[60%] bg-purple-500/20 rounded-full blur-[120px] animate-[pulse_8s_ease-in-out_infinite]" />
                <div className="absolute bottom-[-15%] left-[-15%] w-[70%] h-[70%] bg-blue-500/20 rounded-full blur-[120px] animate-[pulse_12s_ease-in-out_infinite_2s]" />
                {/* Floating particles */}
                <div className="absolute top-1/4 left-1/4 w-3 h-3 rounded-full bg-white/10 animate-[float_8s_ease-in-out_infinite]" />
                <div className="absolute top-3/4 right-1/4 w-4 h-4 rounded-full bg-white/10 animate-[float_12s_ease-in-out_infinite_1s]" />
                <div className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full bg-white/10 animate-[float_10s_ease-in-out_infinite_3s]" />
            </div>

            {/* Main Content */}
            <div className="relative z-10 flex flex-col items-center max-w-sm w-full px-6">

                {/* Spinner with glow effect */}
                <div className={`mb-8 relative ${hasStages ? 'scale-75' : 'scale-100'} transition-transform duration-500`}>
                    {/* Glow behind spinner */}
                    <div className="absolute inset-0 bg-[var(--theme-accent,#9B59B6)] rounded-full blur-xl opacity-30 animate-pulse" />
                    {/* Spinner track */}
                    <div className="relative w-16 h-16 rounded-full border-4 border-white/10" />
                    {/* Spinner indicator */}
                    <div className="absolute top-0 left-0 w-16 h-16 rounded-full border-4 border-t-[var(--theme-accent,#9B59B6)] border-r-transparent border-b-transparent border-l-transparent animate-spin" />
                </div>

                {/* Headline */}
                <h2 className="text-xl font-bold mb-6 tracking-wide text-center" style={{ color: 'var(--theme-text)' }}>
                    {!isOnline ? 'Reconnecting...' : (hasStages ? 'Loading...' : 'Please wait...')}
                </h2>

                {/* Network Status Warnings */}
                {!isOnline && (
                    <div className="w-full mb-6 glass-panel p-4 rounded-2xl flex items-center gap-3 animate-pulse border-red-500/30" style={{ backgroundColor: 'rgba(220, 38, 38, 0.15)' }}>
                        <span className="text-2xl">📡</span>
                        <div>
                            <p className="font-bold text-red-400">Lost connection to server!</p>
                            <p className="text-sm text-red-300/60">Check your network connection</p>
                        </div>
                    </div>
                )}

                {isOnline && isSlow && (
                    <div className="w-full mb-6 glass-panel p-4 rounded-2xl flex items-center gap-3 border-yellow-500/30" style={{ backgroundColor: 'rgba(234, 179, 8, 0.1)' }}>
                        <span className="text-2xl">🐢</span>
                        <div>
                            <p className="font-bold text-yellow-400">Slow connection detected</p>
                            <p className="text-sm text-yellow-300/60">Be patient, this may take a moment</p>
                        </div>
                    </div>
                )}

                {/* Stages List - Glass Panel Style */}
                {hasStages && (
                    <div
                        className="w-full backdrop-blur-xl rounded-2xl border border-white/10 p-4 mb-6 max-h-52 overflow-y-auto"
                        style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}
                    >
                        <div className="space-y-1">
                            {visibleStages.map((stage, i) => renderStageItem(stage, i))}
                        </div>
                        {hasMoreStages && (
                            <p className="text-xs text-white/30 text-center mt-3">
                                +{stages.length - 5} more tasks...
                            </p>
                        )}
                    </div>
                )}

                {/* Tip - Glass Card */}
                <div
                    className="w-full p-4 backdrop-blur-md rounded-xl border border-white/5 text-center"
                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)' }}
                >
                    <p className="text-white/40 text-sm italic leading-relaxed">
                        {tip}
                    </p>
                </div>

                {/* Stuck Button */}
                {showStuckButton && onGoHome && (
                    <button
                        onClick={onGoHome}
                        className="mt-6 py-2 px-6 rounded-full backdrop-blur-md border border-white/10 text-white/40 hover:text-red-400 hover:border-red-500/30 text-xs font-bold uppercase tracking-wider transition-all active:scale-95"
                        style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}
                    >
                        Stuck? Reload App
                    </button>
                )}
            </div>
        </div>
    );
};
