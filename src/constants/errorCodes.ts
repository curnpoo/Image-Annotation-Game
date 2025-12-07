export const ERROR_CODES = {
    // Generic & System
    UNKNOWN_ERROR: 'ERR_SYS_000',
    NETWORK_ERROR: 'ERR_NET_001',
    TIMEOUT_ERROR: 'ERR_NET_002',

    // Authentication & Profile
    AUTH_LOGIN_FAILED: 'ERR_AUTH_001',
    AUTH_USER_NOT_FOUND: 'ERR_AUTH_002',
    PROFILE_SAVE_FAILED: 'ERR_PROF_001',
    PROFILE_LOAD_FAILED: 'ERR_PROF_002',

    // Room & Lobby
    ROOM_NOT_FOUND: 'ERR_ROOM_001',
    ROOM_FULL: 'ERR_ROOM_002',
    ROOM_JOIN_FAILED: 'ERR_ROOM_003',
    ROOM_CREATE_FAILED: 'ERR_ROOM_004',
    ROOM_DISCONNECTED: 'ERR_ROOM_005',
    KICKED_FROM_ROOM: 'ERR_ROOM_006',

    // Game Logic
    GAME_STATE_ERROR: 'ERR_GAME_001',
    SUBMISSION_FAILED: 'ERR_GAME_002',
    IMAGE_UPLOAD_FAILED: 'ERR_GAME_003',
    CANVAS_ERROR: 'ERR_GAME_004',
    VOTE_FAILED: 'ERR_GAME_005',

    // Storage & Firebase
    STORAGE_QUOTA_EXCEEDED: 'ERR_STRG_001',
    PERMISSION_DENIED: 'ERR_PERM_001',
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];

export const getFriendlyErrorMessage = (code: string): string => {
    switch (code) {
        case ERROR_CODES.NETWORK_ERROR:
            return 'Connection lost. Please check your internet.';
        case ERROR_CODES.ROOM_NOT_FOUND:
            return 'This room does not exist or has been deleted.';
        case ERROR_CODES.ROOM_FULL:
            return 'This room is currently full.';
        case ERROR_CODES.AUTH_LOGIN_FAILED:
            return 'Could not log you in. Please try again.';
        case ERROR_CODES.IMAGE_UPLOAD_FAILED:
            return 'Failed to upload image. Please try again.';
        case ERROR_CODES.PERMISSION_DENIED:
            return 'You do not have permission to perform this action.';
        default:
            return 'An unexpected error occurred.';
    }
};
