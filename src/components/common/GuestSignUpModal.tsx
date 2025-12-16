import React, { useEffect, useState } from 'react';

interface GuestSignUpModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

export const GuestSignUpModal: React.FC<GuestSignUpModalProps> = ({ isOpen, onClose, onConfirm }) => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setVisible(true);
        } else {
            const timer = setTimeout(() => setVisible(false), 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isOpen && !visible) return null;

    return (
        <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className={`
                relative bg-gradient-to-b from-[#2c241b] to-[#1e1e1e] 
                w-full max-w-sm rounded-3xl p-6 shadow-2xl border-2 border-white/10
                transform transition-all duration-300 
                ${isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}
            `}>
                {/* Decoration */}
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 text-6xl animate-bounce">
                    🔐
                </div>

                <div className="mt-6 text-center space-y-4">
                    <h2 className="text-2xl font-black text-white leading-none">
                        Guest Mode
                    </h2>
                    
                    <p className="text-white/70 font-medium leading-relaxed">
                        Create an account to unlock the <span className="text-purple-400 font-bold">Store</span>, <span className="text-yellow-400 font-bold">Casino</span>, and <span className="text-blue-400 font-bold">Profile</span> customization!
                    </p>

                    <div className="bg-black/20 rounded-xl p-4 text-left space-y-2 border border-white/5">
                        <div className="flex items-center gap-3 text-sm text-white/80">
                            <span className="text-lg">💾</span> Save your stats & history
                        </div>
                        <div className="flex items-center gap-3 text-sm text-white/80">
                            <span className="text-lg">🎨</span> Customize your avatar
                        </div>
                        <div className="flex items-center gap-3 text-sm text-white/80">
                            <span className="text-lg">☁️</span> Sync across devices
                        </div>
                    </div>

                    <div className="space-y-3 pt-2">
                        <button
                            onClick={onConfirm}
                            className="w-full py-3.5 rounded-xl font-black text-lg text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:scale-[1.02] active:scale-95 transition-all shadow-lg"
                        >
                            Create Account
                        </button>
                        
                        <button
                            onClick={onClose}
                            className="w-full py-3.5 rounded-xl font-bold text-white/50 hover:text-white hover:bg-white/5 transition-all"
                        >
                            Stay as Guest
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
