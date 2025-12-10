# 📅 TODAY's Roadmap — December 9, 2025

> **Goal**: Complete the following tasks by end of day. Each task can be assigned to an agent for parallel work.

---

## 🎯 Task Overview

| Priority | Type | Task | Complexity | Est. Time | Dependencies |
|:--------:|:----:|------|:----------:|:---------:|:------------:|
| 1 | 🛠️ FIX | Loading Screen Flow | Medium | 30-45 min | None |
| 2 | 🛠️ FIX | Level 0 Bug for Older Accounts | Medium | 30 min | None |
| 3 | ➕ ADD | Universal Profile Picture Loading State | Medium | 45 min | None |
| 4 | ➖ REMOVE | Circle Above Color Cars | Low | 15-20 min | None |
| 5 | ✨ FEAT | Invites Section | High | 1-2 hrs | None |

---

## 📋 Detailed Tasks

---

### Task 1: 🛠️ FIX — Loading Screen Transition Flow

**Problem**: Loading screen moves to next screen before showing all green checks, causing a jarring "pop" effect.

**Requirements**:
1. Show **all green checks** (completed states) on loading screen
2. Wait **300ms** after all checks are shown
3. **Preload the next screen underneath** during the 300ms pause
4. **Smoothly fade away** the loading screen to reveal the preloaded screen

**Files to investigate**:
- `src/hooks/useLoadingProgress.ts`
- `src/components/LoadingScreen.tsx` (or similar)
- `src/components/ScreenTransition.tsx`
- `src/App.tsx`

**Acceptance Criteria**:
- [ ] All loading stages show completion with green checks
- [ ] 300ms delay after final check before transition
- [ ] Next screen is rendered beneath during delay
- [ ] Fade transition is smooth with no "pop"

---

### Task 2: 🛠️ FIX — Level 0 Display Bug

**Problem**: Showing "Level 0" in the lobby for some players, especially older accounts.

**Requirements**:
1. Investigate why older accounts show Level 0
2. Check if it's a data migration issue or a display/calculation bug
3. Fix the level calculation or data fetch to show correct level

**Files to investigate**:
- `src/services/storage.ts` (player data)
- `src/services/leveling.ts` or `xp.ts` (level calculations)
- `src/components/` (lobby components showing player level)

**Acceptance Criteria**:
- [ ] Players with existing XP show correct level (not 0)
- [ ] New players correctly start at appropriate level
- [ ] Older accounts display their actual level

---

### Task 3: ➕ ADD — Universal Profile Picture Loading State

**Problem**: Profile pictures show the default photo while loading, rather than a loading indicator.

**Requirements**:
1. Create a **universal loading state** for profile pictures
2. Show a **loading spinner/skeleton** instead of default photo
3. Apply to **all profile picture instances**:
   - Upload screen
   - Lobby
   - Friends list
   - Any other occurrences

**Files to investigate**:
- `src/components/ProfilePicture.tsx` (or similar)
- Components using profile pictures across the app

**Acceptance Criteria**:
- [ ] Loading spinner shown while image is loading
- [ ] Default photo only shown after load fails
- [ ] Consistent behavior across all profile picture usages

---

### Task 4: ➖ REMOVE — Circle Above Color Cars in Profile Customization

**Problem**: There's a circle UI element above the color selection ("color cars") in the profile customization screen that should be removed.

**Requirements**:
1. Remove the circle element from the profile customization screen
2. The color selection should reflect directly on the **profile photo itself**
3. Keep the color picker (HUE/SATURATION/LIGHTNESS sliders) functional

**Files to investigate**:
- `src/components/ProfileCardModal.tsx` (or profile editing component)
- Related CSS files

**Acceptance Criteria**:
- [ ] Circle above color sliders is removed
- [ ] Selected color reflects on the profile photo
- [ ] Color picker remains fully functional

---

### Task 5: ✨ FEAT — Invites Section

**Problem**: Users cannot accept invites sent by friends after much time has passed.

**Requirements**:
1. Add an **Invites section** to the UI
2. Show invites sent to the user by other players in their friends list
3. Invites should **auto-clear after 5 hours**
4. Allow users to **accept invites** even after they were sent

**Technical Considerations**:
- Needs Firebase/database structure for storing invites
- Needs timestamp tracking for 5-hour expiration
- UI placement (likely in friends list or main menu)
- Real-time sync for new invites

**Files to investigate**:
- `src/services/storage.ts`
- `src/services/friends.ts` (if exists)
- Firebase database rules
- UI components for friends/social features

**Acceptance Criteria**:
- [ ] Invites section visible in appropriate UI location
- [ ] Shows pending invites from friends
- [ ] Invites disappear after 5 hours
- [ ] User can accept pending invites
- [ ] Real-time updates when new invite received

---

## 🔄 Agent Assignment Recommendations

| Task | Recommended Focus | Can Parallelize? |
|------|-------------------|-----------------|
| Task 1: Loading Screen | React transitions, animations | ✅ Yes |
| Task 2: Level 0 Bug | Data layer, Firebase | ✅ Yes |
| Task 3: Profile Picture Loading | Component refactoring | ✅ Yes |
| Task 4: Remove Circle | Simple UI removal | ✅ Yes |
| Task 5: Invites Section | Full-stack feature | ✅ Yes (after design) |

---

## 📝 Notes

- **All tasks are independent** and can be worked on in parallel
- **Task 5 (Invites)** is the most complex and may benefit from upfront design planning
- **Tasks 1, 2, 3** are high-impact bug fixes that improve UX
- **Task 4** is a quick win

---

## 🚦 Progress Tracker

- [ ] Task 1: Loading Screen Flow
- [/] Task 2: Level 0 Bug (Working — awaiting user testing)
- [x] Task 3: Profile Picture Loading ✅ (Completed Dec 9, 2025)
- [x] Task 4: Remove Circle Element ✅ (Completed Dec 9, 2025)  
- [ ] Task 5: Invites Section

---

*Last updated: December 9, 2025 2:36 PM EST*
