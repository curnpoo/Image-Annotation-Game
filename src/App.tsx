import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
import { CasinoScreen } from './components/screens/CasinoScreen';
import { HomeScreen } from './components/screens/HomeScreen';
import { StoreScreen } from './components/screens/StoreScreen';
import { ProfileScreen } from './components/screens/ProfileScreen';
import { LoginScreen } from './components/screens/LoginScreen';
import { AvatarEditorScreen } from './components/screens/AvatarEditorScreen';
import { AuthService } from './services/auth';
import { StorageService } from './services/storage';
import { ImageService } from './services/image';
import { XPService } from './services/xp';
import { StatsService } from './services/stats';
import { vibrate } from './utils/haptics';
import { useRoom } from './hooks/useRoom';
import { GameCanvas } from './components/game/GameCanvas';
import { Toolbar } from './components/game/Toolbar';
import { Timer } from './components/game/Timer';
import { HowToPlayModal } from './components/game/HowToPlayModal';
import { SaboteurPanel } from './components/game/SaboteurPanel';
import { SabotageOverlay } from './components/game/SabotageOverlay';
import { Toast } from './components/common/Toast';
import { LoadingScreen } from './components/common/LoadingScreen';
import { NotificationPromptModal } from './components/common/NotificationPromptModal';
import {
  notifyYourTurnToUpload,
  notifyDrawingPhaseStarted,
  notifyVotingStarted,
  notifyResultsReady,
  notifyFinalResults
} from './utils/notifications';
import { getThemeClass, getThemeVariables } from './utils/themes';
import { ThemeTransition } from './components/common/ThemeTransition';
import { requestPushPermission, storePushToken, isPushSupported } from './services/pushNotifications';

import type { Player, DrawingStroke, GameSettings, PlayerDrawing, GameRoom } from './types';

