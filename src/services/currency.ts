// Currency Service - Handles player currency persistence and transactions

const CURRENCY_KEY = 'player_currency';
const PURCHASED_ITEMS_KEY = 'player_purchased_items';

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
        localStorage.setItem(CURRENCY_KEY, Math.max(0, amount).toString());
        window.dispatchEvent(new Event('currency-updated'));
    },

    // Add currency (returns new balance)
    addCurrency(amount: number): number {
        const current = this.getCurrency();
        const newBalance = current + amount;
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
        }
    },

    // Check if item is purchased
    isItemPurchased(itemId: string): boolean {
        return this.getPurchasedItems().includes(itemId);
    },

    // Purchase an item (checks balance and deducts)
    purchaseItem(itemId: string, price: number): boolean {
        if (this.isItemPurchased(itemId)) return true; // Already owned
        if (!this.spendCurrency(price)) return false;
        this.addPurchasedItem(itemId);
        return true;
    },

    // Reset all currency data (for testing)
    reset(): void {
        localStorage.removeItem(CURRENCY_KEY);
        localStorage.removeItem(PURCHASED_ITEMS_KEY);
    }
};
