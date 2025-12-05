import { useState, useEffect, useCallback, useRef } from 'react';
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
  const strokesRef = useRef<DrawingStroke[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);

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
      console.log('Creating room with code:', code);
      await StorageService.createRoom(code, player);
      console.log('Room created successfully');
      setRoomCode(code);
      setCurrentScreen('lobby');
      showToast('Room created! Share the code with friends! 🎉', 'success');
    } catch (err) {
      console.error('Failed to create room:', err);
      showToast('Failed to create room. Check console for details 😅', 'error');
    }
    setIsLoading(false);
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

  const handleTimeUp = useCallback(async () => {
    if (!room || !player || !roomCode) return;

    // Only the current player should trigger the end turn
    const isMyTurn = room.turnOrder[room.currentTurnIndex] === player.id;
    if (isMyTurn && room.turnStatus === 'drawing') {
      console.log('Time up! Preparing to end turn...');
      setIsDrawing(false);

      // Use ref to get latest strokes (avoids stale closure)
      const currentStrokes = strokesRef.current;

      // Sanitize strokes to ensure no invalid data is sent to Firebase
      const validStrokes = currentStrokes.filter(s => s && Array.isArray(s.points) && s.points.length > 0);

      console.log(`Submitting ${validStrokes.length} strokes (filtered from ${currentStrokes.length})`);

      const newAnnotation = {
        playerId: player.id,
        playerName: player.name,
        playerColor: player.color,
        roundNumber: room.roundNumber || 0,
        drawingData: validStrokes,
        submittedAt: Date.now()
      };

      try {
        console.log('Calling StorageService.endTurn with:', JSON.stringify(newAnnotation, null, 2));
        await StorageService.endTurn(roomCode, newAnnotation);
        console.log('Turn submitted successfully!');
      } catch (err) {
        console.error('Failed to end turn. Error details:', err);
        // @ts-ignore
        if (err.message) console.error('Error message:', err.message);
        // @ts-ignore
        if (err.stack) console.error('Error stack:', err.stack);

        showToast('Failed to submit turn. Check console for details.', 'error');
      }
    }
  }, [room, player, roomCode, showToast]); // Removed strokes dependency since we use ref

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

      {currentScreen === 'lobby' && player && (
        room ? (
          <LobbyScreen
            room={room}
            currentPlayerId={player.id}
            onUploadImage={handleUploadImage}
          />
        ) : (
          <div className="min-h-screen bg-90s-animated flex items-center justify-center">
            <div className="bg-white rounded-[2rem] p-8 text-center pop-in"
              style={{
                boxShadow: '0 15px 0 rgba(155, 89, 182, 0.3)',
                border: '5px solid #FF69B4'
              }}>
              <div className="text-6xl animate-bounce mb-4">🎮</div>
              <div className="text-2xl font-bold text-purple-600">Setting up room...</div>
              <div className="text-gray-500 mt-2">Just a moment!</div>
            </div>
          </div>
        )
      )}

      {currentScreen === 'game' && room && room.currentImage && (
        <div className="fixed inset-0 bg-90s-animated flex flex-col">
          {/* Main Game Area */}
          <div className="flex-1 relative flex flex-col items-center justify-center p-4 overflow-hidden">

            {/* Top Bar with Turn Info, Timer, and Ready Button */}
            <div className="w-full max-w-4xl flex justify-between items-center mb-4 px-4 z-20 gap-4">
              {/* Turn Info / Ready Status */}
              <div className="bg-white/95 backdrop-blur-sm px-5 py-3 rounded-2xl pop-in flex items-center gap-4"
                style={{
                  boxShadow: '0 6px 0 rgba(155, 89, 182, 0.3), 0 12px 24px rgba(0, 0, 0, 0.15)',
                  border: '3px solid #FF69B4'
                }}>

                {isMyTurn && room.turnStatus === 'waiting' ? (
                  <div className="flex items-center gap-3">
                    <span className="text-2xl animate-bounce">🎨</span>
                    <div className="flex flex-col">
                      <span className="text-sm text-pink-400 font-bold">Your Turn!</span>
                      <span className="font-bold text-lg bg-clip-text text-transparent bg-gradient-to-r from-green-500 to-blue-500">
                        Ready to Draw?
                      </span>
                    </div>
                    <button
                      onClick={handleReady}
                      className="ml-2 btn-90s bg-gradient-to-r from-lime-400 to-emerald-500 text-white font-bold px-4 py-2 rounded-xl text-sm jelly-hover"
                    >
                      I'm Ready! 🚀
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="text-sm text-pink-400 font-bold">🎮 Current Turn</div>
                    <div className="font-bold text-xl ml-2"
                      style={{
                        background: 'linear-gradient(135deg, #FF69B4, #9B59B6)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                      }}>
                      {isMyTurn ? "✨ It's your turn! ✨" : `${currentPlayerName}'s turn`}
                    </div>
                  </>
                )}
              </div>

              {isMyTurn && room.turnStatus === 'drawing' && (
                <div className="scale-90 origin-right">
                  <Timer
                    endsAt={room.turnEndsAt || Date.now() + 10000}
                    onTimeUp={handleTimeUp}
                  />
                </div>
              )}
            </div>

            {/* Image Container */}
            <div className="relative w-full max-w-4xl aspect-[4/3] max-h-[70vh]"
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
            </div>
          </div>

          {/* Toolbar Area - Bottom on all devices */}
          <div className="p-4 safe-area-bottom w-full flex-shrink-0 flex items-center justify-center z-30">
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
