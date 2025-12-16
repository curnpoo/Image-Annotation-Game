// Currency Service - Handles player currency persistence and transactions
import { ref, update } from 'firebase/database';
import { database } from '../firebase';
import type { UserAccount } from '../types';

const CURRENCY_KEY = 'player_currency';
const PURCHASED_ITEMS_KEY = 'player_purchased_items';
const INVENTORY_KEY = 'player_inventory';
// PERMANENT_POWERUPS_KEY removed - permanent powerups stored in purchasedItems
const LOCAL_USER_KEY = 'logged_in_user';

import { XPService } from './xp';

// Format currency with $ and commas (e.g., $1,999)
export const formatCurrency = (amount: number): string => {
    return '$' + Math.floor(amount).toLocaleString('en-US');
};

export const CurrencyService = {
    // Get player's current currency balance
    getCurrency(): number {
        const stored = localStorage.getItem(CURRENCY_KEY);
        return stored ? parseInt(stored, 10) : 0;
    },

    // Set player's currency balance
    setCurrency(amount: number): void {
        const value = Math.max(0, amount);
        localStorage.setItem(CURRENCY_KEY, value.toString());
        window.dispatchEvent(new Event('currency-updated'));

        // Sync to Firebase if logged in
        try {
            const storedUser = localStorage.getItem(LOCAL_USER_KEY);
            if (storedUser) {
                const user = JSON.parse(storedUser) as UserAccount;
                // Update local cached user object too so it stays in sync
                user.currency = value;
                localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(user));

                // Fire and forget update to Firebase
                const userRef = ref(database, `users/${user.id}`);
                update(userRef, { currency: value }).catch(err =>
                    console.error('Failed to sync currency to server:', err)
                );
            }
        } catch (e) {
            console.error('Error syncing currency:', e);
        }
    },

    // Add currency (returns new balance)
    addCurrency(amount: number): number {
        // Apply Tier Bonus
        const finalAmount = XPService.applyCurrencyBonus(amount);

        const current = this.getCurrency();
        const newBalance = current + finalAmount;
        this.setCurrency(newBalance);
        return newBalance;
    },

    // Spend currency (returns true if successful, false if insufficient funds)
    spendCurrency(amount: number): boolean {
        const current = this.getCurrency();
        if (current < amount) return false;
        this.setCurrency(current - amount);
        return true;
    },

    // Get list of purchased items
    getPurchasedItems(): string[] {
        const stored = localStorage.getItem(PURCHASED_ITEMS_KEY);
        return stored ? JSON.parse(stored) : [];
    },

    // Add an item to purchased list
    addPurchasedItem(itemId: string): void {
        const items = this.getPurchasedItems();
        if (!items.includes(itemId)) {
            items.push(itemId);
            localStorage.setItem(PURCHASED_ITEMS_KEY, JSON.stringify(items));

            // Sync to Firebase if logged in
            try {
                const storedUser = localStorage.getItem(LOCAL_USER_KEY);
                if (storedUser) {
                    const user = JSON.parse(storedUser) as UserAccount;
                    // Update local cached user
                    user.purchasedItems = [...(user.purchasedItems || []), itemId];
                    // Dedupe just in case
                    user.purchasedItems = [...new Set(user.purchasedItems)];
                    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(user));

                    // Fire and forget update
                    const userRef = ref(database, `users/${user.id}`);
                    update(userRef, { purchasedItems: user.purchasedItems }).catch(err =>
                        console.error('Failed to sync purchased item to server:', err)
                    );
                }
            } catch (e) {
                console.error('Error syncing purchased item:', e);
            }
        }
    },

    // Check if item is purchased
    isItemPurchased(itemId: string): boolean {
        return this.getPurchasedItems().includes(itemId);
    },

    // Purchase an item (checks balance and deducts)
    purchaseItem(itemId: string, price: number, type: 'consumable' | 'permanent' = 'permanent'): boolean {
        // For permanent items, check if already owned
        if (type === 'permanent' && this.isItemPurchased(itemId)) return true;
        
        if (!this.spendCurrency(price)) return false;

        if (type === 'consumable') {
            this.addToInventory(itemId, 1);
        } else {
            this.addPurchasedItem(itemId);
        }
        return true;
    },

    // === Inventory Management (Consumables) ===

    getInventory(): { [itemId: string]: number } {
        const stored = localStorage.getItem(INVENTORY_KEY);
        return stored ? JSON.parse(stored) : {};
    },

    addToInventory(itemId: string, count: number): void {
        const inventory = this.getInventory();
        inventory[itemId] = (inventory[itemId] || 0) + count;
        localStorage.setItem(INVENTORY_KEY, JSON.stringify(inventory));
        this.syncInventory();
    },

    consumeItem(itemId: string): boolean {
        const inventory = this.getInventory();
        if (!inventory[itemId] || inventory[itemId] <= 0) return false;

        inventory[itemId]--;
        if (inventory[itemId] === 0) delete inventory[itemId];
        
        localStorage.setItem(INVENTORY_KEY, JSON.stringify(inventory));
        this.syncInventory();
        return true;
    },

    getItemCount(itemId: string): number {
        const inventory = this.getInventory();
        return inventory[itemId] || 0;
    },

    syncInventory(): void {
        try {
            const storedUser = localStorage.getItem(LOCAL_USER_KEY);
            const inventory = this.getInventory();
            
            if (storedUser) {
                const user = JSON.parse(storedUser) as UserAccount;
                user.inventory = inventory;
                localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(user));

                const userRef = ref(database, `users/${user.id}`);
                update(userRef, { inventory }).catch(console.error);
            }
        } catch (e) {
            console.error('Error syncing inventory:', e);
        }
    },
    
    // === Permanent Powerups ===
    // We treat them like normal purchased items, but store/sync them specifically if needed.
    // For now, they can live in 'purchasedItems' OR we can add specific handling if we want separate validaton.
    // The current implementation of purchaseItem adds them to 'purchasedItems' which is fine.
    // But we should ensure we can distinguishing them.
    // The UserAccount type has 'permanentPowerups', so let's sync that too if we want to be strict,
    // or just rely on purchasedItems containing the ID.
    // Let's rely on purchasedItems for now for simplicity, OR update purchasedItems to be the master list.
    // Actually, let's explicitly support the new 'permanentPowerups' field for clarity.

    addPermanentPowerup(itemId: string): void {
        this.addPurchasedItem(itemId); // Keep in general purchased list for ease
        
        // Also sync to specific field if we want
        try {
            const storedUser = localStorage.getItem(LOCAL_USER_KEY);
            if (storedUser) {
                const user = JSON.parse(storedUser) as UserAccount;
                const perms = user.permanentPowerups || [];
                if (!perms.includes(itemId)) {
                    perms.push(itemId);
                    user.permanentPowerups = perms;
                    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(user));
                    
                    const userRef = ref(database, `users/${user.id}`);
                    update(userRef, { permanentPowerups: perms }).catch(console.error);
                }
            }
        } catch(e) { console.error(e); }
    },

    // Reset all currency data (for testing)
    reset(): void {
        localStorage.removeItem(CURRENCY_KEY);
        localStorage.removeItem(PURCHASED_ITEMS_KEY);
    }
};
