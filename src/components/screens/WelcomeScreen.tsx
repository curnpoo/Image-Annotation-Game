
import React, { useState } from 'react';

import { InstallPromptModal } from '../common/InstallPromptModal';
import { ShareModal } from '../common/ShareModal';

interface WelcomeScreenProps {
    onPlay: () => void;
    onJoin: (code: string) => void;
    joiningRoomCode?: string | null;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
    onPlay,
    onJoin,
    joiningRoomCode
}) => {
    const [showInstallModal, setShowInstallModal] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [showAboutModal, setShowAboutModal] = useState(false);

    // If joining a room, show profile setup immediately passed through
    // Note: The parent component usually handles this conditional rendering, 
    // but if we are here, we are in the "menu" state.

    return (
        <div className="relative w-full h-[100dvh] overflow-hidden flex flex-col items-center justify-between safe-area-padding">

            {/* Background Bubbles Container - Fixed to viewport */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                <div className="bubble bg-white w-32 h-32 left-[10%] animation-delay-0 blur-sm"></div>
                <div className="bubble bg-white w-24 h-24 left-[30%] animation-delay-2000 blur-sm"></div>
                <div className="bubble bg-white w-40 h-40 left-[60%] animation-delay-4000 blur-md"></div>
                <div className="bubble bg-white w-16 h-16 left-[80%] animation-delay-1000"></div>
                <div className="bubble bg-white w-20 h-20 left-[50%] animation-delay-3000 blur-sm"></div>
            </div>

            {/* Top Bar: About & Share */}
            <div className="w-full flex justify-between items-center p-4 z-20">
                <button
                    onClick={() => setShowAboutModal(true)}
                    className="w-12 h-12 rounded-full glass-button flex items-center justify-center text-xl hover:scale-110 shadow-lg"
                    aria-label="About"
                >
                    ℹ️
                </button>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowShareModal(true)}
                        className="w-12 h-12 rounded-full glass-button flex items-center justify-center text-xl hover:scale-110 shadow-lg"
                        aria-label="Share"
                    >
                        📤
                    </button>
                    <button
                        onClick={() => setShowInstallModal(true)}
                        className="w-12 h-12 rounded-full glass-button flex items-center justify-center text-xl hover:scale-110 shadow-lg"
                        aria-label="Install App"
                    >
                        📱
                    </button>
                </div>
            </div>

            {/* Main Content: Logo & Play */}
            <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md px-6 z-10 gap-8">

                {/* Logo Section */}
                <div className="text-center relative">
                    <div className="absolute -inset-10 bg-white/20 blur-3xl rounded-full opacity-30 animate-pulse"></div>
                    <h1 className="text-6xl font-black text-white drop-shadow-lg mb-2 relative transform hover:scale-105 transition-transform duration-300 cursor-default">
                        <span className="block text-7xl mb-2 rainbow-text filter drop-shadow-xl">ANO</span>
                        <span className="text-4xl tracking-widest uppercase opacity-90 font-bold">Draw</span>
                    </h1>
                    <p className="text-lg text-white/90 font-medium glass-panel px-4 py-2 rounded-full inline-block mt-4">
                        The party drawing game! 🎨
                    </p>
                </div>

                {/* Main Action */}
                <div className="w-full space-y-4">
                    {joiningRoomCode ? (
                        <div className="glass-panel p-6 rounded-3xl text-center space-y-4 animate-slide-up">
                            <h3 className="text-xl font-bold">Joining Room: <span className="text-yellow-300 font-mono tracking-wider">{joiningRoomCode}</span></h3>
                            <button
                                onClick={() => onJoin(joiningRoomCode)}
                                className="w-full btn-90s py-4 text-xl bg-gradient-to-r from-green-400 to-emerald-600 text-white shadow-green-500/30"
                            >
                                Jump In! 🚀
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={onPlay}
                            className="w-full group relative overflow-hidden rounded-3xl p-1 transition-all duration-300 hover:scale-[1.02] active:scale-95 shadow-2xl"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 animate-gradient-flow"></div>
                            <div className="relative bg-black/20 backdrop-blur-sm rounded-[1.3rem] py-6 px-8 flex items-center justify-center gap-4 border border-white/20 group-hover:bg-transparent transition-colors">
                                <span className="text-4xl filter drop-shadow-lg group-hover:animate-bounce">🎨</span>
                                <div className="text-left">
                                    <div className="text-2xl font-black text-white uppercase tracking-wide drop-shadow-md">Play Now</div>
                                    <div className="text-xs text-white/80 font-medium tracking-wider uppercase">Create or Join Game</div>
                                </div>
                            </div>
                        </button>
                    )}
                </div>
            </div>

            {/* Footer / Copyright */}
            <div className="p-6 text-center z-10 opacity-60 text-xs font-medium tracking-widest uppercase mb-safe">
                Antigravity Games © {new Date().getFullYear()}
            </div>

            {/* Modals */}
            {showInstallModal && <InstallPromptModal onClose={() => setShowInstallModal(false)} />}
            {showShareModal && <ShareModal onClose={() => setShowShareModal(false)} isOpen={showShareModal} />}

            {/* About Modal - Inline for simplicity */}
            {showAboutModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 max-w-sm w-full mx-auto relative shadow-2xl border-4 border-yellow-400">
                        <button
                            onClick={() => setShowAboutModal(false)}
                            className="absolute top-4 right-4 text-gray-500 hover:text-black w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/50 transition-colors"
                        >
                            ✕
                        </button>

                        <div className="text-center mb-6">
                            <span className="text-5xl mb-2 block animate-bounce-gentle">✨</span>
                            <h2 className="text-2xl font-black bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                                About Ano Draw
                            </h2>
                        </div>

                        <div className="space-y-4 text-center text-gray-800 mb-6 font-medium">
                            <p>
                                The ultimate party drawing game for friends! Draw vague prompts, guess the results, and laugh at the chaos. 🎨
                            </p>
                            <div className="bg-yellow-50/80 p-4 rounded-xl border-2 border-yellow-100 text-sm">
                                <p className="font-bold text-yellow-700 mb-1">Version 1.0.0 Alpha</p>
                                <p>Created with 💜 by Antigravity</p>
                            </div>
                        </div>

                        <button
                            onClick={() => setShowAboutModal(false)}
                            className="w-full btn-90s bg-yellow-400 text-black py-3 font-bold text-lg hover:bg-yellow-500 transition-colors"
                        >
                            Awesome! 🌟
                        </button>
                    </div>
                </div>
            )}

        </div>
    );
};

