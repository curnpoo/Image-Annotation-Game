import React, { useState, useEffect, useCallback } from 'react';
import './transitions.css';

interface TunnelTransitionProps {
    isActive: boolean;
    onComplete: () => void;
    isDarkMode?: boolean;
}

/**
 * Full-screen 3D tunnel transition with ANO text on rings
 * Slow, immersive luxury brand feel
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
            // Transition completes after animation (longer duration)
            const timer = setTimeout(() => {
                setVisible(false);
                onComplete();
            }, 900); // Longer duration for smooth effect
            return () => clearTimeout(timer);
        }
    }, [isActive, onComplete]);

    if (!visible) return null;

    const bgColor = isDarkMode ? '#0a0a0a' : '#f8f5f0';
    const ringColor = isDarkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)';
    const textColor = isDarkMode ? '#ffffff' : '#1a1a1a';

    // Create multiple rings with ANO text for 3D tunnel effect
    const rings = [
        { scale: 1, delay: 0, textSize: 'text-6xl', opacity: 0.9 },
        { scale: 1.4, delay: 50, textSize: 'text-5xl', opacity: 0.7 },
        { scale: 2, delay: 100, textSize: 'text-4xl', opacity: 0.5 },
        { scale: 2.8, delay: 150, textSize: 'text-3xl', opacity: 0.35 },
        { scale: 3.8, delay: 200, textSize: 'text-2xl', opacity: 0.2 },
        { scale: 5, delay: 250, textSize: 'text-xl', opacity: 0.1 },
    ];

    return (
        <div
            className="transition-container transition-active"
            style={{
                backgroundColor: bgColor,
                perspective: '1000px',
                perspectiveOrigin: 'center center'
            }}
        >
            {/* 3D Tunnel Rings with ANO text */}
            {rings.map((ring, i) => (
                <div
                    key={i}
                    className="absolute inset-0 flex items-center justify-center tunnel-ring-3d"
                    style={{
                        animationDelay: `${ring.delay}ms`,
                        animationDuration: '800ms'
                    }}
                >
                    {/* Ring circle */}
                    <div
                        className="absolute rounded-full flex items-center justify-center"
                        style={{
                            width: `${80 * ring.scale}vmin`,
                            height: `${80 * ring.scale}vmin`,
                            border: `${3 / ring.scale}px solid ${ringColor}`,
                            opacity: ring.opacity,
                            transform: `translateZ(${-i * 100}px)`,
                        }}
                    >
                        {/* ANO text positioned on the ring */}
                        {i < 4 && (
                            <>
                                {/* Top */}
                                <div
                                    className={`absolute font-black tracking-[0.4em] ${ring.textSize}`}
                                    style={{
                                        top: '8%',
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        color: textColor,
                                        opacity: ring.opacity,
                                        fontFamily: "'Inter', 'SF Pro Display', sans-serif",
                                        textShadow: isDarkMode
                                            ? '0 0 40px rgba(255,255,255,0.2)'
                                            : '0 0 40px rgba(0,0,0,0.05)'
                                    }}
                                >
                                    ANO
                                </div>
                                {/* Bottom (rotated) */}
                                <div
                                    className={`absolute font-black tracking-[0.4em] ${ring.textSize}`}
                                    style={{
                                        bottom: '8%',
                                        left: '50%',
                                        transform: 'translateX(-50%) rotate(180deg)',
                                        color: textColor,
                                        opacity: ring.opacity * 0.6,
                                        fontFamily: "'Inter', 'SF Pro Display', sans-serif",
                                    }}
                                >
                                    ANO
                                </div>
                                {/* Left */}
                                <div
                                    className={`absolute font-black tracking-[0.4em] ${ring.textSize}`}
                                    style={{
                                        left: '5%',
                                        top: '50%',
                                        transform: 'translateY(-50%) rotate(-90deg)',
                                        color: textColor,
                                        opacity: ring.opacity * 0.5,
                                        fontFamily: "'Inter', 'SF Pro Display', sans-serif",
                                    }}
                                >
                                    ANO
                                </div>
                                {/* Right */}
                                <div
                                    className={`absolute font-black tracking-[0.4em] ${ring.textSize}`}
                                    style={{
                                        right: '5%',
                                        top: '50%',
                                        transform: 'translateY(-50%) rotate(90deg)',
                                        color: textColor,
                                        opacity: ring.opacity * 0.5,
                                        fontFamily: "'Inter', 'SF Pro Display', sans-serif",
                                    }}
                                >
                                    ANO
                                </div>
                            </>
                        )}
                    </div>
                </div>
            ))}

            {/* Central focal point */}
            <div
                className="absolute inset-0 flex items-center justify-center tunnel-center"
                style={{ animationDuration: '800ms' }}
            >
                <div
                    className="w-4 h-4 rounded-full"
                    style={{
                        backgroundColor: isDarkMode ? '#fff' : '#000',
                        boxShadow: isDarkMode
                            ? '0 0 60px 20px rgba(255,255,255,0.3)'
                            : '0 0 60px 20px rgba(0,0,0,0.1)'
                    }}
                />
            </div>
        </div>
    );
};

