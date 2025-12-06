export const UNLOCKABLE_BRUSHES = [
    { id: 'default', name: 'Standard', emoji: '🖊️' },
    { id: 'marker', name: 'Marker', emoji: '🖍️' },
    { id: 'calligraphy', name: 'Ink Pen', emoji: '✒️' },
    { id: 'pixel', name: 'Pixel', emoji: '👾' },
    { id: 'neon', name: 'Neon', emoji: '✨' },
    { id: 'spray', name: 'Spray', emoji: '💨' }
];

export const UNLOCKABLE_COLORS = [
    // Standard
    { id: '#000000', name: 'Black' },
    { id: '#ffffff', name: 'White' },
    { id: '#FF0000', name: 'Red' },
    { id: '#00FF00', name: 'Green' },
    { id: '#0000FF', name: 'Blue' },

    // Unlockables
    { id: '#FFD700', name: 'Gold', locked: true },
    { id: '#C0C0C0', name: 'Silver', locked: true },
    { id: '#FF69B4', name: 'Hot Pink', locked: true },
    { id: '#00CCFF', name: 'Cyan', locked: true },
    { id: '#9D00FF', name: 'Electric Purple', locked: true }
];

export const BADGES = [
    { id: 'first_win', name: 'First Win', emoji: '🏆', description: 'Won your first round!' },
    { id: 'artist', name: 'True Artist', emoji: '🎨', description: 'Drew 100 strokes in one round' },
    { id: 'speed', name: 'Speed Demon', emoji: '⚡', description: 'Submitted in under 5 seconds' },
    { id: 'social', name: 'Chatty', emoji: '💭', description: 'Sent 50 messages' },
    { id: 'saboteur', name: 'Chaos Agent', emoji: '😈', description: 'Successfully sabotaged a round' }
];
