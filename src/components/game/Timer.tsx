import React, { useEffect, useState } from 'react';

interface TimerProps {
    endsAt: number;
    onTimeUp: () => void;
}

export const Timer: React.FC<TimerProps> = ({ endsAt, onTimeUp }) => {
    const [timeLeft, setTimeLeft] = useState(5.0);

    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();
            const remaining = Math.max(0, (endsAt - now) / 1000);

            setTimeLeft(remaining);

            if (remaining <= 0) {
                clearInterval(interval);
                onTimeUp();
            }
        }, 50); // Update frequently for smooth display

        return () => clearInterval(interval);
    }, [endsAt, onTimeUp]);

    // Color and urgency logic
    const getColorClasses = () => {
        if (timeLeft > 3) return {
            text: '#32CD32',
            bg: 'from-green-400 to-emerald-500',
            glow: 'rgba(50, 205, 50, 0.5)'
        };
        if (timeLeft > 1) return {
            text: '#FFE135',
            bg: 'from-yellow-400 to-orange-500',
            glow: 'rgba(255, 225, 53, 0.5)'
        };
        return {
            text: '#FF69B4',
            bg: 'from-red-500 to-pink-500',
            glow: 'rgba(255, 105, 180, 0.7)'
        };
    };

    const colors = getColorClasses();
    const progress = Math.min(100, (timeLeft / 5) * 100);
    const isUrgent = timeLeft <= 1;

    return (
        <div
            className={`relative w-32 h-32 flex items-center justify-center gpu-accelerate ${isUrgent ? 'timer-urgent' : ''}`}
            style={{
                filter: `drop-shadow(0 0 20px ${colors.glow})`
            }}
        >
            {/* Outer glow ring */}
            <div
                className="absolute inset-0 rounded-full animate-pulse"
                style={{
                    background: `radial-gradient(circle, ${colors.glow} 0%, transparent 70%)`,
                    opacity: 0.5
                }}
            />

            {/* Background circle */}
            <div
                className="absolute inset-2 rounded-full bg-white"
                style={{
                    boxShadow: `0 8px 0 rgba(0, 0, 0, 0.2), inset 0 4px 10px rgba(0, 0, 0, 0.1)`
                }}
            />

            {/* Circular Progress (SVG) */}
            <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                {/* Background track */}
                <circle
                    cx="64"
                    cy="64"
                    r="54"
                    stroke="#e0e0e0"
                    strokeWidth="10"
                    fill="transparent"
                />
                {/* Progress arc */}
                <circle
                    cx="64"
                    cy="64"
                    r="54"
                    stroke={colors.text}
                    strokeWidth="10"
                    fill="transparent"
                    strokeDasharray={339} // 2 * pi * 54
                    strokeDashoffset={339 - (339 * progress) / 100}
                    strokeLinecap="round"
                    className="transition-all duration-100 gpu-accelerate"
                    style={{
                        filter: `drop-shadow(0 0 5px ${colors.text})`
                    }}
                />
            </svg>

            {/* Time Display */}
            <div
                className={`text-4xl font-bold font-mono z-10 ${isUrgent ? 'bounce-scale' : ''}`}
                style={{
                    color: colors.text,
                    textShadow: `0 2px 0 rgba(0,0,0,0.2), 0 0 10px ${colors.glow}`
                }}
            >
                {timeLeft.toFixed(1)}
            </div>

            {/* Decorative bubbles for urgency */}
            {isUrgent && (
                <>
                    <div className="absolute -top-2 -right-2 text-2xl animate-bounce">⚡</div>
                    <div className="absolute -bottom-2 -left-2 text-2xl animate-bounce" style={{ animationDelay: '0.2s' }}>💨</div>
                </>
            )}
        </div>
    );
};
