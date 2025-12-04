import React, { useEffect, useState } from 'react';

interface WelcomeScreenProps {
    onPlay: () => void;
}

// Floating bubble component
const FloatingBubble: React.FC<{ delay: number; size: number; color: string; left: string }> = ({ delay, size, color, left }) => (
    <div
        className="absolute rounded-full gpu-accelerate"
        style={{
            width: size,
            height: size,
            left,
            bottom: '-100px',
            background: `radial-gradient(circle at 30% 30%, ${color}, transparent)`,
            animation: `bubble-rise ${15 + Math.random() * 10}s ease-in infinite`,
            animationDelay: `${delay}s`,
            opacity: 0.6,
        }}
    />
);

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onPlay }) => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const bubbles = [
        { delay: 0, size: 60, color: '#FF69B4', left: '10%' },
        { delay: 2, size: 40, color: '#00D9FF', left: '25%' },
        { delay: 4, size: 80, color: '#9B59B6', left: '45%' },
        { delay: 1, size: 50, color: '#32CD32', left: '65%' },
        { delay: 3, size: 70, color: '#FFE135', left: '80%' },
        { delay: 5, size: 45, color: '#FF8C00', left: '90%' },
    ];

    return (
        <div className="min-h-screen bg-90s-animated flex flex-col items-center justify-center p-4 text-white relative overflow-hidden">
            {/* Floating Bubbles Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {bubbles.map((bubble, i) => (
                    <FloatingBubble key={i} {...bubble} />
                ))}
            </div>

            <div className={`text-center space-y-8 max-w-md w-full relative z-10 ${mounted ? 'pop-in' : 'opacity-0'}`}>
                <div className="space-y-4">
                    <div className="text-7xl bubble-float">🎨</div>
                    <h1 className="text-5xl font-bold tracking-tight drop-shadow-lg"
                        style={{
                            textShadow: '4px 4px 0 #9B59B6, 8px 8px 0 rgba(0,0,0,0.2)'
                        }}>
                        <span className="rainbow-text">Annotated</span>
                        <br />
                        <span className="text-white">Image Chain</span>
                    </h1>
                    <p className="text-2xl text-yellow-200 font-bold bubble-float" style={{ animationDelay: '0.5s' }}>
                        ✨ Draw together in 10 seconds! ✨
                    </p>
                </div>

                <button
                    onClick={onPlay}
                    className="w-full btn-90s bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500 text-white font-bold text-2xl py-5 px-8 jelly-hover pulse-glow"
                >
                    🚀 Play Now! 🚀
                </button>

                <div className="flex justify-center space-x-8 text-lg">
                    <button className="hover:scale-110 transition-transform wiggle-hover bg-white/20 backdrop-blur-sm px-6 py-2 rounded-full font-bold">
                        ❓ How to Play
                    </button>
                    <button className="hover:scale-110 transition-transform wiggle-hover bg-white/20 backdrop-blur-sm px-6 py-2 rounded-full font-bold">
                        ℹ️ About
                    </button>
                </div>
            </div>

            {/* Decorative Stars */}
            <div className="absolute top-10 left-10 text-4xl animate-pulse">⭐</div>
            <div className="absolute top-20 right-16 text-3xl animate-pulse" style={{ animationDelay: '0.5s' }}>✨</div>
            <div className="absolute bottom-32 left-20 text-3xl animate-pulse" style={{ animationDelay: '1s' }}>🌟</div>
            <div className="absolute bottom-20 right-10 text-4xl animate-pulse" style={{ animationDelay: '0.3s' }}>💫</div>
        </div>
    );
};
