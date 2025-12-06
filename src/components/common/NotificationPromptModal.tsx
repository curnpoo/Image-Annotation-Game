import React from 'react';

interface NotificationPromptModalProps {
    isOpen: boolean;
    onEnable: () => void;
    onLater: () => void;
}

export const NotificationPromptModal: React.FC<NotificationPromptModalProps> = ({
    isOpen,
    onEnable,
    onLater
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl border-4 border-purple-500 animate-pop-in relative overflow-hidden">
                {/* Decorative background circle */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-100 rounded-full blur-2xl z-0" />

                <div className="relative z-10">
                    <div className="text-5xl mb-4 animate-bounce-gentle">🔔</div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">Never Miss a Turn!</h3>
                    <p className="text-gray-600 mb-6 leading-relaxed">
                        Enable notifications to get alerted when it's your turn to draw or vote, even if you're not looking at the screen.
                    </p>

                    <div className="space-y-3">
                        <button
                            onClick={onEnable}
                            className="w-full btn-90s bg-gradient-to-r from-purple-500 to-indigo-600 text-white py-3 rounded-xl font-bold text-lg shadow-lg hover:shadow-purple-500/30 transition-all active:scale-95"
                        >
                            Enable Notifications ⚡️
                        </button>
                        <button
                            onClick={onLater}
                            className="w-full py-2 text-gray-400 font-bold hover:text-gray-600 text-sm transition-colors"
                        >
                            Maybe Later
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
