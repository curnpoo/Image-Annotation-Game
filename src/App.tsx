import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

import { CasinoScreen } from './components/screens/CasinoScreen';
import { WelcomeScreen } from './components/screens/WelcomeScreen';
import { LoginScreen } from './components/screens/LoginScreen';
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
import { TunnelTransition, CasinoTransition } from './components/common/ScreenTransition';
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
import { requestPushPermission, storePushToken, isPushSupported } from './services/pushNotifications';

import { useNotifications } from './hooks/useNotifications';
import { usePlayerSession } from './hooks/usePlayerSession';
import type { Player, GameSettings, PlayerDrawing, GameRoom, Screen } from './types';

// Extended Screen type to include the new joining screen
// Note: In a real app we'd update the type definition in types.ts, casting for now if needed or relying on string loose typing


function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('welcome');
  const {
    player, setPlayer,
    roomCode, setRoomCode,
    isInitialLoading,
    handleUpdateProfile
  } = usePlayerSession({ setCurrentScreen });

  // Pending Room Code from URL
  const [pendingRoomCode, setPendingRoomCode] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);

  const {
    toast,
    showToast,
    hideToast,
    showNotificationPrompt,
    setShowNotificationPrompt
  } = useNotifications();

  // Theme Transition Handler
  const handleTransitionComplete = () => {
    setIsTransitionActive(false);
  };

  // Drawing State
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

  const {
    isMyTimerRunning, setIsMyTimerRunning,
    showHowToPlay, setShowHowToPlay,
    isReadying, setIsReadying,
    showGameEnded, setShowGameEnded,
    showKicked, setShowKicked,
    endGameCountdown, setEndGameCountdown,
    kickCountdown, setKickCountdown,
    lastGameDetails, setLastGameDetails
  } = useGameFlow();

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


  const [pendingGameStats, setPendingGameStats] = useState<{ xp: number, coins: number, isWinner: boolean, action: 'home' | 'replay' } | null>(null);
  const [optimisticTimerStart, setOptimisticTimerStart] = useState<number | null>(null);

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

  // Check URL for join code on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const joinCode = params.get('join');
    if (joinCode) {
      const code = joinCode.toUpperCase();
      console.log('Found join code in URL:', code);
      setPendingRoomCode(code);

      // Clear URL to prevent re-joining on reload (optional, but good UX)
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // Auto-join effect when we have a player AND a pending room code
  useEffect(() => {
    if (player && pendingRoomCode && !isLoading && !roomCode) {
      // If we are logged in and have a pending code, show joining screen and try to join
      setCurrentScreen('joining-game');

      // Small delay to let the UI render
      const timer = setTimeout(() => {
        handleJoinRoom(pendingRoomCode);
        // We don't clear pendingRoomCode immediately in case it fails, 
        // but handleJoinRoom will handle success/failure toast
        // If success -> roomCode set -> transition to lobby
        // If fail -> toast -> stay on home/welcome? 
        // actually handleJoinRoom catches errors.
      }, 500); // 500ms delay for visual feedback

      return () => clearTimeout(timer);
    }
  }, [player, pendingRoomCode, isLoading, roomCode]);

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
      else if (room.status === 'sabotage-selection') setCurrentScreen('sabotage-selection');
      else if (room.status === 'drawing') setCurrentScreen('drawing');
      else if (room.status === 'voting') setCurrentScreen('voting');
      else if (room.status === 'results') setCurrentScreen('results');
      else if (room.status === 'final') setCurrentScreen('final');
    }
  };

  const handleCloseHowToPlay = () => {
    setShowHowToPlay(false);
    localStorage.setItem('has_seen_onboarding', 'true');
  };

  // Onboarding Effect: Auto-show on Home if not seen
  useEffect(() => {
    if (currentScreen === 'home' && !localStorage.getItem('has_seen_onboarding') && !isInitialLoading) {
      // Small delay to ensure smooth transition
      const timer = setTimeout(() => {
        setShowHowToPlay(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentScreen, isInitialLoading]);

  const handleRejoin = async (code: string) => {
    if (!player) return;
    // If we are already connected to this room, just resume
    if (roomCode === code && room) {
      handleResumeGame();
      return;
    }
    handleJoinRoom(code);
  };





  const { room, error: roomError } = useRoom(roomCode, player?.id || null);





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
  const shouldShowWaitingRoom = !amInGame && (amInQueue || true); // If not in game, show waiting room (spectator)

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
    const levelTimeBonus = XPService.getTimeBonus();
    const bonusTime = (hasTimeBonus ? 5 : 0) + levelTimeBonus - (isTimeSabotaged ? penalty : 0);

    const effectiveStartedAt = myState?.timerStartedAt || optimisticTimerStart;

    const endsAt = effectiveStartedAt
      ? effectiveStartedAt + (totalDuration + bonusTime) * 1000
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

  const { myPlayerState, hasSubmitted, timerEndsAt, submittedCount, totalPlayers } = stats;

  // Sync screen with room status
  useEffect(() => {
    if (roomCode && room && !isLoading && !isBrowsing) {
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
          else if (status === 'results') setCurrentScreen('results'); // Everyone sees results
          else if (status === 'final') setCurrentScreen('final');
          return;
        }

        if (currentScreen === 'room-selection' || currentScreen === 'welcome' || currentScreen === 'name-entry') {
          if (status === 'lobby') setCurrentScreen('lobby');
          else if (status === 'uploading') setCurrentScreen(shouldShowWaitingRoom ? 'waiting' : 'uploading');
          else if (status === 'sabotage-selection') setCurrentScreen('sabotage-selection');
          else if (status === 'drawing') setCurrentScreen(shouldShowWaitingRoom ? 'waiting' : 'drawing');
          else if (status === 'voting') setCurrentScreen(shouldShowWaitingRoom ? 'waiting' : 'voting');
          else if (status === 'results') setCurrentScreen('results');
          else if (status === 'final') setCurrentScreen('final');
        }
        return;
      }


      lastStatusRef.current = status;
      lastRoundRef.current = round;
      lastWaitingRef.current = amWaiting;

      // Reset optimistic timer on round change
      if (roundChanged) {
        setOptimisticTimerStart(null);
      }

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

      // Routing Logic - Immediate transition, no fake delay
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
          setIsReadying(false);
        }
      }
      else if (status === 'voting') setCurrentScreen(shouldShowWaitingRoom ? 'waiting' : 'voting');
      else if (status === 'results') setCurrentScreen('results');
      else if (room.status === 'final') setCurrentScreen('final');

      // If we successfully joined (room exists), clear pending code
      if (pendingRoomCode === roomCode) {
        setPendingRoomCode(null);
      }
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

  const handlePlayNow = () => {
    // If we have a session, go to home (should cover edge cases)
    if (player) {
      setCurrentScreen('home');
    } else {
      // Go to Login Screen instead of name-entry
      setCurrentScreen('login');
    }
  };

  // Helper: Common Join Logic after Auth
  const attemptPendingJoin = () => {
    if (pendingRoomCode) {
      setCurrentScreen('joining-game');
      handleJoinRoom(pendingRoomCode);
    } else {
      setCurrentScreen('home');
    }
  };

  const handleCancelJoin = () => {
    setPendingRoomCode(null);
    setCurrentScreen('home');
  };

  const handleLoginComplete = async () => {
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
        // Clear pending code on success
        if (code === pendingRoomCode) {
          setPendingRoomCode(null);
        }
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
      const imageUrl = await ImageService.processImage(file, roomCode);
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
      showToast('Failed to start drawing 😅', 'error');
      // Revert optimistic state
      setIsReadying(false);
      setIsMyTimerRunning(false);
      setOptimisticTimerStart(null);
    }
  };


  const handleTimeUp = useCallback(async () => {
    if (!roomCode || !player || !room) return;

    setIsMyTimerRunning(false);
    setIsReadying(false);

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
      showToast('Failed to unleash chaos 😅', 'error');
    }
  };

  const handleLeaveGame = async (targetScreen: Screen = 'room-selection') => {
    // 1. Capture state needed for cleanup
    const roomCodeToLeave = roomCode;
    const playerToLeave = player;

    // 2. IMMEDIATE UI Updates (Priority)
    // Clear local session first to prevent auto-rejoin
    StorageService.leaveRoom();
    setRoomCode(null);
    setCurrentScreen(targetScreen);
    setIsLoading(false);
    setIsLoadingTransition(false);
    showToast('Left game 👋', 'info');

    // 3. Deferred Server Cleanup (Don't block UI)
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
      showToast('Failed to join round', 'error');
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
      showToast('Failed to kick player', 'error');
    }
  };

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

      {currentScreen === 'joining-game' && pendingRoomCode && (
        <JoiningGameScreen
          roomCode={pendingRoomCode}
          onCancel={handleCancelJoin}
        />
      )}

      {currentScreen === 'welcome' && (
        <WelcomeScreen
          onPlay={() => setCurrentScreen('login')}
          joiningRoomCode={pendingRoomCode}
        />
      )}

      {currentScreen === 'login' && (
        <LoginScreen
          onLogin={handleLoginComplete}
          joiningRoomCode={pendingRoomCode}
        />
      )}

      {/* Transition Overlays */}
      <TunnelTransition
        isActive={showTunnelTransition}
        isDarkMode={player?.cosmetics?.activeTheme?.includes('dark') || false}
        onComplete={() => {
          setShowTunnelTransition(false);
          setCurrentScreen('room-selection');
        }}
      />
      <CasinoTransition
        isActive={showCasinoTransition}
        onComplete={() => {
          setShowCasinoTransition(false);
          setShowCasino(true);
        }}
      />

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
      {showHowToPlay && (
        <HowToPlayModal
          isOpen={showHowToPlay}
          onClose={handleCloseHowToPlay}
        />
      )}

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



      {/* Screen Router handles all main views */}
      <ScreenRouter
        currentScreen={currentScreen}
        player={player}
        room={room}

        onPlayNow={handlePlayNow}
        onLoginComplete={handleLoginComplete}
        onProfileComplete={handleProfileComplete}
        onUpdateProfile={handleUpdateProfile}

        onShowCasino={() => setShowCasinoTransition(true)}
        onShowSettings={() => setShowSettings(true)}
        onRejoin={handleRejoin}
        onPlayWithTransition={() => setShowTunnelTransition(true)}

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

        hasSubmitted={hasSubmitted}
        submittedCount={submittedCount}
        totalPlayers={totalPlayers}
        timerEndsAt={timerEndsAt}
        onTimeUp={handleTimeUp}
      />

      <ThemeTransition isActive={isTransitionActive} onComplete={handleTransitionComplete} />

      {/* Universal Game Rewards Modal */}
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
    </div>
  );
}

export default App;
