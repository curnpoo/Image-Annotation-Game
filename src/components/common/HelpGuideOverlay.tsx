import React, { useEffect, useState } from 'react';

interface HelpGuideOverlayProps {
    onClose: () => void;
}

interface GuideStep {
    number: number;
    emoji: string;
    title: string;
    description: string;
    position: 'top-left' | 'top-right' | 'mid-left' | 'mid-right' | 'bottom-left' | 'bottom-right' | 'bottom-center';
    color: string;
}

const GUIDE_STEPS: GuideStep[] = [
    {
        number: 1,
        emoji: '👥',
        title: 'FRIENDS',
        description: "See who's online & jump into their games!",
        position: 'top-left',
        color: '#22c55e' // green
    },
    {
        number: 2,
        emoji: '🎮',
        title: 'PLAY',
        description: 'Tap here to start playing!',
        position: 'top-right',
        color: '#f97316' // orange (theme accent)
    },
    {
        number: 3,
        emoji: '🎰',
        title: 'CASINO',
        description: 'Spin the wheel for bonus coins!',
        position: 'mid-left',
        color: '#eab308' // yellow
    },
    {
        number: 4,
        emoji: '🛒',
        title: 'STORE',
        description: 'Unlock cosmetics, tools and more!',
        position: 'mid-right',
        color: '#a855f7' // purple
    },
    {
        number: 5,
        emoji: '👤',
        title: 'PROFILE',
        description: 'Customize your look & avatar',
        position: 'bottom-left',
        color: '#3b82f6' // blue
    },
    {
        number: 6,
        emoji: '⚙️',
        title: 'SETTINGS',
        description: 'Adjust settings and room actions',
        position: 'bottom-right',
        color: '#6b7280' // gray
    },
    {
        number: 7,
        emoji: '📊',
        title: 'HISTORY',
        description: 'Revisit your past masterpieces!',
        position: 'bottom-center',
        color: '#ec4899' // pink
    }
];

const getPositionStyles = (position: GuideStep['position']): React.CSSProperties => {
    const baseStyles: React.CSSProperties = {
        position: 'absolute',
    };

    // Position tooltips OFFSET from buttons so buttons remain visible
    // Cards are placed to the side/below rather than covering
    switch (position) {
        case 'top-left':
            // Friends panel - position card to the left edge, slightly overlapping
            return { ...baseStyles, top: '22%', left: '2%' };
        case 'top-right':
            // Play button - position card to the right edge
            return { ...baseStyles, top: '17%', right: '2%' };
        case 'mid-left':
            // Casino - position card to left side
            return { ...baseStyles, top: '46%', left: '2%' };
        case 'mid-right':
            // Store - position card to right side
            return { ...baseStyles, top: '40%', right: '2%' };
        case 'bottom-left':
            // Profile - position card to left side
            return { ...baseStyles, top: '62%', left: '2%' };
        case 'bottom-right':
            // Settings - position card to right side, below Store
            return { ...baseStyles, top: '62%', right: '2%' };
        case 'bottom-center':
            // Match History - position below (moved up to avoid overlap with Got It button)
            return { ...baseStyles, top: '76%', left: '50%', transform: 'translateX(-50%)' };
        default:
            return baseStyles;
    }
};