interface CasinoTransitionProps {
    isActive: boolean;
    onComplete: () => void;
}

/**
 * Casino-themed transition with slot machine and rotating gold rays
 * Uses smooth physics-based bob animation
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
            }, 600);
            return () => clearTimeout(timer);
        }
    }, [isActive, onComplete]);

    if (!visible) return null;

    // Create 16 radial lines emanating from center
    const rayCount = 16;
    const rays = Array.from({ length: rayCount }, (_, i) => ({
        angle: (360 / rayCount) * i,
        delay: i * 15
    }));

    return (
        <div
            className="transition-container transition-active"
            style={{
                background: 'radial-gradient(circle at center, #1f1f1f 0%, #0a0a0a 100%)'
            }}
        >
            {/* Container for centered content */}
            <div className="flex flex-col items-center justify-center">
                {/* Rotating radial rays - thick short lines emanating outward */}
                <div className="absolute casino-rays-spin" style={{ width: '320px', height: '320px' }}>
                    <svg
                        width="320"
                        height="320"
                        viewBox="0 0 320 320"
                        className="absolute inset-0"
                    >
                        {rays.map((ray, i) => (
                            <line
                                key={i}
                                x1="160"
                                y1="80"
                                x2="160"
                                y2="40"
                                stroke="#FFD700"
                                strokeWidth="8"
                                strokeLinecap="round"
                                transform={`rotate(${ray.angle} 160 160)`}
                                style={{
                                    filter: 'drop-shadow(0 0 6px rgba(255, 215, 0, 0.6))',
                                    opacity: 0.9
                                }}
                            />
                        ))}
                    </svg>
                </div>

                {/* Central content with bob animation */}
                <div
                    className="casino-bob flex flex-col items-center z-10"
                    style={{
                        filter: 'drop-shadow(0 8px 24px rgba(0, 0, 0, 0.5))'
                    }}
                >
                    {/* Text above slot machine */}
                    <div className="flex flex-col items-center mb-3">
                        <div
                            className="text-sm font-bold tracking-[0.3em] mb-1"
                            style={{
                                color: 'rgba(255, 215, 0, 0.7)'
                            }}
                        >
                            LOADING
                        </div>
                        <div
                            className="text-2xl font-black tracking-[0.2em]"
                            style={{
                                background: 'linear-gradient(180deg, #FFD700 0%, #FFA500 50%, #FF8C00 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                textShadow: '0 2px 10px rgba(255, 165, 0, 0.3)'
                            }}
                        >
                            CASINO
                        </div>
                    </div>

                    {/* Slot machine emoji - larger */}
                    <div
                        className="text-8xl"
                        style={{
                            filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.4))'
                        }}
                    >
                        🎰
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

interface GlobalBlurTransitionProps {
    children: React.ReactNode;
    screenKey: string;
    duration?: number;
}

/**
 * Global blur transition wrapper for all screen changes
 * Applies a smooth blur fade effect when screens change
 */
export const GlobalBlurTransition: React.FC<GlobalBlurTransitionProps> = ({
    children,
    screenKey,
    duration = 200
}) => {
    const [displayedKey, setDisplayedKey] = useState(screenKey);
    const [displayedChildren, setDisplayedChildren] = useState(children);
    const [phase, setPhase] = useState<'idle' | 'blur-out' | 'blur-in'>('idle');

    useEffect(() => {
        if (screenKey !== displayedKey) {
            // Screen is changing - start blur-out
            setPhase('blur-out');

            // After blur-out completes, swap content and blur-in
            const swapTimer = setTimeout(() => {
                setDisplayedChildren(children);
                setDisplayedKey(screenKey);
                setPhase('blur-in');
            }, duration / 2);

            // After blur-in completes, return to idle
            const idleTimer = setTimeout(() => {
                setPhase('idle');
            }, duration);

            return () => {
                clearTimeout(swapTimer);
                clearTimeout(idleTimer);
            };
        } else {
            // Same screen, just update children
            setDisplayedChildren(children);
        }
    }, [screenKey, children, displayedKey, duration]);

    return (
        <div
            className={`global-blur-transition ${phase !== 'idle' ? `global-blur-${phase}` : ''}`}
            style={{
                '--blur-duration': `${duration / 2}ms`
            } as React.CSSProperties}
        >
            {displayedChildren}
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
