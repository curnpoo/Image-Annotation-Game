import { Suspense, lazy } from 'react';
import type { Screen, Player, GameRoom, GameSettings, RoomHistoryEntry } from '../../types';


// Lazy Load Screens
const WelcomeScreen = lazy(() => import('../screens/WelcomeScreen').then(module => ({ default: module.WelcomeScreen })));
const LoginScreen = lazy(() => import('../screens/LoginScreen').then(module => ({ default: module.LoginScreen })));
const ProfileSetupScreen = lazy(() => import('../screens/ProfileSetupScreen').then(module => ({ default: module.ProfileSetupScreen })));
const HomeScreen = lazy(() => import('../screens/HomeScreen').then(module => ({ default: module.HomeScreen })));
const StoreScreen = lazy(() => import('../screens/StoreScreen').then(module => ({ default: module.StoreScreen })));
const ProfileScreen = lazy(() => import('../screens/ProfileScreen').then(module => ({ default: module.ProfileScreen })));
const AvatarEditorScreen = lazy(() => import('../screens/AvatarEditorScreen').then(module => ({ default: module.AvatarEditorScreen })));
const RoomSelectionScreen = lazy(() => import('../screens/RoomSelectionScreen').then(module => ({ default: module.RoomSelectionScreen })));
const LobbyScreen = lazy(() => import('../screens/LobbyScreen').then(module => ({ default: module.LobbyScreen })));
const WaitingRoomScreen = lazy(() => import('../screens/WaitingRoomScreen').then(module => ({ default: module.WaitingRoomScreen })));
const UploadScreen = lazy(() => import('../screens/UploadScreen').then(module => ({ default: module.UploadScreen })));
const DrawingScreen = lazy(() => import('../screens/DrawingScreen').then(module => ({ default: module.DrawingScreen })));
const VotingScreen = lazy(() => import('../screens/VotingScreen').then(module => ({ default: module.VotingScreen })));
const ResultsScreen = lazy(() => import('../screens/ResultsScreen').then(module => ({ default: module.ResultsScreen })));
const FinalResultsScreen = lazy(() => import('../screens/FinalResultsScreen').then(module => ({ default: module.FinalResultsScreen })));
const StatsScreen = lazy(() => import('../screens/StatsScreen').then(module => ({ default: module.StatsScreen })));
const SabotageSelectionScreen = lazy(() => import('../screens/SabotageSelectionScreen').then(module => ({ default: module.SabotageSelectionScreen })));
const LevelProgressScreen = lazy(() => import('../screens/LevelProgressScreen').then(module => ({ default: module.LevelProgressScreen })));
const GalleryScreen = lazy(() => import('../screens/GalleryScreen').then(module => ({ default: module.GalleryScreen })));


import type { SabotageEffect } from '../../types';

interface ScreenRouterProps {
    currentScreen: Screen;
    player: Player | null;
    room: GameRoom | null;
    joiningRoomCode?: string | null;

    // Auth/Profile Handlers
    onPlayNow: () => void;
    onLoginComplete: () => void;
    onProfileComplete: (data: any) => void;
    onUpdateProfile: (updates: any) => void;

    // Home Handlers
    onShowCasino: () => void;
    onShowSettings: () => void;
    onRejoin: (code: string) => void;
    onPlayWithTransition: () => void;

    // Navigation Handlers
    onNavigate: (screen: Screen) => void; // Generic navigate
    onBackToHome: () => void; // Specific
    onStoreBack: () => void; // Specific for store (refresh logic)
    onLeaveGame: () => void;

    // Game Creation/Join
    onCreateRoom: () => void;
    onJoinRoom: (code: string) => void;

    // Lobby/Game Flow
    onStartGame: () => void;
    onSettingsChange: (settings: Partial<GameSettings>) => void;
    onKickPlayer: (playerId: string) => void;
    onJoinCurrentRound: () => void;
    onMinimizeGame: () => void;

