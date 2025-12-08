import React from 'react';
import type { Screen, Player, GameRoom, GameSettings, RoomHistoryEntry } from '../../types';
import { WelcomeScreen } from '../screens/WelcomeScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { ProfileSetupScreen } from '../screens/ProfileSetupScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { StoreScreen } from '../screens/StoreScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { AvatarEditorScreen } from '../screens/AvatarEditorScreen';
import { RoomSelectionScreen } from '../screens/RoomSelectionScreen';
import { LobbyScreen } from '../screens/LobbyScreen';
import { WaitingRoomScreen } from '../screens/WaitingRoomScreen';
import { UploadScreen } from '../screens/UploadScreen';
import { DrawingScreen } from '../screens/DrawingScreen';
import { VotingScreen } from '../screens/VotingScreen';
import { ResultsScreen } from '../screens/ResultsScreen';
import { FinalResultsScreen } from '../screens/FinalResultsScreen';
import { StatsScreen } from '../screens/StatsScreen';
import { SabotageSelectionScreen } from '../screens/SabotageSelectionScreen';
import { LevelProgressScreen } from '../screens/LevelProgressScreen';
import { GalleryScreen } from '../screens/GalleryScreen';


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
    switch (currentScreen) {
        case 'welcome':
            return <WelcomeScreen onPlay={onPlayNow} onJoin={onJoinRoom} joiningRoomCode={joiningRoomCode} />;

        case 'login':
            return <LoginScreen onLogin={onLoginComplete} joiningRoomCode={joiningRoomCode} />;

        case 'name-entry':
            // Need AuthService? No, ProfileSetupScreen just returns data
            // onProfileComplete in App.tsx checks AuthService
            return <ProfileSetupScreen
                onComplete={onProfileComplete}
                initialName="" // We could pass this if we had it, but App.tsx handles sourcing it. 
            // Wait, App.tsx passes AuthService.getCurrentUser()?.username.
            // We might need to pass initialName as prop?
            />;

        case 'home':
            if (!player) return null;
            return <HomeScreen
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

        case 'gallery':
            return <GalleryScreen
                onBack={onBackToHome}
                showToast={showToast}
            />;

        case 'store':
            return <StoreScreen
                onBack={onStoreBack}
                onFontChange={onEquipTheme}
            />;


        case 'profile':
            if (!player) return null;
            return <ProfileScreen
                player={player}
                onBack={onBackToHome}
                onUpdateProfile={onUpdateProfile}
                onEditAvatar={() => onNavigate('avatar-editor')}
                onShowStats={() => onNavigate('stats')}
            />;

        case 'avatar-editor':
            if (!player) return null;
            return <AvatarEditorScreen
                player={player}
                onCancel={() => onNavigate('profile')}
                onSave={(strokes, color, frame, avatarImageUrl) => {
                    onUpdateProfile({ avatarStrokes: strokes, color, frame, avatarImageUrl });
                    onNavigate('profile');
                }}
            />;


        case 'room-selection':
            if (!player) return null;
            return <RoomSelectionScreen
                playerName={player.name}
                onCreateRoom={onCreateRoom}
                onJoinRoom={onJoinRoom}
                onBack={onBackToHome}
            />;

        case 'lobby':
            if (!room || !player) return null;
            return <LobbyScreen
                room={room}
                currentPlayerId={player.id}
                onStartGame={onStartGame}
                onSettingsChange={onSettingsChange}
                onLeave={onLeaveGame}
                onKick={onKickPlayer}
                onJoinGame={onJoinCurrentRound}
                onBack={onMinimizeGame}
            />;

        case 'waiting':
            if (!room || !player) return null;
            return <WaitingRoomScreen
                room={room}
                currentPlayerId={player.id}
                onJoinGame={onJoinCurrentRound}
            />;

        case 'uploading':
            if (!room || !player) return null;
            return <UploadScreen
                room={room}
                currentPlayerId={player.id}
                onUploadImage={onUploadImage}
            />;

        case 'drawing':
            // The complex one
            // If room.status is NOT drawing (but screen is), we might still want to show?
            // App.tsx logic: (currentScreen === 'drawing' || (room && room.status === 'drawing'))
            // We rely on currentScreen passed to us.
            if (!room || !player) return null;
            return renderDrawingLayout();

        case 'voting':
            if (!room || !player) return null;
            return <VotingScreen
                room={room}
                currentPlayerId={player.id}
                onVote={onVote}
                showToast={showToast}
                onShowSettings={onShowSettings}
            />;

        case 'results':
            if (!room || !player) return null;
            return <ResultsScreen
                room={room}
                currentPlayerId={player.id}
                player={player}
                onNextRound={onNextRound}
                showToast={showToast}
            />;

        case 'final':
            if (!room || !player) return null;
            return <FinalResultsScreen
                room={room}
                currentPlayerId={player.id}
                showToast={showToast}
                onShowRewards={onShowRewards}
            />;

        case 'sabotage-selection':
            if (!room || !player) return null;
            return <SabotageSelectionScreen
                players={room.players}
                saboteurId={room.saboteurId || ''}
                currentPlayerId={player.id}
                onSelect={onSabotageSelect}
            />;

        case 'stats':
            return <StatsScreen onBack={onBackToHome} />;

        case 'level-progress':
            if (!player) return null;
            return <LevelProgressScreen
                player={player}
                onBack={onBackToHome}
            />;

        default:
            return null;
    }
};
