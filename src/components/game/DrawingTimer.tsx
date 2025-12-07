import React, { useEffect, useState, useRef } from 'react';

interface DrawingTimerProps {
    endsAt: number;
    onTimeUp: () => void;
    totalDuration?: number;
}

export const DrawingTimer: React.FC<DrawingTimerProps> = ({
    endsAt,
    onTimeUp,
    totalDuration = 20
}) => {
    // Stabilize endsAt
    const stableEndsAtRef = useRef<number>(endsAt);
    if (Math.abs(endsAt - stableEndsAtRef.current) > 500) {
        stableEndsAtRef.current = endsAt;
    }
    const stableEndsAt = stableEndsAtRef.current;

    const [timeLeft, setTimeLeft] = useState(() => Math.max(0, (stableEndsAt - Date.now()) / 1000));
    const onTimeUpRef = useRef(onTimeUp);
    const hasCalledRef = useRef(false);

    useEffect(() => {
        onTimeUpRef.current = onTimeUp;
    }, [onTimeUp]);

    // Timer logic
    const prevEndsAtRef = useRef<number>(stableEndsAt);
    useEffect(() => {
        if (Math.abs(stableEndsAt - prevEndsAtRef.current) > 500) {
            hasCalledRef.current = false;
            prevEndsAtRef.current = stableEndsAt;
        }

        setTimeLeft(Math.max(0, (stableEndsAt - Date.now()) / 1000));

        const interval = setInterval(() => {
            const now = Date.now();
            const remaining = Math.max(0, (stableEndsAt - now) / 1000);
            setTimeLeft(remaining);

            if (remaining <= 0 && !hasCalledRef.current) {
                hasCalledRef.current = true;
                clearInterval(interval);
                onTimeUpRef.current();
            }
        }, 100);

        return () => clearInterval(interval);
    }, [stableEndsAt]);

    const handleDoneClick = () => {
        if (!hasCalledRef.current) {
            hasCalledRef.current = true;
            onTimeUpRef.current();
        }
    };

    const progress = Math.min(100, (timeLeft / totalDuration) * 100);
    const isLowTime = timeLeft <= 5;

    // Visual states
    const getVisuals = () => {
        if (timeLeft > 10) return {
            barGradient: 'from-emerald-400 to-green-500',
            textClass: 'text-emerald-400',
            borderClass: 'border-emerald-500/30'
        };
        if (timeLeft > 5) return {
            barGradient: 'from-amber-400 to-orange-500',
            textClass: 'text-amber-400',
            borderClass: 'border-amber-500/30'
        };
        return {
            barGradient: 'from-red-500 to-pink-600',
            textClass: 'text-red-400',
            borderClass: 'border-red-500/30'
        };
    };
    const visuals = getVisuals();

    return (
        <div className={`glass-panel rounded-full p-2 flex items-center gap-3 w-full max-w-sm mx-auto shadow-lg backdrop-blur-xl border border-white/20 transition-all duration-300 ${isLowTime ? 'animate-pulse shadow-red-500/20' : ''}`}>

            {/* Timer Icon & Value */}
            <div className={`w-12 h-12 flex-shrink-0 rounded-full bg-black/20 flex flex-col items-center justify-center border ${visuals.borderClass}`}>
                <span className={`text-lg font-black leading-none ${visuals.textClass} tabular-nums`}>
                    {Math.ceil(timeLeft)}
                </span>
                <span className="text-[0.6rem] font-bold text-white/40 uppercase">sec</span>
            </div>

            {/* Progress Bar */}
            <div className="flex-1 h-3 bg-black/20 rounded-full overflow-hidden relative shadow-inner">
                <div
                    className={`absolute top-0 bottom-0 left-0 bg-gradient-to-r ${visuals.barGradient} transition-all duration-100 ease-linear rounded-full shadow-[0_0_10px_rgba(255,255,255,0.3)]`}
                    style={{ width: `${progress}%` }}
                />
            </div>

            {/* Done Button */}
            <button
                onClick={handleDoneClick}
                className="h-10 px-5 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition-all border border-white/20 font-bold text-sm text-white flex items-center gap-1 shadow-md"
            >
                Done <span className="text-green-400">✓</span>
            </button>
        </div>
    );
};
