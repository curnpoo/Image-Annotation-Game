import React, { useState, useCallback, useEffect } from 'react';
import { CurrencyService, formatCurrency } from '../../services/currency';
import { CasinoService } from '../../services/casino';
import type { SpinResult } from '../../services/casino';
import { vibrate, HapticPatterns } from '../../utils/haptics';
import { HorizontalPicker } from '../common/HorizontalPicker';

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
    const [showStats, setShowStats] = useState(false);

    // Update balance when it changes externally
    useEffect(() => {
        const handleCurrencyUpdate = () => {
            setBalance(CurrencyService.getCurrency());
        };
        window.addEventListener('currency-updated', handleCurrencyUpdate);
        setBalance(CurrencyService.getCurrency());

        return () => window.removeEventListener('currency-updated', handleCurrencyUpdate);
    }, []);

    // Clamp bet to balance if balance changes
    useEffect(() => {
        if (bet > balance && balance >= 1) {
            setBet(Math.max(1, Math.min(balance, 500)));
        }
    }, [balance, bet]);

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

        // Stop reels one by one with "thud" haptics
        setTimeout(() => {
            setReels([results[0], reels[1], reels[2]]);
            setSpinningReels([false, true, true]);
            vibrate(HapticPatterns.light);
        }, 600);

        setTimeout(() => {
            setReels([results[0], results[1], reels[2]]);
            setSpinningReels([false, false, true]);
            vibrate(HapticPatterns.light);
        }, 1200);

        setTimeout(async () => {
            setReels(results);
            setSpinningReels([false, false, false]);

            // Check for wins
            let winAmount = 0;
            let message = '';
            let spinResult: SpinResult = 'loss';

            // All three match
            if (results[0] === results[1] && results[1] === results[2]) {
                const multiplier = WINNING_COMBOS[results[0]] || 2;
                winAmount = bet * multiplier;
                message = `JACKPOT! ${results[0]} x3 = ${multiplier}x`;
                spinResult = 'jackpot';
                vibrate(HapticPatterns.success);
            }
            // Two match
            else if (results[0] === results[1] || results[1] === results[2] || results[0] === results[2]) {
                winAmount = bet * 1.5;
                message = `Nice hit! 2 of a kind!`;
                spinResult = 'two_of_a_kind';
                vibrate(HapticPatterns.medium);
            }
            // No match
            else {
                message = 'Try again!';
                spinResult = 'loss';
                vibrate(HapticPatterns.error);
            }

            if (winAmount > 0) {
                CurrencyService.addCurrency(Math.floor(winAmount));
                setBalance(CurrencyService.getCurrency());
            }

            // Track casino stats
            await CasinoService.recordSpin(bet, Math.floor(winAmount), spinResult);

            setResult({ message, win: winAmount });
            setSpinning(false);
        }, 1800);
    }, [spinning, balance, bet, reels]);


    return (
        <div
            className="fixed inset-0 overflow-hidden flex flex-col items-center bg-black"
            style={{ height: '100dvh' }}
        >
            {/* Background Atmosphere */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-20%] left-[-20%] w-[140%] h-[80%] bg-[radial-gradient(circle,rgba(255,215,0,0.15)_0%,rgba(0,0,0,0)_70%)] animate-pulse-slow" />
                <div className="absolute bottom-0 w-full h-[300px] bg-gradient-to-t from-red-900/20 to-transparent opacity-50" />

                {/* Neon Grid Floor */}
                <div className="absolute bottom-0 w-full h-[50%] opacity-20"
                    style={{
                        background: 'linear-gradient(transparent 50%, #8000FF 50%), linear-gradient(90deg, rgba(128,0,255,0.3) 1px, transparent 1px)',
                        backgroundSize: '100% 40px, 40px 100%',
                        transform: 'perspective(500px) rotateX(60deg) translateY(100px) scale(2)'
                    }}
                />
            </div>

            {/* Content Container */}
            <div
                className="relative z-10 w-full max-w-md h-full flex flex-col px-4"
                style={{
                    paddingTop: 'max(1.5rem, env(safe-area-inset-top) + 1rem)',
                    paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom) + 1rem)',
                }}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <button
                        onClick={onClose}
                        className="w-12 h-12 rounded-full flex items-center justify-center text-xl bg-white/10 text-white border border-white/20 active:scale-95 transition-all shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                    >
                        ←
                    </button>
                    <div className="px-5 py-2 rounded-full border border-yellow-500/50 bg-black/40 text-yellow-400 font-mono font-black text-xl shadow-[0_0_20px_rgba(255,215,0,0.2)] backdrop-blur-md">
                        {formatCurrency(balance)}
                    </div>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center relative -mt-10">

                    {/* Logo */}
                    <div className="mb-8 relative text-center">
                        <h1
                            className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 via-yellow-500 to-yellow-700 tracking-tighter"
                            style={{ filter: 'drop-shadow(0 0 10px rgba(255,215,0,0.5))' }}
                        >
                            CASINO
                        </h1>
                        <div className="text-pink-500 font-cursive text-3xl -mt-4 transform -rotate-6 filter drop-shadow-[0_0_5px_rgba(236,72,153,0.8)]">
                            Night
                        </div>
                    </div>

                    {/* Slot Machine Frame */}
                    <div className="w-full relative p-4 rounded-3xl border-4 border-yellow-600/50 bg-gradient-to-b from-gray-900 to-black shadow-[0_0_50px_rgba(255,165,0,0.2)]">
                        {/* Lights Top */}
                        <div className="absolute top-2 left-4 right-4 flex justify-between px-2">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className={`w-3 h-3 rounded-full ${spinning ? 'animate-pulse bg-red-500 shadow-[0_0_10px_red]' : 'bg-red-900'}`} style={{ animationDelay: `${i * 100}ms` }} />
                            ))}
                        </div>

                        {/* Reels Window */}
                        <div className="mt-6 mb-4 bg-white rounded-lg p-1 shadow-inner border-y-4 border-gray-800 relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/40 pointer-events-none z-10" />
                            <div className="flex bg-gray-100">
                                {reels.map((symbol, i) => (
                                    <div
                                        key={i}
                                        className={`flex-1 h-32 flex items-center justify-center text-6xl border-r last:border-r-0 border-gray-300
                                        ${spinningReels[i] ? 'animate-slot-spin blur-sm' : 'animate-bounce-short'}`}
                                    >
                                        {spinningReels[i] ? '🎰' : symbol}
                                    </div>
                                ))}
                            </div>

                            {/* Win Line */}
                            <div className="absolute top-1/2 left-0 right-0 h-1 bg-red-500/50 z-20 pointer-events-none" />
                        </div>

                        {/* Result Display */}
                        <div className="h-10 text-center flex items-center justify-center">
                            {result ? (
                                <div className={`font-black text-xl animate-pop-in ${result.win > 0 ? 'text-green-400 drop-shadow-[0_0_5px_lime]' : 'text-red-400'}`}>
                                    {result.message}
                                    {result.win > 0 && <span className="block text-2xl text-yellow-400">+{formatCurrency(result.win)}</span>}
                                </div>
                            ) : (
                                <div className="text-gray-500 font-bold tracking-widest text-xs uppercase opacity-50">Good Luck!</div>
                            )}
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="w-full mt-8 space-y-4">
                        <div className="bg-white/5 rounded-2xl p-2 border border-white/10 backdrop-blur-md">
                            <HorizontalPicker
                                min={1}
                                max={500}
                                step={1}
                                value={bet}
                                onChange={setBet}
                                prefix="$"
                                disabled={spinning}
                                maxAllowed={Math.min(balance, 500)}
                            />
                        </div>

                        <button
                            onClick={spin}
                            disabled={spinning || balance < bet}
                            className={`w-full py-5 rounded-2xl font-black text-2xl tracking-widest uppercase transition-all
                                ${spinning
                                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed scale-95'
                                    : balance < bet
                                        ? 'bg-red-900/50 text-red-500 border border-red-500/50'
                                        : 'bg-gradient-to-r from-yellow-500 via-orange-500 to-yellow-500 text-black shadow-[0_0_20px_rgba(255,165,0,0.5)] animate-shimmer bg-[length:200%_auto] hover:scale-[1.02] active:scale-95'
                                }
                            `}
                        >
                            {spinning ? 'Spinning...' : balance < bet ? 'Add Funds' : 'SPIN'}
                        </button>
                    </div>
                </div>

                {/* Footer Stats Trigger */}
                <button
                    onClick={() => setShowStats(true)}
                    className="mx-auto mt-4 text-xs font-bold text-white/30 uppercase tracking-[0.2em] hover:text-white/80 transition-colors"
                >
                    View Stats
                </button>

                {/* Stats Modal */}
                {showStats && <CasinoStatsModal onClose={() => setShowStats(false)} />}
            </div>
        </div>
    );
};