    // Game Actions
    onUploadImage: (file: File) => void;
    onVote: (votedForId: string) => void;
    onNextRound: () => void;
    onPlayAgain: () => void;
    onShowRewards: (action: 'home' | 'replay') => void;


    // Store
    onEquipTheme: (themeId?: string) => void;

    // Sabotage
    onSabotageSelect: (targetId: string, effect: SabotageEffect) => void;

    // Drawing Specifics
    isMyTimerRunning: boolean;
    isReadying: boolean;
    onReady: () => void;
    brushType?: string;
    setBrushType?: (type: string) => void;
    brushColor: string;
    brushSize: number;
    isEraser: boolean;
    isEyedropper: boolean;
    setBrushColor: (color: string) => void;
    setBrushSize: (size: number) => void;
    setStrokes: (strokes: any[]) => void;
    setIsEraser: (is: boolean) => void;
    setIsEyedropper: (is: boolean) => void;
    handleUndo: () => void;
    handleClear: () => void;
    handleEraserToggle: () => void;
    handleEyedropperToggle: () => void;
    handleColorPick: (color: string) => void;
    strokes: any[];

    // Misc
    lastGameDetails: RoomHistoryEntry | null;
    showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;

    // Drawing Layout Data
    hasSubmitted: boolean;
    submittedCount: number;
    totalPlayers: number;
    timerEndsAt: number | null;
    totalTimerDuration?: number; // Effective duration including bonuses
    onTimeUp: () => void;
}

