import React, { useState, useMemo } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import type { PlayerStats } from '../../types';
import { StatsService } from '../../services/stats';
import { StatsHistoryService } from '../../services/statsHistory';
import { XPService } from '../../services/xp';
import { CurrencyService, formatCurrency } from '../../services/currency';

interface StatsScreenProps {
    onBack: () => void;
}

// Color palette for charts
const COLORS = {
    primary: '#8B5CF6',
    secondary: '#06B6D4',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    purple: '#A855F7',
    pink: '#EC4899',
    blue: '#3B82F6'
};

export const StatsScreen: React.FC<StatsScreenProps> = ({ onBack }) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'games' | 'casino' | 'trends'>('overview');

    const stats: PlayerStats = StatsService.getStats();
    const history = StatsHistoryService.getHistory();
    const analytics = StatsHistoryService.getAnalytics();
    const level = XPService.getLevel();
    const currency = CurrencyService.getCurrency();

    // Prepare chart data
    const chartData = useMemo(() => {
        // Format history for charts with relative timestamps
        const formattedHistory = history.map((entry, i) => ({
            ...entry,
            name: `Game ${i + 1}`,
            date: new Date(entry.timestamp).toLocaleDateString(),
            winRate: entry.gamesPlayed > 0 ? Math.round((entry.gamesWon / entry.gamesPlayed) * 100) : 0
        }));

        // Pie chart data for win/loss
        const winLossPie = [
            { name: 'Rounds Won', value: stats.roundsWon, color: COLORS.success },
            { name: 'Rounds Lost', value: stats.roundsLost, color: COLORS.danger }
        ];

        // Sabotage data
        const sabotagePie = [
            { name: 'Times Saboteur', value: stats.timesSaboteur, color: COLORS.purple },
            { name: 'Times Sabotaged', value: stats.timesSabotaged, color: COLORS.warning }
        ];

        // Game outcomes
        const gamesPie = [
            { name: 'Games Won', value: stats.gamesWon, color: '#FFD700' },
            { name: 'Games Lost', value: stats.gamesPlayed - stats.gamesWon, color: COLORS.secondary }
        ];

        return { formattedHistory, winLossPie, sabotagePie, gamesPie };
    }, [history, stats]);

    const tabs = [
        { id: 'overview', label: 'Overview', emoji: '📊' },
        { id: 'games', label: 'Games', emoji: '🎮' },
        { id: 'casino', label: 'Casino', emoji: '🎰' },
        { id: 'trends', label: 'Trends', emoji: '📈' }
    ];

    const renderStatCard = (
        emoji: string,
        label: string,
        value: string | number,
        subtext?: string,
        highlight?: boolean
    ) => (
        <div
            className={`rounded-2xl p-4 transition-all ${highlight ? 'ring-2 ring-[var(--theme-accent)]' : ''}`}
            style={{
                backgroundColor: 'var(--theme-bg-secondary)',
                border: '1px solid var(--theme-border)'
            }}
        >
            <div className="text-2xl mb-1">{emoji}</div>
            <div className="text-2xl font-black" style={{ color: 'var(--theme-text)' }}>{value}</div>
            <div className="text-xs font-medium" style={{ color: 'var(--theme-text-secondary)' }}>{label}</div>
            {subtext && (
                <div className="text-xs mt-1 font-bold" style={{ color: 'var(--theme-accent)' }}>{subtext}</div>
            )}
        </div>
    );

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="rounded-xl p-3 shadow-lg" style={{
                    backgroundColor: 'var(--theme-card-bg)',
                    border: '1px solid var(--theme-border)'
                }}>
                    <p className="text-sm font-bold" style={{ color: 'var(--theme-text)' }}>{label}</p>
                    {payload.map((entry: any, i: number) => (
                        <p key={i} className="text-xs" style={{ color: entry.color }}>
                            {entry.name}: {entry.value}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div
            className="min-h-screen flex flex-col"
            style={{
                paddingTop: 'max(1rem, env(safe-area-inset-top))',
                paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
                backgroundColor: 'var(--theme-bg-primary)'
            }}
        >
            {/* Header */}
            <div className="px-4 mb-4">
                <button
                    onClick={onBack}
                    className="w-full rounded-2xl p-4 flex items-center gap-4 hover:brightness-110 active:scale-[0.98] transition-all shadow-lg"
                    style={{
                        backgroundColor: 'var(--theme-card-bg)',
                        border: '2px solid var(--theme-border)'
                    }}
                >
                    <div className="text-2xl">←</div>
                    <div className="flex-1 text-left">
                        <div className="text-lg font-bold" style={{ color: 'var(--theme-text)' }}>
                            📊 Statistics
                        </div>
                        <div className="text-sm" style={{ color: 'var(--theme-text-secondary)' }}>
                            Deep dive into your performance
                        </div>
                    </div>
                </button>
            </div>

            {/* Quick Stats Banner */}
            <div className="px-4 mb-4">
                <div
                    className="rounded-2xl p-4 shadow-lg"
                    style={{
                        background: 'linear-gradient(135deg, var(--theme-accent) 0%, #8B5CF6 100%)'
                    }}
                >
                    <div className="flex justify-around text-white text-center">
                        <div>
                            <div className="text-3xl font-black">LVL {level}</div>
                            <div className="text-xs opacity-80">Level</div>
                        </div>
                        <div className="w-px bg-white/30" />
                        <div>
                            <div className="text-3xl font-black">{formatCurrency(currency)}</div>
                            <div className="text-xs opacity-80">Balance</div>
                        </div>
                        <div className="w-px bg-white/30" />
                        <div>
                            <div className="text-3xl font-black">{analytics.gameWinRate}%</div>
                            <div className="text-xs opacity-80">Win Rate</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 px-4 mb-4 overflow-x-auto no-scrollbar">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`px-4 py-2 rounded-xl font-bold whitespace-nowrap transition-all ${activeTab === tab.id ? 'shadow-lg scale-105' : ''
                            }`}
                        style={{
                            backgroundColor: activeTab === tab.id ? 'var(--theme-accent)' : 'var(--theme-bg-secondary)',
                            color: activeTab === tab.id ? 'white' : 'var(--theme-text)',
                            border: `2px solid ${activeTab === tab.id ? 'var(--theme-accent)' : 'var(--theme-border)'}`
                        }}
                    >
                        {tab.emoji} {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto px-4 pb-8">
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                    <div className="space-y-4">
                        {/* Primary Stats Grid */}
                        <div className="grid grid-cols-3 gap-3">
                            {renderStatCard('🎮', 'Games Played', stats.gamesPlayed)}
                            {renderStatCard('🏆', 'Games Won', stats.gamesWon, `${analytics.gameWinRate}% rate`)}
                            {renderStatCard('📈', 'Highest Level', stats.highestLevel)}
                        </div>

                        {/* Win/Loss Pie Chart */}
                        <div
                            className="rounded-2xl p-4"
                            style={{
                                backgroundColor: 'var(--theme-card-bg)',
                                border: '1px solid var(--theme-border)'
                            }}
                        >
                            <h3 className="text-lg font-bold mb-4 text-center" style={{ color: 'var(--theme-text)' }}>
                                Round Performance
                            </h3>
                            <div className="h-48">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={chartData.winLossPie}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={40}
                                            outerRadius={70}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {chartData.winLossPie.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<CustomTooltip />} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="flex justify-center gap-6 mt-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.success }} />
                                    <span className="text-sm font-medium" style={{ color: 'var(--theme-text)' }}>
                                        Won: {stats.roundsWon}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.danger }} />
                                    <span className="text-sm font-medium" style={{ color: 'var(--theme-text)' }}>
                                        Lost: {stats.roundsLost}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Secondary Stats */}
                        <div className="grid grid-cols-2 gap-3">
                            {renderStatCard('✨', 'Total XP', stats.totalXPEarned.toLocaleString())}
                            {renderStatCard('💰', 'Total $ Earned', formatCurrency(stats.totalCurrencyEarned))}
                            {renderStatCard('💥', 'Times Sabotaged', stats.timesSabotaged)}
                            {renderStatCard('🎭', 'Times Saboteur', stats.timesSaboteur)}
                        </div>
                    </div>
                )}

                {/* Games Tab */}
                {activeTab === 'games' && (
                    <div className="space-y-4">
                        {/* Games Won Pie */}
                        <div
                            className="rounded-2xl p-4"
                            style={{
                                backgroundColor: 'var(--theme-card-bg)',
                                border: '1px solid var(--theme-border)'
                            }}
                        >
                            <h3 className="text-lg font-bold mb-4 text-center" style={{ color: 'var(--theme-text)' }}>
                                🏆 Game Outcomes
                            </h3>
                            <div className="h-48">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={chartData.gamesPie}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={40}
                                            outerRadius={70}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {chartData.gamesPie.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<CustomTooltip />} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="text-center mt-2">
                                <span className="text-2xl font-black" style={{ color: 'var(--theme-accent)' }}>
                                    {analytics.gameWinRate}%
                                </span>
                                <span className="text-sm ml-2" style={{ color: 'var(--theme-text-secondary)' }}>
                                    Win Rate
                                </span>
                            </div>
                        </div>

                        {/* Game Analytics */}
                        <div
                            className="rounded-2xl p-4"
                            style={{
                                backgroundColor: 'var(--theme-card-bg)',
                                border: '1px solid var(--theme-border)'
                            }}
                        >
                            <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--theme-text)' }}>
                                📈 Per-Game Averages
                            </h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center p-3 rounded-xl" style={{ backgroundColor: 'var(--theme-bg-secondary)' }}>
                                    <span style={{ color: 'var(--theme-text-secondary)' }}>Avg Rounds Won</span>
                                    <span className="font-bold" style={{ color: 'var(--theme-text)' }}>{analytics.avgRoundsWonPerGame}</span>
                                </div>
                                <div className="flex justify-between items-center p-3 rounded-xl" style={{ backgroundColor: 'var(--theme-bg-secondary)' }}>
                                    <span style={{ color: 'var(--theme-text-secondary)' }}>Avg $ Per Game</span>
                                    <span className="font-bold text-green-500">{formatCurrency(analytics.avgCurrencyPerGame)}</span>
                                </div>
                                <div className="flex justify-between items-center p-3 rounded-xl" style={{ backgroundColor: 'var(--theme-bg-secondary)' }}>
                                    <span style={{ color: 'var(--theme-text-secondary)' }}>Avg XP Per Game</span>
                                    <span className="font-bold text-purple-500">{analytics.avgXPPerGame}</span>
                                </div>
                                <div className="flex justify-between items-center p-3 rounded-xl" style={{ backgroundColor: 'var(--theme-bg-secondary)' }}>
                                    <span style={{ color: 'var(--theme-text-secondary)' }}>Round Win Rate</span>
                                    <span className="font-bold" style={{ color: 'var(--theme-accent)' }}>{analytics.roundWinRate}%</span>
                                </div>
                            </div>
                        </div>

                        {/* Sabotage Stats */}
                        {(stats.timesSabotaged > 0 || stats.timesSaboteur > 0) && (
                            <div
                                className="rounded-2xl p-4"
                                style={{
                                    backgroundColor: 'var(--theme-card-bg)',
                                    border: '1px solid var(--theme-border)'
                                }}
                            >
                                <h3 className="text-lg font-bold mb-4 text-center" style={{ color: 'var(--theme-text)' }}>
                                    😈 Sabotage Stats
                                </h3>
                                <div className="h-40">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={chartData.sabotagePie} layout="vertical">
                                            <XAxis type="number" hide />
                                            <YAxis type="category" dataKey="name" hide />
                                            <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                                                {chartData.sabotagePie.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Bar>
                                            <Tooltip content={<CustomTooltip />} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="flex justify-center gap-6 mt-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.purple }} />
                                        <span className="text-sm font-medium" style={{ color: 'var(--theme-text)' }}>
                                            Saboteur: {stats.timesSaboteur}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.warning }} />
                                        <span className="text-sm font-medium" style={{ color: 'var(--theme-text)' }}>
                                            Sabotaged: {stats.timesSabotaged}
                                        </span>
                                    </div>
                                </div>
                                {analytics.sabotageRatio && (
                                    <div className="text-center mt-3">
                                        <span className="text-sm" style={{ color: 'var(--theme-text-secondary)' }}>
                                            You're the saboteur {analytics.sabotageRatio}% of the time
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Casino Tab */}
                {activeTab === 'casino' && (
                    <div className="space-y-4">
                        {stats.casinoStats ? (
                            <>
                                {/* Casino Overview */}
                                <div className="grid grid-cols-2 gap-3">
                                    {renderStatCard('🎰', 'Total Spins', stats.casinoStats.totalSpins)}
                                    {renderStatCard(
                                        stats.casinoStats.netProfit >= 0 ? '📈' : '📉',
                                        'Net Profit',
                                        formatCurrency(stats.casinoStats.netProfit),
                                        undefined,
                                        stats.casinoStats.netProfit > 0
                                    )}
                                </div>

                                {/* Win/Loss Ratio */}
                                <div
                                    className="rounded-2xl p-4"
                                    style={{
                                        backgroundColor: 'var(--theme-card-bg)',
                                        border: '1px solid var(--theme-border)'
                                    }}
                                >
                                    <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--theme-text)' }}>
                                        🎲 Win/Loss Breakdown
                                    </h3>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm" style={{ color: 'var(--theme-text-secondary)' }}>Wins</span>
                                            <span className="font-bold text-green-500">{stats.casinoStats.wins}</span>
                                        </div>
                                        <div className="h-3 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--theme-bg-secondary)' }}>
                                            <div
                                                className="h-full rounded-full"
                                                style={{
                                                    backgroundColor: COLORS.success,
                                                    width: `${analytics.casinoWinRate || 0}%`
                                                }}
                                            />
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm" style={{ color: 'var(--theme-text-secondary)' }}>Losses</span>
                                            <span className="font-bold text-red-500">{stats.casinoStats.losses}</span>
                                        </div>
                                    </div>
                                    <div className="text-center mt-4">
                                        <span className="text-2xl font-black" style={{ color: 'var(--theme-accent)' }}>
                                            {analytics.casinoWinRate}%
                                        </span>
                                        <span className="text-sm ml-2" style={{ color: 'var(--theme-text-secondary)' }}>
                                            Win Rate
                                        </span>
                                    </div>
                                </div>

                                {/* Casino Details */}
                                <div className="grid grid-cols-2 gap-3">
                                    {renderStatCard('🎯', 'Jackpots', stats.casinoStats.jackpotWins)}
                                    {renderStatCard('✌️', '2-of-a-Kind', stats.casinoStats.twoOfAKindWins)}
                                    {renderStatCard('💵', 'Total Wagered', formatCurrency(stats.casinoStats.totalBetAmount))}
                                    {renderStatCard('💰', 'Total Winnings', formatCurrency(stats.casinoStats.totalWinnings))}
                                    {renderStatCard('🔥', 'Best Win Streak', stats.casinoStats.longestWinStreak)}
                                    {renderStatCard('❄️', 'Worst Lose Streak', stats.casinoStats.longestLoseStreak)}
                                    {renderStatCard('🎉', 'Biggest Win', formatCurrency(stats.casinoStats.biggestWin))}
                                    {renderStatCard('😬', 'Biggest Bet', formatCurrency(stats.casinoStats.biggestBet))}
                                </div>
                            </>
                        ) : (
                            <div
                                className="rounded-2xl p-8 text-center"
                                style={{
                                    backgroundColor: 'var(--theme-card-bg)',
                                    border: '1px solid var(--theme-border)'
                                }}
                            >
                                <div className="text-6xl mb-4">🎰</div>
                                <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--theme-text)' }}>
                                    No Casino Stats Yet
                                </h3>
                                <p style={{ color: 'var(--theme-text-secondary)' }}>
                                    Visit the casino to start tracking your gambling adventures!
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Trends Tab */}
                {activeTab === 'trends' && (
                    <div className="space-y-4">
                        {history.length > 1 ? (
                            <>
                                {/* XP Over Time */}
                                <div
                                    className="rounded-2xl p-4"
                                    style={{
                                        backgroundColor: 'var(--theme-card-bg)',
                                        border: '1px solid var(--theme-border)'
                                    }}
                                >
                                    <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--theme-text)' }}>
                                        ✨ XP Progress
                                    </h3>
                                    <div className="h-48">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={chartData.formattedHistory}>
                                                <defs>
                                                    <linearGradient id="xpGradient" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor={COLORS.purple} stopOpacity={0.8} />
                                                        <stop offset="95%" stopColor={COLORS.purple} stopOpacity={0.1} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="var(--theme-border)" />
                                                <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--theme-text-secondary)' }} />
                                                <YAxis tick={{ fontSize: 10, fill: 'var(--theme-text-secondary)' }} />
                                                <Tooltip content={<CustomTooltip />} />
                                                <Area
                                                    type="monotone"
                                                    dataKey="totalXPEarned"
                                                    stroke={COLORS.purple}
                                                    fill="url(#xpGradient)"
                                                    name="Total XP"
                                                />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Currency Over Time */}
                                <div
                                    className="rounded-2xl p-4"
                                    style={{
                                        backgroundColor: 'var(--theme-card-bg)',
                                        border: '1px solid var(--theme-border)'
                                    }}
                                >
                                    <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--theme-text)' }}>
                                        💰 Currency Earned Over Time
                                    </h3>
                                    <div className="h-48">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={chartData.formattedHistory}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="var(--theme-border)" />
                                                <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--theme-text-secondary)' }} />
                                                <YAxis tick={{ fontSize: 10, fill: 'var(--theme-text-secondary)' }} />
                                                <Tooltip content={<CustomTooltip />} />
                                                <Line
                                                    type="monotone"
                                                    dataKey="totalCurrencyEarned"
                                                    stroke={COLORS.success}
                                                    strokeWidth={2}
                                                    dot={{ fill: COLORS.success, strokeWidth: 2 }}
                                                    name="Total $ Earned"
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Win Rate Over Time */}
                                <div
                                    className="rounded-2xl p-4"
                                    style={{
                                        backgroundColor: 'var(--theme-card-bg)',
                                        border: '1px solid var(--theme-border)'
                                    }}
                                >
                                    <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--theme-text)' }}>
                                        📊 Win Rate Trend
                                    </h3>
                                    <div className="h-48">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={chartData.formattedHistory}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="var(--theme-border)" />
                                                <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--theme-text-secondary)' }} />
                                                <YAxis tick={{ fontSize: 10, fill: 'var(--theme-text-secondary)' }} domain={[0, 100]} />
                                                <Tooltip content={<CustomTooltip />} />
                                                <Line
                                                    type="monotone"
                                                    dataKey="winRate"
                                                    stroke={COLORS.blue}
                                                    strokeWidth={2}
                                                    dot={{ fill: COLORS.blue, strokeWidth: 2 }}
                                                    name="Win Rate %"
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Level Progress */}
                                <div
                                    className="rounded-2xl p-4"
                                    style={{
                                        backgroundColor: 'var(--theme-card-bg)',
                                        border: '1px solid var(--theme-border)'
                                    }}
                                >
                                    <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--theme-text)' }}>
                                        🎯 Level Progress
                                    </h3>
                                    <div className="h-48">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={chartData.formattedHistory}>
                                                <defs>
                                                    <linearGradient id="levelGradient" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor={COLORS.warning} stopOpacity={0.8} />
                                                        <stop offset="95%" stopColor={COLORS.warning} stopOpacity={0.1} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="var(--theme-border)" />
                                                <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--theme-text-secondary)' }} />
                                                <YAxis tick={{ fontSize: 10, fill: 'var(--theme-text-secondary)' }} />
                                                <Tooltip content={<CustomTooltip />} />
                                                <Area
                                                    type="stepAfter"
                                                    dataKey="level"
                                                    stroke={COLORS.warning}
                                                    fill="url(#levelGradient)"
                                                    name="Level"
                                                />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div
                                className="rounded-2xl p-8 text-center"
                                style={{
                                    backgroundColor: 'var(--theme-card-bg)',
                                    border: '1px solid var(--theme-border)'
                                }}
                            >
                                <div className="text-6xl mb-4">📈</div>
                                <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--theme-text)' }}>
                                    Not Enough Data Yet
                                </h3>
                                <p style={{ color: 'var(--theme-text-secondary)' }}>
                                    Play more games to see your progress over time!
                                </p>
                                <p className="text-sm mt-2" style={{ color: 'var(--theme-text-secondary)' }}>
                                    {history.length} of 2 snapshots needed
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
