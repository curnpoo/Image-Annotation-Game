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
    "💡 Tip: Have you tried turning it off and on again?",
    "💡 Tip: Don't trust anyone, not even yourself. Especially not your drawing hand.",
    "💡 Tip: The early bird gets the worm, but the second mouse gets the cheese.",
    "💡 Tip: If at first you don't succeed, redefine success.",
    "💡 Tip: Life is like a box of chocolates. You never know what you're gonna draw.",
    "💡 Tip: I'm not saying I'm Batman, I'm just saying no one has ever seen me and Batman in the same room.",
    "💡 Tip: The best way to predict the future is to create it. Or just draw it badly.",
    "💡 Tip: My therapist told me to embrace my flaws. I'm still working on my drawing of a perfect circle.",
    "💡 Tip: If you think nobody cares if you're alive, try missing a couple of payments.",
    "💡 Tip: I've been trying to come up with a pun about drawing, but I'm just sketching for ideas.",
    "💡 Tip: Don't worry, be happy. And draw something funny."
];

import { LoadingStage } from '../../types';

interface LoadingScreenProps {
    onGoHome?: () => void;
    stages?: LoadingStage[];
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onGoHome, stages }) => {
    const [tip, setTip] = useState('');
    const [showStuckButton, setShowStuckButton] = useState(false);
    const [isReallySlow, setIsReallySlow] = useState(false);

    useEffect(() => {
        setTip(TIPS[Math.floor(Math.random() * TIPS.length)]);

        // Show stuck button after 8 seconds (increased for realism)
        const timer = setTimeout(() => {
            setShowStuckButton(true);
        }, 8000);

        // Slow network warning after 5 seconds if showing stages
        const slowTimer = setTimeout(() => {
            if (stages && stages.some(s => s.status === 'loading')) {
                setIsReallySlow(true);
            }
        }, 5000);

        return () => {
            clearTimeout(timer);
            clearTimeout(slowTimer);
        };
    }, []);

    // Render Checklist Mode
    const renderChecklist = () => {
        if (!stages || stages.length === 0) return null;

        return (
            <div className="mt-6 w-full space-y-3 font-medium">
                {stages.map((stage) => {
                    let icon = '⬜'; // Pending
                    let color = 'text-gray-400';
                    let animate = '';

                    if (stage.status === 'completed') {
                        icon = '✅';
                        color = 'text-green-600';
                    } else if (stage.status === 'loading') {
                        icon = '⏳';
                        color = 'text-[var(--theme-accent)]';
                        animate = 'animate-pulse';
                    } else if (stage.status === 'error') {
                        icon = '❌';
                        color = 'text-red-500';
                    }

                    return (
                        <div key={stage.id} className={`flex items-center gap-3 transition-colors ${color} ${animate}`}>
                            <span className="text-xl">{icon}</span>
                            <span className={stage.status === 'pending' ? 'opacity-60' : 'font-bold'}>
                                {stage.label}
                            </span>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="fixed inset-0 flex flex-col items-center justify-center z-50 overflow-hidden"
            style={{ background: 'var(--theme-background, #f3e8d0)' }}>

            {/* Paint Tools Background - Large floating monogram */}
            <style>{`
                @keyframes float-diagonal {
                    0%, 100% { transform: translate(0, 0) rotate(-5deg); }
                    50% { transform: translate(15px, -15px) rotate(5deg); }
                }
                @keyframes float-diagonal-reverse {
                    0%, 100% { transform: translate(0, 0) rotate(5deg); }
                    50% { transform: translate(-15px, 15px) rotate(-5deg); }
                }
                @keyframes float-diagonal-alt {
                    0%, 100% { transform: translate(0, 0) rotate(0deg); }
                    50% { transform: translate(12px, 12px) rotate(8deg); }
                }
                .tool-bg-1 { animation: float-diagonal 4s ease-in-out infinite; }
                .tool-bg-2 { animation: float-diagonal-reverse 5s ease-in-out infinite; animation-delay: 0.5s; }
                .tool-bg-3 { animation: float-diagonal-alt 4.5s ease-in-out infinite; animation-delay: 1s; }
                .tool-bg-4 { animation: float-diagonal 5.5s ease-in-out infinite; animation-delay: 1.5s; }
                .tool-bg-5 { animation: float-diagonal-reverse 4.2s ease-in-out infinite; animation-delay: 0.8s; }
            `}</style>

            {/* Background paint tools - scattered around */}
            <div className="absolute inset-0 pointer-events-none opacity-30">
                <div className="absolute tool-bg-1 text-8xl" style={{ top: '10%', left: '10%' }}>🖌️</div>
                <div className="absolute tool-bg-2 text-7xl" style={{ top: '15%', right: '15%' }}>✏️</div>
                <div className="absolute tool-bg-3 text-9xl" style={{ bottom: '20%', left: '5%' }}>🎨</div>
                <div className="absolute tool-bg-4 text-6xl" style={{ bottom: '25%', right: '10%' }}>🖍️</div>
                <div className="absolute tool-bg-5 text-7xl" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>🖼️</div>
            </div>

            {/* Content Card */}
            <div
                className="relative backdrop-blur-sm p-8 rounded-[2rem] shadow-2xl max-w-md w-full mx-4 animate-bounce-in flex flex-col items-center"
                style={{
                    background: 'var(--theme-card-bg, rgba(255,255,255,0.95))',
                    border: '3px solid var(--theme-accent, #FFB74D)'
                }}
            >
                <div className="text-4xl mb-2 animate-spin-slow">
                    🔃
                </div>
                <h2 className="text-2xl font-black mb-2 animate-pulse tracking-wider text-center"
                    style={{ color: 'var(--theme-text, #333)' }}>
                    {stages ? 'Connecting...' : 'Loading...'}
                </h2>

                {/* Progress Checklist */}
                {renderChecklist()}

                {/* Tip Section (Only show if not showing full checklist, or push to bottom) */}
                {!stages && (
                    <p className="font-bold text-base italic text-center mt-4"
                        style={{ color: 'var(--theme-text-secondary, #666)' }}>
                        {tip}
                    </p>
                )}

                {/* Slow Network Warning */}
                {isReallySlow && stages && (
                    <div className="mt-6 bg-yellow-50 border-2 border-yellow-200 rounded-xl p-3 flex items-center gap-3 animate-fade-in">
                        <span className="text-2xl">🐢</span>
                        <div className="text-sm font-bold text-yellow-800 text-left">
                            Taking longer than usual...
                            <div className="font-normal text-xs opacity-80">Check your internet connection</div>
                        </div>
                    </div>
                )}

                {showStuckButton && onGoHome && (
                    <div className="animate-fade-in pt-4 border-t mt-6 text-center w-full"
                        style={{ borderColor: 'var(--theme-border, #e0e0e0)' }}>
                        <p className="text-sm mb-2" style={{ color: 'var(--theme-text-secondary, #888)' }}>
                            Taking a while?
                        </p>
                        <button
                            onClick={onGoHome}
                            className="text-sm font-bold underline hover:opacity-80"
                            style={{ color: 'var(--theme-accent, #FFB74D)' }}
                        >
                            Stuck? Reset App 🔄
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
