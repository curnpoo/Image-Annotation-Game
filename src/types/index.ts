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
}

// User account for login system
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
}

export interface PlayerCosmetics {
    brushesUnlocked: string[];
    colorsUnlocked: string[];
    badges: string[];
    activeBrush?: string;
    activeColor?: string;
    purchasedItems?: string[]; // Items bought with currency
}

export interface Player {
    id: string;
    name: string;
    color: string; // Avatar background color
    avatar?: string; // emoji
    avatarStrokes?: DrawingStroke[]; // Drawn avatar
    frame: string; // frame id
    score?: number;
    currency?: number; // $ earned from games
    xp?: number; // Experience points
    level?: number; // Player level
    isHost?: boolean;
    joinedAt: number;
    lastSeen: number; // timestamp for heartbeat
    cosmetics?: PlayerCosmetics;
}

export interface DrawingStroke {
    points: { x: number; y: number }[];
    color: string;
    size: number;
    isEraser?: boolean;
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
    oderId: string;
    votedForId: string;
    votedAt: number;
}

export interface RoundResult {
    roundNumber: number;
    rankings: {
        playerId: string;
        playerName: string;
        votes: number;
        points: number;
    }[];
}

export type GameStatus = 'lobby' | 'uploading' | 'drawing' | 'voting' | 'results' | 'final';

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

    // Chat
    chatEvents?: ChatMessage[];

    // Voting
    votes: { [oderId: string]: string }; // oderId -> votedForId

    // Scores (accumulated across rounds)
    scores: { [playerId: string]: number };

    // Round history
    roundResults: RoundResult[];

    // === Phase 2: Fun Features ===

    // Sabotage Mode (one random round per game)
    sabotageRound?: number; // Which round has sabotage (1-indexed)
    saboteurId?: string; // Player doing the sabotaging
    sabotageTargetId?: string; // Player being sabotaged
    sabotageTriggered?: boolean; // Has the effect started?

    // Double Points (random chance per round)
    isDoublePoints?: boolean; // This round has 2x points

    // Time Bonus (random player gets extra time)
    timeBonusPlayerId?: string; // Player with extra time this round

    createdAt: number;
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
    oderId: string;
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
