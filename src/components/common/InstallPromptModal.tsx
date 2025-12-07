import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

export const InstallPromptModal: React.FC = () => {
    const [show, setShow] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);

    useEffect(() => {
        // Check if standalone
        const standalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
        setIsStandalone(standalone);

        // Check if iOS
        const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
        setIsIOS(isIOSDevice);

        // Show if not standalone
        if (!standalone) {
            // Small delay for effect
            setTimeout(() => setShow(true), 1000);
        }
    }, []);

    if (!show || isStandalone) return null;

    return createPortal(
        <div className={`fixed bottom-0 left-0 right-0 z-[9999] transition-transform duration-500 ease-in-out transform ${show ? 'translate-y-0' : 'translate-y-full'} safe-area-padding`}>
            <div className="mx-4 mb-6">
                <div className="bg-white/95 backdrop-blur-xl border-2 border-purple-400/30 rounded-3xl shadow-2xl overflow-hidden max-w-md mx-auto relative slide-up">

                    {/* Header / Collapsed State */}
                    <div className="p-4 flex items-center justify-between gap-4 cursor-pointer" onClick={() => setExpanded(!expanded)}>
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center text-2xl shadow-lg">
                                📱
                            </div>
                            <div className="text-left">
                                <h3 className="font-bold text-gray-900 leading-tight">Play Full Screen</h3>
                                <p className="text-xs text-purple-600 font-medium">Get the best experience</p>
                            </div>
                        </div>
                        <button
                            className={`px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm rounded-xl transition-colors ${expanded ? 'bg-gray-200' : ''}`}
                        >
                            {expanded ? 'Close' : 'Install'}
                        </button>
                    </div>

                    {/* Expanded Content (Instructions) */}
                    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${expanded ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}>
                        <div className="p-4 pt-0 space-y-4">
                            <div className="h-px bg-gray-200 w-full" />

                            <p className="text-sm text-gray-600 leading-relaxed">
                                Install <span className="font-bold text-purple-600">Ano Draw</span> to your home screen for smoother gameplay and no browser bars!
                            </p>

                            {isIOS ? (
                                <div className="bg-gray-50 rounded-xl p-3 text-sm space-y-2 text-gray-700 border border-gray-100">
                                    <div className="flex items-center gap-3">
                                        <span className="font-bold text-lg text-purple-500">1</span>
                                        <span>Tap the <span className="font-bold">Share</span> button <span className="text-blue-500 text-lg align-middle">⎋</span></span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="font-bold text-lg text-purple-500">2</span>
                                        <span>Scroll & tap <span className="font-bold">Add to Home Screen</span> ➕</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-700 border border-gray-100">
                                    Tap your browser menu (⋮) and select <strong>Install App</strong> or <strong>Add to Home Screen</strong>.
                                </div>
                            )}

                            {/* "Have the app?" Section requested by user */}
                            <div className="bg-purple-50 rounded-xl p-3 flex items-center justify-between">
                                <span className="text-xs font-bold text-purple-800">Already installed?</span>

                                <button
                                    className="text-xs bg-white text-purple-600 px-3 py-1.5 rounded-lg font-bold shadow-sm border border-purple-100 active:scale-95 transition-transform"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        alert("Please open 'Ano Draw' from your device Home Screen!");
                                        setShow(false);
                                    }}
                                >
                                    Open App
                                </button>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>,
        document.body
    );
};
