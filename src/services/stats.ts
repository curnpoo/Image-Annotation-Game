// Stats Service - Track and persist player statistics
import { AuthService } from './auth';
import type { PlayerStats } from '../types';

const LOCAL_STATS_KEY = 'player_stats';

// Default stats
const defaultStats: PlayerStats = {
    gamesPlayed: 0,
    gamesWon: 0,
    roundsWon: 0,
    roundsLost: 0,
    timesSabotaged: 0,
    timesSaboteur: 0,
    totalCurrencyEarned: 0,
    totalXPEarned: 0,
    highestLevel: 0
};

export const StatsService = {
    // Get current stats (from logged in user or local storage)
    getStats(): PlayerStats {
        const user = AuthService.getCurrentUser();
        if (user) {
            return user.stats;
        }

        // Fallback to local storage for guests
        const stored = localStorage.getItem(LOCAL_STATS_KEY);
        return stored ? JSON.parse(stored) : { ...defaultStats };
    },

    // Increment a specific stat
    async incrementStat(stat: keyof PlayerStats, amount: number = 1): Promise<void> {
        const user = AuthService.getCurrentUser();

        if (user) {
            // Update Firebase user
            const newStats = { ...user.stats };
            newStats[stat] = (newStats[stat] || 0) + amount;
            await AuthService.updateUser(user.id, { stats: newStats });
        } else {
            // Update local storage for guests
            const stats = this.getStats();
            stats[stat] = (stats[stat] || 0) + amount;
            localStorage.setItem(LOCAL_STATS_KEY, JSON.stringify(stats));
        }
    },

    // Record a completed game
    async recordGame(won: boolean, roundsWon: number, roundsLost: number): Promise<void> {
        await this.incrementStat('gamesPlayed', 1);
        if (won) {
            await this.incrementStat('gamesWon', 1);
        }
        await this.incrementStat('roundsWon', roundsWon);
        await this.incrementStat('roundsLost', roundsLost);
    },

    // Record sabotage events
    async recordSabotaged(): Promise<void> {
        await this.incrementStat('timesSabotaged', 1);
    },

    async recordWasSaboteur(): Promise<void> {
        await this.incrementStat('timesSaboteur', 1);
    },

    // Record currency earned
    async recordCurrencyEarned(amount: number): Promise<void> {
        await this.incrementStat('totalCurrencyEarned', amount);
    },

    // Record XP earned
    async recordXPEarned(amount: number): Promise<void> {
        await this.incrementStat('totalXPEarned', amount);
    },

    // Update highest level
    async updateHighestLevel(level: number): Promise<void> {
        const stats = this.getStats();
        if (level > stats.highestLevel) {
            const user = AuthService.getCurrentUser();
            if (user) {
                const newStats = { ...user.stats, highestLevel: level };
                await AuthService.updateUser(user.id, { stats: newStats });
            } else {
                stats.highestLevel = level;
                localStorage.setItem(LOCAL_STATS_KEY, JSON.stringify(stats));
            }
        }
    },

    // Reset guest stats
    resetGuestStats(): void {
        localStorage.removeItem(LOCAL_STATS_KEY);
    }
};