export const ScreenRouter: React.FC<ScreenRouterProps> = ({
    currentScreen,
    player,
    room,
    joiningRoomCode,
    onPlayNow,
    onLoginComplete,
    onProfileComplete,
    onUpdateProfile,
    onShowCasino,
    onShowSettings,
    onRejoin,
    onPlayWithTransition,
    onNavigate,
    onBackToHome,
    onStoreBack,
    onLeaveGame,
    onCreateRoom,
    onJoinRoom,
    onStartGame,
    onSettingsChange,
    onKickPlayer,
    onJoinCurrentRound,
    onMinimizeGame,
    onUploadImage,
    onVote,
    onNextRound,
    onShowRewards,
    onEquipTheme,
    onSabotageSelect,
    isMyTimerRunning,
    isReadying,
    onReady,
    brushColor,
    brushSize,
    isEraser,
    isEyedropper,
    setBrushColor,
    setBrushSize,
    setStrokes,
    setIsEraser,
    setIsEyedropper,
    handleUndo,
    handleClear,
    handleEraserToggle,
    handleEyedropperToggle,
    handleColorPick,
    brushType,
    setBrushType,
    strokes,
    lastGameDetails,
    showToast,
    hasSubmitted,
    submittedCount,
    totalPlayers,
    timerEndsAt,
    totalTimerDuration,
    onTimeUp
}) => {

    // Helper to render Drawing Layout (wrapper)
    const renderDrawingLayout = () => {
        if (!room || !player) return null;
        // Use effective duration if passed (calculated in App.tsx with bonuses), otherwise fallback to settings
        // const effectiveDuration ... (removed unused)


        // Better approach: Calculate effective duration based on room settings + bonuses
        // But App.tsx already calculates 'bonusTime'. We should pass that or the total.
        // Let's rely on App.tsx passing it down. I will add `totalDuration` prop to ScreenRouter.

        return (
            <div className="fixed inset-0 overflow-hidden">
                <div
                    className="h-full w-full flex flex-col p-4"
                    style={{
                        paddingTop: 'max(1rem, env(safe-area-inset-top) + 0.5rem)',
                        paddingBottom: 'max(1rem, env(safe-area-inset-bottom))'
                    }}
                >
                    {/* Top Bar: Settings + Round Info */}
                    <div className="w-full flex items-center justify-between px-2 z-20 mb-3 shrink-0">
                        {/* Settings Button */}
                        <button
                            onClick={onShowSettings}
                            className="bg-white p-3 rounded-2xl shadow-lg hover:scale-105 active:scale-95 transition-all w-12 h-12 flex items-center justify-center border-2 border-gray-100"
                        >
                            ⚙️
                        </button>

                        {/* Status Badge */}
                        {hasSubmitted ? (
                            <div className="bg-green-500 text-white px-4 py-2 rounded-xl font-bold shadow-lg">
                                ✓ Submitted!
                            </div>
                        ) : (
                            <div className="bg-white/95 backdrop-blur-sm px-4 py-2 rounded-xl flex items-center gap-2 shadow-lg border-2 border-purple-200">
                                <span className="font-bold text-purple-600 text-sm whitespace-nowrap">
                                    Round {room.roundNumber}/{room.settings.totalRounds}
                                </span>
                                {room.isDoublePoints && (
                                    <span className="bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded-full text-xs font-bold animate-pulse whitespace-nowrap">
                                        2X!
                                    </span>
                                )}
                                <span className="text-gray-400 text-xs">|</span>
                                <span className="text-gray-500 text-sm whitespace-nowrap">
                                    {submittedCount}/{totalPlayers} done
                                </span>
                            </div>
                        )}
                    </div>



                    {/* Canvas Area - Centered */}
                    <div className="flex-1 flex items-center justify-center min-h-0">
                        <DrawingScreen
                            room={room}
                            player={player}
                            hasSubmitted={hasSubmitted}
                            isMyTimerRunning={isMyTimerRunning}
                            isReadying={isReadying}
                            onReady={onReady}
                            timerEndsAt={timerEndsAt}
                            onTimeUp={onTimeUp}
                            timerDuration={totalTimerDuration || room.settings.timerDuration || 20}
                            brushColor={brushColor}
                            brushSize={brushSize}
                            brushType={brushType}
                            isEraser={isEraser}
                            isEyedropper={isEyedropper}
                            setBrushColor={setBrushColor}
                            setBrushSize={setBrushSize}
                            setBrushType={setBrushType}
                            setStrokes={setStrokes}
                            setIsEraser={setIsEraser}
                            setIsEyedropper={setIsEyedropper}
                            handleUndo={handleUndo}
                            handleClear={handleClear}
                            handleEraserToggle={handleEraserToggle}
                            handleEyedropperToggle={handleEyedropperToggle}
                            handleColorPick={handleColorPick}
                            strokes={strokes}
                        />
                    </div>
                </div>
            </div>
        );
    };

    // Main Switch
    let screenContent = null;
    switch (currentScreen) {
        case 'welcome':
            screenContent = <WelcomeScreen onPlay={onPlayNow} onJoin={onJoinRoom} joiningRoomCode={joiningRoomCode} />;
            break;

        case 'login':
            screenContent = <LoginScreen onLogin={onLoginComplete} joiningRoomCode={joiningRoomCode} />;
            break;

        case 'name-entry':
            // Need AuthService? No, ProfileSetupScreen just returns data
            // onProfileComplete in App.tsx checks AuthService
            screenContent = <ProfileSetupScreen
                onComplete={onProfileComplete}
                initialName="" // We could pass this if we had it, but App.tsx handles sourcing it. 
            // Wait, App.tsx passes AuthService.getCurrentUser()?.username.
            // We might need to pass initialName as prop?
            />;
            break;

        case 'home':
            if (!player) return null;
            screenContent = <HomeScreen
                player={player}
                onPlay={onPlayWithTransition}
                onCasino={onShowCasino}
                onStore={() => onNavigate('store')}
                onProfile={() => onNavigate('profile')}
                onSettings={onShowSettings}
                onLevelProgress={() => onNavigate('level-progress')}
                onGallery={() => onNavigate('gallery')}
                lastGameDetails={lastGameDetails ? {
                    ...lastGameDetails,
                    hostName: lastGameDetails.hostName || 'Unknown',
                    playerCount: lastGameDetails.playerCount || 0
                } : null}
                onRejoin={onRejoin}
            />;
            break;

        case 'gallery':
            screenContent = <GalleryScreen
                onBack={onBackToHome}
                showToast={showToast}
            />;
            break;

        case 'store':
            screenContent = <StoreScreen
                onBack={onStoreBack}
                onFontChange={onEquipTheme}
            />;
            break;


        case 'profile':
            if (!player) return null;
            screenContent = <ProfileScreen
                player={player}
                onBack={onBackToHome}
                onUpdateProfile={onUpdateProfile}
                onEditAvatar={() => onNavigate('avatar-editor')}
                onShowStats={() => onNavigate('stats')}
                onShowGallery={() => onNavigate('gallery')}
            />;
            break;

        case 'avatar-editor':
            if (!player) return null;
            screenContent = <AvatarEditorScreen
                player={player}
                onCancel={() => onNavigate('profile')}
                onSave={(strokes, color, backgroundColor, frame, avatarImageUrl) => {
                    onUpdateProfile({ avatarStrokes: strokes, color, backgroundColor, frame, avatarImageUrl });
                    onNavigate('profile');
                }}
            />;
            break;


        case 'room-selection':
            if (!player) return null;
            screenContent = <RoomSelectionScreen
                playerName={player.name}
                currentRoomCode={room?.roomCode || null}
                onCreateRoom={onCreateRoom}
                onJoinRoom={onJoinRoom}
                onBack={onBackToHome}
            />;
            break;

        case 'lobby':
            if (!room || !player) return null;
            screenContent = <LobbyScreen
                room={room}
                currentPlayerId={player.id}
                onStartGame={onStartGame}
                onSettingsChange={onSettingsChange}
                onLeave={onLeaveGame}
                onKick={onKickPlayer}
                onJoinGame={onJoinCurrentRound}
                onBack={onMinimizeGame}
            />;
            break;

        case 'waiting':
            if (!room || !player) return null;
            screenContent = <WaitingRoomScreen
                room={room}
                currentPlayerId={player.id}
                onJoinGame={onJoinCurrentRound}
            />;
            break;

        case 'uploading':
            if (!room || !player) return null;
            screenContent = <UploadScreen
                room={room}
                currentPlayerId={player.id}
                onUploadImage={onUploadImage}
                onShowSettings={onShowSettings}
            />;
            break;

        case 'drawing':
            // The complex one
            // If room.status is NOT drawing (but screen is), we might still want to show?
            // App.tsx logic: (currentScreen === 'drawing' || (room && room.status === 'drawing'))
            // We rely on currentScreen passed to us.
            if (!room || !player) return null;
            screenContent = renderDrawingLayout();
            break;

        case 'voting':
            if (!room || !player) return null;
            screenContent = <VotingScreen
                room={room}
                currentPlayerId={player.id}
                onVote={onVote}
                showToast={showToast}
                onShowSettings={onShowSettings}
            />;
            break;

        case 'results':
            if (!room || !player) return null;
            screenContent = <ResultsScreen
                room={room}
                currentPlayerId={player.id}
                player={player}
                onNextRound={onNextRound}
                showToast={showToast}
            />;
            break;

        case 'final':
            if (!room || !player) return null;
            screenContent = <FinalResultsScreen
                room={room}
                currentPlayerId={player.id}
                showToast={showToast}
                onShowRewards={onShowRewards}
            />;
            break;

        case 'sabotage-selection':
            if (!room || !player) return null;
            screenContent = <SabotageSelectionScreen
                players={room.players}
                saboteurId={room.saboteurId || ''}
                currentPlayerId={player.id}
                onSelect={onSabotageSelect}
            />;
            break;

        case 'stats':
            screenContent = <StatsScreen onBack={onBackToHome} />;
            break;

        case 'level-progress':
            if (!player) return null;
            screenContent = <LevelProgressScreen
                player={player}
                onBack={onBackToHome}
            />;
            break;
    }

    return (
        <Suspense fallback={null}>
            {screenContent}
        </Suspense>
    );
};
