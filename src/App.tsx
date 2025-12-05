import { useState, useEffect, useCallback, useRef } from 'react';
import { WelcomeScreen } from './components/screens/WelcomeScreen';
import { ProfileSetupScreen } from './components/screens/ProfileSetupScreen';
import { RoomSelectionScreen } from './components/screens/RoomSelectionScreen';
import { LobbyScreen } from './components/screens/LobbyScreen';
import { UploadScreen } from './components/screens/UploadScreen';
import { WaitingRoomScreen } from './components/screens/WaitingRoomScreen';
import { SettingsModal } from './components/common/SettingsModal';
import { VotingScreen } from './components/screens/VotingScreen';
import { ResultsScreen } from './components/screens/ResultsScreen';
import { FinalResultsScreen } from './components/screens/FinalResultsScreen';
import { StorageService } from './services/storage';
import { ImageService } from './services/image';
import { useRoom } from './hooks/useRoom';
import { GameCanvas } from './components/game/GameCanvas';
import { Toolbar } from './components/game/Toolbar';
import { Timer } from './components/game/Timer';
import { HowToPlayModal } from './components/game/HowToPlayModal';
import { Toast } from './components/common/Toast';
import type { Player, DrawingStroke, GameSettings, PlayerDrawing } from './types';

type Screen = 'welcome' | 'name-entry' | 'room-selection' | 'lobby' | 'waiting' | 'uploading' | 'drawing' | 'voting' | 'results' | 'final';

