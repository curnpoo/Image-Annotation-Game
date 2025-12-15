// Casino stats for tracking gambling activity
export interface CasinoStats {
    totalSpins: number;
    wins: number;
    losses: number;
    jackpotWins: number;      // Triple matches
    twoOfAKindWins: number;   // Two matching
    totalBetAmount: number;   // Total $ wagered
    totalWinnings: number;    // Total $ won
    totalLosses: number;      // Total $ lost
    biggestWin: number;       // Largest single win
    biggestBet: number;       // Largest single bet
    currentStreak: number;    // Current win/loss streak (positive = wins, negative = losses)
    longestWinStreak: number;
    longestLoseStreak: number;
    netProfit: number;        // totalWinnings - totalBetAmount
}

// Player lifetime stats
export interface PlayerStats {
    gamesPlayed: number;
    gamesWon: number;
    roundsWon: number;
    roundsLost: number;
    timesSabotaged: number;
    timesSaboteur: number;
    totalCurrencyEarned: number;
    totalXPEarned: number;
    highestLevel: number;
    casinoStats?: CasinoStats;
}


// User account for login system
// Friend relationship (stored as user ID, profile fetched on demand)
export interface Friend {
    id: string;           // User ID
    addedAt: number;      // Timestamp when friendship was created
}

// Game invitation
export interface GameInvite {
    id: string;           // Invite ID
    fromUserId: string;   // Sender's user ID
    fromUsername: string; // Sender's name
    toUserId: string;     // Recipient's user ID
    roomCode: string;     // Room to join
    sentAt: number;       // Timestamp
    status: 'pending' | 'accepted' | 'declined' | 'expired';
    origin?: string;      // Origin URL for dynamic links
}

export interface FriendRequest {
    id: string;
    fromUserId: string;
    fromUsername: string;
    toUserId: string;
    status: 'pending' | 'accepted' | 'declined';
    createdAt: number;
}

export interface UserAccount {
    id: string;
    username: string;
    pinHash: string; // Hashed PIN for security
    createdAt: number;
    lastLoginAt: number;
    stats: PlayerStats;
    currency: number;
    xp: number;
    purchasedItems: string[];
    cosmetics: PlayerCosmetics;
    // Profile Data
    avatarStrokes?: DrawingStroke[];
    avatarImageUrl?: string; // Pre-rendered avatar image for display
    color?: string;
    backgroundColor?: string;
    frame?: string;
    avatar?: string; // fallback emoji
    // Friends System
    friends?: string[];   // Array of friend user IDs
    usernameHistory?: string[]; // Last 3 usernames (most recent first)
    lastUsernameChange?: number; // Timestamp for rate limiting
    lastInviteTimes?: { [userId: string]: number }; // Track invite cooldowns per user
    currentRoomCode?: string; // Code of the room the user is currently in (One Room Policy)
    challenges?: PlayerChallengeState[]; // Active player challenges
}


export interface PlayerCosmetics {
    brushesUnlocked: string[];
    colorsUnlocked: string[];
    badges: string[];
    activeBrush?: string;
    activeColor?: string;
    activeBackgroundColor?: string;
    activeCardColor?: string; // Color for player card in lobby
    activeBadge?: string; // Currently displayed badge
    activeTheme?: string; // light/dark mode preference
    activeFont?: string;  // purchased font
    activeStat?: string; // Stat to display on card (level, wins, earnings, etc)
    purchasedItems?: string[]; // Items bought with currency
}

export type ChallengeType = 'daily' | 'weekly';
export type ChallengeAction = 'play_game' | 'win_round' | 'vote_correctly' | 'earn_currency' | 'sabotage';

export interface Challenge {
    id: string;
    type: ChallengeType;
    action: ChallengeAction;
    target: number;
    reward: {
        currency: number;
        xp: number;
    };
    description: string;
    icon: string;
}

export interface PlayerChallengeState {
    challengeId: string;
    progress: number;
    completed: boolean;
    claimed: boolean;
    assignedAt: number; // To check for daily reset
    expiresAt: number;
}

export interface Player {
    id: string;
    name: string;
    color: string; // Avatar background color (this seems to be stroke color based on existing usage?)
    backgroundColor?: string; // Avatar background fill
    avatar?: string; // emoji
    avatarStrokes?: DrawingStroke[]; // Drawn avatar
    avatarImageUrl?: string; // Pre-rendered avatar image URL for display
    frame: string; // frame id
    score?: number;
    currency?: number; // $ earned from games
    xp?: number; // Experience points
    level?: number; // Player level
    isHost?: boolean;
    joinedAt: number;
    lastSeen: number; // timestamp for heartbeat
    stats?: PlayerStats; // Stats for display in lobby
    cosmetics?: PlayerCosmetics;
}


export interface DrawingStroke {
    points: { x: number; y: number }[];
    color: string;
    size: number;
    isEraser?: boolean;
    type?: string; // 'default' | 'marker' | 'calligraphy' | 'pixel' | 'neon' | 'spray'
}

export interface PlayerDrawing {
    playerId: string;
    playerName: string;
    playerColor: string;
    strokes: DrawingStroke[];
    submittedAt: number;
}

export interface GameSettings {
    timerDuration: number; // seconds (10, 15, 20, 30)
    totalRounds: number; // (3, 5, 7, 10)
    enableSabotage?: boolean;
}

export interface BlockInfo {
    type: 'square' | 'circle';
    // Position as percentage of image (0-100)
    x: number;
    y: number;
    size: number; // percentage of image width
}

