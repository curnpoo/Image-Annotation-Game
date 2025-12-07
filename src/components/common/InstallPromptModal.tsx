import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface InstallPromptModalProps {
    onClose?: () => void;
}

export const InstallPromptModal: React.FC<InstallPromptModalProps> = ({ onClose }) => {
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

        // Show immediately if onClose is provided (manual trigger), otherwise delay
        if (!standalone) {
            if (onClose) {
                setShow(true);
                setExpanded(true); // Auto-expand if manually triggered
            } else {
                setTimeout(() => setShow(true), 1000);
            }
        }
    }, [onClose]);

    const handleClose = () => {
        setShow(false);
        if (onClose) setTimeout(onClose, 300); // Wait for animation
    };

    if (!show || isStandalone) return null;

    return createPortal(
        <div className={`fixed bottom-0 left-0 right-0 z-[9999] transition-transform duration-500 ease-in-out transform ${show ? 'translate-y-0' : 'translate-y-full'} safe-area-padding`}>
            {/* Backdrop for manual mode */}
            {onClose && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-sm -z-10" onClick={handleClose}></div>
            )}

            <div className="mx-4 mb-6">
                <div className="bg-white/95 backdrop-blur-xl border-2 border-purple-400/30 rounded-3xl shadow-2xl overflow-hidden max-w-md mx-auto relative slide-up">

                    {/* Close Button (if manual) */}
                    {onClose && (
                        <button
                            onClick={handleClose}
                            className="absolute top-2 right-2 p-2 bg-gray-100/50 rounded-full hover:bg-gray-200/50 transition-colors z-10"
                        >
                            ✕
                        </button>
                    )}

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

                        </div>
                    </div>

                </div>
            </div>
        </div>,
        document.body
    );
};
