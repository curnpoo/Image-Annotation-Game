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
];

const roadmapData: RoadmapColumn[] = [
    {
        id: 'working',
        title: 'Working',
        emoji: '🔧',
        color: '#f59e0b',
        tasks: [
            { id: 'w1', type: 'FIX', title: 'Remove Landscape mode', description: 'Enforcing portrait-only orientation' },
            { id: 'w2', type: 'FEAT', title: 'Add zooming to drawing canvas', description: 'Pinch-to-zoom with iOS-native feel' },
            { id: 't4', type: 'ADD', title: 'Profile picture loading state', description: 'Universal loading indicator instead of default photo' },
            { id: 't3', type: 'FIX', title: 'Level 0 bug', description: 'Older accounts showing Level 0 in lobby' },
        ]
    },
    {
        id: 'today',
        title: 'Today',
        emoji: '📅',
        color: '#eab308',
        tasks: [
            { id: 't1', type: 'FEAT', title: 'Add invites section', description: 'Shows invites from friends, clears after 5 hours, allows late acceptance' },
            { id: 't2', type: 'FIX', title: 'Loading screen transition', description: 'Show all green checks → 300ms delay → smooth fade with preloaded screen' },
            { id: 't5', type: 'FEAT', title: 'Friend request popups', description: 'In-game and out-of-app notifications for friend requests' },
        ]
    },
    {
        id: 'tomorrow',
        title: 'Tomorrow',
        emoji: '📆',
        color: '#3b82f6',
        tasks: [
            { id: 'tm1', type: 'FIX', title: 'Match history accuracy', description: 'Correct game count, dropdown for each round showing winner\'s drawing' },
            { id: 'tm2', type: 'FIX', title: 'Empty game join prevention', description: 'Close out empty games, gray out "left" games with "rejoin" option' },
            { id: 'tm3', type: 'FIX', title: 'Timer end screen flow', description: 'Controls should stay visible, blurred background when clicking ready' },
            { id: 'tm4', type: 'FIX', title: 'Home from results = left game', description: 'Count as "left game", no rejoin button on homescreen' },
            { id: 'tm5', type: 'REFACTOR', title: 'Host starts while player in menu', description: 'Save avatar edits, show idle state, in-app and external notifications' },
            { id: 'tm6', type: 'FIX', title: 'Fix sabotage mechanic', description: 'Entire sabotage mechanic is broken and needs to be fixed' },
        ]
    },
    {
        id: 'later',
        title: 'Later',
        emoji: '🔮',
        color: '#8b5cf6',
        tasks: [
            { id: 'l1', type: 'FEAT', title: 'Replay mode', description: 'Watch strokes appear in playback' },
            { id: 'l2', type: 'FEAT', title: 'Waiting room minigame', description: 'Activities while waiting for next round' },
            { id: 'l3', type: 'FEAT', title: 'NEW GAME MODES!', description: 'Multiple game modes coming soon' },
            { id: 'l4', type: 'FEAT', title: 'Dark and Light mode', description: 'Cohesive aesthetic design with theme options' },
        ]
    },
    {
        id: 'todo',
        title: 'Backlog',
        emoji: '📋',
        color: '#ec4899',
        tasks: [
            { id: 'b1', type: 'FIX', title: 'Polish animations for iOS native feel', description: 'Research Apple HIG, implement spring physics, plan for future iOS app' },
            { id: 'b2', type: 'FIX', title: 'Smooth transitions overhaul', description: 'Make all screen transitions butter-smooth' },
            { id: 'b3', type: 'REFACTOR', title: 'Performance optimization', description: 'Fix lag on slow connections, optimize for all users' },
            { id: 'b4', type: 'REFACTOR', title: 'Universal Button Components', description: 'Create reusable GlassButton, IconButton, ActionButton components for consistent styling' },
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
                    <p className="last-updated">Last updated: December 9, 2025</p>
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
                <p>Last updated: December 9, 2025</p>
                <p className="footer-note">Built with ❤️ by Curren</p>
            </footer>
        </div>
    );
};

export default RoadmapPage;