// Casino Stats Modal Component (Refreshed)
const CasinoStatsModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const stats = CasinoService.getStats();
    const winRate = CasinoService.getWinRate();
    const roi = CasinoService.getROI();

    const statItems = [
        { label: 'Total Spins', value: stats.totalSpins, emoji: '🎰' },
        { label: 'Win Rate', value: `${winRate}%`, emoji: '📈' },
        { label: 'Net Profit', value: `${stats.netProfit >= 0 ? '+' : ''}${formatCurrency(stats.netProfit)}`, emoji: stats.netProfit >= 0 ? '🤑' : '💸', color: stats.netProfit >= 0 ? '#4ade80' : '#f87171' },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in" onClick={onClose}>
            <div
                className="relative z-10 w-full max-w-xs bg-gray-900 border-2 border-yellow-500/30 rounded-3xl p-6 shadow-2xl pop-in text-center"
                onClick={e => e.stopPropagation()}
            >
                <div className="text-4xl mb-2">📊</div>
                <h2 className="text-2xl font-black text-white mb-6 uppercase tracking-widest">Stats</h2>

                <div className="space-y-3">
                    {statItems.map((item, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                            <div className="flex items-center gap-3 text-white/70 font-bold">
                                <span>{item.emoji}</span>
                                <span className="text-sm">{item.label}</span>
                            </div>
                            <div className="font-mono font-black text-lg text-white" style={item.color ? { color: item.color } : {}}>
                                {item.value}
                            </div>
                        </div>
                    ))}
                </div>

                <button
                    onClick={onClose}
                    className="w-full mt-6 py-3 rounded-xl bg-white/10 text-white font-bold hover:bg-white/20 transition-colors"
                >
                    Close
                </button>
            </div>
        </div>
    );
};
