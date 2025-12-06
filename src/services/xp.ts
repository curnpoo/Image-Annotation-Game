// XP Service - Handles player experience points and leveling

const XP_KEY = 'player_xp';
const LEVEL_KEY = 'player_level';

// XP required per level (100 XP per level)
const XP_PER_LEVEL = 100;

export const XPService = {
    // Get current XP
    getXP(): number {
        const stored = localStorage.getItem(XP_KEY);
        return stored ? parseInt(stored, 10) : 0;
    },

    // Get current level (calculated from XP)
    getLevel(): number {
        return Math.floor(this.getXP() / XP_PER_LEVEL);
    },

    // Get XP progress within current level (0-99)
    getLevelProgress(): number {
        return this.getXP() % XP_PER_LEVEL;
    },

    // Add XP and handle level ups
    addXP(amount: number): { newXP: number; newLevel: number; leveledUp: boolean } {
        const oldLevel = this.getLevel();
        const oldXP = this.getXP();
        const newXP = oldXP + amount;

        localStorage.setItem(XP_KEY, newXP.toString());

        const newLevel = Math.floor(newXP / XP_PER_LEVEL);
        const leveledUp = newLevel > oldLevel;

        if (leveledUp) {
            localStorage.setItem(LEVEL_KEY, newLevel.toString());
        }

        return { newXP, newLevel, leveledUp };
    },

    // XP rewards for different actions
    rewards: {
        WIN_ROUND: 25,      // Win a voting round
        COMPLETE_GAME: 50,  // Finish a complete game
        CORRECT_VOTE: 10,   // Vote for the winner
        PARTICIPATE: 5,     // Just participate in a round
        DAILY_LOGIN: 20     // First login of the day (future feature)
    }
};