interface ToastState {
  message: string;
  type: 'error' | 'success' | 'info';
}

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('welcome');
  const [player, setPlayer] = useState<Player | null>(null);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Drawing State
  const [brushColor, setBrushColor] = useState('#FF69B4');
  const [brushSize, setBrushSize] = useState(12);
  const [strokes, setStrokes] = useState<DrawingStroke[]>([]);
  const strokesRef = useRef<DrawingStroke[]>([]);
  const [isMyTimerRunning, setIsMyTimerRunning] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [isEraser, setIsEraser] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Keep ref in sync with state
  useEffect(() => {
    strokesRef.current = strokes;
  }, [strokes]);

  const { room } = useRoom(roomCode, player?.id || null);

  const showToast = useCallback((message: string, type: 'error' | 'success' | 'info' = 'error') => {
    setToast({ message, type });
  }, []);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  // Restore session and room
  useEffect(() => {
    const session = StorageService.getSession();
    if (session) {
      setPlayer(session);
      setCurrentScreen('room-selection');
    }
  }, []);

  // Sync screen with room status
  useEffect(() => {
    if (!room) return;

    // Check if I am waiting
    const isWaiting = room.waitingPlayers?.some(p => p.id === player?.id);
    if (isWaiting) {
      if (currentScreen !== 'waiting') setCurrentScreen('waiting');
      return;
    }

    switch (room.status) {
      case 'lobby':
        if (currentScreen !== 'lobby' && currentScreen !== 'welcome' &&
          currentScreen !== 'name-entry' && currentScreen !== 'room-selection') {
          setCurrentScreen('lobby');
          // Reset drawing state for new round
          setStrokes([]);
          setIsMyTimerRunning(false);
        }
        break;
      case 'uploading':
        if (currentScreen !== 'uploading' && currentScreen !== 'waiting') {
          // Show loading for 2 seconds before switching
          setIsLoading(true);
          setTimeout(() => {
            setIsLoading(false);
            setCurrentScreen('uploading');
          }, 2000);
        }
        break;
      case 'drawing':
        if (currentScreen === 'lobby' || currentScreen === 'uploading' || currentScreen === 'waiting') {
          setCurrentScreen('drawing');
          setStrokes([]);
          setIsMyTimerRunning(false);
        }
        break;
      case 'voting':
        setCurrentScreen('voting');
        break;
      case 'results':
        setCurrentScreen('results');
        break;
      case 'final':
        setCurrentScreen('final');
        // Update history with winner
        if (room.scores) {
          const winnerId = Object.entries(room.scores).sort(([, a], [, b]) => b - a)[0]?.[0];
          const winner = room.players.find(p => p.id === winnerId);
          if (winner) {
            StorageService.updateHistoryWinner(room.roomCode, winner.name);
          }
        }
        break;
    }
  }, [room?.status, currentScreen, room?.waitingPlayers, player?.id]);

  const handlePlayNow = () => {
    if (player) {
      setCurrentScreen('room-selection');
    } else {
      setCurrentScreen('name-entry');
    }
  };

  const handleProfileComplete = (profileData: Omit<Player, 'id' | 'joinedAt' | 'lastSeen'>) => {
    const newPlayer: Player = {
      id: crypto.randomUUID(),
      ...profileData,
      joinedAt: Date.now(),
      lastSeen: Date.now()
    };
    StorageService.saveSession(newPlayer);
    setPlayer(newPlayer);
    setCurrentScreen('room-selection');
  };

  const handleUpdateProfile = (profileData: Partial<Player>) => {
    if (!player) return;
    const updatedPlayer = { ...player, ...profileData };
    setPlayer(updatedPlayer);
    StorageService.saveSession(updatedPlayer);

    // If in a room, update player info in room
    if (roomCode) {
      StorageService.joinRoom(roomCode, updatedPlayer);
    }
  };

  const handleCreateRoom = async () => {
    if (!player) return;
    setIsLoading(true);
    try {
      const code = await StorageService.createRoom(player);
      setRoomCode(code);
      setCurrentScreen('lobby');
      showToast('Room created! Share the code! 🎉', 'success');
    } catch (err) {
      console.error('Failed to create room:', err);
      showToast('Failed to create room 😅', 'error');
    }
    setIsLoading(false);
  };

  const handleJoinRoom = async (code: string) => {
    if (!player) return;
    setIsLoading(true);
    try {
      const room = await StorageService.joinRoom(code.toUpperCase(), player);
      if (room) {
        setRoomCode(code.toUpperCase());
        setCurrentScreen('lobby');
        showToast('Joined room! 🎮', 'success');
      } else {
        showToast('Room not found! Check the code 🔍', 'error');
      }
    } catch (err) {
      console.error('Failed to join room:', err);
      showToast('Failed to join room 😅', 'error');
    }
    setIsLoading(false);
  };

  const handleSettingsChange = async (settings: Partial<GameSettings>) => {
    if (!roomCode) return;
    try {
      await StorageService.updateSettings(roomCode, settings);
    } catch (err) {
      console.error('Failed to update settings:', err);
      showToast('Failed to update settings', 'error');
    }
  };

  const handleStartGame = async () => {
    if (!roomCode) return;
    try {
      await StorageService.initiateRound(roomCode);
    } catch (err) {
      console.error('Failed to start game:', err);
      showToast('Failed to start game 😅', 'error');
    }
  };

  const handleUploadImage = async (file: File) => {
    if (!roomCode || !player) return;
    setIsLoading(true);
    try {
      const imageUrl = await ImageService.processImage(file);
      await StorageService.startRound(roomCode, imageUrl, player.id);
      showToast('Round started! 🎨', 'success');
    } catch (err) {
      console.error('Failed to start round:', err);
      showToast('Failed to start round 😅', 'error');
    }
    setIsLoading(false);
  };

  const handleReady = async () => {
    if (!roomCode || !player) return;
    try {
      await StorageService.playerReady(roomCode, player.id);
      setIsMyTimerRunning(true);
      setShowHowToPlay(false);
    } catch (err) {
      console.error('Failed to mark ready:', err);
      showToast('Failed to start drawing 😅', 'error');
    }
  };

  const handleTimeUp = useCallback(async () => {
    if (!roomCode || !player || !room) return;

    setIsMyTimerRunning(false);

    const currentStrokes = strokesRef.current;
    const validStrokes = currentStrokes.filter(s => s && Array.isArray(s.points) && s.points.length > 0);

    const drawing: PlayerDrawing = {
      playerId: player.id,
      playerName: player.name,
      playerColor: player.color,
      strokes: validStrokes,
      submittedAt: Date.now()
    };

    try {
      await StorageService.submitDrawing(roomCode, drawing);
      showToast('Drawing submitted! ✅', 'success');
    } catch (err) {
      console.error('Failed to submit drawing:', err);
      showToast('Failed to submit drawing 😅', 'error');
    }
  }, [roomCode, player, room, showToast]);

  const handleVote = async (votedForId: string) => {
    if (!roomCode || !player) return;
    try {
      await StorageService.submitVote(roomCode, player.id, votedForId);
      showToast('Vote submitted! 🗳️', 'success');
    } catch (err) {
      console.error('Failed to vote:', err);
      showToast('Failed to vote 😅', 'error');
    }
  };

  const handleNextRound = async () => {
    if (!roomCode) return;
    try {
      await StorageService.nextRound(roomCode);
    } catch (err) {
      console.error('Failed to start next round:', err);
      showToast('Failed to start next round 😅', 'error');
    }
  };

  const handlePlayAgain = async () => {
    if (!roomCode) return;
    try {
      await StorageService.resetGame(roomCode);
    } catch (err) {
      console.error('Failed to reset game:', err);
      showToast('Failed to reset game 😅', 'error');
    }
  };

  const handleUndo = () => {
    setStrokes(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setStrokes([]);
  };

  const handleEraserToggle = () => {
    setIsEraser(prev => !prev);
  };

  const handleLeaveGame = async () => {
    if (!roomCode || !player) return;
    try {
      await StorageService.removePlayerFromRoom(roomCode, player.id);
      StorageService.leaveRoom(); // Clears local storage
      setRoomCode(null);
      setCurrentScreen('room-selection');
      showToast('Left game 👋', 'info');
    } catch (err) {
      console.error('Failed to leave game:', err);
      showToast('Failed to leave game', 'error');
    }
  };

  const handleEndGame = async () => {
    if (!roomCode) return;
    try {
      await StorageService.resetGame(roomCode);
      showToast('Game ended 🛑', 'info');
    } catch (err) {
      console.error('Failed to end game:', err);
      showToast('Failed to end game', 'error');
    }
  };

  // Get my player state
  const myPlayerState = room?.playerStates?.[player?.id || ''];
  const hasSubmitted = myPlayerState?.status === 'submitted';
  const timerEndsAt = myPlayerState?.timerStartedAt
    ? myPlayerState.timerStartedAt + (room?.settings?.timerDuration || 15) * 1000
    : null;

  // Count submitted players
  const submittedCount = room ? Object.values(room.playerStates || {}).filter(s => s.status === 'submitted').length : 0;
  const totalPlayers = room?.players?.length || 0;

  return (
    <div>
      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}

      {/* Settings Button - Show on all screens except welcome/name-entry */}
      {player && currentScreen !== 'welcome' && currentScreen !== 'name-entry' && (
        <button
          onClick={() => setShowSettings(true)}
          className="fixed top-4 left-4 z-50 bg-white/90 backdrop-blur-sm p-3 rounded-xl shadow-lg border-2 border-purple-200 hover:border-purple-500 transition-all hover:scale-110"
          title="Settings"
        >
          ⚙️
        </button>
      )}

      {/* Settings Modal */}
      {showSettings && player && (
        <SettingsModal
          player={player}
          roomCode={roomCode}
          isHost={room?.hostId === player.id}
          onClose={() => setShowSettings(false)}
          onUpdateProfile={handleUpdateProfile}
          onLeaveGame={roomCode ? handleLeaveGame : undefined}
          onEndGame={roomCode ? handleEndGame : undefined}
        />
      )}

      {/* How To Play Modal */}
      <HowToPlayModal isOpen={showHowToPlay} onClose={() => setShowHowToPlay(false)} />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="text-6xl animate-bounce">🎨</div>
        </div>
      )}

      {/* Screens */}
      {currentScreen === 'welcome' && (
        <WelcomeScreen onPlay={handlePlayNow} />
      )}

      {currentScreen === 'name-entry' && (
        <ProfileSetupScreen
          onComplete={handleProfileComplete}
        />
      )}

      {currentScreen === 'room-selection' && player && (
        <RoomSelectionScreen
          playerName={player.name}
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          onBack={() => setCurrentScreen('name-entry')}
        />
      )}

      {currentScreen === 'lobby' && (
        room && player ? (
          <LobbyScreen
            room={room}
            currentPlayerId={player.id}
            onStartGame={handleStartGame}
            onSettingsChange={handleSettingsChange}
          />
        ) : (
          <div className="fixed inset-0 bg-90s-animated flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="text-6xl animate-bounce">⏳</div>
              <div className="text-2xl font-bold text-white drop-shadow-md">Loading Room...</div>
            </div>
          </div>
        )
      )}

      {currentScreen === 'waiting' && room && player && (
        <WaitingRoomScreen
          room={room}
          currentPlayerId={player.id}
        />
      )}

      {currentScreen === 'uploading' && room && player && (
        <UploadScreen
          room={room}
          currentPlayerId={player.id}
          onUploadImage={handleUploadImage}
        />
      )}

      {/* Drawing Screen */}
      {currentScreen === 'drawing' && room && room.currentImage && player && (
        <div className="fixed inset-0 bg-90s-animated overflow-hidden">
          <div className="h-full w-full flex flex-col p-4 pb-0">

            {/* Top Bar */}
            <div className="flex-shrink-0 flex items-center justify-between gap-2 mb-4 z-20">
              {/* Progress */}
              <div className="bg-white/95 backdrop-blur-sm px-4 py-2 rounded-xl pop-in ml-16"
                style={{ boxShadow: '0 4px 0 rgba(155, 89, 182, 0.3)', border: '3px solid #9B59B6' }}>
                <span className="font-bold text-purple-600">
                  Round {room.roundNumber}/{room.settings.totalRounds}
                </span>
                <span className="ml-3 text-gray-500">
                  {submittedCount}/{totalPlayers} drawn
                </span>
              </div>

              {/* Timer or Status */}
              {hasSubmitted ? (
                <div className="bg-green-500 text-white px-4 py-2 rounded-xl font-bold">
                  ✓ Submitted!
                </div>
              ) : isMyTimerRunning && timerEndsAt ? (
                <div className="scale-75 origin-right">
                  <Timer endsAt={timerEndsAt} onTimeUp={handleTimeUp} />
                </div>
              ) : null}
            </div>

            {/* Image Container */}
            <div className="flex-1 min-h-0 flex items-center justify-center p-2">
              <div className="relative aspect-square w-full max-w-[min(100%,calc(100vh-200px))]"
                style={{
                  borderRadius: '1.5rem',
                  overflow: 'hidden',
                  boxShadow: '0 10px 0 rgba(155, 89, 182, 0.4)',
                  border: '5px solid white'
                }}>
                {/* Base Image */}
                <img
                  src={room.currentImage.url}
                  alt="Round image"
                  className="absolute inset-0 w-full h-full object-cover"
                />

                {/* Block Overlay */}
                {room.block && (
                  <div
                    className="absolute bg-white"
                    style={{
                      left: `${room.block.x}%`,
                      top: `${room.block.y}%`,
                      width: `${room.block.size}%`,
                      height: `${room.block.size}%`,
                      borderRadius: room.block.type === 'circle' ? '50%' : '8px',
                      boxShadow: 'inset 0 0 20px rgba(0,0,0,0.1)'
                    }}
                  />
                )}

                {/* Drawing Canvas - Only when timer running */}
                {isMyTimerRunning && !hasSubmitted && (
                  <GameCanvas
                    imageUrl={room.currentImage.url}
                    brushColor={isEraser ? '#FFFFFF' : brushColor}
                    brushSize={isEraser ? brushSize * 2 : brushSize}
                    isDrawingEnabled={true}
                    strokes={strokes}
                    onStrokesChange={setStrokes}
                    isEraser={isEraser}
                  />
                )}

                {/* Show "waiting" overlay if not ready */}
                {!isMyTimerRunning && !hasSubmitted && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-30">
                    <div className="bg-white rounded-3xl p-8 text-center max-w-sm mx-4 shadow-2xl pop-in border-4 border-purple-500">
                      <div className="text-6xl mb-4 animate-bounce">🎨</div>
                      <h3 className="text-2xl font-bold text-purple-600 mb-2">It's Drawing Time!</h3>
                      <p className="text-gray-500 mb-6">You have {room.settings.timerDuration} seconds to draw.</p>
                      <button
                        onClick={handleReady}
                        className="w-full btn-90s bg-gradient-to-r from-lime-400 to-emerald-500 text-white px-8 py-4 rounded-xl font-bold text-xl jelly-hover shadow-lg"
                      >
                        I'M READY! 🚀
                      </button>
                    </div>
                  </div>
                )}

                {/* Show "submitted" overlay */}
                {hasSubmitted && (
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <div className="bg-white rounded-2xl p-6 text-center">
                      <div className="text-4xl mb-2">✅</div>
                      <p className="font-bold text-green-600">Drawing submitted!</p>
                      <p className="text-gray-500 text-sm mt-1">Waiting for others...</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Toolbar - Only when timer running */}
            {isMyTimerRunning && !hasSubmitted && (
              <div className="flex-shrink-0 py-3 safe-area-bottom flex justify-center">
                <Toolbar
                  brushColor={brushColor}
                  brushSize={brushSize}
                  isEraser={isEraser}
                  onColorChange={setBrushColor}
                  onSizeChange={setBrushSize}
                  onEraserToggle={handleEraserToggle}
                  onUndo={handleUndo}
                  onClear={handleClear}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Voting Screen */}
      {currentScreen === 'voting' && room && player && (
        <VotingScreen
          room={room}
          currentPlayerId={player.id}
          onVote={handleVote}
        />
      )}

      {/* Results Screen */}
      {currentScreen === 'results' && room && player && (
        <ResultsScreen
          room={room}
          currentPlayerId={player.id}
          onNextRound={handleNextRound}
        />
      )}

      {/* Final Results Screen */}
      {currentScreen === 'final' && room && player && (
        <FinalResultsScreen
          room={room}
          currentPlayerId={player.id}
          onPlayAgain={handlePlayAgain}
        />
      )}
    </div>
  );
}

export default App;
