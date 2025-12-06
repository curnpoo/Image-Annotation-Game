import React from 'react';

interface HowToPlayModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (

        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pointer-events-none">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto" onClick={onClose} />
            <div className="relative z-10 bg-white rounded-[2rem] max-w-md w-full p-8 space-y-6 pop-in pointer-events-auto"
                style={{
                    boxShadow: '0 20px 0 rgba(155, 89, 182, 0.3), 0 40px 80px rgba(0, 0, 0, 0.3)',
                    border: '5px solid transparent',
                    backgroundImage: 'linear-gradient(white, white), linear-gradient(135deg, #FF69B4, #9B59B6, #00D9FF)',
                    backgroundOrigin: 'border-box',
                    backgroundClip: 'padding-box, border-box'
                }}>

                <div className="text-center space-y-2">
                    <div className="text-6xl bounce-scale">🎨</div>
                    <h2 className="text-3xl font-bold"
                        style={{
                            background: 'linear-gradient(135deg, #FF69B4, #9B59B6)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                        }}>
                        How to Play
                    </h2>
                </div>

                <div className="space-y-4 stagger-children">
                    <div className="flex items-start space-x-4 pop-in">
                        <div className="bg-gradient-to-br from-pink-400 to-purple-500 text-white font-bold rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0 text-xl"
                            style={{ boxShadow: '0 3px 0 rgba(155, 89, 182, 0.4)' }}>
                            1
                        </div>
                        <p className="text-gray-600 font-medium text-lg pt-1">
                            Create your profile and <span className="font-bold text-purple-500">draw your avatar!</span> 🎨
                        </p>
                    </div>

                    <div className="flex items-start space-x-4 pop-in" style={{ animationDelay: '0.1s' }}>
                        <div className="bg-gradient-to-br from-cyan-400 to-blue-500 text-white font-bold rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0 text-xl"
                            style={{ boxShadow: '0 3px 0 rgba(65, 105, 225, 0.4)' }}>
                            2
                        </div>
                        <p className="text-gray-600 font-medium text-lg pt-1">
                            Fill in the <span className="font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-lg">white blank</span> to complete the image! Use the eraser if you make a mistake. ✏️
                        </p>
                    </div>

                    <div className="flex items-start space-x-4 pop-in" style={{ animationDelay: '0.2s' }}>
                        <div className="bg-gradient-to-br from-orange-400 to-red-500 text-white font-bold rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0 text-xl"
                            style={{ boxShadow: '0 3px 0 rgba(255, 140, 0, 0.4)' }}>
                            3
                        </div>
                        <p className="text-gray-600 font-medium text-lg pt-1">
                            Vote for the funniest or most creative drawing to win points! 🏆
                        </p>
                    </div>
                </div>

                <button
                    onClick={onClose}
                    className="w-full btn-90s bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 text-white font-bold text-xl py-4 jelly-hover"
                >
                    ✨ Got it! Let's Go! ✨
                </button>
            </div>
        </div>
    );
};
