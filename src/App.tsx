import { useState, useEffect, useCallback } from 'react';
import { WelcomeScreen } from './components/screens/WelcomeScreen';
import { NameEntryScreen } from './components/screens/NameEntryScreen';
import { RoomSelectionScreen } from './components/screens/RoomSelectionScreen';
import { LobbyScreen } from './components/screens/LobbyScreen';
import { StorageService } from './services/storage';
import { ImageService } from './services/image';
import { useRoom } from './hooks/useRoom';
import { GameCanvas } from './components/game/GameCanvas';
import { Toolbar } from './components/game/Toolbar';
import { Timer } from './components/game/Timer';
import { ReviewScreen } from './components/screens/ReviewScreen';
import { HowToPlayModal } from './components/game/HowToPlayModal';
import { Toast } from './components/common/Toast';
import type { Player, DrawingStroke } from './types';

type Screen = 'welcome' | 'name-entry' | 'room-selection' | 'lobby' | 'game' | 'review';

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

  // Game State
  const [brushColor, setBrushColor] = useState('#FF69B4');
  const [brushSize, setBrushSize] = useState(8);
  const [strokes, setStrokes] = useState<DrawingStroke[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);

  const { room } = useRoom(roomCode, player?.id || null);

  const showToast = useCallback((message: string, type: 'error' | 'success' | 'info' = 'error') => {
    setToast({ message, type });
  }, []);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  // Restore session
  useEffect(() => {
    const session = StorageService.getSession();
    if (session) {
      setPlayer(session);
      setCurrentScreen('room-selection');
    }
  }, []);

  const handlePlayNow = () => {
    if (player) {
      setCurrentScreen('room-selection');
    } else {
      setCurrentScreen('name-entry');
    }
  };

  const handleNameSubmit = (name: string) => {
    const newPlayer: Player = {
      id: crypto.randomUUID(),
      name,
      color: '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0'),
      joinedAt: Date.now(),
      lastSeen: Date.now(),
    };
    setPlayer(newPlayer);
    StorageService.saveSession(newPlayer);
    setCurrentScreen('room-selection');
  };

  const handleCreateRoom = async () => {
    if (!player) return;
    setIsLoading(true);
    try {
      const code = StorageService.generateRoomCode();
      await StorageService.createRoom(code, player);
      setRoomCode(code);
      setCurrentScreen('lobby');
      showToast('Room created! Share the code with friends! 🎉', 'success');
    } catch (err) {
      showToast('Failed to create room. Try again! 😅', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinRoom = async (code: string) => {
    if (!player) return;
    setIsLoading(true);
    try {
      const joinedRoom = await StorageService.joinRoom(code, player);
      if (joinedRoom) {
        setRoomCode(code);
        setCurrentScreen('lobby');
        showToast('Joined room successfully! 🎮', 'success');
      } else {
        showToast('Room not found! Check the code and try again 🔍', 'error');
      }
    } catch (err) {
      showToast('Failed to join room. Try again! 😅', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadImage = async (file: File) => {
    if (!roomCode || !player) return;
    setIsLoading(true);
    try {
      const base64 = await ImageService.processImage(file);
      await StorageService.updateRoom(roomCode, (r) => ({
        ...r,
        currentImage: {
          url: base64,
          uploadedBy: player.id,
          uploadedAt: Date.now()
        },
        status: 'annotating',
        turnOrder: r.players.map(p => p.id),
        currentTurnIndex: 0,
        turnStatus: 'waiting',
        roundStartedAt: Date.now(),
      }));
      showToast('Image uploaded! Game starting! 🖼️', 'success');
    } catch (err) {
      showToast('Failed to upload image! Try a smaller file 📸', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToName = () => {
    setCurrentScreen('name-entry');
  };

  const handleTimeUp = async () => {
    setIsDrawing(false);
    if (roomCode && player) {
      const newAnnotation = {
        playerId: player.id,
        playerName: player.name,
        playerColor: player.color,
        roundNumber: room?.roundNumber || 0,
        drawingData: strokes,
        submittedAt: Date.now()
      };
      try {
        await StorageService.endTurn(roomCode, newAnnotation);
      } catch (err) {
        console.error('Failed to end turn:', err);
      }
    }
  };

  const handleReady = async () => {
    if (roomCode) {
      try {
        await StorageService.startTurn(roomCode);
      } catch (err) {
        showToast('Failed to start turn. Try again!', 'error');
      }
    }
  };

  const handleUndo = () => {
    setStrokes(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setStrokes([]);
  };

  const handleNextRound = async () => {
    if (roomCode) {
      try {
        await StorageService.updateRoom(roomCode, (r) => ({
          ...r,
          status: 'lobby',
          currentImage: undefined,
          roundNumber: r.roundNumber + 1,
          annotations: [],
        }));
      } catch (err) {
        showToast('Failed to start next round. Try again!', 'error');
      }
    }
  };

  // Auto-transition to game when status changes
  useEffect(() => {
    if (room?.status === 'annotating' && currentScreen === 'lobby') {
      setCurrentScreen('game');
      setStrokes([]);
      setShowHowToPlay(true);
    } else if (room?.status === 'reviewing' && currentScreen === 'game') {
      setCurrentScreen('review');
    } else if (room?.status === 'lobby' && currentScreen === 'review') {
      setCurrentScreen('lobby');
    }
  }, [room?.status, currentScreen]);

  // Sync isDrawing with turn status
  useEffect(() => {
    if (currentScreen === 'game' && room && player) {
      const isMyTurn = room.turnOrder[room.currentTurnIndex] === player.id;
      const isDrawingPhase = room.turnStatus === 'drawing';
      setIsDrawing(isMyTurn && isDrawingPhase);
    }
  }, [room?.turnStatus, room?.currentTurnIndex, currentScreen, player]);

  const isMyTurn = room && player && room.turnOrder[room.currentTurnIndex] === player.id;
  const currentPlayerName = room && room.players.find(p => p.id === room.turnOrder[room.currentTurnIndex])?.name;

  return (
    <div className="antialiased font-sans">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center">
          <div className="bg-white rounded-2xl p-8 text-center pop-in"
            style={{
              boxShadow: '0 10px 0 rgba(155, 89, 182, 0.3)',
              border: '4px solid #FF69B4'
            }}>
            <div className="text-5xl animate-bounce mb-4">⏳</div>
            <div className="text-xl font-bold text-purple-600">Loading...</div>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
          duration={3000}
        />
      )}

      <HowToPlayModal isOpen={showHowToPlay} onClose={() => setShowHowToPlay(false)} />

      {currentScreen === 'welcome' && (
        <WelcomeScreen onPlay={handlePlayNow} />
      )}

      {currentScreen === 'name-entry' && (
        <NameEntryScreen onContinue={handleNameSubmit} />
      )}

      {currentScreen === 'room-selection' && player && (
        <RoomSelectionScreen
          playerName={player.name}
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          onBack={handleBackToName}
        />
      )}

      {currentScreen === 'lobby' && room && player && (
        <LobbyScreen
          room={room}
          currentPlayerId={player.id}
          onUploadImage={handleUploadImage}
        />
      )}

      {currentScreen === 'game' && room && room.currentImage && (
        <div className="fixed inset-0 bg-90s-animated flex flex-col">
          {/* Main Game Area */}
          <div className="flex-1 relative flex items-center justify-center p-4 overflow-hidden">
            <div className="relative w-full max-w-4xl aspect-[4/3] max-h-[80vh]"
              style={{
                borderRadius: '2rem',
                overflow: 'hidden',
                boxShadow: '0 15px 0 rgba(155, 89, 182, 0.4), 0 30px 60px rgba(0, 0, 0, 0.3)',
                border: '6px solid transparent',
                backgroundImage: 'linear-gradient(white, white), linear-gradient(135deg, #FF69B4, #9B59B6, #00D9FF)',
                backgroundOrigin: 'border-box',
                backgroundClip: 'padding-box, border-box'
              }}>
              <GameCanvas
                imageUrl={room.currentImage.url}
                brushColor={brushColor}
                brushSize={brushSize}
                isDrawingEnabled={isDrawing}
                onStrokesChange={setStrokes}
              />

              {/* Turn Info Overlay */}
              <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none">
                <div className="bg-white/95 backdrop-blur-sm px-5 py-3 rounded-2xl pop-in"
                  style={{
                    boxShadow: '0 6px 0 rgba(155, 89, 182, 0.3), 0 12px 24px rgba(0, 0, 0, 0.15)',
                    border: '3px solid #FF69B4'
                  }}>
                  <div className="text-sm text-pink-400 font-bold">🎮 Current Turn</div>
                  <div className="font-bold text-xl"
                    style={{
                      background: 'linear-gradient(135deg, #FF69B4, #9B59B6)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent'
                    }}>
                    {isMyTurn ? "✨ It's your turn! ✨" : `${currentPlayerName}'s turn`}
                  </div>
                </div>

                {isMyTurn && room.turnStatus === 'drawing' && (
                  <div className="pointer-events-auto">
                    <Timer
                      endsAt={room.turnEndsAt || Date.now() + 10000}
                      onTimeUp={handleTimeUp}
                    />
                  </div>
                )}
              </div>

              {/* Ready Button Overlay */}
              {isMyTurn && room.turnStatus === 'waiting' && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-10">
                  <div className="bg-white p-10 rounded-[2rem] text-center space-y-6 max-w-sm mx-4 pop-in"
                    style={{
                      boxShadow: '0 15px 0 rgba(155, 89, 182, 0.4), 0 30px 60px rgba(0, 0, 0, 0.3)',
                      border: '5px solid transparent',
                      backgroundImage: 'linear-gradient(white, white), linear-gradient(135deg, #32CD32, #00D9FF, #9B59B6)',
                      backgroundOrigin: 'border-box',
                      backgroundClip: 'padding-box, border-box'
                    }}>
                    <div className="text-7xl bounce-scale">🎨</div>
                    <div>
                      <h3 className="text-3xl font-bold"
                        style={{
                          background: 'linear-gradient(135deg, #32CD32, #00D9FF)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent'
                        }}>
                        It's Your Turn!
                      </h3>
                      <p className="text-lg text-gray-500 font-medium mt-2">You have 10 seconds to draw! ⏱️</p>
                    </div>
                    <button
                      onClick={handleReady}
                      className="w-full btn-90s bg-gradient-to-r from-lime-400 via-cyan-400 to-purple-500 text-white font-bold text-2xl py-5 jelly-hover"
                    >
                      🚀 READY! 🚀
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Toolbar Area */}
          <div className="p-4 safe-area-bottom">
            <Toolbar
              brushColor={brushColor}
              brushSize={brushSize}
              onColorChange={setBrushColor}
              onSizeChange={setBrushSize}
              onUndo={handleUndo}
              onClear={handleClear}
            />
          </div>
        </div>
      )}

      {currentScreen === 'review' && room && player && (
        <ReviewScreen
          room={room}
          currentPlayerId={player.id}
          onNextRound={handleNextRound}
        />
      )}
    </div>
  );
}

export default App;
