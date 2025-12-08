import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

import { CasinoScreen } from './components/screens/CasinoScreen';

import { JoiningGameScreen } from './components/screens/JoiningGameScreen';
import { AuthService } from './services/auth';
import { StorageService } from './services/storage';
import { ImageService } from './services/image';
import { XPService } from './services/xp';
import { StatsService } from './services/stats';
import { BadgeService } from './services/badgeService';
import { vibrate } from './utils/haptics';
import { useDrawingState } from './hooks/useDrawingState';
import { useGameFlow } from './hooks/useGameFlow';
import { useRoom } from './hooks/useRoom';
import { ScreenRouter } from './components/common/ScreenRouter';
import { HowToPlayModal } from './components/game/HowToPlayModal';
import { Toast } from './components/common/Toast';
import { LoadingScreen } from './components/common/LoadingScreen';
import { NotificationPromptModal } from './components/common/NotificationPromptModal';
import { SettingsModal } from './components/common/SettingsModal';
import { UpdateNotification } from './components/common/UpdateNotification';
import { ConfirmationModal } from './components/common/ConfirmationModal';
import { TunnelTransition, CasinoTransition, GlobalBlurTransition } from './components/common/ScreenTransition';
import { MonogramBackground } from './components/common/MonogramBackground';
import {
  notifyYourTurnToUpload,
  notifyDrawingPhaseStarted,
  notifyVotingStarted,
  notifyResultsReady,
  notifyFinalResults
} from './utils/notifications';
import { simplifyStrokes } from './utils/geometry';
import { getThemeClass, getThemeVariables } from './utils/themes';
import { ThemeTransition } from './components/common/ThemeTransition';
import { requestPushPermission, onForegroundMessage } from './services/pushNotifications';
import { useNotifications } from './hooks/useNotifications';
import { usePlayerSession } from './hooks/usePlayerSession';
import { useLoadingProgress } from './hooks/useLoadingProgress';
import type { Player, GameSettings, PlayerDrawing, GameRoom, Screen } from './types';


// Extended Screen type to include the new joining screen
// Note: In a real app we'd update the type definition in types.ts, casting for now if needed or relying on string loose typing
import type { RoomHistoryEntry } from './types';



