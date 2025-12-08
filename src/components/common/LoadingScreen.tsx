import React, { useState, useEffect } from 'react';
import type { LoadingStage } from '../../types';

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

        // 1. Show stuck button after 8 seconds
        const timer = setTimeout(() => {
            setShowStuckButton(true);
        }, 8000);

        // 2. Slow network warning after 5 seconds
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

    // Render Checklist with polished visuals
    const renderChecklist = () => {
        if (!stages || stages.length === 0) return null;

        return (
            <div className="mt-8 w-full space-y-4 animate-fade-in">
                {stages.map((stage) => {
                    let icon = (
                        <div className="w-6 h-6 rounded-full border-2 border-zinc-700 transition-colors" />
                    );
                    let color = 'text-zinc-500';
                    let animate = '';
                    let textClass = 'font-normal opacity-60';

                    if (stage.status === 'completed') {
                        icon = <span className="text-xl">✅</span>;
                        color = 'text-green-400';
                        textClass = 'font-medium text-green-400 opacity-90 line-through decoration-green-400/30';
                    } else if (stage.status === 'loading') {
                        icon = (
                            <div className="w-6 h-6 border-2 border-t-transparent border-[var(--theme-accent)] rounded-full animate-spin" />
                        );
                        color = 'text-[var(--theme-accent)]';
                        animate = 'scale-105';
                        textClass = 'font-bold text-white';
                    } else if (stage.status === 'error') {
                        icon = <span className="text-xl">❌</span>;
                        color = 'text-red-500';
                        textClass = 'font-bold text-red-500';
                    }

                    return (
                        <div key={stage.id} className={`flex items-center gap-4 transition-all duration-300 ${color} ${animate}`}>
                            <div className="flex-shrink-0 w-8 flex justify-center">{icon}</div>
                            <span className={`text-lg transition-all ${textClass}`}>
                                {stage.label}
                            </span>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="fixed inset-0 flex flex-col items-center justify-center z-[2000] overflow-hidden bg-black text-white font-sans"
            style={{ backgroundColor: '#000000', color: '#fff' }}>

            {/* Dark Grid Background Pattern */}
            <div className="absolute inset-0 opacity-[0.1] pointer-events-none"
                style={{
                    backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)',
                    backgroundSize: '40px 40px'
                }}
            />

            {/* Animated Floating Tools (Subtle & Dark) */}
            <style>{`
                @keyframes float-slow {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    50% { transform: translateY(-20px) rotate(5deg); }
                }
                .bg-icon { animation: float-slow 8s ease-in-out infinite; opacity: 0.15; filter: grayscale(100%); }
            `}</style>

            <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
                <div className="absolute bg-icon text-9xl top-10 -left-10" style={{ animationDelay: '0s' }}>🎨</div>
                <div className="absolute bg-icon text-8xl bottom-20 -right-10" style={{ animationDelay: '2s' }}>✏️</div>
                <div className="absolute bg-icon text-6xl top-1/4 right-20" style={{ animationDelay: '4s' }}>🖍️</div>
            </div>

            {/* Main Content Area */}
            <div className="relative z-10 flex flex-col items-center max-w-md w-full px-6">

                {/* 1. Main Spinner */}
                <div className="mb-8 relative transition-all duration-500 scale-90">
                    {/* Outer ring */}
                    <div className="w-20 h-20 rounded-full border-8 border-zinc-800"></div>
                    {/* Spinner */}
                    <div className="absolute top-0 left-0 w-20 h-20 rounded-full border-8 border-t-[var(--theme-accent,orange)] border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
                </div>

                {/* 2. Headline */}
                <h2 className="text-2xl font-black mb-2 tracking-wide text-center uppercase text-white animate-pulse">
                    {stages ? 'Connecting...' : 'Loading...'}
                </h2>

                {/* 3. Smart Content (Checklist + Tips) - Always Visible now */}
                <div className="w-full flex flex-col items-center animate-slide-up-fade">

                    {/* Checklist */}
                    {renderChecklist()}

                    {/* Tip Box */}
                    <div className="mt-12 w-full p-6 bg-zinc-900/50 rounded-xl border border-zinc-800 shadow-sm text-center backdrop-blur-sm">
                        <p className="text-zinc-400 font-medium italic text-lg leading-relaxed">
                            {tip}
                        </p>
                    </div>
                </div>

                {/* 4. Slow Network & Stuck Actions */}
                {isReallySlow && stages && (
                    <div className="mt-6 animate-fade-in bg-yellow-900/20 text-yellow-500 px-4 py-3 rounded-xl text-sm font-bold border border-yellow-700/30 flex items-center gap-2 shadow-sm">
                        <span className="text-2xl">🐢</span>
                        <div>
                            Slow connection detected...
                            <div className="font-normal text-xs opacity-80">Hang tight!</div>
                        </div>
                    </div>
                )}

                {showStuckButton && onGoHome && (
                    <button
                        onClick={onGoHome}
                        className="mt-8 py-2 px-6 rounded-full bg-zinc-800 hover:bg-red-900/30 text-zinc-500 hover:text-red-400 text-xs font-bold uppercase tracking-wider transition-colors animate-fade-in"
                    >
                        Stuck? Reload App 🔄
                    </button>
                )}

            </div>
        </div>
    );
};
