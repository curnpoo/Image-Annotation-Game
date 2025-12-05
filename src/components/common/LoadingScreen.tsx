import React, { useState, useEffect } from 'react';

const TIPS = [
    "💡 Tip: Vote for the funniest answer, not just the best drawing!",
    "💡 Tip: You can change your brush size for more detail.",
    "💡 Tip: Don't forget to check the leaderboard!",
    "💡 Tip: Quick! Keep an eye on the timer.",
    "💡 Tip: You can update your avatar in the settings menu.",
    "💡 Tip: Use the 'Fill' tool to color large areas quickly.",
    "💡 Tip: Creative answers usually get more votes!",
    "💡 Tip: You can rejoin a game if you accidentally close the tab."
];

export const LoadingScreen: React.FC = () => {
    const [tip, setTip] = useState('');

    useEffect(() => {
        setTip(TIPS[Math.floor(Math.random() * TIPS.length)]);
    }, []);

    return (
        <div className="fixed inset-0 bg-90s-animated flex flex-col items-center justify-center z-50 p-8 text-center">
            <div className="bg-white/90 backdrop-blur-sm p-8 rounded-[2rem] shadow-2xl max-w-md w-full border-4 border-purple-500 animate-bounce-in">
                <div className="text-6xl mb-6 animate-spin-slow">🎡</div>
                <h2 className="text-4xl font-black text-purple-600 mb-4 animate-pulse tracking-wider">LOADING...</h2>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-6">
                    <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 animate-loading-bar" />
                </div>
                <p className="text-gray-600 font-bold text-lg italic">
                    {tip}
                </p>
            </div>
        </div>
    );
};
