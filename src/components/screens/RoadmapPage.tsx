import React, { useState } from 'react';
import { MonogramBackground } from '../common/MonogramBackground';
import './RoadmapPage.css';

interface RoadmapTask {
    id: string;
    type: 'FIX' | 'FEAT' | 'ADD' | 'REMOVE' | 'REFACTOR' | 'CONFIRMED';
    title: string;
    description?: string;
    completedDate?: string;
}

interface RoadmapColumn {
    id: string;
    title: string;
    emoji: string;
    color: string;
    tasks: RoadmapTask[];
}

// Done items with completion dates
const doneItems: RoadmapTask[] = [
    { id: 'd1', type: 'CONFIRMED', title: 'Game Loop', description: 'Core game loop is working', completedDate: 'Dec 1' },
    { id: 'd2', type: 'FIX', title: 'Player Profile picture in waiting for upload screen', description: 'Fixed visibility and text contrast on dark background', completedDate: 'Dec 7' },
    { id: 'd3', type: 'FIX', title: 'Results screen scrolling', description: 'Results can now be scrolled', completedDate: 'Dec 8' },
    { id: 'd4', type: 'FIX', title: 'Drawing round UI and UX', description: 'Timer aligned with canvas, Bento style toolbar, touch-friendly interface', completedDate: 'Dec 8' },
    { id: 'd5', type: 'REMOVE', title: 'Circle above color picker', description: 'Removed preview circle, color reflects on profile photo directly', completedDate: 'Dec 8' },
    { id: 'd6', type: 'FIX', title: 'Popup z-index issue', description: 'Leave/join popup is now front and foremost above all menus', completedDate: 'Dec 9' },
    { id: 'd7', type: 'FIX', title: 'Remove Landscape mode', description: 'App locked to portrait-only orientation with landscape blocker overlay', completedDate: 'Dec 10' },
    { id: 'd8', type: 'ADD', title: 'Profile picture loading state', description: 'Universal loading spinner shown when fetching profile pictures', completedDate: 'Dec 10' },
    { id: 'd9', type: 'FIX', title: 'Level 0 bug', description: 'XP synced from Firebase to fix level calculation for older accounts', completedDate: 'Dec 10' },
    { id: 'd10', type: 'FEAT', title: 'Pinch-to-zoom on drawing canvas', description: 'iOS-native spring physics, two-finger pan, drawing disabled during gestures', completedDate: 'Dec 10' },
    { id: 'd11', type: 'FEAT', title: 'iOS-style toast notifications', description: 'Redesigned toasts with glassmorphism, spring animations, and action buttons', completedDate: 'Dec 10' },
    { id: 'd12', type: 'FEAT', title: 'Grouped notifications', description: 'Multiple notifications batch together with dynamic sizing', completedDate: 'Dec 10' },
    { id: 'd13', type: 'ADD', title: 'Database cleanup script', description: 'Script to clear stale rooms, drawings, presence, invites, and friendRequests', completedDate: 'Dec 10' },
    { id: 'd14', type: 'FEAT', title: 'Tappable notification cards', description: 'Tap anywhere on notification to take action, left pill to dismiss', completedDate: 'Dec 10' },
    { id: 'd15', type: 'ADD', title: 'Notification timer progress bar', description: 'Gradient line shrinks inward showing time remaining before auto-dismiss', completedDate: 'Dec 10' },
    { id: 'd16', type: 'FIX', title: 'Loading screen transition', description: 'Smooth transition with 500ms delay after all checks complete', completedDate: 'Dec 10' },
    { id: 'd17', type: 'FIX', title: 'Help overlay animation polish', description: 'Refined animation timing and line endpoints for help guide', completedDate: 'Dec 11' },
];

