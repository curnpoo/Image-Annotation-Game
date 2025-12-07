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
import { Timer } from '../game/Timer';

interface ScreenRouterProps {
    currentScreen: Screen;
    player: Player | null;
    room: GameRoom | null;

    // Auth/Profile Handlers
    onPlayNow: () => void;
    onLoginComplete: () => void;
    onProfileComplete: (data: any) => void;
    onUpdateProfile: (updates: any) => void;

    // Home Handlers
    onShowCasino: () => void;
    onShowSettings: () => void;
    onRejoin: (code: string) => void;

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

    // Store
    onEquipTheme: (themeId?: string) => void;

    // Drawing Specifics
    isMyTimerRunning: boolean;
    isReadying: boolean;
    onReady: () => void;
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
    onTimeUp: () => void;
}

export const ScreenRouter: React.FC<ScreenRouterProps> = ({
    currentScreen,
    player,
    room,
    onPlayNow,
    onLoginComplete,
    onProfileComplete,
    onUpdateProfile,
    onShowCasino,
    onShowSettings,
    onRejoin,
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
    onPlayAgain,
    onEquipTheme,
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
    strokes,
    lastGameDetails,
    showToast,
    hasSubmitted,
    submittedCount,
    totalPlayers,
    timerEndsAt,
    onTimeUp
}) => {

    // Helper to render Drawing Layout (wrapper)
    const renderDrawingLayout = () => {
        if (!room || !player) return null;
        return (
            <div className="fixed inset-0 overflow-hidden">
                <div
                    className="h-full w-full flex flex-col p-4 pb-0"
                    style={{
                        paddingTop: 'max(1rem, env(safe-area-inset-top) + 0.5rem)',
                        paddingBottom: 'max(0rem, env(safe-area-inset-bottom))'
                    }}
                >
                    {/* Top Info Bar - Relative Layout */}
                    <div className="w-full flex justify-between items-start px-2 z-20 pointer-events-none mb-2 shrink-0">
                        <div className="flex flex-col gap-2 w-full">
                            <div className="flex justify-between w-full">
                                {/* Settings Button - Handled in App.tsx overlay? Or duplicated here? */}
                                {/* App.tsx has a global settings button, but Drawing phase layout has its own in structure? 
                      In App.tsx line 1155 it renders a Settings button logic specific to drawing view?
                      Yes, lines 1154-1160. So we replicate it here.
                   */}
                                <button
                                    onClick={onShowSettings}
                                    className="bg-white p-3 rounded-2xl shadow-lg hover:scale-105 active:scale-95 transition-all w-12 h-12 flex items-center justify-center pointer-events-auto border-2 border-gray-100"
                                >
                                    ⚙️
                                </button>

                                {/* Timer or Status */}
                                <div className="pointer-events-auto">
                                    {hasSubmitted ? (
                                        <div className="bg-green-500 text-white px-4 py-2 rounded-xl font-bold">
                                            ✓ Submitted!
                                        </div>
                                    ) : isMyTimerRunning ? (
                                        /* Timer Import? Need to import Timer component */
                                        /* We will import Timer at top */
                                        <div className="scale-90 origin-right">
                                            {/* Timer component logic needs to be verified. Does it exist? Yes in App.tsx imports */}
                                            {/* We need to pass props to Router or import Timer here */}
                                            <Timer endsAt={timerEndsAt || Date.now()} onTimeUp={onTimeUp} />
                                        </div>
                                    ) : null}
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="bg-white/95 backdrop-blur-sm px-4 py-2 rounded-xl flex items-center justify-between gap-2 shadow-sm border-2 border-purple-200 self-center"
                                style={{ width: 'fit-content' }}>
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
                        </div>
                    </div>

                    {/* Drawing Screen Component */}
                    <DrawingScreen
                        room={room}
                        player={player}
                        isMyTimerRunning={isMyTimerRunning}
                        isReadying={isReadying}
                        onReady={onReady}
                        brushColor={brushColor}
                        brushSize={brushSize}
                        isEraser={isEraser}
                        isEyedropper={isEyedropper}
                        setBrushColor={setBrushColor}
                        setBrushSize={setBrushSize}
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
        );
    };

    // Main Switch
    switch (currentScreen) {
        case 'welcome':
            return <WelcomeScreen onPlay={onPlayNow} />;

        case 'login':
            return <LoginScreen onLogin={onLoginComplete} />;

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
                onPlay={() => onNavigate('room-selection')}
                onCasino={onShowCasino}
                onStore={() => onNavigate('store')}
                onProfile={() => onNavigate('profile')}
                onSettings={onShowSettings}
                lastGameDetails={lastGameDetails ? {
                    ...lastGameDetails,
                    hostName: lastGameDetails.hostName || 'Unknown',
                    playerCount: lastGameDetails.playerCount || 0
                } : null}
                onRejoin={onRejoin}
            />;

        case 'store':
            return <StoreScreen
                onBack={onStoreBack}
                onEquip={onEquipTheme}
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
                onSave={(strokes, color, frame) => {
                    onUpdateProfile({ avatarStrokes: strokes, color, frame });
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
                onPlayAgain={onPlayAgain}
                onGoHome={onLeaveGame}
                showToast={showToast}
            />;

        case 'stats':
            return <StatsScreen onBack={onBackToHome} />;

        default:
            return null;
    }
};
