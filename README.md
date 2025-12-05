# Fill in the Blank 🎨

**Fill in the Blank** is a real-time, collaborative drawing game where players take turns uploading images and drawing on them to complete a prompt or just be silly. It's designed to be a fun, democratic, and chaotic experience for friends, inspired by the "fill in the blank" meme format.

![Cover Image](./public/og-image.png)

## 🚀 Why This Exists

This project was born out of a desire to create a simple, accessible, and highly interactive web game that captures the energy of collaborative creativity. We wanted to move away from complex, rule-heavy games and focus on the raw fun of drawing on pictures with friends.

The core philosophy is **"Mobile-First Chaos"**. The UI is designed to feel like a vibrant 90s toy, with big buttons, bright colors, and satisfying animations. It's meant to be played on phones while hanging out, or remotely with a group call.

## ✨ Key Features

*   **Real-Time Multiplayer**: Powered by Firebase Realtime Database, game state syncs instantly across all devices.
*   **Democratic Gameplay**: No single "host" dictates everything. Anyone can upload (when chosen), anyone can vote, and the game flows naturally.
*   **Mobile-First Design**: A responsive, touch-friendly UI that works perfectly on smartphones.
*   **90s Aesthetic**: A nostalgic, colorful design language with "pop-in" animations, glassmorphism, and confetti.
*   **Robust Room System**:
    *   4-character room codes for easy sharing.
    *   Mid-game joining (Waiting Room queue).
    *   Persistence (refresh without losing your spot).
    *   Host controls for managing the flow.

## 🛠️ The Technical Journey

Building "Fill in the Blank" was an iterative process of refining both the user experience and the technical architecture.

### Evolution
1.  **The Concept**: Started as "Annotated Image Chain", a simple idea of passing images around.
2.  **The Prototype**: Basic room creation and canvas drawing.
3.  **The Pivot**: Shifted to a "Fill in the Blank" format where one person uploads, everyone draws, and then everyone votes.
4.  **The Polish**: Added the 90s aesthetic, improved the drawing engine, and smoothed out the game flow.

### Challenges & Solutions

#### 1. Real-Time State Management
*   **Challenge**: Keeping 10+ players in sync as they move from Lobby -> Uploading -> Drawing -> Voting -> Results.
*   **Solution**: We used Firebase Realtime Database with a strict state machine in `storage.ts`. Every transition is atomic, and clients listen to the `room.status` to know what screen to show.

#### 2. Canvas Consistency
*   **Challenge**: A drawing made on a large desktop screen needs to look exactly the same on a small phone screen.
*   **Solution**: We implemented a coordinate system based on **percentages** (0-100%) rather than pixels.
    *   `GameCanvas` converts touch/mouse events to percentage coordinates.
    *   `VotingScreen` renders these strokes using an SVG with `viewBox="0 0 100 100"`.
    *   **Line Thickness**: We devised a scaling logic (`stroke.size / 3`) to ensure lines appear proportionally thick regardless of the display size.

#### 3. The "White Screen" of Death
*   **Challenge**: A typo in the room creation logic caused the app to crash silently for new users.
*   **Solution**: Rigorous debugging with console logs revealed a property mismatch in the Firebase object. We fixed it and added error boundaries and toast notifications to prevent silent failures in the future.

#### 4. Mid-Game Joiners
*   **Challenge**: What happens if a friend joins while you're in the middle of a round?
*   **Solution**: We implemented a **Waiting Room**. New players are added to a `waitingPlayers` queue. They see a dedicated screen showing the current game status. When the next round starts, the server merges them into the main player list automatically.

## 📦 Tech Stack

*   **Frontend**: React, TypeScript, Vite
*   **Styling**: Tailwind CSS (with custom animations)
*   **Backend**: Firebase Realtime Database (Serverless)
*   **State Management**: React Hooks + Firebase Listeners

## 🎮 How to Play

1.  **Create a Room**: One person creates a room and shares the 4-letter code.
2.  **Join**: Friends join the room, create their avatar, and pick a color.
3.  **Upload**: The game picks a random "Uploader" to choose an image (or take a photo).
4.  **Draw**: Everyone gets 15-30 seconds to draw on the image.
5.  **Vote**: Everyone votes for their favorite drawing (you can't vote for yourself!).
6.  **Win**: Points are awarded, and the game continues to the next round!

---

*Built with ❤️ and a lot of ☕ by the Antigravity Team. and Curren*
