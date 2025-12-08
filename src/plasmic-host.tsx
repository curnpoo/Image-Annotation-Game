import { createRoot } from 'react-dom/client';
import { PlasmicCanvasHost } from '@plasmicapp/host';

// Import your global styles
import './index.css';

// Import components you want to make editable in Plasmic
import { HomeScreen } from './components/screens/HomeScreen';

// Mock data for component previews
const MOCK_PLAYER = {
    id: 'mock-player-1',
    displayName: 'Player Name',
    username: 'player123',
    avaurl: '',
    color: '#FF6B9D',
    level: 5,
    xp: 1250,
    currency: 500,
    tokens: 10,
    status: 'online' as const,
    createdAt: Date.now(),
    lastActive: Date.now(),
};

function PlasmicHost() {
    return (
        <PlasmicCanvasHost>
            <HomeScreen
                player={MOCK_PLAYER}
                onPlay={() => console.log('Play clicked')}
                onProfile={() => console.log('Profile clicked')}
                onSettings={() => console.log('Settings clicked')}
                onStore={() => console.log('Store clicked')}
                onCasino={() => console.log('Casino clicked')}
                onLevelProgress={() => console.log('Level clicked')}
                onGallery={() => console.log('Gallery clicked')}
                roomCode=""
                hostName=""
                playerCount={0}
            />
        </PlasmicCanvasHost>
    );
}

const root = createRoot(document.getElementById('root')!);
root.render(<PlasmicHost />);