const App = () => {
  // --- PWA Update Detection ---
  const intervalMs = 60 * 1000; // Check for updates every 60 seconds
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const initialBuildTime = useRef<string | null>(null);

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered:', r);
      // Check for updates periodically
      if (r) {
        setInterval(() => {
          console.log('Checking for SW updates...');
          r.update();
        }, intervalMs);
      }
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
    onNeedRefresh() {
      console.log('New content available, showing update notification');
    },
    onOfflineReady() {
      console.log('App ready to work offline');
    },
  });

  // Fallback: Version check via fetch (for iOS Safari and browsers with restrictive SW behavior)
  useEffect(() => {
    const checkVersion = async () => {
      try {
        const response = await fetch('/version.json?t=' + Date.now(), {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' }
        });
        const data = await response.json();

        if (initialBuildTime.current === null) {
          // First check - store the initial build time
          initialBuildTime.current = data.buildTime || data.version;
          console.log('Initial version:', initialBuildTime.current);
        } else if (data.buildTime && data.buildTime !== initialBuildTime.current) {
          // Build time changed - update available!
          console.log('Version changed:', initialBuildTime.current, '->', data.buildTime);
          setUpdateAvailable(true);
        }
      } catch (error) {
        console.log('Version check failed:', error);
      }
    };

    // Check immediately on mount
    checkVersion();

    // Then check periodically
    const interval = setInterval(checkVersion, intervalMs);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateApp = () => {
    // Try service worker update first, then force reload
    if (needRefresh) {
      updateServiceWorker(true);
    } else {
      window.location.reload();
    }
  };

  const handleDismissUpdate = () => {
    setNeedRefresh(false);
    setUpdateAvailable(false);
  };

  // Show notification if either detection method finds an update
  const showUpdateNotification = needRefresh || updateAvailable;

  const [currentScreen, setCurrentScreen] = useState<Screen>('welcome');
  const [lastGameDetails, setLastGameDetails] = useState<RoomHistoryEntry | null>(null);

  // --- Smart Loading System ---
  const {
    stages: loadingStages,
    isOnline,
    isSlow,
    updateStage: updateLoadingStage,
    clearStages: _clearLoadingStages,
    startScenario: startLoadingScenario,
  } = useLoadingProgress();
  const loadingStartTimeRef = useRef<number>(0);

  // Wrapper to start loading with scenario
  const startLoading = useCallback((scenario: 'initial' | 'join' | 'start' | 'upload' | 'create') => {
    setIsLoading(true);
    loadingStartTimeRef.current = Date.now();
    startLoadingScenario(scenario);
  }, [startLoadingScenario]);


  // Complete all remaining stages and dismiss loading with visible delay
  const stopLoadingWithDelay = useCallback(() => {
    // First, mark ALL remaining stages as complete
    loadingStages.forEach(stage => {
      if (stage.status !== 'completed') {
        updateLoadingStage(stage.id, 'completed');
      }
    });

    // Then wait 150ms so user sees all green checkmarks before dismissing
    const elapsed = Date.now() - loadingStartTimeRef.current;
    const minDelay = 300;
    const completionDelay = 150; // Extra delay to show all green checks
    const totalMinDelay = Math.max(minDelay, elapsed) + completionDelay;
    const remaining = totalMinDelay - elapsed;

    setTimeout(() => setIsLoading(false), remaining);
  }, [loadingStages, updateLoadingStage]);

  const {
    player, setPlayer,
    roomCode, setRoomCode,
    isInitialLoading,
    handleUpdateProfile
  } = usePlayerSession({
    setCurrentScreen,
    onProgress: (id, status) => {
      updateLoadingStage(id, status);
    },
    onComplete: () => {
      stopLoadingWithDelay();
    }
  });

  // Initialize default loading stages on mount (for initial load)
  useEffect(() => {
    startLoading('initial');
  }, [startLoading]);

  // Pending Room Code from URL
  const [pendingRoomCode, setPendingRoomCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // --- HOOKS: ORDER MATTERS ---
  // 1. Session & Player
  // (Already called above: usePlayerSession)

  // 2. Room Connection (Must be after player/roomCode)
  const { room, error: roomError } = useRoom(roomCode, player?.id || null);

  // 3. Notifications
  const {
    toast,
    showToast,
    showError,
    hideToast,
    showNotificationPrompt,
    setShowNotificationPrompt
  } = useNotifications();

  // 4. Drawing State
  const {
    brushColor, setBrushColor,
    brushSize, setBrushSize,
    brushType, setBrushType,
    strokes, setStrokes,
    strokesRef,
    isEraser, setIsEraser,
    isEyedropper, setIsEyedropper,
    handleUndo, handleClear,
    handleEraserToggle, handleEyedropperToggle,
    handleColorPick
  } = useDrawingState({ onToast: showToast });

  // 5. Game Flow
  const {
    isMyTimerRunning, setIsMyTimerRunning,
    showHowToPlay, setShowHowToPlay,
    isReadying, setIsReadying,
    showGameEnded, setShowGameEnded,
    showKicked, setShowKicked,
    endGameCountdown, setEndGameCountdown,
    kickCountdown, setKickCountdown,
  } = useGameFlow();

  // Theme Transition Handler
  const handleTransitionComplete = () => {
    setIsTransitionActive(false);
  };

  const [showSettings, setShowSettings] = useState(false);
  const [showCasino, setShowCasino] = useState(false);
  const [showTunnelTransition, setShowTunnelTransition] = useState(false);
  const [showCasinoTransition, setShowCasinoTransition] = useState(false);
  const [isTransitionActive, setIsTransitionActive] = useState(false);
  const [isLoadingTransition, setIsLoadingTransition] = useState(false);
  const [isBrowsing, setIsBrowsing] = useState(false);

  const lastStatusRef = useRef<string | null>(null);
  const lastRoundRef = useRef<number | null>(null);
  const lastWaitingRef = useRef<boolean>(false);
  const submissionLockRef = useRef<boolean>(false); // Prevent concurrent submissions

  const [pendingGameStats, setPendingGameStats] = useState<{ xp: number, coins: number, isWinner: boolean, action: 'home' | 'replay' } | null>(null);
  const [optimisticTimerStart, setOptimisticTimerStart] = useState<number | null>(null);

  // Session Restriction State
  const [pendingConfirmation, setPendingConfirmation] = useState<{ type: 'host' | 'join', data?: any } | null>(null);

  // Fetch last game details when on home screen
  useEffect(() => {
    const checkLastGame = async () => {
      const code = StorageService.getRoomCode();
      if (code && currentScreen === 'home') {
        const details = await StorageService.getRoomPreview(code);
        if (details) {
          setLastGameDetails({ ...details, roomCode: code, lastSeen: Date.now() });
        } else {

          setLastGameDetails(null);
        }
      } else {
        setLastGameDetails(null);
      }
    };
    checkLastGame();
  }, [currentScreen]);

  // Check URL for join code on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const joinCode = params.get('join');
    if (joinCode) {
      const code = joinCode.toUpperCase();
      console.log('Found join code in URL:', code);
      setPendingRoomCode(code);
      // Clear URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // Timer Resilience: Optimistic Submission State
  const [optimisticHasSubmitted, setOptimisticHasSubmitted] = useState(false);

  // Reset optimistic state when round changes
  useEffect(() => {
    if (room?.roundNumber !== lastRoundRef.current) {
      setOptimisticHasSubmitted(false);
    }
  }, [room?.roundNumber]);

  // Auto-join effect
  useEffect(() => {
    if (player && pendingRoomCode && !isLoading && !roomCode) {
      setCurrentScreen('joining-game');
      const timer = setTimeout(() => {
        handleJoinRoom(pendingRoomCode);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [player, pendingRoomCode, isLoading, roomCode]);

  // Auth Redirect
  useEffect(() => {
    if (!player && !isLoading && !isInitialLoading) {
      if (!['welcome', 'login', 'name-entry'].includes(currentScreen)) {
        setCurrentScreen('welcome');
      }
    }
  }, [player, currentScreen, isLoading, isInitialLoading]);

  const handleMinimizeGame = () => {
    setIsBrowsing(true);
    setCurrentScreen('home');
  };

  function handleResumeGame() {
    setIsBrowsing(false);
    if (room?.status) {
      if (room.status === 'lobby') setCurrentScreen('lobby');
      else if (room.status === 'uploading') setCurrentScreen('uploading');
      else if (room.status === 'sabotage-selection') setCurrentScreen('sabotage-selection');
      else if (room.status === 'drawing') setCurrentScreen('drawing');
      else if (room.status === 'voting') setCurrentScreen('voting');
      else if (room.status === 'results') setCurrentScreen('results');
      else if (room.status === 'final') setCurrentScreen('final');
      else if (room.status === 'rewards') {
        setCurrentScreen('final');
        showGameRewards('replay');
      }
    }
  };

  const handleCloseHowToPlay = () => {
    setShowHowToPlay(false);
    localStorage.setItem('has_seen_onboarding', 'true');
  };

  // Onboarding Effect
  useEffect(() => {
    if (currentScreen === 'home' && !localStorage.getItem('has_seen_onboarding') && !isInitialLoading) {
      const timer = setTimeout(() => {
        setShowHowToPlay(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentScreen, isInitialLoading]);

  async function handleRejoin(code: string) {
    if (!player) return;
    if (roomCode === code && room) {
      handleResumeGame();
      return;
    }
    handleJoinRoom(code);
  };





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

  // Font Effect: Apply active font to document
  useEffect(() => {
    const fontId = player?.cosmetics?.activeFont || 'default';
    const fontMap: { [key: string]: string } = {
      'default': "'Inter', sans-serif",
      'comic': "'Comic Neue', cursive",
      'pixel': "'Press Start 2P', cursive",
      'mono': "'JetBrains Mono', monospace",
      'handwritten': "'Caveat', cursive",
      'retro': "'VT323', monospace"
    };
    const fontFamily = fontMap[fontId] || fontMap['default'];
    document.documentElement.style.setProperty('--theme-font', fontFamily);
    document.body.style.fontFamily = fontFamily;
  }, [player?.cosmetics?.activeFont]);

  // Calculated state for dependencies
  // Check if I am an active player (in the current game)
  const amInGame = room?.players.some(p => p.id === player?.id);
  // Check if I am in the waiting queue
  const amInQueue = room?.waitingPlayers?.some(p => p.id === player?.id);

  // "Waiting" in the context of routing means "Spectator" or "Queued"
  // It should NOT refer to an active player who is just waiting for their turn
  // Only show waiting room if player is explicitly in the waiting queue, not during transitions
  const shouldShowWaitingRoom = !amInGame && amInQueue;

  const amWaiting = room?.playerStates?.[player?.id || '']?.status === 'waiting' || false;

  const handleEquipTheme = (fontId?: string) => {
    // Immediate local update for visual responsiveness
    if (fontId && player) {
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
            activeFont: fontId,
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
    const totalDuration = room?.settings?.timerDuration || 15;
    // Add +5 seconds if player has time bonus
    const hasTimeBonus = room?.timeBonusPlayerId === player?.id;
    const isTimeSabotaged = room?.sabotageTargetId === player?.id && room?.sabotageEffect?.type === 'subtract_time';

    // Calculate penalty (20% of total time, rounded up)
    const penalty = Math.ceil(totalDuration * 0.20);
    // REMOVED: Level-based time bonus to ensure fairness
    const bonusTime = (hasTimeBonus ? 5 : 0) - (isTimeSabotaged ? penalty : 0);

    const effectiveStartedAt = myState?.timerStartedAt || optimisticTimerStart;

    const endsAt = effectiveStartedAt
      ? effectiveStartedAt + (totalDuration + bonusTime) * 1000
      : null;

    // Safety check for room existence
    if (!room) return {
      myPlayerState: myState,
      hasSubmitted: submitted,
      timerEndsAt: endsAt,
      effectiveTotalDuration: totalDuration + bonusTime, // Default if no room
      submittedCount: 0,
      totalPlayers: 0,
      unfinishedPlayers: []
    };

    // Calculate effective duration for timer consistency
    const effectiveTotalDuration = (totalDuration + bonusTime);

    return {
      myPlayerState: myState,
      hasSubmitted: submitted || optimisticHasSubmitted, // <--- Include optimistic state
      timerEndsAt: endsAt,
      effectiveTotalDuration, // Export for ScreenRouter
      submittedCount: Object.values(room.playerStates || {}).filter(s => s.status === 'submitted').length,
      totalPlayers: room.players.length,
      unfinishedPlayers: room.players.filter(p => room.playerStates?.[p.id]?.status !== 'submitted')
    };
  }, [room, player?.id, optimisticTimerStart, optimisticHasSubmitted]);

  const { myPlayerState, hasSubmitted, timerEndsAt, effectiveTotalDuration, submittedCount, totalPlayers } = stats;

  // Sync screen with room status
  // Sync screen with room status
  useEffect(() => {
    if (roomCode && room && !isLoading && !isBrowsing) {
      const status = room.status;
      const round = room.roundNumber;

      const statusChanged = status !== lastStatusRef.current;
      const roundChanged = round !== lastRoundRef.current;
      const waitingChanged = amWaiting !== lastWaitingRef.current;

      // Reset optimistic timer on round change
      if (roundChanged) {
        setOptimisticTimerStart(null);
      }

      // Handle Transitions
      // 1. Waiting Status Change (Joined/Spectating updates)
      if (waitingChanged) {
        if (status === 'lobby') setCurrentScreen('lobby');
        else if (status === 'uploading') setCurrentScreen(shouldShowWaitingRoom ? 'waiting' : 'uploading');
        else if (status === 'sabotage-selection') setCurrentScreen('sabotage-selection');
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
        else if (status === 'results') setCurrentScreen('results');
        else if (status === 'final') setCurrentScreen('final');
        else if (status === 'rewards') {
          setCurrentScreen('final');
          showGameRewards('replay');
        }
      }
      // 2. Room Status Change (Navigation) - if we are on a "joining" screen OR the lobby
      else if (['room-selection', 'welcome', 'name-entry', 'joining-game', 'lobby'].includes(currentScreen)) {
        if (status === 'lobby') setCurrentScreen('lobby');
        // Check other statuses just in case we rejoin mid-game
        else if (status === 'uploading') setCurrentScreen(shouldShowWaitingRoom ? 'waiting' : 'uploading');
        else if (status === 'sabotage-selection') setCurrentScreen('sabotage-selection');
        else if (status === 'drawing') setCurrentScreen(shouldShowWaitingRoom ? 'waiting' : 'drawing');
        else if (status === 'voting') setCurrentScreen(shouldShowWaitingRoom ? 'waiting' : 'voting');
        else if (status === 'results') setCurrentScreen('results');
        else if (status === 'final') setCurrentScreen('final');
      }
      // 3. In-game status changes (for players already in the game on other screens)
      else if (statusChanged) {
        if (status === 'lobby') {
          setCurrentScreen('lobby');
          setPendingGameStats(null);
        }
        else if (status === 'uploading') setCurrentScreen(shouldShowWaitingRoom ? 'waiting' : 'uploading');
        else if (status === 'sabotage-selection') setCurrentScreen('sabotage-selection');
        else if (status === 'drawing') {


          setCurrentScreen(shouldShowWaitingRoom ? 'waiting' : 'drawing');
          if (!shouldShowWaitingRoom) {
            setStrokes([]);
            setIsMyTimerRunning(false);
          }
        }
        else if (status === 'voting') setCurrentScreen(shouldShowWaitingRoom ? 'waiting' : 'voting');
        else if (status === 'results') setCurrentScreen('results');
        else if (status === 'final') setCurrentScreen('final');
        else if (status === 'rewards') {
          setCurrentScreen('final');
          showGameRewards('replay');
        }
      }
      // Handle Notifications
      if (statusChanged) {
        if (status === 'uploading' && room?.currentUploaderId === player?.id) {
          notifyYourTurnToUpload();
        } else if (status === 'drawing' && !amWaiting) {
          notifyDrawingPhaseStarted();
        } else if (status === 'voting') {
          notifyVotingStarted();
        } else if (status === 'results') {
          notifyResultsReady();
          if (room) handleRoundEndRewards(room);
        } else if (status === 'final') {
          notifyFinalResults();
          if (room) handleGameEndRewards(room);
        }
      }

      // If we successfully joined (room exists), clear pending code
      if (pendingRoomCode === roomCode) {
        setPendingRoomCode(null);
      }

      // Update refs to track what we've processed
      lastStatusRef.current = status;
      lastRoundRef.current = round;
      lastWaitingRef.current = amWaiting;
    }
  }, [room?.status, room?.roundNumber, isLoading, currentScreen, isBrowsing, amWaiting, shouldShowWaitingRoom, roomCode, pendingRoomCode]);

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

  // Effect: Safeguard against stuck loading screen on game screens
  // If we're on a game screen but room data hasn't loaded after 10 seconds, reset to home
  useEffect(() => {
    const gameScreens = ['lobby', 'waiting', 'uploading', 'drawing', 'voting', 'results', 'final'];
    const isGameScreen = gameScreens.includes(currentScreen);

    // Only run if we're on a game screen, have a roomCode, but room is null (not loaded)
    if (isGameScreen && roomCode && !room && !isLoading && !isInitialLoading) {
      const timer = setTimeout(() => {
        // Double-check: still on game screen without room data
        if (!room) {
          console.warn('Room data failed to load after timeout, resetting to home screen');
          setRoomCode(null);
          StorageService.leaveRoom();
          setCurrentScreen('home');
          showToast('Connection lost. Please rejoin the game.', 'error');
        }
      }, 10000); // 10 second timeout

      return () => clearTimeout(timer);
    }
  }, [currentScreen, roomCode, room, isLoading, isInitialLoading, showToast]);


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
  async function handleRoundEndRewards(currentRoom: GameRoom) {
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

      // Check for level-based badge unlocks
      const newBadges = await BadgeService.checkAndAwardLevelBadges(xpResult.newLevel);
      if (newBadges.length > 0) {
        const badgeInfo = BadgeService.getBadgeInfo(newBadges[0]);
        if (badgeInfo) {
          showToast(`New Badge: ${badgeInfo.emoji} ${badgeInfo.name}!`, 'success');
        }
      }
    }

    // 4. Auth Sync
    if (AuthService.isLoggedIn()) {
      await AuthService.updateUser(player.id, { xp: XPService.getXP() });
    }
  };

  async function handleGameEndRewards(currentRoom: GameRoom) {
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

      // Check for level-based badge unlocks
      const newBadges = await BadgeService.checkAndAwardLevelBadges(xpResult.newLevel);
      if (newBadges.length > 0) {
        const badgeInfo = BadgeService.getBadgeInfo(newBadges[0]);
        if (badgeInfo) {
          showToast(`New Badge: ${badgeInfo.emoji} ${badgeInfo.name}!`, 'success');
        }
      }
    }

    if (AuthService.isLoggedIn()) {
      await AuthService.updateUser(player.id, { xp: XPService.getXP() });
    }
  };

  function handlePlayNow() {
    if (player) {
      setCurrentScreen('room-selection');
    } else {
      // Go to Login Screen instead of name-entry
      setCurrentScreen('login');
    }
  };

  // Helper: Common Join Logic after Auth
  function attemptPendingJoin() {
    if (pendingRoomCode) {
      setCurrentScreen('joining-game');
      handleJoinRoom(pendingRoomCode);
    } else {
      setCurrentScreen('home');
    }
  };

  function handleCancelJoin() {
    setPendingRoomCode(null);
    setCurrentScreen('home');
  };

  async function handleLoginComplete() {
    const authUser = AuthService.getCurrentUser();
    if (authUser) {
      // Check if profile is set up
      if (authUser.avatarStrokes && authUser.color) {
        // Profile ready
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

        // Check pending join
        attemptPendingJoin();
      } else {
        // Need to setup profile (Avatar/Color)
        setCurrentScreen('name-entry');
      }
    } else {
      // Guest mode selected
      setCurrentScreen('name-entry');
    }
  };

  function handleProfileComplete(profileData: Omit<Player, 'id' | 'joinedAt' | 'lastSeen'>) {
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

      // Check pending join
      attemptPendingJoin();
    } else {
      // Guest Flow
      const newPlayer: Player = {
        id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
        ...profileData,
        joinedAt: Date.now(),
        lastSeen: Date.now(),
        cosmetics: {
          activeFont: 'default',
          brushesUnlocked: [],
          colorsUnlocked: [],
          badges: [],
          purchasedItems: []
        }
      };
      StorageService.saveSession(newPlayer);
      setPlayer(newPlayer);

      // Check pending join
      attemptPendingJoin();
    }
  };



  async function handleCreateRoom(force: boolean = false) {
    if (!player) return;

    // SINGLE GAME RESTRICTION: Host Check
    if (!force && roomCode && room) {
      setPendingConfirmation({ type: 'host' });
      return;
    }

    setIsLoading(true);
    try {
      const code = await StorageService.createRoom(player);
      setRoomCode(code);
      setIsBrowsing(false);
      setCurrentScreen('lobby');
      showToast('Room created! Share the code! 🎉', 'success');
    } catch (err) {
      console.error('Failed to create room:', err);
      showError(err);
    }
    setIsLoading(false);
  };

  async function handleJoinRoom(code: string, force: boolean = false) {
    if (!player) return;

    // SINGLE GAME RESTRICTION: Join Check
    // If we are already in a room (and it's not the same one we are re-joining)
    if (!force && roomCode && room && roomCode !== code) {
      setPendingConfirmation({ type: 'join', data: code });
      return;
    }

    setIsBrowsing(false);
    startLoading('join'); // Smart Loading Checklist

    // Explicitly update checklist for 'connect'
    // (Already set to loading in startLoading)

    try {
      // 1. Join Room
      updateLoadingStage('connect', 'completed');
      updateLoadingStage('sync', 'loading');

      const newRoom = await StorageService.joinRoom(code.toUpperCase(), player);

      if (newRoom) {
        updateLoadingStage('sync', 'completed');
        updateLoadingStage('verify', 'loading');

        setRoomCode(code.toUpperCase());
        // setRoom(newRoom); // Optimistic set to avoid flicker - useRoom hook handles this

        // Wait a tick for verify
        updateLoadingStage('verify', 'completed');
        // Transition Logic is handled by useRoom effect
        stopLoadingWithDelay();

      } else {
        showError('Room not found or full');
        setIsLoading(false);
      }
    } catch (err) {
      console.error(err);
      updateLoadingStage('connect', 'error');
      showError(err);
      setIsLoading(false);
    }
  };

  async function handleSettingsChange(settings: Partial<GameSettings>) {
    if (!roomCode) return;
    try {
      await StorageService.updateSettings(roomCode, settings);
    } catch (err) {
      console.error('Failed to update settings:', err);
      showError(err);
    }
  };

  async function handleStartGame() {
    if (!roomCode || !room) return;

    startLoading('start'); // Smart Loading Checklist

    try {
      updateLoadingStage('init', 'completed');
      updateLoadingStage('assign', 'loading');

      await StorageService.initiateRound(roomCode); // Changed from startGame to initiateRound

      updateLoadingStage('assign', 'completed');
      updateLoadingStage('sync', 'loading');

      // Let the natural room updates clear the loading screen
      // But ensure we clear it if update comes fast
      setTimeout(() => stopLoadingWithDelay(), 800);

    } catch (err) {
      console.error('Failed to start game:', err);
      updateLoadingStage('init', 'error');
      showError(err);
      setIsLoading(false);
    }
  };

  async function handleUploadImage(file: File) {
    if (!roomCode || !player) return;

    startLoading('upload'); // Smart Loading Checklist

    try {
      // 1. Process
      updateLoadingStage('process', 'completed');
      updateLoadingStage('upload', 'loading');

      const imageUrl = await ImageService.processImage(file, roomCode); // Changed from uploadImage to processImage

      // 2. Upload
      updateLoadingStage('upload', 'completed');
      updateLoadingStage('verify', 'loading');

      await StorageService.startRound(roomCode, imageUrl, player.id);

      updateLoadingStage('verify', 'completed');

      // Clear loading state immediately - don't wait for room status update
      // This prevents stuck loading screen for host
      stopLoadingWithDelay();

    } catch (err: any) {
      console.error('Upload failed:', err);
      updateLoadingStage('upload', 'error');
      showError(err?.message || 'Failed to upload image');
      setIsLoading(false);
    }
  };

  async function handleReady() {
    if (!roomCode || !player) return;
    try {
      setIsReadying(true); // Immediate feedback

      // Optimistic Start
      setOptimisticTimerStart(Date.now());
      setIsMyTimerRunning(true);
      setShowHowToPlay(false);

      await StorageService.playerReady(roomCode, player.id);

      // Trigger sabotage if this player is the target
      if (room?.sabotageTargetId === player.id && !room?.sabotageTriggered) {
        await StorageService.triggerSabotage(roomCode);
      }
    } catch (err) {
      console.error('Failed to mark ready:', err);
      showError(err);
      // Revert optimistic state
      setIsReadying(false);
      setIsMyTimerRunning(false);
      setOptimisticTimerStart(null);
    }
  };


  const handleTimeUp = useCallback(async () => {
    if (!roomCode || !player || !room) return;

    // LOCK: Prevent concurrent submissions (race condition guard)
    if (submissionLockRef.current) {
      console.log('[handleTimeUp] Submission already in progress, ignoring duplicate call');
      return;
    }
    submissionLockRef.current = true;

    // Guard: Prevent duplicate submissions
    const playerState = room.playerStates[player.id];
    if (playerState?.status === 'submitted' || optimisticHasSubmitted) {
      console.log('Drawing already submitted, skipping duplicate submission');
      submissionLockRef.current = false;
      return;
    }

    // IMMEDIATE: Optimistic Updates to prevent "Stuck" state
    setIsMyTimerRunning(false);
    setIsReadying(false);
    setOptimisticHasSubmitted(true); // <--- Optimistic Update
    showToast('Submitting drawing... ☁️', 'info'); // <--- Visual Feedback

    // Force transition locally if needed? 
    // Actually ScreenRouter uses `hasSubmitted` logic. We need to make sure `hasSubmitted` includes our optimistic state.

    const currentStrokes = strokesRef.current;
    const validStrokes = currentStrokes.filter(s => s && Array.isArray(s.points) && s.points.length > 0);

    // OPTIMIZATION: Simplify strokes to reduce data usage
    // Tolerance of 0.5 provides ~80-90% reduction with minimal visual difference
    const simplifiedStrokes = simplifyStrokes(validStrokes, 0.5);

    // Log optimization stats (uncomment for debugging)
    // const originalPoints = validStrokes.reduce((acc: number, s: any) => acc + s.points.length, 0);
    // const newPoints = simplifiedStrokes.reduce((acc: number, s: any) => acc + s.points.length, 0);
    // console.log(`Optimization: Reduced ${originalPoints} to ${newPoints} (${Math.round((1 - newPoints / originalPoints) * 100)}% reduction)`);

    const drawing: PlayerDrawing = {
      playerId: player.id,
      playerName: player.name,
      playerColor: player.color,
      strokes: simplifiedStrokes,
      submittedAt: Date.now()
    };

    try {
      await StorageService.submitDrawing(roomCode, drawing);
      showToast('Drawing submitted! ✅', 'success');
    } catch (err) {
      console.error('Failed to submit drawing:', err);
      showError(err);
    } finally {
      // Release lock after submission completes (success or failure)
      submissionLockRef.current = false;
    }
  }, [roomCode, player, room, showToast, optimisticHasSubmitted]);

  const handleVote = async (votedForId: string) => {
    if (!roomCode || !player) return;
    try {
      await StorageService.submitVote(roomCode, player.id, votedForId);
      showToast('Vote submitted! 🗳️', 'success');
    } catch (err) {
      console.error('Failed to vote:', err);
      showError(err);
    }
  };

  const handleNextRound = async () => {
    if (!roomCode) return;
    try {
      await StorageService.nextRound(roomCode);
    } catch (err) {
      console.error('Failed to start next round:', err);
      showError(err);
    }
  };

  const handlePlayAgain = async () => {
    if (!roomCode || !room || !player) return;

    // Only host can reset the game
    if (room.hostId !== player.id) {
      showToast('Waiting for host to restart... ⏳', 'info');
      return;
    }

    try {
      await StorageService.resetGame(roomCode);
    } catch (err) {
      console.error('Failed to reset game:', err);
      showError(err);
    }
  };

  // Centralized rewards popup trigger - called from FinalResultsScreen
  const showGameRewards = (action: 'home' | 'replay') => {
    if (!room || !player) return;
    const sortedPlayers = [...room.players].sort((a, b) => (room.scores[b.id] || 0) - (room.scores[a.id] || 0));
    const isWinner = sortedPlayers[0]?.id === player.id;
    const coins = 50 + (isWinner ? 100 : 0);
    setPendingGameStats({ xp: 100, coins, isWinner, action });
  };

  const handleSabotageSelect = async (targetId: string, effect: any) => {
    if (!roomCode) return;
    try {
      await StorageService.setSabotageTarget(roomCode, targetId, effect);
    } catch (err) {
      console.error('Failed to set sabotage:', err);
      showError(err);
    }
  };

  const handleLeaveGame = async (targetScreen: Screen = 'room-selection') => {
    // 1. Capture state needed for cleanup
    const roomCodeToLeave = roomCode;
    const playerToLeave = player;

    // 2. Mark this game as "left" in history BEFORE clearing
    if (roomCodeToLeave) {
      StorageService.updateHistoryStatus(roomCodeToLeave, 'left');
    }

    // 3. IMMEDIATE UI Updates (Priority)
    // Clear local session first to prevent auto-rejoin
    StorageService.leaveRoom();
    setRoomCode(null);
    setCurrentScreen(targetScreen);
    setIsLoading(false);
    setIsLoadingTransition(false);
    showToast('Left game 👋', 'info');

    // 4. Deferred Server Cleanup (Don't block UI)
    if (roomCodeToLeave && playerToLeave) {
      setTimeout(async () => {
        try {
          await StorageService.removePlayerFromRoom(roomCodeToLeave, playerToLeave.id);
        } catch (err) {
          console.error('Failed to leave game:', err);
        }
      }, 10);
    }
  };

  const handleJoinCurrentRound = async () => {
    if (!roomCode || !player || !room) return;
    try {
      await StorageService.joinCurrentGame(roomCode, player.id);
      showToast('Joined the round! 🚀', 'success');

      // Force screen transition immediately based on game status
      if (room.status === 'uploading') setCurrentScreen('uploading');
      else if (room.status === 'drawing') setCurrentScreen('drawing');
      else if (room.status === 'voting') setCurrentScreen('voting');
      else if (room.status === 'results') setCurrentScreen('results');
      else if (room.status === 'final') setCurrentScreen('final');
    } catch (err) {
      console.error(err);
      showError(err);
    }
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
      showError(err);
    }
  };



  const handleSafeReset = () => {
    StorageService.leaveRoom(); // Clear local session to prevent auto-rejoin
    window.location.reload();
  };

  const handleConfirmSessionSwitch = async () => {
    if (!pendingConfirmation) return;

    const { type, data } = pendingConfirmation;
    setPendingConfirmation(null); // Close modal

    if (type === 'host') {
      // 1. Leave/End current game
      // If host, maybe we should end it? For now, let's just leave cleanly or "End" if we are host?
      // The requirement says "ask if they want to END the old game" if host.
      if (room?.hostId === player?.id) {
        await handleEndGame();
      } else {
        await handleLeaveGame('room-selection');
      }

      // 2. Create new room (Force)
      // Wait a bit for cleanup
      setTimeout(() => {
        handleCreateRoom(true);
      }, 500);

    } else if (type === 'join') {
      // 1. Leave current game
      await handleLeaveGame('room-selection');

      // 2. Join new room (Force)
      setTimeout(() => {
        if (data) handleJoinRoom(data, true);
      }, 500);
    }
  };



  // Foreground Notification Listener
  useEffect(() => {
    const unsubscribe = onForegroundMessage((payload) => {
      // Handle Game Invite
      if (payload?.data?.type === 'game_invite') {
        const { fromUsername, roomCode } = payload.data;
        showToast(`Game Invite from ${fromUsername}!`, 'success', {
          label: 'JOIN',
          onClick: () => {
            // Handle join
            if (roomCode) {
              handleJoinRoom(roomCode);
            }
          }
        });
      }
      // Handle Friend Request
      else if (payload?.data?.type === 'friend_request') {
        const { fromUsername } = payload.data;
        showToast(`Friend Request from ${fromUsername}! 👋`, 'info', {
          label: 'VIEW',
          onClick: () => {
            // Open friends panel to requests tab
            // The FriendsPanel will automatically show the new request via real-time subscription
            vibrate();
          }
        });
      }
    });
    return () => unsubscribe();
  }, [showToast, handleJoinRoom]);

  if (isLoading || isInitialLoading) {
    return <LoadingScreen onGoHome={handleSafeReset} stages={loadingStages} isOnline={isOnline} isSlow={isSlow} />;
  }

  if (isLoadingTransition) {
    return <LoadingScreen onGoHome={handleSafeReset} stages={loadingStages} isOnline={isOnline} isSlow={isSlow} />;
  }

  // Prevent white screen if in game but room/player missing
  const isGameScreen = ['lobby', 'waiting', 'uploading', 'drawing', 'voting', 'results', 'final'].includes(currentScreen);
  if (isGameScreen && (!room || !player)) {
    return <LoadingScreen onGoHome={handleSafeReset} stages={loadingStages} isOnline={isOnline} isSlow={isSlow} />;
  }



  // Handlers for ScreenRouter
  const handleStoreBack = () => {
    // Refresh player state when returning from store
    const freshUser = AuthService.getCurrentUser();
    if (freshUser && player) {
      const updatedSession = { ...player, cosmetics: freshUser.cosmetics };
      setPlayer(updatedSession);
    }
    setCurrentScreen('home');
  };

  const handleKickPlayer = async (playerId: string) => {
    if (!roomCode) return;
    try {
      await StorageService.kickPlayer(roomCode, playerId);
      showToast('Player kicked 👢', 'info');
    } catch (err) {
      console.error(err);
      showError(err);
    }
  };

  return (
    <div className="fixed inset-0 overflow-hidden bg-black text-white select-none touch-none">

      {/* Global Background - Applied to all screens */}
      {/* Note: User requested safe storage of this background with subtle settings for screens */}
      <MonogramBackground speed="slow" blur="none" opacity={0.15} />

      {/* Main Router with Transitions */}
      <GlobalBlurTransition screenKey={currentScreen}>
        <ScreenRouter
          currentScreen={currentScreen}
          player={player}
          room={room}
          joiningRoomCode={pendingRoomCode}

          onPlayNow={handlePlayNow}
          onLoginComplete={handleLoginComplete}
          onProfileComplete={handleProfileComplete}
          onUpdateProfile={handleUpdateProfile}

          onShowCasino={() => setShowCasinoTransition(true)}
          onShowSettings={() => setShowSettings(true)}
          onRejoin={handleRejoin}
          onPlayWithTransition={() => {
            setShowTunnelTransition(true);
          }}

          onNavigate={setCurrentScreen}
          onBackToHome={() => setCurrentScreen('home')}
          onStoreBack={handleStoreBack}
          onLeaveGame={() => handleLeaveGame('room-selection')}

          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}

          onStartGame={handleStartGame}
          onSettingsChange={handleSettingsChange}
          onKickPlayer={handleKickPlayer}
          onJoinCurrentRound={handleJoinCurrentRound}
          onMinimizeGame={handleMinimizeGame}

          onUploadImage={handleUploadImage}
          onVote={handleVote}
          onNextRound={handleNextRound}
          onPlayAgain={handlePlayAgain}
          onShowRewards={showGameRewards}
          onEquipTheme={handleEquipTheme}
          onSabotageSelect={handleSabotageSelect}

          isMyTimerRunning={isMyTimerRunning}
          isReadying={isReadying}
          onReady={handleReady}

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

          lastGameDetails={lastGameDetails as any}
          showToast={showToast}

          hasSubmitted={hasSubmitted || optimisticHasSubmitted}
          submittedCount={submittedCount}
          totalPlayers={totalPlayers}
          timerEndsAt={timerEndsAt}
          totalTimerDuration={effectiveTotalDuration} // <--- Pass calculated duration
          onTimeUp={handleTimeUp}
        />
      </GlobalBlurTransition>

      {/* Legacy Join Screen Overlay - if stuck in join flow? */}
      {currentScreen === 'joining-game' && pendingRoomCode && (
        <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center">
          <JoiningGameScreen
            roomCode={pendingRoomCode}
            onCancel={handleCancelJoin}
          />
        </div>
      )}

      {/* Global Loading Screen with Smart Stages */}
      {(isLoading || isInitialLoading) && (
        <LoadingScreen
          onGoHome={handleSafeReset}
          stages={isInitialLoading ? loadingStages : undefined}
        />
      )}

      {/* Toast Notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          action={toast.action}
          onClose={hideToast}
        />
      )}

      {/* Modals & Overlays */}
      {showSettings && player && (
        <SettingsModal
          player={player}
          players={room?.players}
          roomCode={roomCode}
          isHost={room?.hostId === player?.id}
          onClose={() => setShowSettings(false)}
          onUpdateProfile={handleUpdateProfile}
          onLeaveGame={roomCode ? () => handleLeaveGame('room-selection') : undefined}
          onEndGame={room?.hostId === player?.id ? handleEndGame : undefined}
          onGoHome={roomCode ? handleMinimizeGame : undefined}
          onKick={handleKickPlayer}
        />
      )}

      {showHowToPlay && (
        <HowToPlayModal
          isOpen={showHowToPlay}
          onClose={handleCloseHowToPlay}
        />
      )}

      <NotificationPromptModal
        isOpen={showNotificationPrompt}
        onEnable={() => {
          setShowNotificationPrompt(false);
          requestPushPermission();
        }}
        onLater={() => setShowNotificationPrompt(false)}
      />

      {/* Casino Overlay */}
      {showCasino && player && (
        <CasinoScreen
          onClose={() => setShowCasino(false)}
        />
      )}

      {/* Game Ended & Kicked Modals */}
      {showGameEnded && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center animate-fade-in">
          <div className="bg-zinc-900 rounded-3xl p-8 text-center max-w-sm mx-4 shadow-2xl pop-in border-4 border-red-500">
            <div className="text-6xl mb-4 animate-bounce">🛑</div>
            <h3 className="text-2xl font-bold text-red-600 mb-2">Game Ended</h3>
            <p className="text-white font-medium">The host has closed the room.</p>
            <p className="text-gray-400 text-sm mt-4">Returning to lobby in {endGameCountdown}...</p>
            <div className="mt-6 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
            </div>
          </div>
        </div>
      )}

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

      {/* Session Confirmation Modal */}
      {pendingConfirmation && (
        <ConfirmationModal
          isOpen={!!pendingConfirmation}
          title={pendingConfirmation.type === 'host' ? (room?.hostId === player?.id ? "End Current Game?" : "Leave Current Game?") : "Leave Current Game?"}
          message={
            pendingConfirmation.type === 'host'
              ? (room?.hostId === player?.id
                ? "You are hosting a game. Starting a new one will end the current game for everyone."
                : "You are in a game. Hosting a new one will remove you from the current game.")
              : "You are already in a game. Joining this new room will remove you from the current one."
          }
          confirmLabel={pendingConfirmation.type === 'host' ? (room?.hostId === player?.id ? "End & Host New" : "Leave & Host") : "Leave & Join"}
          confirmColor={pendingConfirmation.type === 'host' && room?.hostId === player?.id ? 'red' : 'blue'}
          onConfirm={handleConfirmSessionSwitch}
          onCancel={() => setPendingConfirmation(null)}
        />
      )}

      {/* Game Rewards Modal */}
      {pendingGameStats && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] pop-in">
          <div className="rounded-3xl p-8 w-full max-w-sm mx-4 text-center border-4 shadow-2xl relative overflow-hidden"
            style={{
              backgroundColor: 'var(--theme-card-bg)',
              borderColor: 'var(--theme-accent)'
            }}
          >
            {/* Shine effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent pointer-events-none" />

            <div className="text-6xl mb-4 animate-bounce">🎁</div>
            <h2 className="text-3xl font-black mb-2" style={{ color: 'var(--theme-text)' }}>Game Rewards</h2>
            <p className="mb-6" style={{ color: 'var(--theme-text-secondary)' }}>Great game! Here's what you earned:</p>

            <div className="space-y-4 mb-8">
              {/* Coins */}
              <div className="rounded-xl p-4 border-2 flex items-center justify-between"
                style={{
                  backgroundColor: 'var(--theme-bg-secondary)',
                  borderColor: 'var(--theme-border)'
                }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl">🪙</span>
                  <span className="font-bold" style={{ color: 'var(--theme-text)' }}>Coins</span>
                </div>
                <div className="text-2xl font-black text-green-500">+{pendingGameStats.coins}</div>
              </div>

              {/* XP */}
              <div className="rounded-xl p-4 border-2 flex items-center justify-between"
                style={{
                  backgroundColor: 'var(--theme-bg-secondary)',
                  borderColor: 'var(--theme-border)'
                }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl">✨</span>
                  <span className="font-bold" style={{ color: 'var(--theme-text)' }}>XP</span>
                </div>
                <div className="text-2xl font-black text-purple-500">+{pendingGameStats.xp}</div>
              </div>
            </div>

            <button
              onClick={() => {
                const action = pendingGameStats.action;
                setPendingGameStats(null);
                if (action === 'replay') {
                  handlePlayAgain();
                } else {
                  handleLeaveGame('room-selection');
                }
              }}
              className="w-full py-4 rounded-xl font-bold text-lg hover:scale-105 active:scale-95 transition-all shadow-xl"
              style={{
                backgroundColor: 'var(--theme-accent)',
                color: 'var(--theme-button-text)'
              }}
            >
              {pendingGameStats.action === 'replay' ? 'Continue to Lobby' : 'Go Home'}
            </button>
          </div>
        </div>
      )}

      {/* Transition Effects */}
      <ThemeTransition isActive={isTransitionActive} onComplete={handleTransitionComplete} />
      <TunnelTransition
        isActive={showTunnelTransition}
        isDarkMode={player?.cosmetics?.activeTheme?.includes('dark') || false}
        onComplete={() => {
          setShowTunnelTransition(false);
          handlePlayNow();
        }}
      />
      <CasinoTransition
        isActive={showCasinoTransition}
        onComplete={() => {
          setShowCasinoTransition(false);
          setShowCasino(true);
        }}
      />

      {/* Update Notification */}
      {showUpdateNotification && (
        <UpdateNotification
          onUpdate={handleUpdateApp}
          onDismiss={handleDismissUpdate}
        />
      )}

    </div>
  );
}

export default App;
