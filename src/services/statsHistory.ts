// Stats History Service - Track stats snapshots over time for graphing
import type { StatsHistoryEntry } from '../types';
import { StatsService } from './stats';
import { XPService } from './xp';
import { CurrencyService } from './currency';

const STATS_HISTORY_KEY = 'player_stats_history';
const MAX_HISTORY_ENTRIES = 50; // Keep last 50 snapshots

export const StatsHistoryService = {
    // Get all history entries
    getHistory(): StatsHistoryEntry[] {
        const stored = localStorage.getItem(STATS_HISTORY_KEY);
        return stored ? JSON.parse(stored) : [];
    },

    // Save a new snapshot of current stats
    recordSnapshot(): void {
        const stats = StatsService.getStats();
        const level = XPService.getLevel();
        const currency = CurrencyService.getCurrency();

        const entry: StatsHistoryEntry = {
            timestamp: Date.now(),
            gamesPlayed: stats.gamesPlayed,
            gamesWon: stats.gamesWon,
            roundsWon: stats.roundsWon,
            roundsLost: stats.roundsLost,
            totalCurrencyEarned: stats.totalCurrencyEarned,
            totalXPEarned: stats.totalXPEarned,
            level,
            currency
        };

        const history = this.getHistory();

        // Only add if stats actually changed (or if this is the first entry)
        const lastEntry = history[history.length - 1];
        if (!lastEntry ||
            lastEntry.gamesPlayed !== entry.gamesPlayed ||
            lastEntry.roundsWon !== entry.roundsWon ||
            lastEntry.totalCurrencyEarned !== entry.totalCurrencyEarned ||
            lastEntry.totalXPEarned !== entry.totalXPEarned) {

            history.push(entry);

            // Keep only last N entries
            while (history.length > MAX_HISTORY_ENTRIES) {
                history.shift();
            }

            localStorage.setItem(STATS_HISTORY_KEY, JSON.stringify(history));
        }
    },

    // Get computed analytics
    getAnalytics() {
        const stats = StatsService.getStats();
        const history = this.getHistory();

        // Win rates
        const gameWinRate = stats.gamesPlayed > 0
            ? (stats.gamesWon / stats.gamesPlayed * 100).toFixed(1)
            : '0.0';
        const roundWinRate = (stats.roundsWon + stats.roundsLost) > 0
            ? (stats.roundsWon / (stats.roundsWon + stats.roundsLost) * 100).toFixed(1)
            : '0.0';

        // Averages per game
        const avgRoundsWonPerGame = stats.gamesPlayed > 0
            ? (stats.roundsWon / stats.gamesPlayed).toFixed(1)
            : '0.0';
        const avgCurrencyPerGame = stats.gamesPlayed > 0
            ? Math.round(stats.totalCurrencyEarned / stats.gamesPlayed)
            : 0;
        const avgXPPerGame = stats.gamesPlayed > 0
            ? Math.round(stats.totalXPEarned / stats.gamesPlayed)
            : 0;

        // Casino stats
        const casino = stats.casinoStats;
        const casinoWinRate = casino && casino.totalSpins > 0
            ? ((casino.wins / casino.totalSpins) * 100).toFixed(1)
            : null;
        const casinoNetProfit = casino?.netProfit || 0;

        // Trends from history (last 7 entries vs previous 7)
        const recentGames = history.slice(-7);
        const olderGames = history.slice(-14, -7);

        let trendGamesPlayed = 0;
        let trendWinRate = 0;

        if (recentGames.length > 0 && olderGames.length > 0) {
            const recentGamesCount = recentGames[recentGames.length - 1].gamesPlayed - recentGames[0].gamesPlayed;
            const olderGamesCount = olderGames[olderGames.length - 1].gamesPlayed - olderGames[0].gamesPlayed;
            trendGamesPlayed = recentGamesCount - olderGamesCount;

            const recentWins = recentGames[recentGames.length - 1].gamesWon - recentGames[0].gamesWon;
            const olderWins = olderGames[olderGames.length - 1].gamesWon - olderGames[0].gamesWon;
            const recentRate = recentGamesCount > 0 ? recentWins / recentGamesCount : 0;
            const olderRate = olderGamesCount > 0 ? olderWins / olderGamesCount : 0;
            trendWinRate = (recentRate - olderRate) * 100;
        }

        return {
            gameWinRate,
            roundWinRate,
            avgRoundsWonPerGame,
            avgCurrencyPerGame,
            avgXPPerGame,
            casinoWinRate,
            casinoNetProfit,
            trendGamesPlayed,
            trendWinRate,
            totalRounds: stats.roundsWon + stats.roundsLost,
            sabotageRatio: (stats.timesSabotaged + stats.timesSaboteur) > 0
                ? (stats.timesSaboteur / (stats.timesSabotaged + stats.timesSaboteur) * 100).toFixed(0)
                : null
        };
    },

    // Clear history (for account reset)
    clearHistory(): void {
        localStorage.removeItem(STATS_HISTORY_KEY);
    }
};
