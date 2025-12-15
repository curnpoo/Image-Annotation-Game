import { AuthService } from './auth';
import type { Challenge, PlayerChallengeState, ChallengeAction } from '../types';
import { CurrencyService } from './currency';
import { XPService } from './xp';
import type { UserAccount } from '../types';

const CHALLENGE_POOL: Omit<Challenge, 'id' | 'type'>[] = [
    {
        action: 'play_game',
        target: 3,
        reward: { currency: 150, xp: 50 },
        description: 'Play 3 Games',
        icon: '🎮'
    },
    {
        action: 'win_round',
        target: 1,
        reward: { currency: 100, xp: 100 },
        description: 'Win a Round',
        icon: '🏆'
    },
    {
        action: 'vote_correctly',
        target: 5,
        reward: { currency: 75, xp: 25 },
        description: 'Vote Correctly 5 Times',
        icon: '✅'
    },
    {
        action: 'earn_currency',
        target: 500,
        reward: { currency: 100, xp: 50 },
        description: 'Earn $500',
        icon: '💰'
    },
    {
        action: 'sabotage',
        target: 1,
        reward: { currency: 200, xp: 75 },
        description: 'Sabotage a Player',
        icon: '😈'
    }
];

export const ChallengeService = {
    // Get active challenges for current user, generating new ones if needed
    getChallenges(): PlayerChallengeState[] {
        const user = AuthService.getCurrentUser();
        if (!user) return [];

        const now = Date.now();
        const storedChallenges = user.challenges || [];
        
        // Remove expired challenges
        const activeChallenges = storedChallenges.filter(c => c.expiresAt > now);

        // If we have enough active daily challenges (e.g., 3), return them
        if (activeChallenges.length >= 3) {
            return activeChallenges;
        }

        // Otherwise generate new ones
        const newChallenges = this.generateDailyChallenges(3 - activeChallenges.length);
        const updatedList = [...activeChallenges, ...newChallenges];
        
        // Save to user
        AuthService.updateUser(user.id, { challenges: updatedList });
        
        return updatedList;
    },

    generateDailyChallenges(count: number): PlayerChallengeState[] {
        const newChallenges: PlayerChallengeState[] = [];
        const now = Date.now();
        // Expires at midnight + 24h (roughly next day) or just 24h from now for simplicity
        const expiresAt = now + 24 * 60 * 60 * 1000;

        for (let i = 0; i < count; i++) {
            const template = CHALLENGE_POOL[Math.floor(Math.random() * CHALLENGE_POOL.length)];
            // Create a unique ID combining action and timestamp to avoid collisions
            const id = `${template.action}_${now}_${i}`;
            
            newChallenges.push({
                challengeId: id, // We'll map this back to template dynamically or store template data. 
                // To keep it simple, we'll store specific ID format or just use the template action as key if unique per day.
                // Better approach: Store definitions locally and reference by index or fixed ID.
                // Let's refactor to use fixed IDs for templates:
                // Actually, let's just store the definition in "challengeId" for now via a lookup or just encode it.
                // Simpler: Just map index of pool.
                progress: 0,
                completed: false,
                claimed: false,
                assignedAt: now,
                expiresAt: expiresAt
            });
        }
        return newChallenges;
    },

    // Helper to get definition from state
    getChallengeDefinition(state: PlayerChallengeState): Challenge | undefined {
        // This is a hacky way to map back since we didn't add IDs to the pool.
        // Let's rely on the action string encoded in the ID or just matching content.
        // REAL IMPLEMENTATION: The pool should have stable IDs.
        // Let's fix this by finding a matching template based on the ID prefix we set.
        const action = state.challengeId.split('_')[0] + (state.challengeId.split('_').length > 3 ? '_' + state.challengeId.split('_')[1] : ''); 
        
        // Try to find by action matching corresponding pool item
        // This logic is fragile. Let's make the pool items have IDs.
        return this.getChallengeFromId(state.challengeId);
    },

    getChallengeFromId(instanceId: string): Challenge | undefined {
        // Extract the action key from the instance ID (e.g. "play_game_12345_0")
        const parts = instanceId.split('_');
        // Reassemble action (might contain underscores like vote_correctly)
        // We know timestamp starts with numbers.
        let action = parts[0];
        if (parts.length > 2 && isNaN(Number(parts[1]))) {
             action += '_' + parts[1];
        }

        const template = CHALLENGE_POOL.find(c => c.action === action);
        if (!template) return undefined;

        return {
            ...template,
            id: instanceId, // Use the instance ID for the runtime object
            type: 'daily'
        };
    },

    // Update progress
    updateProgress(action: ChallengeAction, amount: number = 1) {
        const user = AuthService.getCurrentUser();
        if (!user || !user.challenges) return;

        let changed = false;
        const updatedChallenges = user.challenges.map(c => {
            const def = this.getChallengeDefinition(c);
            if (!def || def.action !== action || c.completed) return c;

            const newProgress = Math.min(c.progress + amount, def.target);
            if (newProgress !== c.progress) {
                changed = true;
                const completed = newProgress >= def.target;
                return { ...c, progress: newProgress, completed };
            }
            return c;
        });

        if (changed) {
            AuthService.updateUser(user.id, { challenges: updatedChallenges });
            // Notify UI
            window.dispatchEvent(new Event('challenges-updated'));
        }
    },

    claimReward(instanceId: string) {
        const user = AuthService.getCurrentUser();
        if (!user || !user.challenges) return;

        const challenge = user.challenges.find(c => c.challengeId === instanceId);
        if (!challenge || !challenge.completed || challenge.claimed) return;

        const def = this.getChallengeDefinition(challenge);
        if (!def) return;

        // Give Rewards
        if (def.reward.currency) CurrencyService.addCurrency(def.reward.currency);
        if (def.reward.xp) XPService.addXP(def.reward.xp);

        // Mark claimed
        const updatedChallenges = user.challenges.map(c => 
            c.challengeId === instanceId ? { ...c, claimed: true } : c
        );

        AuthService.updateUser(user.id, { challenges: updatedChallenges });
        window.dispatchEvent(new Event('challenges-updated'));
    }
};
