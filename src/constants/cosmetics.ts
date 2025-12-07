export const UNLOCKABLE_BRUSHES = [
    { id: 'default', name: 'Simple', emoji: '🖊️', price: 0 },
    { id: 'marker', name: 'Marker', emoji: '🖍️', price: 15 },
    { id: 'calligraphy', name: 'Ink Pen', emoji: '✒️', price: 15 },
    { id: 'pixel', name: 'Pixel', emoji: '👾', price: 25 },
    { id: 'neon', name: 'Neon', emoji: '✨', price: 50 },
    { id: 'spray', name: 'Spray', emoji: '💨', price: 25 }
];

export const UNLOCKABLE_COLORS = [
    // Standard (free)
    { id: '#000000', name: 'Black', price: 0 },
    { id: '#ffffff', name: 'White', price: 0 },
    { id: '#FF0000', name: 'Red', price: 0 },
    { id: '#00FF00', name: 'Green', price: 0 },
    { id: '#0000FF', name: 'Blue', price: 0 },
    { id: '#FFA500', name: 'Orange', price: 0 },
    { id: '#FFFF00', name: 'Yellow', price: 0 },
    { id: '#800080', name: 'Purple', price: 0 },
    { id: '#A52A2A', name: 'Brown', price: 0 },
    { id: '#FFC0CB', name: 'Pink', price: 0 },

    // Unlockables
    { id: '#FFD700', name: 'Gold', locked: true, price: 25 },
    { id: '#C0C0C0', name: 'Silver', locked: true, price: 15 },
    { id: '#FF69B4', name: 'Hot Pink', locked: true, price: 15 },
    { id: '#00CCFF', name: 'Cyan', locked: true, price: 15 },
    { id: '#9D00FF', name: 'Electric Purple', locked: true, price: 25 }
];

export const BADGES = [
    // Achievement badges
    { id: 'first_win', name: 'First Win', emoji: '🏆', description: 'Won your first round!', price: 0 },
    { id: 'artist', name: 'True Artist', emoji: '🎨', description: 'Drew 100 strokes in one round', price: 0 },
    { id: 'speed', name: 'Speed Demon', emoji: '⚡', description: 'Submitted in under 5 seconds', price: 0 },
    { id: 'social', name: 'Chatty', emoji: '💭', description: 'Sent 50 messages', price: 0 },
    { id: 'saboteur', name: 'Chaos Agent', emoji: '😈', description: 'Successfully sabotaged a round', price: 0 },
    { id: 'high_roller', name: 'High Roller', emoji: '🎰', description: 'Win big at the casino', price: 0 },
    { id: 'rich', name: 'Loaded', emoji: '💰', description: 'Have 100$ at once', price: 0 },

    // Drawing-themed level milestone badges
    { id: 'level_5', name: 'Sketch Artist', emoji: '✏️', description: 'Drew your way to Level 5', price: 0, levelRequired: 5 },
    { id: 'level_10', name: 'Ink Master', emoji: '🖊️', description: 'Mastered the pen at Level 10', price: 0, levelRequired: 10 },
    { id: 'level_25', name: 'Canvas Virtuoso', emoji: '🖼️', description: 'A true artist at Level 25', price: 0, levelRequired: 25 },
    { id: 'level_50', name: 'Masterpiece Maker', emoji: '🎨', description: 'Creating masterpieces at Level 50', price: 0, levelRequired: 50 },
    { id: 'level_100', name: 'Legendary Illustrator', emoji: '👑', description: 'The ultimate artist at Level 100', price: 0, levelRequired: 100 }
];

// Purchasable powerups (consumable items)
export const POWERUPS = [
    { id: 'extra_time', name: 'Extra Time', emoji: '⏰', description: '+10 seconds drawing time', price: 10, consumable: true },
    { id: 'double_vote', name: 'Double Vote', emoji: '✌️', description: 'Your vote counts twice', price: 15, consumable: true },
    { id: 'shield', name: 'Anti-Sabotage', emoji: '🛡️', description: 'Block sabotage effects', price: 20, consumable: true },
    { id: 'reveal', name: 'Reveal Saboteur', emoji: '👁️', description: 'See who the saboteur is', price: 25, consumable: true },
    { id: 'steal', name: 'Vote Steal', emoji: '🎭', description: 'Steal 1 vote from leader', price: 30, consumable: true }
];

// Purchasable fonts (permanent unlocks)
export const FONTS = [
    { id: 'default', name: 'Inter', fontFamily: "'Inter', sans-serif", description: 'Clean & modern', price: 0 },
    { id: 'comic', name: 'Comic Neue', fontFamily: "'Comic Neue', cursive", description: 'Fun & playful', price: 10 },
    { id: 'pixel', name: 'Press Start 2P', fontFamily: "'Press Start 2P', cursive", description: 'Retro gaming vibes', price: 25 },
    { id: 'mono', name: 'JetBrains Mono', fontFamily: "'JetBrains Mono', monospace", description: 'Developer favorite', price: 15 },
    { id: 'handwritten', name: 'Caveat', fontFamily: "'Caveat', cursive", description: 'Handwritten style', price: 15 },
    { id: 'retro', name: 'VT323', fontFamily: "'VT323', monospace", description: 'Terminal nostalgia', price: 20 }
];