const roadmapData: RoadmapColumn[] = [
    {
        id: 'working',
        title: 'Working',
        emoji: '🔧',
        color: '#f59e0b',
        tasks: [
            { id: 'w4', type: 'FEAT', title: 'Push notifications for friend requests', description: '[FCM, NotificationService] Send push notifications when receiving friend requests while app is closed' },
            { id: 'w5', type: 'FIX', title: 'Match history accuracy', description: '[ProfileScreen.tsx, MatchHistory component] Fix incorrect game count, add dropdown per round showing winner\'s drawing' },
            { id: 'w6', type: 'FEAT', title: 'Update/Version Popup Logic', description: '[App.tsx, UpdateNotification.tsx] Check version.json vs running version to show "Update Available" only when needed' },
            { id: 'w7', type: 'FEAT', title: 'Add invites section', description: '[HomeScreen.tsx, new InvitesPanel component] Add section showing game invites from friends, auto-clear after 5 hours, allow late join' },
        ]
    },
    {
        id: 'today',
        title: 'Today',
        emoji: '📅',
        color: '#eab308',
        tasks: [
            { id: 't2', type: 'FIX', title: 'Fix sabotage mechanic', description: '[DrawingScreen.tsx, VotingScreen.tsx, GameService] Entire sabotage game mode is broken - fix saboteur assignment, voting logic, and reveal flow' },
            { id: 't3', type: 'FIX', title: 'Player card online status', description: '[FriendsScreen.tsx, LobbyScreen.tsx] Fix presence system, show accurate game status, clear status when offline' },
            { id: 't4', type: 'FIX', title: 'Empty game join prevention', description: '[RoomSelectionScreen.tsx, GameService] Auto-close empty games in Firebase, gray out "left" games in room list' },
            { id: 't5', type: 'FIX', title: 'Timer end screen flow', description: '[DrawingScreen.tsx] Keep toolbar visible when timer ends, add blurred overlay when player clicks ready button' },
            { id: 't6', type: 'FIX', title: 'Home from results = left game', description: '[FinalResultsScreen.tsx, HomeScreen.tsx] Clicking home marks player as "left game", remove rejoin button from HomeScreen current game section' },
            { id: 't7', type: 'REFACTOR', title: 'Host starts while player in menu', description: '[AvatarEditorScreen.tsx, LobbyScreen.tsx] Auto-save avatar edits on game start, show idle overlay' },
        ]
    },
    {
        id: 'tomorrow',
        title: 'Tomorrow',
        emoji: '📆',
        color: '#3b82f6',
        tasks: [
            { id: 'tm8', type: 'FIX', title: 'Fix "Money Earned" stat', description: '[FinalResultsScreen.tsx, UserService] Ensure totalCurrencyEarned is correctly tracked and incremented' },
            { id: 'tm9', type: 'FEAT', title: 'Conditional Idle Refresh', description: '[App.tsx] Ensure auto-refresh only triggers when user is on homescreen and truly idle' },
            { id: 'tm10', type: 'FIX', title: 'Verify Database Cleanup', description: 'Run and verify the database cleanup script on production data' },
        ]
    },
    {
        id: 'later',
        title: 'Later',
        emoji: '🔮',
        color: '#8b5cf6',
        tasks: [
            { id: 'l1', type: 'FEAT', title: 'Replay mode', description: '[FinalResultsScreen.tsx, new ReplayPlayer component] Add playback feature that animates strokes appearing in real-time for each drawing' },
            { id: 'l2', type: 'FEAT', title: 'Waiting room minigame', description: '[LobbyScreen.tsx, new WaitingMinigame component] Add interactive activities while waiting for other players between rounds' },
            { id: 'l3', type: 'FEAT', title: 'NEW GAME MODES!', description: '[GameService, RoomSelectionScreen.tsx] Add new game mode options beyond standard drawing guessing' },
            { id: 'l4', type: 'FEAT', title: 'Dark and Light mode', description: '[ThemeProvider, all screens] Add theme toggle with cohesive dark/light color schemes across entire app' },
            { id: 'l5', type: 'FEAT', title: 'Release iOS app', description: 'Deploy to App Store' },
        ]
    },
    {
        id: 'todo',
        title: 'Backlog',
        emoji: '📋',
        color: '#ec4899',
        tasks: [
            { id: 'b1', type: 'FIX', title: 'Polish animations for iOS native feel', description: '[All animation files, ScreenTransition.tsx] Apply Apple HIG spring physics, consistent easing curves, and gesture feedback across all interactions' },
            { id: 'b2', type: 'FIX', title: 'Smooth transitions overhaul', description: '[App.tsx, ScreenTransition.tsx, transitions.css] Optimize all screen-to-screen transitions for 60fps with preloading and GPU acceleration' },
            { id: 'b3', type: 'REFACTOR', title: 'Performance optimization', description: '[GameService, Firebase listeners, React components] Reduce network calls, optimize re-renders, fix lag on slow connections' },
            { id: 'b4', type: 'REFACTOR', title: 'Universal Button Components', description: '[src/components/common/] Create reusable GlassButton, IconButton, ActionButton components with consistent styling and animations' },
            { id: 'b5', type: 'FIX', title: 'iPhone haptic feedback', description: '[utils/haptics.ts] Haptic feedback only works on Android - investigate and implement iOS-compatible vibration using Web Vibration API or native bridges' },
        ]
    }
];

