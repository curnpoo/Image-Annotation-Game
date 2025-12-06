import React, { useEffect, useState } from 'react';

interface ThemeTransitionProps {
    isActive: boolean;
    onComplete: () => void;
}

export const ThemeTransition: React.FC<ThemeTransitionProps> = ({ isActive, onComplete }) => {
    const [show, setShow] = useState(false);

    useEffect(() => {
        if (isActive) {
            setShow(true);
            const timer = setTimeout(() => {
                setShow(false);
                onComplete();
            }, 2000); // 2 seconds total duraton
            return () => clearTimeout(timer);
        }
    }, [isActive, onComplete]);

    if (!show) return null;

    return (
        <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-white animate-fade-in">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 animate-gradient-xy opacity-90" />

            <div className="relative z-10 text-center animate-bounce">
                <div className="text-8xl mb-4">🎨</div>
                <h2 className="text-4xl font-black text-white drop-shadow-xl loading-dots">
                    Applying Magic
                </h2>
            </div>

            {/* Paint Splatter Effects */}
            <div className="absolute top-1/4 left-1/4 text-6xl animate-ping opacity-75">✨</div>
            <div className="absolute bottom-1/4 right-1/4 text-6xl animate-ping opacity-75 delay-100">✨</div>
        </div>
    );
};
