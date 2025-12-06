import React, { useState, useEffect } from 'react';

const TIPS = [
    "💡 Tip: Vote for the funniest answer, not just the best drawing!",
    "💡 Tip: The government is watching you draw that.",
    "💡 Tip: Birds aren't real. Wake up.",
    "💡 Tip: If you don't win, the election was stolen. Stop the count!",
    "💡 Tip: Your FBI agent is judging your art style right now.",
    "💡 Tip: I am living in your walls.",
    "💡 Tip: Your drawing is so bad, it's good. No, wait, it's just bad.",
    "💡 Tip: Remember to hydrate, drawing is hard work!",
    "💡 Tip: This game is not responsible for any existential crises caused by your art.",
    "💡 Tip: Don't let your dreams be memes.",
    "💡 Tip: Why did the scarecrow win an award? Because he was outstanding in his field!",
    "💡 Tip: My computer just beat me at chess. I guess it was no match for its motherboard.",
    "💡 Tip: What do you call a fake noodle? An impasta.",
    "💡 Tip: I told my wife she was drawing her eyebrows too high. She looked surprised.",
    "💡 Tip: Did you hear about the restaurant on the moon? Great food, no atmosphere.",
    "💡 Tip: I'm reading a book about anti-gravity. It's impossible to put down!",
    "💡 Tip: What's orange and sounds like a parrot? A carrot.",
    "💡 Tip: I used to be a baker, but I couldn't make enough dough.",
    "💡 Tip: Why don't scientists trust atoms? Because they make up everything!",
    "💡 Tip: What do you call a sad strawberry? A blueberry.",
    "💡 Tip: Jet fuel can't melt steel beams, but your drawing might melt my eyes.",
    "💡 Tip: Taxation is theft, but tracing is worse.",
    "💡 Tip: This loading screen is actually mining crypto on your device. Thanks!",
    "💡 Tip: 5G towers caused this loading time.",
    "💡 Tip: The earth is flat, just like your drawing skills.",
    "💡 Tip: Aliens built the pyramids, and you can't even draw a circle.",
    "💡 Tip: Don't look behind you.",
    "💡 Tip: Simulation theory is real. None of this matters.",
    "💡 Tip: I know what you did last summer.",
    "💡 Tip: Vote for Giant Meteor 2026. Just end it.",
    "💡 Tip: Drawing hands is impossible. Just hide them in pockets.",
    "💡 Tip: If you draw a stick figure, I will uninstall myself.",
    "💡 Tip: Your internet is slow. Have you tried yelling at the router?",
    "💡 Tip: Drink water. Or don't. I'm a line of code, I don't care.",
    "💡 Tip: You can change your brush size, but you can't change your past.",
    "💡 Tip: Creative answers usually get more votes. Bribes work too.",
    "💡 Tip: You can rejoin a game if you accidentally close the tab. You clumsy oaf.",
    "💡 Tip: You can't win at this game.",
    "💡 Tip: I don't care what you draw.",
    "💡 Tip: The eyedropper tool can be used to copy colors from the image.",
    "💡 Tip: Unlock stuff by winning games!",
    "💡 Tip: The cake is a lie. Just like your drawing skills.",
    "💡 Tip: This loading screen is longer than my last relationship.",
    "💡 Tip: Have you tried turning it off and on again?",
    "💡 Tip: My other loading screen is a Porsche.",
    "💡 Tip: Don't trust anyone, not even yourself. Especially not your drawing hand.",
    "💡 Tip: The early bird gets the worm, but the second mouse gets the cheese.",
    "💡 Tip: If at first you don't succeed, redefine success.",
    "💡 Tip: Life is like a box of chocolates. You never know what you're gonna draw.",
    "💡 Tip: I'm not saying I'm Batman, I'm just saying no one has ever seen me and Batman in the same room.",
    "💡 Tip: The best way to predict the future is to create it. Or just draw it badly.",
    "💡 Tip: Why did the scarecrow win an award? Because he was outstanding in his field!",
    "💡 Tip: My therapist told me to embrace my flaws. I'm still working on my drawing of a perfect circle.",
    "💡 Tip: If you think nobody cares if you're alive, try missing a couple of payments.",
    "💡 Tip: I told my wife she was drawing her eyebrows too high. She looked surprised.",
    "💡 Tip: What do you call a fake noodle? An impasta!",
    "💡 Tip: I'm reading a book on anti-gravity. It's impossible to put down!",
    "💡 Tip: Did you hear about the artist who could only draw perfect circles? He was well-rounded.",
    "💡 Tip: Why don't scientists trust atoms? Because they make up everything!",
    "💡 Tip: My computer just beat me at chess. But I'm sure it was just a fluke.",
    "💡 Tip: I've been trying to come up with a pun about drawing, but I'm just sketching for ideas.",
    "💡 Tip: What do you call a sad strawberry? A blueberry!",
    "💡 Tip: This loading screen is powered by hamsters on tiny treadmills.",
    "💡 Tip: Don't worry, be happy. And draw something funny."
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
                <div className="h-4 bg-gray-100 rounded-full overflow-hidden mb-6 border-2 border-gray-200 shadow-inner relative">
                    {/* Progress Bar with CSS animation */}
                    <div
                        className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 rounded-full"
                        style={{
                            width: '100%',
                            transition: 'width 2s ease-in-out',
                            animation: 'fillBar 2s ease-out forwards'
                        }}
                    />

                    {/* Sparkle effect moving across */}
                    <div
                        className="absolute top-0 bottom-0 w-full animate-shimmer"
                        style={{
                            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)',
                            transform: 'skewX(-20deg)'
                        }}
                    />
                </div>
                <style>{`
                    @keyframes fillBar {
                        0% { width: 0%; }
                        100% { width: 100%; }
                    }
                    @keyframes shimmer {
                        0% { transform: translateX(-100%) skewX(-20deg); }
                        100% { transform: translateX(200%) skewX(-20deg); }
                    }
                    .animate-shimmer {
                        animation: shimmer 1.5s infinite;
                    }
                `}</style>
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