const typeColors: Record<string, { bg: string; text: string }> = {
    FIX: { bg: 'rgba(239, 68, 68, 0.2)', text: '#ef4444' },
    FEAT: { bg: 'rgba(34, 197, 94, 0.2)', text: '#22c55e' },
    ADD: { bg: 'rgba(59, 130, 246, 0.2)', text: '#3b82f6' },
    REMOVE: { bg: 'rgba(249, 115, 22, 0.2)', text: '#f97316' },
    REFACTOR: { bg: 'rgba(168, 85, 247, 0.2)', text: '#a855f7' },
    CONFIRMED: { bg: 'rgba(34, 197, 94, 0.3)', text: '#22c55e' },
};

export const RoadmapPage: React.FC = () => {
    const [isDoneExpanded, setIsDoneExpanded] = useState(false);

    const handleBackToGame = () => {
        window.location.href = '/';
    };

    return (
        <div className="roadmap-page">
            <MonogramBackground />

            {/* Header */}
            <header className="roadmap-header">
                <div className="header-top-row">
                    <button onClick={handleBackToGame} className="back-button">
                        ← Back
                    </button>
                    <div className="version-badge">v0.8 Alpha</div>
                </div>
                <div className="header-content">
                    <h1>🗺️ Roadmap</h1>
                    <p className="subtitle">What's coming to ANO</p>
                    <p className="last-updated">Last updated: December 11, 2025</p>
                </div>
            </header>

            {/* Done Dropdown */}
            <section className="done-dropdown">
                <button
                    className="done-dropdown-header"
                    onClick={() => setIsDoneExpanded(!isDoneExpanded)}
                >
                    <div className="done-dropdown-left">
                        <span className="done-emoji">✅</span>
                        <span className="done-title">Done</span>
                        <span className="done-count">{doneItems.length}</span>
                    </div>
                    <span className={`done-chevron ${isDoneExpanded ? 'expanded' : ''}`}>
                        ▼
                    </span>
                </button>

                {isDoneExpanded && (
                    <div className="done-dropdown-content">
                        {doneItems.map((task) => (
                            <article key={task.id} className="task-card done-task-card">
                                <div className="task-header">
                                    <span
                                        className="task-type"
                                        style={{
                                            backgroundColor: typeColors[task.type]?.bg,
                                            color: typeColors[task.type]?.text
                                        }}
                                    >
                                        {task.type}
                                    </span>
                                    {task.completedDate && (
                                        <span className="task-completed-date">
                                            {task.completedDate}
                                        </span>
                                    )}
                                </div>
                                <h3 className="task-title">{task.title}</h3>
                                {task.description && (
                                    <p className="task-description">{task.description}</p>
                                )}
                            </article>
                        ))}
                    </div>
                )}
            </section>

            {/* Roadmap Grid */}
            <main className="roadmap-grid">
                {roadmapData.map((column) => (
                    <section key={column.id} className="roadmap-column">
                        <div className="column-header" style={{ borderColor: column.color }}>
                            <span className="column-emoji">{column.emoji}</span>
                            <h2>{column.title}</h2>
                            <span className="task-count">{column.tasks.length}</span>
                        </div>

                        <div className="column-tasks">
                            {column.tasks.map((task) => (
                                <article key={task.id} className="task-card">
                                    <div className="task-header">
                                        <span
                                            className="task-type"
                                            style={{
                                                backgroundColor: typeColors[task.type]?.bg,
                                                color: typeColors[task.type]?.text
                                            }}
                                        >
                                            {task.type}
                                        </span>
                                    </div>
                                    <h3 className="task-title">{task.title}</h3>
                                    {task.description && (
                                        <p className="task-description">{task.description}</p>
                                    )}
                                </article>
                            ))}
                        </div>
                    </section>
                ))}
            </main>

            {/* Footer */}
            <footer className="roadmap-footer">
                <p>Last updated: December 10, 2025</p>
                <p className="footer-note">Built with ❤️ by Curren</p>
            </footer>
        </div>
    );
};

export default RoadmapPage;
