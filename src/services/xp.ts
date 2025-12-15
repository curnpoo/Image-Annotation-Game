// XP Service - Handles player experience points, leveling, and tier progression

const XP_KEY = 'player_xp';
const LEVEL_KEY = 'player_level';

// Level tier definitions with power bonuses
// Level tier definitions with power bonuses
export const LEVEL_TIERS = [
    { name: 'Bronze', minLevel: 0, color: '#CD7F32', icon: '🥉', xpBonus: 0.05, currencyBonus: 0.05, timeBonus: 0 },
    { name: 'Silver', minLevel: 10, color: '#C0C0C0', icon: '🥈', xpBonus: 0.15, currencyBonus: 0.25, timeBonus: 2 },
    { name: 'Gold', minLevel: 25, color: '#FFD700', icon: '🥇', xpBonus: 0.3, currencyBonus: 0.5, timeBonus: 4 },
    { name: 'Platinum', minLevel: 50, color: '#00CED1', icon: '💎', xpBonus: 0.5, currencyBonus: 1.0, timeBonus: 7 },
    { name: 'Diamond', minLevel: 100, color: '#9B59B6', icon: '💠', xpBonus: 1.0, currencyBonus: 2.5, timeBonus: 10 }
] as const;

export type LevelTier = typeof LEVEL_TIERS[number];

export const XPService = {
    // Get current total XP
    getXP(): number {
        const stored = localStorage.getItem(XP_KEY);
        return stored ? parseInt(stored, 10) : 0;
    },

    // Exponential XP formula: XP needed for a specific level = 100 + (level * 25)
    // Level 0: 100 XP, Level 10: 350 XP, Level 50: 1,350 XP, Level 100: 2,600 XP
    getXPForLevel(level: number): number {
        return 100 + (level * 25);
    },

    // Get total XP required to reach a specific level (sum of all previous levels)
    getTotalXPForLevel(level: number): number {
        let total = 0;
        for (let i = 0; i < level; i++) {
            total += this.getXPForLevel(i);
        }
        return total;
    },

    // Calculate level from a specific XP amount (static helper)
    getLevelFromXP(totalXP: number): number {
        let remainingXP = totalXP;
        let level = 0;
        while (remainingXP >= this.getXPForLevel(level)) {
            remainingXP -= this.getXPForLevel(level);
            level++;
        }
        return level;
    },

    // Get current level based on total XP (iterative calculation)
    getLevel(): number {
        return this.getLevelFromXP(this.getXP());
    },

    // Get XP progress within current level (0 to XP needed - 1)
    getLevelProgress(): number {
        let remainingXP = this.getXP();
        let level = 0;
        while (remainingXP >= this.getXPForLevel(level)) {
            remainingXP -= this.getXPForLevel(level);
            level++;
        }
        return remainingXP;
    },

    // Get XP needed for next level
    getXPForNextLevel(): number {
        return this.getXPForLevel(this.getLevel());
    },

    // Get level progress as percentage (0-100)
    getLevelProgressPercent(): number {
        const progress = this.getLevelProgress();
        const needed = this.getXPForNextLevel();
        return Math.floor((progress / needed) * 100);
    },

    // Get current tier based on level
    getTier(): LevelTier {
        return this.getTierForLevel(this.getLevel());
    },

    // Get tier for a specific level (static helper)
    getTierForLevel(level: number): LevelTier {
        // Find the highest tier the player qualifies for
        for (let i = LEVEL_TIERS.length - 1; i >= 0; i--) {
            if (level >= LEVEL_TIERS[i].minLevel) {
                return LEVEL_TIERS[i];
            }
        }
        return LEVEL_TIERS[0];
    },

    // Apply XP bonus based on tier (returns boosted amount)
    applyXPBonus(baseXP: number): number {
        const tier = this.getTier();
        return Math.floor(baseXP * (1 + tier.xpBonus));
    },

    // Apply currency bonus based on tier (returns boosted amount)
    applyCurrencyBonus(baseCurrency: number): number {
        const tier = this.getTier();
        return Math.floor(baseCurrency * (1 + tier.currencyBonus));
    },

    // Get time bonus in seconds for current tier
    getTimeBonus(): number {
        return this.getTier().timeBonus;
    },

    // Add XP and handle level ups (applies tier bonus automatically)
    addXP(amount: number, applyBonus: boolean = true): { newXP: number; newLevel: number; leveledUp: boolean; bonusApplied: number } {
        const oldLevel = this.getLevel();
        const oldXP = this.getXP();

        // Apply tier bonus if enabled
        const bonusApplied = applyBonus ? this.applyXPBonus(amount) - amount : 0;
        const finalAmount = applyBonus ? this.applyXPBonus(amount) : amount;
        const newXP = oldXP + finalAmount;

        localStorage.setItem(XP_KEY, newXP.toString());

        const newLevel = this.getLevel();
        const leveledUp = newLevel > oldLevel;

        if (leveledUp) {
            localStorage.setItem(LEVEL_KEY, newLevel.toString());
        }

        return { newXP, newLevel, leveledUp, bonusApplied };
    },

    // XP rewards for different actions (base values before tier bonus)
    rewards: {
        WIN_ROUND: 50,      // Win a voting round
        COMPLETE_GAME: 100, // Finish a complete game
        CORRECT_VOTE: 15,   // Vote for the winner
        PARTICIPATE: 10,     // Just participate in a round
        DAILY_LOGIN: 50,     // First login of the day 
        DAILY_CHALLENGE: 200 // Complete a daily challenge
    }
};
