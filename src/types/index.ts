export interface Player {
    id: string;
    name: string;
    color: string;
    joinedAt: number;
    lastSeen: number;
}

export interface Annotation {
    playerId: string;
    playerName: string;
    playerColor: string;
    roundNumber: number;
    drawingData: DrawingStroke[];
    submittedAt: number;
}

export interface DrawingStroke {
    points: { x: number; y: number }[];
    color: string;
    size: number;
}

export interface GameRoom {
    roomCode: string;
    status: 'lobby' | 'annotating' | 'reviewing';
    currentImage?: {
        url: string;
        uploadedBy: string;
        uploadedAt: number;
    };
    roundNumber: number;
    // Turn-based fields
    turnOrder: string[]; // Array of player IDs
    currentTurnIndex: number;
    turnStatus: 'waiting' | 'drawing'; // 'waiting' for ready, 'drawing' with timer
    turnEndsAt?: number;
    players: Player[];
    annotations: Annotation[];
    roundStartedAt?: number;
    roundEndsAt?: number;
    createdAt: number;
}

export interface PlayerSession {
    playerId: string;
    playerName: string;
    currentRoom?: string;
    assignedColor: string;
}
