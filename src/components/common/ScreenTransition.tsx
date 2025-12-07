import React, { useState, useEffect, useCallback } from 'react';
import './transitions.css';

interface TunnelTransitionProps {
    isActive: boolean;
    onComplete: () => void;
    isDarkMode?: boolean;
}

/**
 * Full-screen tunnel transition with ANO monogram + brushes
 * LV-style luxury brand feel
 */
export const TunnelTransition: React.FC<TunnelTransitionProps> = ({
    isActive,
    onComplete,
    isDarkMode = false
}) => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (isActive) {
            setVisible(true);
            // Transition completes after animation
            const timer = setTimeout(() => {
                setVisible(false);
                onComplete();
            }, 280);
            return () => clearTimeout(timer);
        }
    }, [isActive, onComplete]);

    if (!visible) return null;

    const bgColor = isDarkMode ? '#000000' : '#ffffff';
    const textColor = isDarkMode ? '#ffffff' : '#000000';

    return (
        <div
            className="transition-container transition-active"
            style={{ backgroundColor: bgColor }}
        >
            {/* Multiple rings for tunnel depth effect */}
            {[...Array(5)].map((_, i) => (
                <div
                    key={i}
                    className="absolute inset-0 flex items-center justify-center tunnel-ring"
                    style={{
                        animationDelay: `${i * 30}ms`,
                        opacity: 0.6 - i * 0.1
                    }}
                >
                    <div
                        className="rounded-full border-4"
                        style={{
                            width: `${100 + i * 50}px`,
                            height: `${100 + i * 50}px`,
                            borderColor: textColor,
                            opacity: 0.3
                        }}
                    />
                </div>
            ))}

            {/* Central ANO Monogram */}
            <div
                className="tunnel-text flex flex-col items-center gap-2"
                style={{ color: textColor }}
            >
                {/* Brushes icon above */}
                <div className="text-3xl" style={{ opacity: 0.7 }}>
                    🖌️✨🎨
                </div>
                {/* ANO Text - styled like luxury brand */}
                <div
                    className="font-black tracking-[0.3em] text-5xl"
                    style={{
                        fontFamily: "'Inter', sans-serif",
                        letterSpacing: '0.3em',
                        textShadow: isDarkMode
                            ? '0 0 30px rgba(255,255,255,0.3)'
                            : '0 0 30px rgba(0,0,0,0.1)'
                    }}
                >
                    ANO
                </div>
                {/* Brushes icon below */}
                <div className="text-3xl" style={{ opacity: 0.7 }}>
                    🎨✨🖌️
                </div>
            </div>
        </div>
    );
};

interface CasinoTransitionProps {
    isActive: boolean;
    onComplete: () => void;
}

/**
 * Casino-themed transition with slot machine and rotating gold dashes
 */
export const CasinoTransition: React.FC<CasinoTransitionProps> = ({
    isActive,
    onComplete
}) => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (isActive) {
            setVisible(true);
            const timer = setTimeout(() => {
                setVisible(false);
                onComplete();
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [isActive, onComplete]);

    if (!visible) return null;

    return (
        <div
            className="transition-container transition-active"
            style={{
                background: 'linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 100%)'
            }}
        >
            {/* Rotating gold dashed circle */}
            <div className="relative flex items-center justify-center">
                <svg
                    className="absolute rotate-dashes"
                    width="200"
                    height="200"
                    viewBox="0 0 200 200"
                >
                    <circle
                        cx="100"
                        cy="100"
                        r="90"
                        fill="none"
                        stroke="#FFD700"
                        strokeWidth="6"
                        strokeDasharray="15 10"
                        strokeLinecap="round"
                    />
                </svg>

                {/* Central content */}
                <div className="casino-entrance flex flex-col items-center gap-3">
                    <div className="text-7xl">🎰</div>
                    <div
                        className="text-lg font-bold tracking-wider"
                        style={{
                            background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                        }}
                    >
                        LOADING CASINO
                        <span className="animate-pulse">...</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

interface ScreenTransitionProps {
    children: React.ReactNode;
    screenKey: string;
    direction?: 'left' | 'right' | 'fade';
}

/**
 * Wrapper component for screen transitions
 * Applies enter animation based on direction
 */
export const ScreenTransition: React.FC<ScreenTransitionProps> = ({
    children,
    screenKey,
    direction = 'fade'
}) => {
    const [currentKey, setCurrentKey] = useState(screenKey);
    const [animationClass, setAnimationClass] = useState('screen-fade-in');

    useEffect(() => {
        if (screenKey !== currentKey) {
            // New screen - apply entrance animation
            setCurrentKey(screenKey);
            const animClass = direction === 'left'
                ? 'screen-slide-left'
                : direction === 'right'
                    ? 'screen-slide-right'
                    : 'screen-fade-in';
            setAnimationClass(animClass);
        }
    }, [screenKey, currentKey, direction]);

    return (
        <div className={animationClass} key={currentKey}>
            {children}
        </div>
    );
};

// Custom hook for managing transition state
export const useTransition = () => {
    const [transitionType, setTransitionType] = useState<'tunnel' | 'casino' | null>(null);
    const [pendingCallback, setPendingCallback] = useState<(() => void) | null>(null);

    const triggerTunnel = useCallback((callback: () => void) => {
        setTransitionType('tunnel');
        setPendingCallback(() => callback);
    }, []);

    const triggerCasino = useCallback((callback: () => void) => {
        setTransitionType('casino');
        setPendingCallback(() => callback);
    }, []);

    const handleComplete = useCallback(() => {
        if (pendingCallback) {
            pendingCallback();
        }
        setTransitionType(null);
        setPendingCallback(null);
    }, [pendingCallback]);

    return {
        transitionType,
        triggerTunnel,
        triggerCasino,
        handleComplete
    };
};
