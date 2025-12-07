import { UNLOCKABLE_BRUSHES, UNLOCKABLE_COLORS } from '../constants/cosmetics';
import { CurrencyService } from './currency';

export const CosmeticsService = {
    // Get all available brushes (free + purchased)
    getAvailableBrushes() {
        const purchasedIds = CurrencyService.getPurchasedItems();
        return UNLOCKABLE_BRUSHES.filter(brush =>
            brush.price === 0 || purchasedIds.includes(brush.id)
        );
    },

    // Get all available colors (free + purchased)
    getAvailableColors() {
        const purchasedIds = CurrencyService.getPurchasedItems();
        return UNLOCKABLE_COLORS.filter(color =>
            color.price === 0 || purchasedIds.includes(color.id)
        );
    },

    // Check if specific item is unlocked
    isUnlocked(itemId: string, price: number) {
        if (price === 0) return true;
        return CurrencyService.isItemPurchased(itemId);
    },

    // Get ALL brushes (for Avatar Editor, etc)
    getAllBrushes() {
        return UNLOCKABLE_BRUSHES;
    },

    // Get ALL colors (for Avatar Editor, etc)
    getAllColors() {
        return UNLOCKABLE_COLORS;
    }
};
