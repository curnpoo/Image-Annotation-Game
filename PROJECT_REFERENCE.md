# 📖 ANO Game — Project Reference

> **Master reference document for all agents and contributors.**  
> Keep this document updated as the project evolves.

---

## 🎮 Project Overview

**ANO** is a real-time, mobile-first party drawing game where players annotate images and vote for the best additions.

| Attribute | Value |
|-----------|-------|
| **URL** | [anogame.xyz](https://anogame.xyz) |
| **Version** | 0.8 Alpha |
| **Platform** | Mobile-first PWA (Portrait only) |
| **Tech Stack** | React 19, TypeScript, Firebase Realtime DB, Tailwind CSS |
| **Target Feel** | **Native iOS app** — fluid, responsive, premium |

---

## 🍎 iOS 26 Native Experience Guidelines

The app must feel like a **native iOS 26 application**. All animations, transitions, and interactions should follow Apple's Human Interface Guidelines.

### Core Principles

| Principle | Description |
|-----------|-------------|
| **Clarity** | Content is paramount. UI elements should never compete with content. |
| **Deference** | The interface helps people understand and interact without competing. |
| **Depth** | Visual layers and realistic motion convey hierarchy and facilitate understanding. |

### Animation Requirements

#### Spring Physics (Default for all animations)
iOS uses **spring animations** as the default. All motion should feel organic, not mechanical.

```css
/* iOS-like spring curve */
cubic-bezier(0.22, 1, 0.36, 1)   /* Snappy spring */
cubic-bezier(0.32, 0.72, 0, 1)  /* Modal slide */
cubic-bezier(0.34, 1.56, 0.64, 1) /* Bouncy popup */
```

#### Animation Timing Guidelines

| Animation Type | Duration | Easing |
|----------------|----------|--------|
| **Button press** | 100-150ms | `ease-out` or spring |
| **Modal slide up** | 250-300ms | `cubic-bezier(0.32, 0.72, 0, 1)` |
| **Modal dismiss** | 200ms | `ease-in` |
| **Screen transition** | 300-400ms | Spring physics |
| **Popup scale** | 200ms | `cubic-bezier(0.34, 1.56, 0.64, 1)` |
| **Fade** | 150-200ms | `ease-out` |

#### Key Behaviors to Implement

1. **Rubber-banding** — Scrollable areas should stretch and bounce at edges
2. **Velocity preservation** — Gestures should carry momentum
3. **Interruptible animations** — Users can interrupt any transition
4. **Haptic feedback** — Pair animations with subtle haptics
5. **60fps minimum** — Never drop frames during animations

### Gesture Patterns

| Gesture | Expected Behavior |
|---------|-------------------|
| **Swipe down** | Dismiss modals/sheets |
| **Pinch** | Zoom with elastic boundaries |
| **Long press** | Show context menu with haptic |
| **Tap** | Immediate response (< 100ms visual feedback) |

### Performance Rules

- Use `will-change` sparingly (only during active animations)
- Prefer `transform` and `opacity` for animations (GPU-accelerated)
- Avoid animating `blur` — apply instantly, animate opacity
- Use `contain: layout` for complex components
- Target 60fps, fallback to reduced-motion gracefully

---

## 🎨 Design Language

### Color Palette (90s Bubbly Theme)

```css
--bubble-pink: #FF69B4
--bubble-purple: #9B59B6
--bubble-cyan: #00D9FF
--bubble-yellow: #FFE135
--bubble-lime: #32CD32
--bubble-orange: #FF8C00
--bubble-blue: #4169E1
--bubble-teal: #20B2AA
```

### Gradients

```css
--gradient-90s: linear-gradient(135deg, #FF69B4 0%, #9B59B6 25%, #4169E1 50%, #00D9FF 75%, #32CD32 100%)
--gradient-sunset: linear-gradient(135deg, #FF8C00 0%, #FF69B4 50%, #9B59B6 100%)
--gradient-ocean: linear-gradient(135deg, #00D9FF 0%, #4169E1 50%, #9B59B6 100%)
--gradient-candy: linear-gradient(135deg, #FF69B4 0%, #FFE135 50%, #00D9FF 100%)
```

### Glass Panels (Dark Mode Default)

```css
background: rgba(0, 0, 0, 0.65);
backdrop-filter: blur(24px);
border: 1px solid rgba(255, 255, 255, 0.15);
```

### Typography

- **Font Family**: `'Inter', -apple-system, BlinkMacSystemFont, sans-serif`
- **Font Smoothing**: `-webkit-font-smoothing: antialiased`

### Border Radius

```css
--radius-main: 1.5rem  /* 24px - Cards, buttons */
--radius-full: 9999px  /* Pills, circular buttons */
```

---

## 📁 Project Structure

```
src/
├── App.tsx              # Main app, state machine, screen routing
├── components/
│   ├── common/          # Shared components (ScreenTransition, etc.)
│   ├── game/            # Game-specific UI
│   └── ui/              # Reusable UI components
├── hooks/               # Custom React hooks
├── services/            # Firebase, storage, friends, leveling
├── types/               # TypeScript definitions
└── utils/               # Helper functions
```

### Key Files

| File | Purpose |
|------|---------|
| `src/index.css` | Design system, CSS variables, animations |
| `src/components/common/transitions.css` | Screen/modal transition animations |
| `src/services/storage.ts` | Firebase data layer |
| `src/App.tsx` | Main state machine & screen routing |

---

## 📅 Current Roadmap

> [!IMPORTANT]
> **When completing tasks:** Always update BOTH:
> 1. `TODAY_ROADMAP.md` — Mark task complete with checkbox
> 2. `src/components/screens/RoadmapPage.tsx` — Move task to Done column
>
> The roadmap page is publicly accessible at **anogame.xyz/roadmap**

### December 9, 2025 — TODAY

| # | Type | Task | Status |
|:-:|:----:|------|:------:|
| 1 | 🛠️ FIX | Loading screen: show all checks → 300ms delay → smooth fade | ⬜ |
| 2 | 🛠️ FIX | Level 0 showing for older accounts in lobby | ⬜ |
| 3 | ➕ ADD | Universal loading indicator for profile pictures | ⬜ |
| 4 | ➖ REMOVE | Circle above color picker in profile customization | ✅ |
| 5 | ✨ FEAT | Invites section (5-hour expiration) | ⬜ |

> See [TODAY_ROADMAP.md](./TODAY_ROADMAP.md) for detailed task breakdowns.

---

### Future Roadmap

<!-- Add future tasks here as they come -->

| Target | Task | Status |
|--------|------|:------:|
| — | *Awaiting user input* | — |

---

## 🔧 iOS Native Animation Plan

### Current State
The app has good visual transitions in `transitions.css` but needs refinement for true iOS-native feel.

### Priority Improvements

#### Phase 1: Spring Physics Everywhere
- [ ] Replace all `ease-in-out` with spring curves
- [ ] Add velocity-based animation continuity
- [ ] Implement rubber-banding on scroll boundaries

#### Phase 2: Gesture Polish
- [ ] Swipe-to-dismiss for all modals
- [ ] Pinch-to-zoom with elastic bounds
- [ ] Pan gestures with momentum

#### Phase 3: Micro-interactions
- [ ] Button press animations (scale down on press)
- [ ] Haptic feedback integration
- [ ] Loading state shimmer effects

#### Phase 4: Screen Transitions
- [ ] Unified transition system
- [ ] Preload screens during transition
- [ ] No "pop" or flash between screens

### Animation Library Recommendations

For complex gestures, consider:
- **Framer Motion** (already in stack) — Spring animations, gestures
- **use-gesture** — React hook for complex gestures
- **react-spring** — Physics-based animations

---

## ✅ Development Guidelines

### Before Making Changes

1. **Read this document** to understand design language
2. **Check iOS HIG** for interaction patterns
3. **Test on real iOS device** — simulators lie about animation smoothness

### Code Standards

- All animations must support `prefers-reduced-motion`
- Use `will-change` only during active animations
- Prefer CSS animations for simple transitions
- Use Framer Motion for complex/interruptible animations
- Always use `transform` and `opacity` (GPU-accelerated)

### Testing Checklist

- [ ] 60fps on low-end devices
- [ ] No visual "pop" on screen changes
- [ ] Gestures feel native
- [ ] Reduced motion fallback works

---

## 🏷️ Version History

| Version | Date | Notes |
|---------|------|-------|
| 0.8 Alpha | Dec 2025 | Current |

---

*Last updated: December 9, 2025*