export type PlayerStatus = 'waiting' | 'ready' | 'drawing' | 'submitted';

export interface PlayerState {
    status: PlayerStatus;
    timerStartedAt?: number;
    drawing?: PlayerDrawing;
}

export interface Vote {
    voterId: string;
    votedForId: string;
    votedAt: number;
}

export interface RoundResult {
    roundNumber: number;
    imageUrl?: string; // Base image for this round
    block?: BlockInfo; // The white block/mask used in this round
    rankings: {
        playerId: string;
        playerName: string;
        votes: number;
        points: number;
    }[];
    drawings?: {
        playerId: string;
        playerName: string;
        playerColor: string;
        strokes: DrawingStroke[];
    }[]; // Optional: May be stripped for history optimization
}


export type GameStatus = 'lobby' | 'uploading' | 'sabotage-selection' | 'drawing' | 'voting' | 'results' | 'final' | 'rewards';

export interface GameRoom {
    roomCode: string;
    hostId: string;
    status: GameStatus;
    settings: GameSettings;

    // Current round info
    roundNumber: number;
    currentUploaderId?: string; // ID of player whose turn it is to upload
    currentImage?: {
        url: string;
        uploadedBy: string;
        uploadedAt: number;
    } | null;
    block?: BlockInfo | null;

    // Player data
    players: Player[];
    waitingPlayers?: Player[]; // Players waiting for next round
    playerStates: { [playerId: string]: PlayerState };

    // Chat - MOVED TO SEPARATE PATH (ChatService)
    // chatEvents?: ChatMessage[];

    // Voting
    votes: { [voterId: string]: string }; // voterId -> votedForId

    // Scores (accumulated across rounds)
    scores: { [playerId: string]: number };

    // Round history
    roundResults: RoundResult[];

    // === Phase 2: Fun Features ===

    // Sabotage Mode (one random round per game)
    sabotageRound?: number | null; // Which round has sabotage (1-indexed)
    saboteurId?: string | null; // Player doing the sabotaging
    sabotageTargetId?: string | null; // Player being sabotaged
    sabotageEffect?: SabotageEffect;
    sabotageTriggered?: boolean; // Has the effect started?

    // Double Points (random chance per round)
    isDoublePoints?: boolean; // This round has 2x points

    // Time Bonus (random player gets extra time)
    timeBonusPlayerId?: string | null; // Player with extra time this round

    createdAt: number;
}

export type SabotageType = 'subtract_time' | 'reduce_colors' | 'visual_distortion';

export interface SabotageEffect {
    type: SabotageType;
    intensity: number; // 1-10 scale maybe? or just generic
}

export interface ChatMessage {
    id: string;
    playerId: string;
    playerName: string;
    playerAvatar?: string;
    text: string;
    timestamp: number;
}

export interface PlayerSession {
    voterId: string;
    playerName: string;
    currentRoom?: string;
    assignedColor: string;
}

// Legacy type for backwards compat during migration
export interface Annotation {
    playerId: string;
    playerName: string;
    playerColor: string;
    roundNumber: number;
    drawingData: DrawingStroke[];
    submittedAt: number;
}
export interface RoomHistoryEntry {
    roomCode: string;
    lastSeen: number;
    hostName?: string;
    winnerName?: string;
    playerCount?: number;
    roundNumber?: number;
    endReason?: 'finished' | 'early' | 'cancelled' | 'left';
    leaderName?: string;
}
// Individual toast message for grouping
export interface ToastMessage {
    id: string;
    message: string;
    type: 'error' | 'success' | 'info';
    action?: {
        label: string;
        onClick: () => void;
    };
}

// Grouped toast state - displays multiple messages in one card
export interface ToastState {
    messages: ToastMessage[];
}

export type Screen = 'welcome' | 'login' | 'name-entry' | 'home' | 'room-selection' | 'store' | 'profile' | 'avatar-editor' | 'lobby' | 'waiting' | 'joining-game' | 'uploading' | 'sabotage-selection' | 'drawing' | 'voting' | 'results' | 'final' | 'stats' | 'level-progress' | 'gallery';

export interface LoadingStage {
    id: string;
    label: string;
    status: 'pending' | 'loading' | 'completed' | 'error';
    error?: string;
}

// Stats history for graphs over time
export interface StatsHistoryEntry {
    timestamp: number;
    gamesPlayed: number;
    gamesWon: number;
    roundsWon: number;
    roundsLost: number;
    totalCurrencyEarned: number;
    totalXPEarned: number;
    level: number;
    currency: number; // Current balance at snapshot
}

// === Gallery Types ===

// A drawing saved to gallery
export interface GalleryDrawing {
    playerId: string;
    playerName: string;
    playerColor: string;
    strokes: DrawingStroke[];
    renderedImageUrl?: string;  // Firebase Storage URL of combined image+strokes
    votes: number;
}

// A complete snapshot of a round for gallery viewing
export interface GalleryRound {
    roundNumber: number;
    imageUrl: string;           // The base image
    block?: BlockInfo;          // The white block/mask used in this round
    drawings: GalleryDrawing[]; // All player drawings for this round
    winner: {
        playerId: string;
        playerName: string;
        votes: number;
    };
}

// A completed game saved to gallery
export interface GalleryGame {
    gameId: string;             // Unique ID for this game
    roomCode: string;           // Original room code
    completedAt: number;        // Timestamp
    playerIds: string[];        // Who participated (for access control)
    players: { id: string; name: string; color: string }[];
    rounds: GalleryRound[];
    finalScores: { [playerId: string]: number };
    winner: { playerId: string; playerName: string };
}
