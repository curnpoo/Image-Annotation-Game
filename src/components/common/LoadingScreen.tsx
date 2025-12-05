import React, { useState, useEffect } from 'react';

const TIPS = [
    "💡 Tip: Vote for the funniest answer, not just the best drawing!",
    "💡 Tip: The government is watching you draw that.",
    "💡 Tip: Birds aren't real. Wake up.",
    "💡 Tip: If you don't win, the election was stolen. Stop the count!",
    "💡 Tip: Your FBI agent is judging your art style right now.",
    "💡 Tip: I am living in your walls.",
    "💡 Tip: Jet fuel can't melt steel beams, but your drawing might melt my eyes.",
    "💡 Tip: Taxation is theft, but tracing is worse.",
    "💡 Tip: This loading screen is actually mining crypto on your device. Thanks!",
    "💡 Tip: 5G towers caused this loading time.",
    "💡 Tip: The earth is flat, just like your drawing skills.",
    "💡 Tip: Aliens built the pyramids, and you can't even draw a circle.",
    "💡 Tip: Don't look behind you.",
    "💡 Tip: Simulation theory is real. None of this matters.",
    "💡 Tip: I know what you did last summer.",
    "💡 Tip: Vote for Giant Meteor 2024. Just end it.",
    "💡 Tip: Drawing hands is impossible. Just hide them in pockets.",
    "💡 Tip: If you draw a stick figure, I will uninstall myself.",
    "💡 Tip: Your internet is slow. Have you tried yelling at the router?",
    "💡 Tip: Drink water. Or don't. I'm a line of code, I don't care.",
    "💡 Tip: You can change your brush size, but you can't change your past.",
    "💡 Tip: Creative answers usually get more votes. Bribes work too.",
    "💡 Tip: You can rejoin a game if you accidentally close the tab. You clumsy oaf."
];

interface LoadingScreenProps {
    onGoHome?: () => void;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onGoHome }) => {
    const [tip, setTip] = useState('');
    const [showStuckButton, setShowStuckButton] = useState(false);

    useEffect(() => {
        setTip(TIPS[Math.floor(Math.random() * TIPS.length)]);

        // Show stuck button after 5 seconds
        const timer = setTimeout(() => {
            setShowStuckButton(true);
        }, 5000);

        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="fixed inset-0 bg-90s-animated flex flex-col items-center justify-center z-50 p-8 text-center">
            <div className="bg-white/90 backdrop-blur-sm p-8 rounded-[2rem] shadow-2xl max-w-md w-full border-4 border-purple-500 animate-bounce-in">
                <div className="text-6xl mb-6 animate-spin-slow">🎡</div>
                <h2 className="text-4xl font-black text-purple-600 mb-4 animate-pulse tracking-wider">LOADING...</h2>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-6">
                    <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 animate-loading-bar" />
                </div>
                <p className="text-gray-600 font-bold text-lg italic mb-4">
                    {tip}
                </p>

                {showStuckButton && onGoHome && (
                    <div className="animate-fade-in pt-4 border-t border-gray-200 mt-4">
                        <p className="text-sm text-gray-500 mb-2">Taking a while?</p>
                        <button
                            onClick={onGoHome}
                            className="text-sm font-bold text-purple-500 hover:text-purple-700 underline"
                        >
                            Stuck? Reset App 🔄
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