export const HelpGuideOverlay: React.FC<HelpGuideOverlayProps> = ({ onClose }) => {
    // visibleCount tracks how many steps are effectively "done" (shown)
    // Starts at 0 so we can animate the first one IN (instead of it just being there)
    const [visibleCount, setVisibleCount] = useState<number>(0);
    
    // lineProgress tracks the drawing of the line (0 to 6 segments)
    const [lineProgress, setLineProgress] = useState<number>(0);
    
    const [showDismiss, setShowDismiss] = useState(false);

    useEffect(() => {
        let mounted = true;

        const runSequence = async () => {
            // Helper to wait
            const wait = (ms: number) => new Promise(r => setTimeout(r, ms));

            // Wait initially for consistent start
            await wait(200);

            // Show first step
            setVisibleCount(1);
            
            // Loop through remaining steps (1 to 6, indices of GUIDE_STEPS)
            for (let i = 1; i < GUIDE_STEPS.length; i++) {
                if (!mounted) return;

                // 1. READ TIME: User reads the current step (750ms)
                await wait(750);
                if (!mounted) return;

                // 2. DRAW TIME: Animate line to next step
                setLineProgress(i);
                
                // 3. DRAW DURATION: Wait for line animation to finish (500ms)
                await wait(500);
                if (!mounted) return;

                // 4. SHOW STEP: Reveal the next card
                setVisibleCount(i + 1);
            }

            // Final read time before button
            await wait(750);
            if (!mounted) return;
            
            setShowDismiss(true);
        };

        runSequence();

        return () => { mounted = false; };
    }, []);

    return (
        <div
            className="fixed inset-0 z-[9999] flex flex-col"
            style={{
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
            }}
            onClick={onClose}
        >
            {/* SVG Path connecting the steps */}
            <svg
                className="absolute inset-0 w-full h-full pointer-events-none"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
            >
                <defs>
                    <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#22c55e" stopOpacity="0.8" />
                        <stop offset="50%" stopColor="#a855f7" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="#ec4899" stopOpacity="0.8" />
                    </linearGradient>
                </defs>
                
                {/* 
                   Separate path segments for each step connection.
                   This ensures exact start/stop control compared to a single long dash offset.
                */}
                {[
                    "M 15 24 C 30 24, 60 20, 85 20", // 1 -> 2
                    "M 85 20 C 90 30, 20 40, 15 48", // 2 -> 3
                    "M 15 48 C 10 52, 80 44, 85 48", // 3 -> 4
                    "M 85 48 C 90 54, 15 58, 15 64", // 4 -> 5
                    "M 15 64 C 10 68, 85 60, 85 64", // 5 -> 6
                    "M 85 64 C 85 72, 55 78, 50 82"  // 6 -> 7
                ].map((d, i) => (
                    <path
                        key={i}
                        d={d}
                        fill="none"
                        stroke="url(#pathGradient)"
                        strokeWidth="0.4"
                        strokeLinecap="round"
                        pathLength={1}
                        style={{
                            strokeDasharray: 1,
                            // i+1 because lineProgress=1 means "Draw First Segment" (Segment Index 0)
                            strokeDashoffset: lineProgress >= (i + 1) ? 0 : 1,
                            transition: 'stroke-dashoffset 500ms ease-in-out'
                        }}
                    />
                ))}
            </svg>

            {/* Guide Steps */}
            {GUIDE_STEPS.map((step, index) => (
                <div
                    key={step.number}
                    style={{
                        ...getPositionStyles(step.position),
                        opacity: index < visibleCount ? 1 : 0,
                        transform: `${getPositionStyles(step.position).transform || ''} ${index < visibleCount ? 'scale(1)' : 'scale(0.8)'}`,
                        transition: 'opacity 0.4s ease-out, transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    }}
                    className="pointer-events-none"
                >
                {/* Step Card */}
                    <div
                        className="flex items-start gap-2.5 p-2.5 rounded-xl backdrop-blur-md border border-white/20"
                        style={{
                            backgroundColor: 'rgba(30, 30, 30, 0.9)',
                            boxShadow: `0 0 15px ${step.color}25, 0 2px 8px rgba(0,0,0,0.3)`,
                            maxWidth: '140px',
                        }}
                    >
                        {/* Number Badge */}
                        <div
                            className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black text-white shadow-lg"
                            style={{
                                backgroundColor: step.color,
                                boxShadow: `0 0 8px ${step.color}60`,
                            }}
                        >
                            {step.number}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1 mb-0.5">
                                <span className="text-sm">{step.emoji}</span>
                                <span
                                    className="text-[11px] font-black tracking-wide"
                                    style={{ color: step.color }}
                                >
                                    {step.title}
                                </span>
                            </div>
                            <p className="text-[11px] text-white/80 leading-snug">
                                {step.description}
                            </p>
                        </div>
                    </div>
                </div>
            ))}

            {/* Dismiss Button - Bottom Center Large Pill */}
            <div
                className={`
                    fixed bottom-8 left-0 right-0
                    flex justify-center
                    transition-all duration-700
                    z-[10000]
                    ${showDismiss ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}
                `}
                style={{
                    paddingBottom: 'env(safe-area-inset-bottom)',
                }}
            >
                <div className="relative group">
                    {/* Glow blur behind */}
                    <div className="absolute inset-0.5 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 rounded-full blur-[20px] opacity-40 group-hover:opacity-70 transition-opacity duration-500" />
                    
                    <button
                        onClick={onClose}
                        className="
                            relative
                            px-16 py-6
                            rounded-full
                            text-white font-black text-xl tracking-wider
                            active:scale-95
                            transition-all duration-300
                            overflow-hidden
                            border border-white/20
                        "
                        style={{
                            background: 'rgba(20, 20, 20, 0.6)',
                            backdropFilter: 'blur(20px)',
                            WebkitBackdropFilter: 'blur(20px)',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.2)',
                        }}
                    >
                        {/* Gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-orange-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        
                        <span className="relative flex items-center gap-3 drop-shadow-lg">
                            <span className="text-2xl">✨</span>
                            <span>GOT IT!</span>
                            <span className="text-2xl">✨</span>
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
};
