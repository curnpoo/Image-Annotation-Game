export interface Player {
    id: string;
    name: string;
    color: string;
    avatar?: string; // Emoji (legacy/fallback)
    avatarStrokes?: DrawingStroke[]; // Drawn avatar
    frame: string; // CSS class for frame effect
    joinedAt: number;
    lastSeen: number;
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

    // Voting
    votes: { [oderId: string]: string }; // oderId -> votedForId

    // Scores (accumulated across rounds)
    scores: { [playerId: string]: number };

    // Round history
    roundResults: RoundResult[];

    createdAt: number;
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
