import React, { useState } from 'react';
import { AuthService } from '../../services/auth';
import { vibrate, HapticPatterns } from '../../utils/haptics';

interface LoginScreenProps {
    onLogin: () => void;
    joiningRoomCode?: string | null;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, joiningRoomCode }) => {
    const [mode, setMode] = useState<'choose' | 'login' | 'register'>('choose');
    const [username, setUsername] = useState('');
    const [pin, setPin] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!username.trim() || pin.length !== 4) {
            setError('Please enter username and 4-digit PIN');
            vibrate(HapticPatterns.error);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const result = mode === 'register'
                ? await AuthService.register(username.trim(), pin)
                : await AuthService.login(username.trim(), pin);

            if (result.success) {
                vibrate(HapticPatterns.success);
                // The onLogin callback typically re-checks AuthService.getCurrentUser() 
                // or we could pass the user object, but existing flow relies on AuthService state/storage.
                onLogin();
            } else {
                setError(result.error || 'Authentication failed');
                vibrate(HapticPatterns.error);
            }
        } catch (err: any) {
            setError(err.message || 'Something went wrong. Please try again.');
            vibrate(HapticPatterns.error);
        } finally {
            setLoading(false);
        }
    };

    // Shared Background Bubbles
    const BackgroundBubbles = () => (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            <div className="bubble bg-white w-32 h-32 left-[10%] animation-delay-0 blur-sm"></div>
            <div className="bubble bg-white w-24 h-24 left-[30%] animation-delay-2000 blur-sm"></div>
            <div className="bubble bg-white w-40 h-40 left-[60%] animation-delay-4000 blur-md"></div>
            <div className="bubble bg-white w-16 h-16 left-[80%] animation-delay-1000"></div>
            <div className="bubble bg-white w-20 h-20 left-[50%] animation-delay-3000 blur-sm"></div>
        </div>
    );

    // Initial choice screen
    if (mode === 'choose') {
        return (
            <div className="relative w-full h-[100dvh] overflow-hidden flex flex-col items-center justify-center safe-area-padding p-6">
                <BackgroundBubbles />

                <div className="z-10 w-full max-w-sm flex flex-col items-center gap-8">
                    {/* Header */}
                    <div className="text-center animate-slide-up">
                        <div className="text-6xl mb-4 animate-bounce-gentle">🎮</div>
                        <h1 className="text-5xl font-black text-white drop-shadow-lg mb-2 rainbow-text">
                            AnnoGame
                        </h1>
                        <p className="text-xl text-white/90 font-medium glass-panel px-6 py-2 rounded-full inline-block">
                            Draw, Vote, Win!
                        </p>
                    </div>

                    {joiningRoomCode && (
                        <div className="w-full glass-panel p-6 rounded-3xl text-center space-y-2 animate-bounce-in border-l-4 border-l-purple-400">
                            <div className="text-xs font-bold uppercase tracking-widest text-purple-300">
                                Joining Room
                            </div>
                            <div className="text-4xl font-black text-white tracking-wider font-mono">
                                {joiningRoomCode}
                            </div>
                        </div>
                    )}

                    <div className="w-full space-y-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                        <button
                            onClick={() => setMode('register')}
                            className="w-full group relative overflow-hidden rounded-2xl p-[2px] transition-transform active:scale-95 hover:scale-[1.02]"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-600"></div>
                            <div className="relative bg-black/40 backdrop-blur-sm rounded-[0.9rem] py-5 px-4 flex items-center justify-center gap-3 h-full">
                                <span className="text-xl">🆕</span>
                                <span className="font-bold text-xl text-white">Create Account</span>
                            </div>
                        </button>

                        <button
                            onClick={() => setMode('login')}
                            className="w-full group relative overflow-hidden rounded-2xl p-[2px] transition-transform active:scale-95 hover:scale-[1.02]"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500"></div>
                            <div className="relative bg-black/40 backdrop-blur-sm rounded-[0.9rem] py-5 px-4 flex items-center justify-center gap-3 h-full">
                                <span className="text-xl">🔐</span>
                                <span className="font-bold text-xl text-white">Sign In</span>
                            </div>
                        </button>

                        <button
                            onClick={onLogin}
                            className="w-full glass-button py-4 rounded-2xl font-bold text-lg text-white/80 border-white/20 hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-2"
                        >
                            <span>👤</span> Continue as Guest
                        </button>
                    </div>

                    <p className="text-white/60 text-sm text-center max-w-xs leading-relaxed animate-fade-in delay-500">
                        Create an account to save your progress, stats, and purchases!
                    </p>
                </div>
            </div>
        );
    }

    // Login/Register form
    return (
        <div className="relative w-full h-[100dvh] overflow-hidden flex flex-col items-center justify-center safe-area-padding p-6">
            <BackgroundBubbles />

            <div className="z-10 w-full max-w-sm animate-slide-up">
                {/* Back button */}
                <button
                    onClick={() => {
                        setMode('choose');
                        setError(null);
                        setUsername('');
                        setPin('');
                    }}
                    className="mb-6 glass-button px-5 py-2 rounded-full font-bold text-white hover:pl-4 hover:pr-6 transition-all flex items-center gap-2"
                >
                    <span>←</span> Back
                </button>

                <div className="glass-panel p-8 rounded-[2rem] shadow-2xl relative overflow-hidden">
                    {/* Decorative header gradient */}
                    <div className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${mode === 'register'
                            ? 'from-green-400 to-emerald-600'
                            : 'from-purple-500 to-pink-500'
                        }`}></div>

                    <h2 className="text-3xl font-black text-center mb-8 text-white flex items-center justify-center gap-3">
                        {mode === 'register' ? '🆕 Register' : '🔐 Sign In'}
                    </h2>

                    {/* Username */}
                    <div className="mb-6 space-y-2">
                        <label className="block text-xs font-bold text-white/70 uppercase tracking-widest ml-1">
                            Username
                        </label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                            placeholder="Enter username"
                            maxLength={15}
                            className="w-full px-4 py-4 bg-white/10 border border-white/20 rounded-xl focus:border-white/50 focus:bg-white/20 focus:outline-none font-bold text-center text-xl text-white placeholder-white/30 transition-all"
                            autoCapitalize="none"
                            autoCorrect="off"
                        />
                    </div>

                    {/* PIN */}
                    <div className="mb-8 space-y-2">
                        <label className="block text-xs font-bold text-white/70 uppercase tracking-widest ml-1">
                            4-Digit PIN
                        </label>
                        <input
                            type="tel"
                            value={pin}
                            onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
                            placeholder="• • • •"
                            maxLength={4}
                            className="w-full px-4 py-4 bg-white/10 border border-white/20 rounded-xl focus:border-white/50 focus:bg-white/20 focus:outline-none font-bold text-center text-3xl tracking-[0.5em] text-white placeholder-white/30 transition-all"
                            inputMode="numeric"
                        />
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="bg-red-500/20 border border-red-500/30 text-red-200 p-3 rounded-xl text-center font-bold mb-6 animate-shake text-sm backdrop-blur-sm">
                            ⚠️ {error}
                        </div>
                    )}

                    {/* Submit */}
                    <button
                        onClick={handleSubmit}
                        disabled={loading || !username.trim() || pin.length !== 4}
                        className={`w-full py-4 rounded-xl font-black text-lg uppercase tracking-wide transition-all shadow-lg ${loading
                            ? 'bg-gray-500/50 cursor-wait'
                            : mode === 'register'
                                ? 'bg-gradient-to-r from-green-400 to-emerald-600 hover:scale-[1.02] active:scale-95 text-white'
                                : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:scale-[1.02] active:scale-95 text-white'
                            } disabled:opacity-50 disabled:scale-100`}
                    >
                        {loading
                            ? '⏳ Loading...'
                            : mode === 'register'
                                ? 'Create Account'
                                : 'Sign In'
                        }
                    </button>
                </div>

                {mode === 'register' && (
                    <p className="text-white/50 text-xs mt-6 text-center font-medium">
                        Your PIN is your password.<br />Don't forget it!
                    </p>
                )}
            </div>
        </div>
    );
};
