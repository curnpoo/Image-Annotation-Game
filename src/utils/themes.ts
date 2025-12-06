// CARD_THEMES removed


export const getThemeStyles = (themeId: string = 'default') => {
    switch (themeId) {
        case 'cardboard':
            return {
                background: '#d2b48c',
                border: '4px dashed #8b4513',
                color: '#5d4037'
            };
        case 'dark':
            return {
                background: '#1a1a2e',
                border: '4px solid #16213e',
                color: '#e94560'
            };
        case 'gradient':
            return {
                backgroundImage: 'linear-gradient(135deg, #FF9A9E 0%, #FECFEF 99%, #FECFEF 100%)',
                border: '4px solid #fff',
                color: '#555'
            };
        case 'neon':
            return {
                background: '#000',
                border: '4px solid #0ff',
                boxShadow: '0 0 10px #0ff, inset 0 0 10px #0ff',
                color: '#0ff',
                textShadow: '0 0 5px #0ff'
            };
        case 'gold':
            return {
                background: 'linear-gradient(135deg, #bf953f, #fcf6ba, #b38728, #fbf5b7, #aa771c)',
                border: '4px solid #daa520',
                color: '#5c4013'
            };
        case 'holographic':
            return {
                backgroundImage: 'linear-gradient(45deg, #ff9a9e 0%, #fecfef 20%, #a6c0fe 40%, #f68084 60%, #a6c0fe 80%, #fecfef 100%)',
                backgroundSize: '200% 200%',
                animation: 'gradient 3s ease infinite',
                border: '4px solid rgba(255,255,255,0.5)',
                color: '#fff'
            };
        case 'galaxy':
            return {
                backgroundColor: '#000',
                backgroundImage: 'url("https://www.transparenttextures.com/patterns/stardust.png")', // Fallback or use CSS radial gradients
                background: 'radial-gradient(ellipse at bottom, #1B2735 0%, #090A0F 100%)',
                border: '4px solid #4B0082',
                color: '#E6E6FA'
            };
        case 'default':
        default:
            return {
                background: 'white',
                border: '4px solid transparent',
                backgroundImage: 'linear-gradient(white, white), linear-gradient(135deg, #00D9FF, #32CD32)',
                backgroundOrigin: 'border-box',
                backgroundClip: 'padding-box, border-box'
            };
    }
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