type Screen = 'welcome' | 'login' | 'name-entry' | 'home' | 'room-selection' | 'store' | 'profile' | 'avatar-editor' | 'lobby' | 'waiting' | 'uploading' | 'drawing' | 'voting' | 'results' | 'final';

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

  // Theme Transition Handler
  const handleTransitionComplete = () => {
    setIsTransitionActive(false);
  };

  // Drawing State
  const [brushColor, setBrushColor] = useState('#FF69B4');
  const [brushSize, setBrushSize] = useState(12);
  const [strokes, setStrokes] = useState<DrawingStroke[]>([]);
  const strokesRef = useRef<DrawingStroke[]>([]);
  const [isMyTimerRunning, setIsMyTimerRunning] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);

  const [isEraser, setIsEraser] = useState(false);
  const [isEyedropper, setIsEyedropper] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showCasino, setShowCasino] = useState(false);
  const [isTransitionActive, setIsTransitionActive] = useState(false); // New state for theme transition
  const [isLoadingTransition, setIsLoadingTransition] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isBrowsing, setIsBrowsing] = useState(false);
  const lastStatusRef = useRef<string | null>(null);
  const lastRoundRef = useRef<number | null>(null);
  const lastWaitingRef = useRef<boolean>(false);

  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);
  const [showGameEnded, setShowGameEnded] = useState(false);
  const [showKicked, setShowKicked] = useState(false);
  const [endGameCountdown, setEndGameCountdown] = useState(3);

  const [kickCountdown, setKickCountdown] = useState(3);
  const [isReadying, setIsReadying] = useState(false);

  const [lastGameDetails, setLastGameDetails] = useState<{
    roomCode: string;
    hostName: string;
    playerCount: number;
  } | null>(null);

  // Fetch last game details when on home screen
  useEffect(() => {
    const checkLastGame = async () => {
      const code = StorageService.getRoomCode();
      if (code && currentScreen === 'home') {
        const details = await StorageService.getRoomPreview(code);
        if (details) {
          setLastGameDetails({ ...details, roomCode: code });
        } else {
          setLastGameDetails(null);
        }
      } else {
        setLastGameDetails(null);
      }
    };

    checkLastGame();
  }, [currentScreen]);

  // Auth Redirect: If no player and not in auth flow, go to welcome
  useEffect(() => {
    if (!player && !isLoading && !isInitialLoading) {
      // Allow browsing store as guest? No, store requires player usually.
      // If we are deep in the app but have no player, kick out.
      if (!['welcome', 'login', 'name-entry'].includes(currentScreen)) {
        setCurrentScreen('welcome');
      }
    }
  }, [player, currentScreen, isLoading, isInitialLoading]);

  const handleGoHome = async () => {
    // Completely leave the game
    setRoomCode(null); // Stop listening in React
    StorageService.leaveRoom();
    setCurrentScreen('home');
  };

  const handleMinimizeGame = () => {
    // Just go to home screen but keep room connection alive
    setIsBrowsing(true);
    setCurrentScreen('home');
  };

  const handleResumeGame = () => {
    // Return to the active game screen
    setIsBrowsing(false);
    // The useEffect for room status will automatically route us to the correct screen
    // based on room.status
    if (room?.status) {
      if (room.status === 'lobby') setCurrentScreen('lobby');
      else if (room.status === 'uploading') setCurrentScreen('uploading');
      else if (room.status === 'drawing') setCurrentScreen('drawing');
      else if (room.status === 'voting') setCurrentScreen('voting');
      else if (room.status === 'results') setCurrentScreen('results');
      else if (room.status === 'final') setCurrentScreen('final');
    }
  };

  const handleRejoin = async (code: string) => {
    if (!player) return;
    // If we are already connected to this room, just resume
    if (roomCode === code && room) {
      handleResumeGame();
      return;
    }
    handleJoinRoom(code);
  };

  // Initial 2s loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // Keep ref in sync with state
  useEffect(() => {
    strokesRef.current = strokes;
  }, [strokes]);

  const { room, error: roomError } = useRoom(roomCode, player?.id || null);

  const showToast = useCallback((message: string, type: 'error' | 'success' | 'info' = 'error') => {
    setToast({ message, type });
  }, []);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  // Restore session (Auth or Local)
  useEffect(() => {
    const initSession = async () => {
      // 1. Check Auth (Firebase Login) - Sync with server to ensure fresh data
      const authUser = await AuthService.syncUser();
      let session = StorageService.getSession();

      if (authUser) {
        // We have a logged in user, ensure session matches
        if (!session || session.id !== authUser.id) {
          // Create session from auth user
          if (authUser.avatarStrokes && authUser.color) {
            session = {
              id: authUser.id,
              name: authUser.username,
              color: authUser.color,
              frame: authUser.frame || 'none',
              avatarStrokes: authUser.avatarStrokes,
              joinedAt: authUser.createdAt,
              lastSeen: Date.now(),
              cosmetics: authUser.cosmetics
            };
            StorageService.saveSession(session);
            setPlayer(session);
          } else {
            // Auth user exists but no profile text/avatar -> needs setup
            // (This might happen if we add partial registration later)
            // For now, assume if they have an account they went through setup?
            // Actually, we need to handle "New Account" flow where they haven't set avatar yet.
          }
        }
      }

      if (session) {
        setPlayer(session);

        // Check for auto-rejoin
        const lastRoomCode = StorageService.getRoomCode();
        const lastActive = StorageService.getLastLocalActivity();
        const isRecent = Date.now() - lastActive < 10 * 60 * 1000; // 10 minutes

        if (lastRoomCode && isRecent) {
          setRoomCode(lastRoomCode);
          const room = await StorageService.joinRoom(lastRoomCode, session);
          if (!room) {
            StorageService.leaveRoom();
            setCurrentScreen('home');
          }
          // If room exists, useEffect will handle routing
        } else {
          setCurrentScreen('home');
        }
      }
    };
    initSession();
  }, []);

  // Theme Effect: Apply global theme class AND variables to body
  useEffect(() => {
    const theme = player?.cosmetics?.activeTheme || 'default';

    // Apply Class (for legacy or specific overrides)
    const themeClass = getThemeClass(theme);
    document.body.className = `${themeClass} overflow-x-hidden`;

    // Apply Deep Variables
    const variables = getThemeVariables(theme);
    Object.entries(variables).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value);
    });
  }, [player?.cosmetics?.activeTheme]);

  // Calculated state for dependencies
  // Check if I am an active player (in the current game)
  const amInGame = room?.players.some(p => p.id === player?.id);
  // Check if I am in the waiting queue
  const amInQueue = room?.waitingPlayers?.some(p => p.id === player?.id);

  // "Waiting" in the context of routing means "Spectator" or "Queued"
  // It should NOT refer to an active player who is just waiting for their turn
  const shouldShowWaitingRoom = !amInGame && (amInQueue || true); // If not in game, show waiting room (spectator)

  const amWaiting = room?.playerStates?.[player?.id || '']?.status === 'waiting' || false;

  const handleEquipTheme = (themeId?: string) => {
    setIsTransitionActive(true);

    // Immediate local update for visual responsiveness
    if (themeId && player) {
      setPlayer(prev => {
        if (!prev) return prev;

        // Ensure defaults for required fields if cosmetics is undefined or partial
        const currentCosmetics = prev.cosmetics || {
          brushesUnlocked: [],
          colorsUnlocked: [],
          badges: [],
          purchasedItems: []
        };

        return {
          ...prev,
          cosmetics: {
            ...currentCosmetics,
            activeTheme: themeId,
            // Fallbacks for safety during partial updates
            brushesUnlocked: currentCosmetics.brushesUnlocked || [],
            colorsUnlocked: currentCosmetics.colorsUnlocked || [],
            badges: currentCosmetics.badges || []
          }
        };
      });
    }

    // Explicitly refresh player state to ensure full sync (DB source of truth)
    setTimeout(() => {
      const freshUser = AuthService.getCurrentUser();
      if (freshUser) {
        setPlayer(prev => prev ? { ...prev, cosmetics: freshUser.cosmetics } : prev);
      }
    }, 100);
  };

  // Derived State
  // Derived State (Memoized)
  const stats = useMemo(() => {
    const myState = room?.playerStates?.[player?.id || ''];
    const submitted = myState?.status === 'submitted';
    // Add +5 seconds if player has time bonus
    const hasTimeBonus = room?.timeBonusPlayerId === player?.id;
    const bonusTime = hasTimeBonus ? 5 : 0;
    const endsAt = myState?.timerStartedAt
      ? myState.timerStartedAt + ((room?.settings?.timerDuration || 15) + bonusTime) * 1000
      : null;

    // Safety check for room existence
    if (!room) return {
      myPlayerState: myState,
      hasSubmitted: submitted,
      timerEndsAt: endsAt,
      submittedCount: 0,
      totalPlayers: 0,
      unfinishedPlayers: []
    };

    return {
      myPlayerState: myState,
      hasSubmitted: submitted,
      timerEndsAt: endsAt,
      submittedCount: Object.values(room.playerStates || {}).filter(s => s.status === 'submitted').length,
      totalPlayers: room.players.length,
      unfinishedPlayers: room.players.filter(p => room.playerStates?.[p.id]?.status !== 'submitted')
    };
  }, [room, player?.id]);

  const { myPlayerState, hasSubmitted, timerEndsAt, submittedCount, totalPlayers, unfinishedPlayers } = stats;

  // Sync screen with room status
  useEffect(() => {
    if (room && !isLoading && !isBrowsing) {
      const status = room.status;
      const round = room.roundNumber;

      const statusChanged = status !== lastStatusRef.current;
      const roundChanged = round !== lastRoundRef.current;
      const waitingChanged = amWaiting !== lastWaitingRef.current;

      // Initial load or no change - no transition
      if (!lastStatusRef.current || (!statusChanged && !roundChanged && !waitingChanged)) {
        lastStatusRef.current = status;
        lastRoundRef.current = round;
        lastWaitingRef.current = amWaiting;

        // Update screen immediately if needed (e.g. initial load or waiting change without transition)
        // If waiting status changed (e.g. joined game), update screen immediately without 1.5s delay
        if (waitingChanged) {
          if (status === 'lobby') setCurrentScreen('lobby');
          else if (status === 'uploading') setCurrentScreen(shouldShowWaitingRoom ? 'waiting' : 'uploading');
          else if (status === 'drawing') {
            if (shouldShowWaitingRoom) {
              setCurrentScreen('waiting');
            } else {
              setCurrentScreen('drawing');
              setStrokes([]);
              setIsMyTimerRunning(false);
            }
          }
          else if (status === 'voting') setCurrentScreen(shouldShowWaitingRoom ? 'waiting' : 'voting');
          else if (status === 'results') setCurrentScreen('results'); // Everyone sees results
          else if (status === 'final') setCurrentScreen('final');
          return;
        }

        if (currentScreen === 'room-selection' || currentScreen === 'welcome' || currentScreen === 'name-entry') {
          if (status === 'lobby') setCurrentScreen('lobby');
          else if (status === 'uploading') setCurrentScreen(shouldShowWaitingRoom ? 'waiting' : 'uploading');
          else if (status === 'drawing') setCurrentScreen(shouldShowWaitingRoom ? 'waiting' : 'drawing');
          else if (status === 'voting') setCurrentScreen(shouldShowWaitingRoom ? 'waiting' : 'voting');
          else if (status === 'results') setCurrentScreen('results');
          else if (status === 'final') setCurrentScreen('final');
        }
        return;
      }

      // Status or Round changed - trigger transition
      lastStatusRef.current = status;
      lastRoundRef.current = round;
      lastWaitingRef.current = amWaiting;

      setIsLoadingTransition(true);

      const timer = setTimeout(() => {
        setIsLoadingTransition(false);

        // Send notifications (only when status actually changed)
        if (statusChanged) {
          if (status === 'uploading' && room?.currentUploaderId === player?.id) {
            notifyYourTurnToUpload();
          } else if (status === 'drawing' && !amWaiting) {
            notifyDrawingPhaseStarted();
          } else if (status === 'voting' && !amWaiting) {
            notifyVotingStarted();
          } else if (status === 'results') {
            notifyResultsReady();
            handleRoundEndRewards(room);
          } else if (status === 'final') {
            notifyFinalResults();
            handleGameEndRewards(room);
          }
        }

        // Routing Logic
        if (status === 'lobby') setCurrentScreen('lobby');
        else if (status === 'uploading') setCurrentScreen(shouldShowWaitingRoom ? 'waiting' : 'uploading');
        else if (status === 'drawing') {
          if (shouldShowWaitingRoom) {
            setCurrentScreen('waiting');
          } else {
            setCurrentScreen('drawing');
            setStrokes([]);
            setIsMyTimerRunning(false);
          }
        }
        else if (status === 'voting') setCurrentScreen(shouldShowWaitingRoom ? 'waiting' : 'voting');
        else if (status === 'results') setCurrentScreen('results'); // Spectators can see results too usually? Or waiting? Let's show results.
        else if (status === 'final') setCurrentScreen('final');
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [room?.status, room?.roundNumber, isLoading, currentScreen, isBrowsing, amWaiting, shouldShowWaitingRoom]);

  // Effect: Kicked / Removed check
  useEffect(() => {
    // Only run check if we have a room, player, and data is fully loaded
    if (roomCode && room && player && !isLoading && !isInitialLoading && !isBrowsing) {
      // Check if player is missing
      const amInPlayers = room.players.some(p => p.id === player.id);
      const amInWaiting = room.waitingPlayers?.some(p => p.id === player.id);

      if (!amInPlayers && !amInWaiting) {
        // Debounce the kick check to prevent race conditions during transitions
        // e.g. when moving from Lobby -> Game, sometimes the list updates asynchronously
        const timer = setTimeout(() => {
          // Re-check after 2s
          const currentPlayers = room.players.some(p => p.id === player.id);
          const currentWaiting = room.waitingPlayers?.some(p => p.id === player.id);
          if (!currentPlayers && !currentWaiting) {
            setShowKicked(true);
            setKickCountdown(3);
          }
        }, 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [room, player, roomCode, isLoading, isInitialLoading, isBrowsing]);

  // Effect: Sync local timer state with server state (Auto-resume / Fix stuck state)
  useEffect(() => {
    if (room?.status === 'drawing' && myPlayerState?.status === 'drawing') {
      if (!isMyTimerRunning) {
        // Server says we are drawing, so unlock the screen
        setIsMyTimerRunning(true);
        setIsReadying(false); // Stop "Starting..." spinner
      }
    }
  }, [room?.status, myPlayerState?.status, isMyTimerRunning]);

  // Effect: Kicked Countdown
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (showKicked) {
      if (kickCountdown > 0) {
        timer = setTimeout(() => setKickCountdown(prev => prev - 1), 1000);
      } else {
        // Countdown finished
        setShowKicked(false);
        setRoomCode(null);
        StorageService.leaveRoom();
        setCurrentScreen('room-selection');
        showToast('You were removed from the room 👢', 'info');
      }
    }
    return () => clearTimeout(timer);
  }, [showKicked, kickCountdown, showToast]);

  // Effect: Host Ended Game (Room Deleted)
  useEffect(() => {
    if (roomCode && roomError === 'Room not found' && !isLoading && !isInitialLoading) {
      // Host closed the room
      setShowGameEnded(true);
      setEndGameCountdown(3);
    }
  }, [roomError, roomCode]);

  // Effect: Game Ended Countdown
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (showGameEnded) {
      if (endGameCountdown > 0) {
        timer = setTimeout(() => setEndGameCountdown(prev => prev - 1), 1000);
      } else {
        // Countdown finished
        setShowGameEnded(false);
        setRoomCode(null);
        StorageService.leaveRoom();
        setCurrentScreen('room-selection');
        showToast('Host ended the game', 'info');
      }
    }
    return () => clearTimeout(timer);
  }, [showGameEnded, endGameCountdown, showToast]);


  // Notification Effect & Prompt
  useEffect(() => {
    // Check for prompt
    if (roomCode && player && 'Notification' in window) {
      const permission = Notification.permission;
      const hasSeenPrompt = sessionStorage.getItem('seenNotificationPrompt');

      if (permission === 'default' && !hasSeenPrompt) {
        // Delay slightly to not overwhelm
        const timer = setTimeout(() => {
          setShowNotificationPrompt(true);
        }, 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [roomCode, player]);

  // Game Status Notification
  useEffect(() => {
    if (room && room.roundNumber !== lastRoundRef.current && room.status === 'drawing') {
      // New round started
      if (document.visibilityState === 'hidden' && Notification.permission === 'granted') {
        new Notification("It's Drawing Time! 🎨", {
          body: `Round ${room.roundNumber + 1} has started!`,
          icon: '/pwa-icon.png'
        });
      }
    }
  }, [room?.roundNumber, room?.status]);


  // Heartbeat
  useEffect(() => {
    if (!roomCode || !player) return;

    const interval = setInterval(() => {
      StorageService.heartbeat(roomCode, player.id);
    }, 5000); // Every 5 seconds

    return () => clearInterval(interval);
  }, [roomCode, player?.id]);

  // --- XP & Stats Helpers ---
  const handleRoundEndRewards = async (currentRoom: GameRoom) => {
    if (!player) return;

    // Find results for the PREVIOUS round (since status just changed to 'results', the round number might be same)
    // Wait, storage service updates roundResults THEN changes status.
    const results = currentRoom.roundResults.find(r => r.roundNumber === currentRoom.roundNumber);
    if (!results) return;

    // 1. Participation Reward (XP only, stats tracked via wins/losses)
    const xpResult = XPService.addXP(XPService.rewards.PARTICIPATE);
    await StatsService.recordXPEarned(XPService.rewards.PARTICIPATE);

    // 2. Win/Loss
    const myRankIndex = results.rankings.findIndex(r => r.playerId === player.id);
    if (myRankIndex === 0) {
      const winXP = XPService.addXP(XPService.rewards.WIN_ROUND);
      xpResult.newLevel = winXP.newLevel; // Update if double level up
      xpResult.leveledUp = xpResult.leveledUp || winXP.leveledUp;

      await StatsService.recordXPEarned(XPService.rewards.WIN_ROUND);
      await StatsService.incrementStat('roundsWon');
      showToast(`Round Won! +${XPService.rewards.WIN_ROUND} XP 🏆`, 'success');
    } else {
      await StatsService.incrementStat('roundsLost');
    }

    // 3. Level Up Check
    if (xpResult.leveledUp) {
      showToast(`Level Up! You are now level ${xpResult.newLevel}! 🎉`, 'success');
      vibrate([100, 50, 100, 50, 200]);
      await StatsService.updateHighestLevel(xpResult.newLevel);
    }

    // 4. Auth Sync
    if (AuthService.isLoggedIn()) {
      await AuthService.updateUser(player.id, { xp: XPService.getXP() });
    }
  };

  const handleGameEndRewards = async (currentRoom: GameRoom) => {
    if (!player) return;

    // Game Completion
    const xpResult = XPService.addXP(XPService.rewards.COMPLETE_GAME);
    await StatsService.recordXPEarned(XPService.rewards.COMPLETE_GAME);

    // Determine Winner
    if (currentRoom.scores) {
      // Sort scores
      const sorted = (Object.entries(currentRoom.scores) as [string, number][]).sort(([, a], [, b]) => b - a);
      if (sorted[0][0] === player.id) {
        const winXP = XPService.addXP(XPService.rewards.COMPLETE_GAME); // Bonus for winning? Use COMPLETE_GAME for now or add new reward
        xpResult.leveledUp = xpResult.leveledUp || winXP.leveledUp;
        await StatsService.incrementStat('gamesWon');
        showToast('You Won the Game! 🏆', 'success');
      }
    }
    await StatsService.incrementStat('gamesPlayed');

    if (xpResult.leveledUp) {
      showToast(`Level Up! You are now level ${xpResult.newLevel}! 🎉`, 'success');
      await StatsService.updateHighestLevel(xpResult.newLevel);
    }

    if (AuthService.isLoggedIn()) {
      await AuthService.updateUser(player.id, { xp: XPService.getXP() });
    }
  };

  const handlePlayNow = () => {
    // If we have a session, go to home (should cover edge cases)
    if (player) {
      setCurrentScreen('home');
    } else {
      // Go to Login Screen instead of name-entry
      setCurrentScreen('login');
    }
  };

  const handleLoginComplete = async () => {
    const authUser = AuthService.getCurrentUser();
    if (authUser) {
      // Check if profile is set up
      if (authUser.avatarStrokes && authUser.color) {
        // Profile ready, go home
        const session: Player = {
          id: authUser.id,
          name: authUser.username,
          color: authUser.color,
          frame: authUser.frame || 'none',
          avatarStrokes: authUser.avatarStrokes,
          joinedAt: authUser.createdAt,
          lastSeen: Date.now(),
          cosmetics: authUser.cosmetics
        };
        StorageService.saveSession(session);
        setPlayer(session);
        setCurrentScreen('home');
      } else {
        // Need to setup profile (Avatar/Color)
        setCurrentScreen('name-entry');
      }
    } else {
      // Guest mode selected
      setCurrentScreen('name-entry');
    }
  };

  const handleProfileComplete = (profileData: Omit<Player, 'id' | 'joinedAt' | 'lastSeen'>) => {
    const authUser = AuthService.getCurrentUser();

    // If logged in, update the Auth User with this profile data
    if (authUser) {
      const updates = {
        avatarStrokes: profileData.avatarStrokes,
        color: profileData.color,
        frame: profileData.frame,
        // We usually keep the username from auth, but if they changed it here?
        // ProfileSetup allows changing name. Let's update it.
        username: profileData.name
      };
      AuthService.updateUser(authUser.id, updates);

      // Use Auth ID
      const newPlayer: Player = {
        id: authUser.id,
        ...profileData,
        joinedAt: authUser.createdAt,
        lastSeen: Date.now(),
        cosmetics: authUser.cosmetics
      };
      StorageService.saveSession(newPlayer);
      setPlayer(newPlayer);
      setCurrentScreen('home');
    } else {
      // Guest Flow
      const newPlayer: Player = {
        id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
        ...profileData,
        joinedAt: Date.now(),
        lastSeen: Date.now()
      };
      StorageService.saveSession(newPlayer);
      setPlayer(newPlayer);
      setCurrentScreen('home');
    }
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
      setIsBrowsing(false);
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
        setIsBrowsing(false);
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
    } catch (err: any) {
      console.error('Failed to start round:', err);
      showToast(err.message || 'Failed to start round 😅', 'error');
    }
    setIsLoading(false);
  };

  const handleReady = async () => {
    if (!roomCode || !player) return;
    try {
      setIsReadying(true); // Immediate feedback
      await StorageService.playerReady(roomCode, player.id);

      // Trigger sabotage if this player is the target
      if (room?.sabotageTargetId === player.id && !room?.sabotageTriggered) {
        await StorageService.triggerSabotage(roomCode);
      }

      setIsMyTimerRunning(true);
      setShowHowToPlay(false);
    } catch (err) {
      console.error('Failed to mark ready:', err);
      showToast('Failed to start drawing 😅', 'error');
      setIsReadying(false); // Revert on error
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
    setIsEyedropper(false);
  };

  const handleEyedropperToggle = () => {
    setIsEyedropper(prev => !prev);
    setIsEraser(false);
  };

  const handleColorPick = (color: string) => {
    setBrushColor(color);
    setIsEyedropper(false);
    setIsEraser(false);
    showToast('Color picked! 🎨', 'success');
  };

  const handleLeaveGame = async (targetScreen: Screen = 'room-selection') => {
    if (!roomCode || !player) return;

    // Attempt to remove from server, but don't block local exit
    try {
      await StorageService.removePlayerFromRoom(roomCode, player.id);
    } catch (err) {
      console.error('Failed to leave game:', err);
    }

    // Always exit locally
    StorageService.leaveRoom();
    setRoomCode(null);
    setCurrentScreen(targetScreen);
    setIsLoading(false);
    setIsLoadingTransition(false);
    showToast('Left game 👋', 'info');
  };

  const handleEndGame = async () => {
    if (!roomCode || !room) return;
    try {
      // Determine reason and leader
      let reason: 'cancelled' | 'early' = 'early';
      let leaderName: string | undefined;

      if (room.status === 'lobby') {
        reason = 'cancelled';
      } else {
        // Find leader
        if (room.scores) {
          const leaderId = Object.entries(room.scores).sort(([, a], [, b]) => b - a)[0]?.[0];
          const leader = room.players.find(p => p.id === leaderId);
          if (leader) leaderName = leader.name;
        }
      }

      // Update history before closing
      StorageService.updateHistoryEndState(roomCode, reason, leaderName);

      // Close room (delete from Firebase)
      await StorageService.closeRoom(roomCode);

      // Clear local state
      StorageService.leaveRoom();
      setRoomCode(null);
      setCurrentScreen('room-selection');

      showToast('Game ended and room closed 🛑', 'info');
    } catch (err) {
      console.error('Failed to end game:', err);
      showToast('Failed to end game', 'error');
    }
  };



  const handleSafeReset = () => {
    StorageService.leaveRoom(); // Clear local session to prevent auto-rejoin
    window.location.reload();
  };



  if (isLoading || isInitialLoading) {
    return <LoadingScreen onGoHome={handleSafeReset} />;
  }

  if (isLoadingTransition) {
    return <LoadingScreen onGoHome={handleSafeReset} />;
  }

  // Prevent white screen if in game but room/player missing
  const isGameScreen = ['lobby', 'waiting', 'uploading', 'drawing', 'voting', 'results', 'final'].includes(currentScreen);
  if (isGameScreen && (!room || !player)) {
    return <LoadingScreen onGoHome={handleSafeReset} />;
  }



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

      {/* Casino Screen */}
      {showCasino && (
        <CasinoScreen onClose={() => setShowCasino(false)} />
      )}

      {showSettings && player && (
        <SettingsModal
          player={player}
          players={room?.players}
          roomCode={roomCode}
          isHost={room?.hostId === player.id}
          onClose={() => setShowSettings(false)}
          onUpdateProfile={handleUpdateProfile}
          onLeaveGame={roomCode ? () => handleLeaveGame('room-selection') : undefined}
          onEndGame={room?.hostId === player.id ? handleEndGame : undefined}
          onGoHome={roomCode ? handleMinimizeGame : undefined}
          onKick={async (playerId) => {
            if (!roomCode) return;
            try {
              await StorageService.kickPlayer(roomCode, playerId);
              showToast('Player kicked 🥾', 'success');
            } catch (err) {
              showToast('Failed to kick player', 'error');
            }
          }}
        />
      )}

      <HowToPlayModal isOpen={showHowToPlay} onClose={() => setShowHowToPlay(false)} />

      {/* Notification Prompt */}
      <NotificationPromptModal
        isOpen={showNotificationPrompt}
        onEnable={async () => {
          try {
            // Check if FCM is supported
            if (isPushSupported()) {
              const token = await requestPushPermission();
              if (token && player) {
                await storePushToken(player.id, token);
                showToast('Push notifications enabled! 🔔', 'success');
              }
            } else if ('Notification' in window) {
              // Fallback to basic notifications
              await Notification.requestPermission();
            }
          } catch (error) {
            console.error('Failed to enable push notifications:', error);
          }
          setShowNotificationPrompt(false);
          sessionStorage.setItem('seenNotificationPrompt', 'true');
        }}
        onLater={() => {
          setShowNotificationPrompt(false);
          sessionStorage.setItem('seenNotificationPrompt', 'true');
        }}
      />

      {/* Game Ended Modal */}
      {showGameEnded && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center animate-fade-in">
          <div className="bg-white rounded-3xl p-8 text-center max-w-sm mx-4 shadow-2xl pop-in border-4 border-red-500">
            <div className="text-6xl mb-4 animate-bounce">🛑</div>
            <h3 className="text-2xl font-bold text-red-600 mb-2">Game Ended</h3>
            <p className="text-gray-600 font-medium">The host has closed the room.</p>
            <p className="text-gray-400 text-sm mt-4">Returning to lobby in {endGameCountdown}...</p>
            <div className="mt-6 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
            </div>
          </div>
        </div>
      )}

      {/* Kicked Modal */}
      {showKicked && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center animate-fade-in">
          <div className="bg-white rounded-3xl p-8 text-center max-w-sm mx-4 shadow-2xl pop-in border-4 border-orange-500">
            <div className="text-6xl mb-4 animate-bounce">👢</div>
            <h3 className="text-2xl font-bold text-orange-600 mb-2">You were Kicked</h3>
            <p className="text-gray-600 font-medium">You have been removed from the room.</p>
            <p className="text-gray-400 text-sm mt-4">Returning to lobby in {kickCountdown}...</p>
            <div className="mt-6 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Button - Show only during active game rounds (excluding drawing which has its own) */}
      {player && ['waiting', 'uploading', 'voting', 'results', 'final'].includes(currentScreen) && (
        <div className="fixed left-4 z-50 flex items-center gap-2" style={{ top: 'max(1rem, env(safe-area-inset-top) + 1rem)' }}>
          <button
            onClick={() => setShowSettings(true)}
            className="bg-white/90 backdrop-blur-sm p-3 rounded-xl shadow-lg border-2 border-purple-200 hover:border-purple-500 transition-all hover:scale-110"
            title="Settings"
          >
            ⚙️
          </button>
        </div>
      )}



      {/* Screens */}
      {currentScreen === 'welcome' && (
        <WelcomeScreen onPlay={handlePlayNow} />
      )}

      {currentScreen === 'login' && (
        <LoginScreen onLogin={handleLoginComplete} />
      )}

      {currentScreen === 'name-entry' && (
        <ProfileSetupScreen
          onComplete={handleProfileComplete}
          initialName={AuthService.getCurrentUser()?.username || ''}
        />
      )}

      {currentScreen === 'home' && player && (
        <HomeScreen
          player={player}
          onPlay={() => setCurrentScreen('room-selection')}
          onCasino={() => setShowCasino(true)}
          onStore={() => setCurrentScreen('store')}
          onProfile={() => setCurrentScreen('profile')}
          onSettings={() => setShowSettings(true)}
          lastGameDetails={lastGameDetails}
          onRejoin={handleRejoin}
        />
      )}

      {/* Store Screen */}
      {currentScreen === 'store' && (
        <StoreScreen
          onBack={() => {
            // Refresh player state when returning from store
            const freshUser = AuthService.getCurrentUser();
            if (freshUser && player) {
              const updatedSession = { ...player, cosmetics: freshUser.cosmetics };
              setPlayer(updatedSession);
            }
            setCurrentScreen('home');
          }}
          onEquip={handleEquipTheme}
        />
      )}
      <ThemeTransition isActive={isTransitionActive} onComplete={handleTransitionComplete} />

      {/* Profile Screen */}
      {currentScreen === 'profile' && player && (
        <ProfileScreen
          player={player}
          onBack={() => setCurrentScreen('home')}
          onUpdateProfile={handleUpdateProfile}
          onEditAvatar={() => setCurrentScreen('avatar-editor')}
        />
      )}

      {currentScreen === 'avatar-editor' && player && (
        <AvatarEditorScreen
          player={player}
          onCancel={() => setCurrentScreen('profile')}
          onSave={(strokes, color, frame) => {
            handleUpdateProfile({ avatarStrokes: strokes, color, frame });
            setCurrentScreen('profile');
          }}
        />
      )}

      {currentScreen === 'room-selection' && player && (
        <RoomSelectionScreen
          playerName={player.name}
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          onBack={() => setCurrentScreen('home')}
        />
      )}

      {currentScreen === 'lobby' && room && player && (
        <LobbyScreen
          room={room}
          currentPlayerId={player.id}
          onStartGame={handleStartGame}
          onSettingsChange={handleSettingsChange}
          onLeave={() => handleLeaveGame('room-selection')}
          onKick={async (playerId) => {
            if (!roomCode) return;
            try {
              await StorageService.kickPlayer(roomCode, playerId);
              showToast('Player kicked 👢', 'info');
            } catch (err) {
              console.error(err);
              showToast('Failed to kick player', 'error');
            }
          }}
          onJoinGame={async () => {
            if (!roomCode || !player) return;
            try {
              await StorageService.joinCurrentGame(roomCode, player.id);
              showToast('Joined the round! 🚀', 'success');

              // Force screen transition immediately
              if (room.status === 'uploading') setCurrentScreen('uploading');
              else if (room.status === 'drawing') setCurrentScreen('drawing');
              else if (room.status === 'voting') setCurrentScreen('voting');
              else if (room.status === 'results') setCurrentScreen('results');
              else if (room.status === 'final') setCurrentScreen('final');
            } catch (err) {
              console.error(err);
              showToast('Failed to join round', 'error');
            }
          }}
          onBack={handleMinimizeGame}
        />
      )}

      {currentScreen === 'waiting' && room && player && (
        <WaitingRoomScreen
          room={room}
          currentPlayerId={player.id}
          onJoinGame={async () => {
            if (!roomCode || !player) return;
            try {
              await StorageService.joinCurrentGame(roomCode, player.id);
              showToast('Joined the round! 🚀', 'success');

              // Force screen transition immediately
              if (room.status === 'uploading') setCurrentScreen('uploading');
              else if (room.status === 'drawing') setCurrentScreen('drawing');
              else if (room.status === 'voting') setCurrentScreen('voting');
              else if (room.status === 'results') setCurrentScreen('results');
              else if (room.status === 'final') setCurrentScreen('final');
            } catch (err) {
              console.error(err);
              showToast('Failed to join round', 'error');
            }
          }}
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
                  {/* Settings Button */}
                  <button
                    onClick={() => setShowSettings(true)}
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
                      <div className="scale-90 origin-right">
                        <Timer endsAt={timerEndsAt || Date.now()} onTimeUp={handleTimeUp} />
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



            {/* Image Container */}
            <div className="flex-1 min-h-0 flex items-center justify-center p-2 relative">
              <div className="relative mx-auto flex items-center justify-center aspect-square max-w-full max-h-full w-full h-auto landscape:h-full landscape:w-auto"
                style={{
                  borderRadius: '1.5rem',
                  overflow: 'hidden',
                  boxShadow: '0 10px 30px -10px rgba(0,0,0,0.2)',
                  border: '5px solid white',
                  backgroundColor: 'white'
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
                    className="absolute"
                    style={{
                      left: `${room.block.x}%`,
                      top: `${room.block.y}%`,
                      width: `${room.block.size}%`,
                      height: `${room.block.size}%`,
                      borderRadius: room.block.type === 'circle' ? '50%' : '8px',
                      boxShadow: 'inset 0 0 20px rgba(0,0,0,0.1)',
                      backgroundColor: '#ffffff',
                      opacity: 1,
                      zIndex: 10
                    }}
                  />
                )}

                {/* Drawing Canvas - Only when timer running */}
                {isMyTimerRunning && !hasSubmitted && (
                  <GameCanvas
                    key={room.roundNumber}
                    imageUrl={room.currentImage.url}
                    brushColor={isEraser ? '#FFFFFF' : brushColor}
                    brushSize={isEraser ? brushSize * 2 : brushSize}
                    isDrawingEnabled={true}
                    strokes={strokes}
                    onStrokesChange={setStrokes}
                    isEraser={isEraser}
                    isEyedropper={isEyedropper}
                    onColorPick={handleColorPick}
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
                        disabled={isReadying}
                        className="w-full btn-90s bg-gradient-to-r from-lime-400 to-emerald-500 text-white px-8 py-4 rounded-xl font-bold text-xl jelly-hover shadow-lg disabled:opacity-70 disabled:grayscale"
                      >
                        {isReadying ? (
                          <span className="flex items-center justify-center gap-2">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            STARTING...
                          </span>
                        ) : (
                          "I'M READY! 🚀"
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Show "submitted" overlay */}
                {hasSubmitted && (
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center z-30">
                    <div className="bg-white rounded-2xl p-6 text-center max-w-sm mx-4 shadow-xl animate-bounce-gentle">
                      <div className="text-4xl mb-2">✅</div>
                      <h3 className="font-bold text-green-600 text-xl mb-2">Drawing Submitted!</h3>
                      <p className="text-gray-500 text-sm mb-4">Waiting for others...</p>

                      {/* List unfinished players */}
                      {unfinishedPlayers.length > 0 && (
                        <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Still Drawing</p>
                          <div className="flex flex-wrap justify-center gap-2">
                            {unfinishedPlayers.map(p => (
                              <div key={p.id} className="flex items-center gap-1 bg-white border border-gray-200 px-2 py-1 rounded-lg shadow-sm">
                                <span className="text-xs">{p.avatar || '👤'}</span>
                                <span className="text-xs font-semibold text-gray-600 truncate max-w-[80px]">{p.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Toolbar - BELOW the image, only show when drawing is enabled */}
            {isMyTimerRunning && !hasSubmitted && (
              <div className="flex-shrink-0 z-30 pb-4 px-2 pop-in">
                <Toolbar
                  brushColor={brushColor}
                  brushSize={brushSize}
                  isEraser={isEraser}
                  onColorChange={(color) => {
                    setBrushColor(color);
                    setIsEraser(false);
                    setIsEyedropper(false);
                  }}
                  onSizeChange={setBrushSize}
                  onEraserToggle={handleEraserToggle}
                  onUndo={handleUndo}
                  onClear={handleClear}
                  isEyedropper={isEyedropper}
                  onEyedropperToggle={handleEyedropperToggle}
                />
              </div>
            )}
          </div>

          {/* Saboteur Panel - shown when player is the saboteur and hasn't selected target */}
          {room.saboteurId === player.id && !room.sabotageTargetId && (
            <SaboteurPanel
              players={room.players}
              currentPlayerId={player.id}
              uploaderId={room.currentUploaderId || room.hostId}
              onSelectTarget={async (targetId) => {
                if (roomCode) {
                  await StorageService.setSabotageTarget(roomCode, targetId);
                }
              }}
              selectedTargetId={room.sabotageTargetId || undefined}
            />
          )}

          {/* Sabotage Overlay - shown when player is being sabotaged and has started drawing */}
          <SabotageOverlay
            isActive={
              room.sabotageTargetId === player.id &&
              room.sabotageTriggered === true &&
              isMyTimerRunning
            }
          />
        </div>
      )}

      {/* Voting Screen */}
      {currentScreen === 'voting' && room && player && (
        <VotingScreen
          room={room}
          currentPlayerId={player.id}
          onVote={handleVote}
          showToast={showToast}
        />
      )}

      {/* Results Screen */}
      {currentScreen === 'results' && room && player && (
        <ResultsScreen
          room={room}
          currentPlayerId={player.id}
          player={player}
          onNextRound={handleNextRound}
          showToast={showToast}
        />
      )}

      {/* Final Results Screen */}
      {currentScreen === 'final' && room && player && (
        <FinalResultsScreen
          room={room}
          currentPlayerId={player.id}
          onPlayAgain={handlePlayAgain}
          onGoHome={handleGoHome}
          showToast={showToast}
        />
      )}
    </div >
  );
}

export default App;
