// CARD_THEMES removed


export const getThemeVariables = (themeId: string = 'default') => {
    switch (themeId) {
        case 'dark':
            return {
                '--theme-bg': '#0f172a',
                '--theme-bg-secondary': '#1e293b',
                '--theme-text': '#f8fafc',
                '--theme-text-secondary': '#94a3b8',
                '--theme-accent': '#e94560',
                '--theme-border': '#334155',
                '--theme-button-bg': '#e94560',
                '--theme-button-text': '#ffffff',
                '--theme-card-bg': 'rgba(30, 41, 59, 0.8)',
            };
        case 'cardboard':
            return {
                '--theme-bg': '#d2b48c',
                '--theme-bg-secondary': '#e6ccb2',
                '--theme-text': '#5d4037',
                '--theme-text-secondary': '#8d6e63',
                '--theme-accent': '#8b4513',
                '--theme-border': '#8b4513',
                '--theme-button-bg': '#8b4513',
                '--theme-button-text': '#d2b48c',
                '--theme-card-bg': '#faeedd',
            };
        case 'neon':
            return {
                '--theme-bg': '#000000',
                '--theme-bg-secondary': '#111111',
                '--theme-text': '#00ff00',
                '--theme-text-secondary': '#00cc00',
                '--theme-accent': '#00ff00',
                '--theme-border': '#00ff00',
                '--theme-button-bg': '#000000',
                '--theme-button-text': '#00ff00',
                '--theme-card-bg': 'rgba(0, 0, 0, 0.9)',
            };
        case 'retro':
            return {
                '--theme-bg': '#ff00ff',
                '--theme-bg-secondary': '#00ffff',
                '--theme-text': '#ffff00',
                '--theme-text-secondary': '#00ff00',
                '--theme-accent': '#ffff00',
                '--theme-border': '#000000',
                '--theme-button-bg': '#ffffff',
                '--theme-button-text': '#000000',
                '--theme-card-bg': '#ffffff',
            };
        case 'default':
        default:
            return {
                '--theme-bg': 'linear-gradient(-45deg, #FF69B4, #9B59B6, #00D9FF, #32CD32, #FFE135, #FF8C00)',
                '--theme-bg-secondary': '#ffffff',
                '--theme-text': '#1f2937',
                '--theme-text-secondary': '#6b7280',
                '--theme-accent': '#9B59B6',
                '--theme-border': 'transparent',
                '--theme-button-bg': 'linear-gradient(to right, #00D9FF, #9B59B6)',
                '--theme-button-text': '#ffffff',
                '--theme-card-bg': 'rgba(255, 255, 255, 0.9)',
            };
    }
};

// Deprecated: kept for backward compatibility if needed, but should point to variables
export const getThemeStyles = (_themeId: string = 'default') => {
    return {}; // Handled via CSS variables now
};


export const getThemeContainerStyle = (themeId: string = 'default') => {
    // Returns styles for the container (gradient borders etc)
    // This simplifies the logic by returning a complete style object
    const styles = getThemeStyles(themeId);

    // Default fallback for layout
    return {
        padding: '1.25rem', // p-5
        borderRadius: '1.5rem', // rounded-3xl
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', // shadow-xl
        ...styles
    };
};

export const getThemeClass = (themeId: string = 'default'): string => {
    switch (themeId) {
        case 'dark':
            return 'theme-bg-dark';
        case 'cardboard':
            return 'theme-bg-cardboard';
        case 'neon':
            return 'theme-bg-neon';
        case 'gold':
            return 'theme-bg-gold';
        case 'galaxy':
            return 'theme-bg-galaxy';
        default:
            return 'theme-bg-default';
    }
};
