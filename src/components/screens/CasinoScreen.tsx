import React, { useState, useCallback } from 'react';
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
    React.useEffect(() => {
        const handleCurrencyUpdate = () => {
            setBalance(CurrencyService.getCurrency());
        };
        window.addEventListener('currency-updated', handleCurrencyUpdate);
        setBalance(CurrencyService.getCurrency());

        return () => window.removeEventListener('currency-updated', handleCurrencyUpdate);
    }, []);

    // Clamp bet to balance if balance changes
    React.useEffect(() => {
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
                message = `🎉 JACKPOT! ${results[0]} x3 = ${multiplier}x`;
                spinResult = 'jackpot';
                vibrate(HapticPatterns.success);
            }
            // Two match
            else if (results[0] === results[1] || results[1] === results[2] || results[0] === results[2]) {
                winAmount = bet * 1.5;
                message = `✨ Two of a kind! +${winAmount.toFixed(0)}$`;
                spinResult = 'two_of_a_kind';
                vibrate(HapticPatterns.medium);
            }
            // No match
            else {
                message = '😢 No luck this time...';
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
        }, 1500);
    }, [spinning, balance, bet, reels]);


    return (
        <>
            {/* Solid background layer to ensure no transparency on iOS */}
            <div
                className="fixed inset-0 z-40"
                style={{ backgroundColor: '#0d0d0d' }}
            />

            <div
                className="fixed inset-0 flex flex-col items-center z-50 overflow-y-auto"
                style={{
                    paddingTop: 'max(1.5rem, env(safe-area-inset-top) + 1rem)',
                    paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom) + 1rem)',
                    paddingLeft: '1rem',
                    paddingRight: '1rem',
                    backgroundColor: '#0d0d0d',
                    background: 'linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 100%)'
                }}
            >
                {/* Decorative Background Elements */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    {/* Subtle gold radial glow */}
                    <div
                        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px]"
                        style={{
                            background: 'radial-gradient(ellipse at center, rgba(255,215,0,0.1) 0%, transparent 70%)',
                        }}
                    />
                    {/* Bottom glow */}
                    <div
                        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px]"
                        style={{
                            background: 'radial-gradient(ellipse at center, rgba(255,215,0,0.05) 0%, transparent 60%)',
                        }}
                    />
                </div>


                {/* Home Button */}
                <button
                    onClick={onClose}
                    className="w-full max-w-md mb-4 rounded-2xl p-4 flex items-center gap-4 hover:brightness-110 active:scale-[0.98] transition-all relative z-10"
                    style={{
                        background: 'linear-gradient(135deg, rgba(40,40,40,0.9) 0%, rgba(30,30,30,0.9) 100%)',
                        border: '1px solid rgba(255,215,0,0.2)',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)'
                    }}
                >
                    <div className="text-2xl">🏠</div>
                    <div className="flex-1 text-left">
                        <div className="text-base font-bold text-white">Back to Home</div>
                        <div className="text-xs text-gray-400">Return to main menu</div>
                    </div>
                    <div className="text-xl text-gray-500">←</div>
                </button>

                {/* Title & Balance */}
                <div className="text-center mb-4 relative z-10">
                    <div className="flex items-center justify-center gap-3 mb-1">
                        <h1
                            className="text-3xl font-black"
                            style={{
                                background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FFD700 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))'
                            }}
                        >
                            🎰 CASINO 🎰
                        </h1>
                        <button
                            onClick={() => setShowStats(true)}
                            className="p-2 rounded-lg transition-all hover:scale-110 active:scale-95"
                            style={{
                                background: 'rgba(255,215,0,0.2)',
                                border: '1px solid rgba(255,215,0,0.3)'
                            }}
                            title="View Stats"
                        >
                            📊
                        </button>
                    </div>
                    <div
                        className="text-2xl font-bold"
                        style={{
                            color: '#4ade80',
                            textShadow: '0 0 10px rgba(74,222,128,0.3)'
                        }}
                    >
                        {formatCurrency(balance)}
                    </div>
                </div>

                {/* Slot Machine */}
                <div
                    className="p-5 rounded-[2rem] mb-4 w-full max-w-md relative z-10"
                    style={{
                        background: 'linear-gradient(180deg, #b8860b 0%, #8b6914 50%, #654b0f 100%)',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.5), inset 0 2px 0 rgba(255,255,255,0.2), inset 0 -2px 0 rgba(0,0,0,0.3)',
                        border: '3px solid #ffd700'
                    }}
                >
                    {/* Inner frame */}
                    <div
                        className="rounded-xl p-4 flex gap-3 justify-center"
                        style={{
                            background: 'linear-gradient(180deg, #0a0a0a 0%, #1a1a1a 100%)',
                            boxShadow: 'inset 0 4px 20px rgba(0,0,0,0.8), 0 -2px 0 rgba(255,215,0,0.3)'
                        }}
                    >
                        {reels.map((symbol, i) => (
                            <div
                                key={i}
                                className={`w-[70px] h-[90px] rounded-xl flex items-center justify-center text-5xl
                                ${spinningReels[i] ? 'animate-bounce' : 'pop-in'}
                            `}
                                style={{
                                    background: 'linear-gradient(180deg, #ffffff 0%, #f0f0f0 100%)',
                                    boxShadow: 'inset 0 4px 8px rgba(0,0,0,0.2), 0 4px 12px rgba(0,0,0,0.4)',
                                    animationDelay: `${i * 100}ms`
                                }}
                            >
                                {spinningReels[i] ? (
                                    <span className="animate-spin">🎲</span>
                                ) : symbol}
                            </div>
                        ))}
                    </div>

                    {/* "Start a new game" text */}
                    {!result && !spinning && (
                        <div className="text-center mt-3 text-sm text-gray-300 font-medium">
                            Start a new game
                        </div>
                    )}
                </div>

                {/* Result */}
                {result && (
                    <div className={`text-center mb-3 pop-in relative z-10 ${result.win > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        <div className="text-xl font-bold">{result.message}</div>
                        {result.win > 0 && (
                            <div
                                className="text-3xl font-bold animate-pulse"
                                style={{
                                    color: '#FFD700',
                                    textShadow: '0 0 20px rgba(255,215,0,0.5)'
                                }}
                            >
                                +${Math.floor(result.win)}
                            </div>
                        )}
                    </div>
                )}

                {/* Horizontal Wheel Picker for Bet */}
                <div className="w-full max-w-md mb-4 relative z-10">
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

                {/* Spin Button */}
                <button
                    onClick={spin}
                    disabled={spinning || balance < bet}
                    className={`px-12 py-4 rounded-2xl font-bold text-2xl transition-all w-full max-w-xs relative z-10
                    ${spinning || balance < bet ? 'opacity-60' : 'hover:scale-105 active:scale-95'}
                `}
                    style={{
                        background: spinning
                            ? 'linear-gradient(135deg, #4a4a4a 0%, #3a3a3a 100%)'
                            : balance < bet
                                ? 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)'
                                : 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                        color: spinning ? '#888' : '#000',
                        boxShadow: (!spinning && balance >= bet)
                            ? '0 4px 20px rgba(255,215,0,0.4), inset 0 2px 0 rgba(255,255,255,0.3)'
                            : '0 4px 12px rgba(0,0,0,0.3)',
                        border: '2px solid rgba(255,255,255,0.1)'
                    }}
                >
                    {spinning ? '🎲 SPINNING...' : balance < bet ? '💸 BROKE!' : `SPIN! ($${bet})`}
                </button>

                {/* Paytable */}
                <div className="mt-6 text-center text-xs relative z-10 w-full max-w-md">
                    <div className="font-bold mb-2 text-gray-400 uppercase tracking-wider">Payouts</div>
                    <div className="flex flex-wrap justify-center gap-2">
                        {Object.entries(WINNING_COMBOS).map(([symbol, mult]) => (
                            <span
                                key={symbol}
                                className="px-2 py-1 rounded-lg text-xs font-medium"
                                style={{
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    color: '#ccc'
                                }}
                            >
                                {symbol}x3 = {mult}x
                            </span>
                        ))}
                    </div>
                    <div className="mt-2 text-gray-500">Two of a kind = 1.5x</div>
                    <div className="mt-4 text-gray-600 text-[10px] uppercase tracking-widest">
                        Antigravity Games
                    </div>
                </div>

                {/* Stats Modal */}
                {showStats && (
                    <CasinoStatsModal onClose={() => setShowStats(false)} />
                )}
            </div>
        </>
    );
};

// Casino Stats Modal Component
const CasinoStatsModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const stats = CasinoService.getStats();
    const winRate = CasinoService.getWinRate();
    const roi = CasinoService.getROI();

    const statItems = [
        { label: 'Total Spins', value: stats.totalSpins, emoji: '🎰' },
        { label: 'Wins', value: stats.wins, emoji: '✅' },
        { label: 'Losses', value: stats.losses, emoji: '❌' },
        { label: 'Win Rate', value: `${winRate}%`, emoji: '📈' },
        { label: 'Jackpots', value: stats.jackpotWins, emoji: '🎉' },
        { label: '2 of a Kind', value: stats.twoOfAKindWins, emoji: '✨' },
        { label: 'Total Wagered', value: formatCurrency(stats.totalBetAmount), emoji: '💰' },
        { label: 'Total Won', value: formatCurrency(stats.totalWinnings), emoji: '💵' },
        { label: 'Net Profit', value: `${stats.netProfit >= 0 ? '+' : ''}${formatCurrency(stats.netProfit)}`, emoji: stats.netProfit >= 0 ? '📈' : '📉', color: stats.netProfit >= 0 ? '#4ade80' : '#f87171' },
        { label: 'ROI', value: `${roi >= 0 ? '+' : ''}${roi}%`, emoji: '💹', color: roi >= 0 ? '#4ade80' : '#f87171' },
        { label: 'Biggest Win', value: formatCurrency(stats.biggestWin), emoji: '🏆' },
        { label: 'Biggest Bet', value: formatCurrency(stats.biggestBet), emoji: '🎲' },
        { label: 'Win Streak', value: stats.longestWinStreak, emoji: '🔥' },
        { label: 'Lose Streak', value: stats.longestLoseStreak, emoji: '💀' },
    ];

    return (
        <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
            onClick={onClose}
        >
            <div
                className="w-full max-w-md rounded-3xl p-6 max-h-[85vh] overflow-y-auto"
                style={{
                    background: 'linear-gradient(180deg, #2a2a2a 0%, #1a1a1a 100%)',
                    border: '2px solid rgba(255,215,0,0.3)',
                    boxShadow: '0 0 40px rgba(255,215,0,0.2)'
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2
                        className="text-2xl font-black"
                        style={{
                            background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                        }}
                    >
                        📊 Casino Stats
                    </h2>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white hover:bg-white/10 transition-all text-xl"
                    >
                        ✕
                    </button>
                </div>

                {/* Current Streak */}
                <div
                    className="rounded-2xl p-4 mb-6 text-center"
                    style={{
                        background: stats.currentStreak >= 0
                            ? 'linear-gradient(135deg, rgba(74,222,128,0.2), rgba(34,197,94,0.1))'
                            : 'linear-gradient(135deg, rgba(248,113,113,0.2), rgba(239,68,68,0.1))',
                        border: `1px solid ${stats.currentStreak >= 0 ? 'rgba(74,222,128,0.3)' : 'rgba(248,113,113,0.3)'}`
                    }}
                >
                    <div className="text-sm text-gray-400 mb-1">Current Streak</div>
                    <div
                        className="text-3xl font-black"
                        style={{ color: stats.currentStreak >= 0 ? '#4ade80' : '#f87171' }}
                    >
                        {stats.currentStreak > 0 ? `🔥 ${stats.currentStreak} Wins` :
                            stats.currentStreak < 0 ? `💀 ${Math.abs(stats.currentStreak)} Losses` :
                                '➖ No Streak'}
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                    {statItems.map((item, i) => (
                        <div
                            key={i}
                            className="rounded-xl p-3 text-center"
                            style={{
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)'
                            }}
                        >
                            <div className="text-xl mb-1">{item.emoji}</div>
                            <div
                                className="text-lg font-bold"
                                style={{ color: item.color || '#fff' }}
                            >
                                {item.value}
                            </div>
                            <div className="text-xs text-gray-500">{item.label}</div>
                        </div>
                    ))}
                </div>

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="w-full mt-6 py-3 rounded-xl font-bold transition-all hover:scale-[1.02] active:scale-95"
                    style={{
                        background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                        color: '#000'
                    }}
                >
                    Close
                </button>
            </div>
        </div>
    );
};
