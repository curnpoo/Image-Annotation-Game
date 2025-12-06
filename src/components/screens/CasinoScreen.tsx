import React, { useState, useCallback } from 'react';
import { CurrencyService, formatCurrency } from '../../services/currency';
import { vibrate, HapticPatterns } from '../../utils/haptics';

interface CasinoScreenProps {
    onClose: () => void;
}

const SYMBOLS = ['🍒', '🍋', '🍊', '💎', '7️⃣', '🎰'];
const WINNING_COMBOS: { [key: string]: number } = {
    '7️⃣': 10,  // Triple 7s = 10x
    '💎': 7,   // Triple diamonds = 7x
    '🎰': 5,   // Triple jackpot = 5x
    '🍒': 3,   // Triple cherries = 3x
    '🍋': 2,   // Triple lemons = 2x
    '🍊': 2    // Triple oranges = 2x
};

export const CasinoScreen: React.FC<CasinoScreenProps> = ({ onClose }) => {
    const [balance, setBalance] = useState(CurrencyService.getCurrency());
    const [bet, setBet] = useState(1);
    const [reels, setReels] = useState(['🎰', '🎰', '🎰']);
    const [spinning, setSpinning] = useState(false);
    const [result, setResult] = useState<{ message: string; win: number } | null>(null);
    const [spinningReels, setSpinningReels] = useState([false, false, false]);

    // Update balance when it changes externally
    React.useEffect(() => {
        const handleCurrencyUpdate = () => {
            setBalance(CurrencyService.getCurrency());
        };
        window.addEventListener('currency-updated', handleCurrencyUpdate);
        // Also check on mount just in case
        setBalance(CurrencyService.getCurrency());

        return () => window.removeEventListener('currency-updated', handleCurrencyUpdate);
    }, []);

    const spin = useCallback(async () => {
        if (spinning || balance < bet) return;

        setResult(null);
        setSpinning(true);
        vibrate(HapticPatterns.light);

        // Deduct bet
        CurrencyService.spendCurrency(bet);
        setBalance(CurrencyService.getCurrency());

        // Start spinning animation
        setSpinningReels([true, true, true]);

        // Generate random results
        const results = Array(3).fill(0).map(() =>
            SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]
        );

        // Stop reels one by one
        setTimeout(() => {
            setReels([results[0], reels[1], reels[2]]);
            setSpinningReels([false, true, true]);
            vibrate(HapticPatterns.light);
        }, 500);

        setTimeout(() => {
            setReels([results[0], results[1], reels[2]]);
            setSpinningReels([false, false, true]);
            vibrate(HapticPatterns.light);
        }, 1000);

        setTimeout(() => {
            setReels(results);
            setSpinningReels([false, false, false]);

            // Check for wins
            let winAmount = 0;
            let message = '';

            // All three match
            if (results[0] === results[1] && results[1] === results[2]) {
                const multiplier = WINNING_COMBOS[results[0]] || 2;
                winAmount = bet * multiplier;
                message = `🎉 JACKPOT! ${results[0]} x3 = ${multiplier}x`;
                vibrate(HapticPatterns.success);
            }
            // Two match
            else if (results[0] === results[1] || results[1] === results[2] || results[0] === results[2]) {
                winAmount = bet * 1.5;
                message = `✨ Two of a kind! +${winAmount.toFixed(0)}$`;
                vibrate(HapticPatterns.medium);
            }
            // No match
            else {
                message = '😢 No luck this time...';
                vibrate(HapticPatterns.error);
            }

            if (winAmount > 0) {
                CurrencyService.addCurrency(Math.floor(winAmount));
                setBalance(CurrencyService.getCurrency());
            }

            setResult({ message, win: winAmount });
            setSpinning(false);
        }, 1500);
    }, [spinning, balance, bet, reels]);

    return (
        <div
            className="fixed inset-0 bg-gradient-to-b from-purple-900 via-purple-800 to-black flex flex-col items-center p-4 z-50 overflow-y-auto"
            style={{ paddingTop: 'max(1.5rem, env(safe-area-inset-top) + 1rem)' }}
        >
            {/* Home Button Card */}
            <button
                onClick={onClose}
                className="w-full max-w-md mb-6 bg-white/10 backdrop-blur-sm rounded-2xl p-4 border-2 border-white/20 flex items-center gap-4 hover:bg-white/20 active:scale-95 transition-all"
            >
                <div className="text-3xl">🏠</div>
                <div className="flex-1 text-left">
                    <div className="text-lg font-bold text-white">Back to Home</div>
                    <div className="text-white/60 text-sm">Return to main menu</div>
                </div>
                <div className="text-2xl text-white/60">←</div>
            </button>

            {/* Title */}
            <div className="text-center mb-6">
                <h1 className="text-4xl font-bold text-yellow-400 drop-shadow-lg mb-2">
                    🎰 CASINO 🎰
                </h1>
                <div className="text-yellow-300 text-xl font-bold">
                    {formatCurrency(balance)}
                </div>
            </div>

            {/* Slot Machine */}
            <div className="bg-gradient-to-b from-yellow-600 to-yellow-700 p-6 rounded-3xl shadow-2xl border-4 border-yellow-400 mb-6">
                <div className="bg-black rounded-2xl p-4 flex gap-2">
                    {reels.map((symbol, i) => (
                        <div
                            key={i}
                            className={`w-20 h-24 bg-white rounded-xl flex items-center justify-center text-5xl
                                ${spinningReels[i] ? 'animate-bounce' : 'pop-in'}
                            `}
                            style={{
                                boxShadow: 'inset 0 4px 8px rgba(0,0,0,0.3)',
                                animationDelay: `${i * 100}ms`
                            }}
                        >
                            {spinningReels[i] ? (
                                <span className="animate-spin">🎲</span>
                            ) : symbol}
                        </div>
                    ))}
                </div>
            </div>

            {/* Result */}
            {result && (
                <div className={`text-center mb-4 pop-in ${result.win > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    <div className="text-2xl font-bold">{result.message}</div>
                    {result.win > 0 && (
                        <div className="text-3xl font-bold text-yellow-400 animate-pulse">
                            +${Math.floor(result.win)}
                        </div>
                    )}
                </div>
            )}

            {/* Bet Selector */}
            <div className="flex items-center gap-4 mb-6">
                <span className="text-white font-bold">BET:</span>
                {[1, 2, 5].map(amount => (
                    <button
                        key={amount}
                        onClick={() => setBet(amount)}
                        disabled={balance < amount}
                        className={`w-12 h-12 rounded-full font-bold text-lg transition-all
                            ${bet === amount
                                ? 'bg-yellow-400 text-purple-900 scale-110 shadow-lg'
                                : 'bg-purple-700 text-white hover:bg-purple-600'}
                            ${balance < amount ? 'opacity-50 cursor-not-allowed' : ''}
                        `}
                    >
                        ${amount}
                    </button>
                ))}
            </div>

            {/* Spin Button */}
            <button
                onClick={spin}
                disabled={spinning || balance < bet}
                className={`px-12 py-4 rounded-2xl font-bold text-2xl transition-all
                    ${spinning
                        ? 'bg-gray-600 text-gray-400'
                        : balance < bet
                            ? 'bg-red-600 text-white opacity-50'
                            : 'bg-gradient-to-r from-green-400 to-green-600 text-white hover:scale-105 shadow-lg jelly-hover'}
                `}
            >
                {spinning ? '🎲 SPINNING...' : balance < bet ? '💸 BROKE!' : `SPIN! ($${bet})`}
            </button>

            {/* Paytable */}
            <div className="mt-8 text-center text-white/70 text-sm">
                <div className="font-bold mb-2">PAYOUTS:</div>
                <div className="flex flex-wrap justify-center gap-2">
                    {Object.entries(WINNING_COMBOS).map(([symbol, mult]) => (
                        <span key={symbol} className="bg-black/30 px-2 py-1 rounded">
                            {symbol}x3 = {mult}x
                        </span>
                    ))}
                </div>
                <div className="mt-2">Two of a kind = 1.5x</div>
            </div>
        </div>
    );
};
