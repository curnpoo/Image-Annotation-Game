import React, { useState } from 'react';
import { AuthService } from '../../services/auth';
import { vibrate, HapticPatterns } from '../../utils/haptics';

interface LoginScreenProps {
    onLogin: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
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
            let result;
            if (mode === 'register') {
                result = await AuthService.register(username.trim(), pin);
                if (!result) {
                    setError('Username already taken or invalid PIN');
                }
            } else {
                result = await AuthService.login(username.trim(), pin);
                if (!result) {
                    setError('Invalid username or PIN');
                }
            }

            if (result) {
                vibrate(HapticPatterns.success);
                onLogin();
            } else {
                vibrate(HapticPatterns.error);
            }
        } catch (err) {
            setError('Something went wrong. Please try again.');
            vibrate(HapticPatterns.error);
        } finally {
            setLoading(false);
        }
    };

    // Initial choice screen
    if (mode === 'choose') {
        return (
            <div
                className="min-h-screen bg-90s-animated flex flex-col items-center justify-center p-6"
                style={{ paddingTop: 'max(2rem, env(safe-area-inset-top) + 1rem)' }}
            >
                <div className="text-center mb-8">
                    <div className="text-6xl mb-4">🎮</div>
                    <h1 className="text-4xl font-black text-white drop-shadow-lg mb-2">
                        AnnoGame
                    </h1>
                    <p className="text-white/80 font-medium">
                        Draw, Vote, Win!
                    </p>
                </div>

                <div className="w-full max-w-sm space-y-4">
                    <button
                        onClick={() => setMode('register')}
                        className="w-full bg-gradient-to-r from-green-400 to-emerald-600 text-white font-bold py-5 rounded-2xl shadow-xl text-xl hover:scale-[1.02] active:scale-95 transition-all"
                    >
                        🆕 Create Account
                    </button>

                    <button
                        onClick={() => setMode('login')}
                        className="w-full bg-gradient-to-r from-purple-500 to-purple-700 text-white font-bold py-5 rounded-2xl shadow-xl text-xl hover:scale-[1.02] active:scale-95 transition-all"
                    >
                        🔐 Sign In
                    </button>

                    <button
                        onClick={onLogin}
                        className="w-full bg-white/20 backdrop-blur-sm text-white font-bold py-4 rounded-2xl border-2 border-white/30 hover:bg-white/30 transition-all"
                    >
                        👤 Continue as Guest
                    </button>
                </div>

                <p className="text-white/60 text-sm mt-6 text-center">
                    Create an account to save your<br />progress, stats, and purchases!
                </p>
            </div>
        );
    }

    // Login/Register form
    return (
        <div
            className="min-h-screen bg-90s-animated flex flex-col items-center justify-center p-6"
            style={{ paddingTop: 'max(2rem, env(safe-area-inset-top) + 1rem)' }}
        >
            <div className="w-full max-w-sm">
                {/* Back button */}
                <button
                    onClick={() => {
                        setMode('choose');
                        setError(null);
                        setUsername('');
                        setPin('');
                    }}
                    className="mb-6 bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-xl font-bold hover:bg-white/30 transition-all"
                >
                    ← Back
                </button>

                <div className="bg-white rounded-3xl p-6 shadow-2xl"
                    style={{
                        border: '4px solid transparent',
                        backgroundImage: mode === 'register'
                            ? 'linear-gradient(white, white), linear-gradient(135deg, #10B981, #3B82F6)'
                            : 'linear-gradient(white, white), linear-gradient(135deg, #8B5CF6, #EC4899)',
                        backgroundOrigin: 'border-box',
                        backgroundClip: 'padding-box, border-box'
                    }}
                >
                    <h2 className="text-2xl font-black text-center mb-6 text-gray-800">
                        {mode === 'register' ? '🆕 Create Account' : '🔐 Sign In'}
                    </h2>

                    {/* Username */}
                    <div className="mb-4">
                        <label className="block text-sm font-bold text-gray-600 mb-2">
                            USERNAME
                        </label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                            placeholder="Enter username"
                            maxLength={15}
                            className="w-full px-4 py-3 bg-gray-50 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none font-bold text-center text-lg"
                            autoCapitalize="none"
                            autoCorrect="off"
                        />
                    </div>

                    {/* PIN */}
                    <div className="mb-4">
                        <label className="block text-sm font-bold text-gray-600 mb-2">
                            4-DIGIT PIN
                        </label>
                        <input
                            type="tel"
                            value={pin}
                            onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
                            placeholder="• • • •"
                            maxLength={4}
                            className="w-full px-4 py-3 bg-gray-50 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none font-bold text-center text-2xl tracking-[0.5em]"
                            inputMode="numeric"
                        />
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="bg-red-100 text-red-600 p-3 rounded-xl text-center font-bold mb-4 pop-in">
                            {error}
                        </div>
                    )}

                    {/* Submit */}
                    <button
                        onClick={handleSubmit}
                        disabled={loading || !username.trim() || pin.length !== 4}
                        className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${loading
                                ? 'bg-gray-400 text-white'
                                : mode === 'register'
                                    ? 'bg-gradient-to-r from-green-400 to-emerald-600 text-white hover:scale-[1.02]'
                                    : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:scale-[1.02]'
                            } disabled:opacity-50`}
                    >
                        {loading
                            ? '⏳ Loading...'
                            : mode === 'register'
                                ? '✓ Create Account'
                                : '✓ Sign In'
                        }
                    </button>
                </div>

                {mode === 'register' && (
                    <p className="text-white/60 text-sm mt-4 text-center">
                        Your PIN is like a simple password.<br />Remember it to log in later!
                    </p>
                )}
            </div>
        </div>
    );
};
