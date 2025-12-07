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
    // Stabilize endsAt to prevent timer reset on every re-render
    const stableEndsAtRef = useRef<number>(endsAt);

    // Only update the stable ref if the value actually changed significantly (more than 500ms difference)
    if (Math.abs(endsAt - stableEndsAtRef.current) > 500) {
        stableEndsAtRef.current = endsAt;
    }

    const stableEndsAt = stableEndsAtRef.current;

    const [timeLeft, setTimeLeft] = useState(() => Math.max(0, (stableEndsAt - Date.now()) / 1000));
    const onTimeUpRef = useRef(onTimeUp);
    const hasCalledRef = useRef(false);

    // Keep ref updated with latest callback
    useEffect(() => {
        onTimeUpRef.current = onTimeUp;
    }, [onTimeUp]);

    useEffect(() => {
        // Only reset hasCalledRef if the timer was actually restarted (significantly different endsAt)
        hasCalledRef.current = false;

        // Reset timeLeft when stableEndsAt changes
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

    // Manual submit handler
    const handleDoneClick = () => {
        if (!hasCalledRef.current) {
            hasCalledRef.current = true;
            onTimeUpRef.current();
        }
    };

    // Calculate progress percentage
    const progress = Math.min(100, (timeLeft / totalDuration) * 100);

    // Color logic based on time remaining
    const getVisuals = () => {
        if (timeLeft > 10) return {
            barColor: 'bg-gradient-to-r from-emerald-400 to-green-500',
            textColor: 'text-emerald-600',
            bgColor: 'bg-emerald-50',
            borderColor: 'border-emerald-200',
            glowColor: 'shadow-emerald-200/50'
        };
        if (timeLeft > 5) return {
            barColor: 'bg-gradient-to-r from-amber-400 to-orange-500',
            textColor: 'text-amber-600',
            bgColor: 'bg-amber-50',
            borderColor: 'border-amber-200',
            glowColor: 'shadow-amber-200/50'
        };
        return {
            barColor: 'bg-gradient-to-r from-red-500 to-pink-600',
            textColor: 'text-red-600',
            bgColor: 'bg-red-50',
            borderColor: 'border-red-200',
            glowColor: 'shadow-red-200/50'
        };
    };

    const visuals = getVisuals();
    const isLowTime = timeLeft <= 5;

    return (
        <div
            className={`w-full rounded-2xl p-3 border-2 ${visuals.borderColor} ${visuals.bgColor} shadow-lg ${visuals.glowColor} transition-all duration-300 ${isLowTime ? 'animate-pulse' : ''}`}
        >
            <div className="flex items-center gap-3">
                {/* Progress Bar Container */}
                <div className="flex-1 relative">
                    {/* Track */}
                    <div className="h-5 bg-white rounded-full overflow-hidden shadow-inner border border-gray-100">
                        {/* Progress */}
                        <div
                            className={`h-full ${visuals.barColor} rounded-full transition-all duration-100 ease-linear`}
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>

                {/* Timer Number */}
                <div className={`flex items-center justify-center min-w-[60px] h-12 rounded-xl ${visuals.bgColor} border-2 ${visuals.borderColor}`}>
                    <span className={`text-2xl font-black ${visuals.textColor} tabular-nums`}>
                        {Math.ceil(timeLeft)}
                    </span>
                    <span className={`text-sm font-bold ${visuals.textColor} ml-0.5 opacity-60`}>s</span>
                </div>

                {/* Done Button */}
                <button
                    onClick={handleDoneClick}
                    className="px-4 h-12 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl active:scale-95 transition-all text-sm"
                >
                    Done ✓
                </button>
            </div>
        </div>
    );
};
