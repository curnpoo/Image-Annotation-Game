
import React, { useState } from 'react';

import { InstallPromptModal } from '../common/InstallPromptModal';
import { ShareModal } from '../common/ShareModal';

import { MonogramBackground } from '../common/MonogramBackground';

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

            <MonogramBackground />

            {/* Top Bar: About & Share */}
            <div className="w-full flex justify-between items-center p-4 z-20">
                <button
                    onClick={() => setShowAboutModal(true)}
                    className="h-10 px-4 rounded-full glass-button flex items-center justify-center gap-2 hover:scale-105 shadow-lg active:scale-95 transition-all text-white"
                    aria-label="About"
                >
                    <span className="text-lg">ℹ️</span>
                    <span className="font-bold text-xs tracking-wider opacity-90">INFO</span>
                </button>
                <button
                    onClick={() => setShowShareModal(true)}
                    className="h-10 px-4 rounded-full glass-button flex items-center justify-center gap-2 hover:scale-105 shadow-lg active:scale-95 transition-all text-white"
                    aria-label="Share"
                >
                    <span className="text-lg">📤</span>
                    <span className="font-bold text-xs tracking-wider opacity-90">SHARE</span>
                </button>
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
                        <div className="relative w-full">
                            {/* Radial Glow - behind text/screen */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200%] h-[400%] bg-gradient-to-r from-purple-600/40 to-pink-600/40 blur-[90px] animate-pulse -z-10 pointer-events-none mix-blend-screen"></div>

                            <button
                                onClick={onPlay}
                                className="w-full group relative overflow-hidden rounded-3xl p-1 transition-all duration-300 hover:scale-[1.02] active:scale-95 shadow-2xl z-10"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 animate-gradient-flow"></div>
                                <div className="relative bg-black/20 backdrop-blur-sm rounded-[1.3rem] py-8 px-8 flex items-center justify-center gap-6 border border-white/20 group-hover:bg-transparent transition-colors">
                                    <span className="text-5xl filter drop-shadow-lg group-hover:animate-bounce">🎨</span>
                                    <div className="text-3xl font-black text-white uppercase tracking-wide drop-shadow-md">Play Now</div>
                                </div>
                            </button>
                        </div>
                    )}
                </div>

                {/* Install App Card */}
                {!joiningRoomCode && (
                    <button
                        onClick={() => setShowInstallModal(true)}
                        className="w-full glass-panel p-4 rounded-2xl flex items-center justify-between group hover:bg-white/40 transition-all cursor-pointer active:scale-95 shadow-sm mt-auto md:mt-0"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center text-white shadow-md text-xl">
                                📱
                            </div>
                            <div className="text-left">
                                <div className="font-bold text-white leading-tight">Install App</div>
                                <div className="text-xs text-white/70 font-medium">Add to Home Screen</div>
                            </div>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/40 transition-colors text-white">
                            ⬇️
                        </div>
                    </button>
                )}
            </div>

            {/* Footer / Copyright */}
            <div className="p-6 text-center z-10 space-y-1 mb-safe">
                <div className="text-sm font-bold text-white/90 shadow-black/20 drop-shadow-sm">Bored at Work games</div>
                <div className="text-xs text-white/70 font-medium">
                    made with love by curren ❤️
                </div>
                <div className="text-[10px] text-white/50 font-mono tracking-widest uppercase">
                    v0.7 Alpha
                </div>
            </div>

            {/* Modals */}
            {showInstallModal && <InstallPromptModal onClose={() => setShowInstallModal(false)} />}
            {showShareModal && <ShareModal onClose={() => setShowShareModal(false)} isOpen={showShareModal} />}

            {/* About Modal - Inline for simplicity */}
            {
                showAboutModal && (
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
                                    <p className="font-bold text-yellow-700 mb-1">Version 0.7 Alpha</p>
                                    <p>made with love by curren ❤️</p>
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
                )
            }

        </div >
    );
};

