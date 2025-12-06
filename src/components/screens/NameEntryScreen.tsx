import React, { useState, useEffect } from 'react';

interface NameEntryScreenProps {
    onContinue: (name: string) => void;
}

export const NameEntryScreen: React.FC<NameEntryScreenProps> = ({ onContinue }) => {
    const [name, setName] = useState('');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const isValid = name.length >= 3 && name.length <= 15 && /^[a-zA-Z0-9\s\-_]+$/.test(name);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isValid) {
            onContinue(name);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-10 left-10 text-5xl bubble-float">🎭</div>
            <div className="absolute top-20 right-10 text-4xl bubble-float" style={{ animationDelay: '1s' }}>🎪</div>
            <div className="absolute bottom-20 left-16 text-4xl bubble-float" style={{ animationDelay: '0.5s' }}>🎨</div>
            <div className="absolute bottom-32 right-20 text-5xl bubble-float" style={{ animationDelay: '1.5s' }}>✏️</div>

            <div className={`w-full max-w-md relative z-10 ${mounted ? 'pop-in' : 'opacity-0'}`}>
                {/* Card with bubble border */}
                <div className="bg-white rounded-[2rem] p-8 space-y-6"
                    style={{
                        boxShadow: '0 15px 0 rgba(155, 89, 182, 0.3), 0 30px 60px rgba(0, 0, 0, 0.2)',
                        border: '5px solid transparent',
                        backgroundImage: 'linear-gradient(white, white), linear-gradient(135deg, #FF69B4, #00D9FF, #32CD32)',
                        backgroundOrigin: 'border-box',
                        backgroundClip: 'padding-box, border-box'
                    }}>

                    <div className="text-center space-y-2">
                        <div className="text-5xl bounce-scale">👋</div>
                        <h2 className="text-3xl font-bold"
                            style={{
                                background: 'linear-gradient(135deg, #FF69B4, #9B59B6)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent'
                            }}>
                            What's your name?
                        </h2>
                        <p className="text-gray-500 font-medium">This is how you'll appear in the game! 🎮</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Enter your name..."
                                className="input-90s w-full text-center border-purple-300 focus:border-pink-500"
                                style={{
                                    background: 'linear-gradient(to bottom, #fff, #f8f4ff)'
                                }}
                                maxLength={15}
                                autoFocus
                            />
                            <div className={`text-right text-sm font-bold ${name.length > 15 ? 'text-red-500' : 'text-purple-400'}`}>
                                {name.length}/15 characters
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={!isValid}
                            className={`w-full py-4 rounded-full font-bold text-xl transition-all ${isValid
                                ? 'btn-90s bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 text-white jelly-hover'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed rounded-full'
                                }`}
                        >
                            {isValid ? '🎉 Let\'s Go! →' : '✍️ Type your name...'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};
