---
description: Visual editing with Plasmic
---

# 🎨 Visual Editing with Plasmic

This workflow enables you to visually edit your React components using Plasmic's drag-and-drop interface.

## 🚀 Initial Setup (One-time)

### 1. Create a Plasmic Account
- Go to [https://studio.plasmic.app/](https://studio.plasmic.app/)
- Sign up for a free account
- Create a new project called "ANO Game"

### 2. Start the Plasmic Host Server
Your app needs to run locally so Plasmic can connect to it:

```bash
npm run dev
```

The Plasmic host page will be available at: `http://localhost:5173/plasmic-host.html`

### 3. Connect Plasmic to Your Local App
In the Plasmic Studio:
1. Click on "Project settings" (gear icon)
2. Go to "App host"
3. Enter your host URL: `http://localhost:5173/plasmic-host.html`
4. Click "Connect"

## 📝 Making Components Editable

To make a component visually editable in Plasmic, you need to register it.

### Example: Register HomeScreen Component

1. Open `/src/plasmic-host.tsx`

2. Import the component:
```typescript
import HomeScreen from './components/screens/HomeScreen';
```

3. Add it to the PLASMIC_COMPONENTS array:
```typescript
const PLASMIC_COMPONENTS = [
  {
    name: 'HomeScreen',
    component: HomeScreen,
    props: {
      // Define which props Plasmic can edit
      // Leave empty to make all props editable
    },
    importPath: './components/screens/HomeScreen'
  }
];
```

4. Update the PlasmicCanvasHost:
```typescript
<PlasmicCanvasHost>
  {PLASMIC_COMPONENTS.map((comp) => (
    <comp.component key={comp.name} />
  ))}
</PlasmicCanvasHost>
```

5. Save and refresh Plasmic Studio - your component will appear in the left sidebar!

## 🎨 Visual Editing Workflow

### Option A: Direct Component Editing (Recommended for UI tweaks)

1. **Start your dev server**: `npm run dev`
2. **Open Plasmic Studio**: Go to your project at studio.plasmic.app
3. **Edit visually**: 
   - Drag and drop elements
   - Adjust spacing, colors, fonts
   - Add new UI elements
4. **See changes live**: Plasmic connects to your localhost
5. **Generate code**: Click "Publish" → "Generate code"
6. **Copy to your project**: Plasmic shows you the updated component code

### Option B: Create New Components in Plasmic

1. **Design in Plasmic**: Create components from scratch
2. **Export code**: Use the "Code" tab to get React code
3. **Add to project**: Copy into your `/src/components` folder
4. **Import and use**: Use in your existing screens

## 🔄 Sync Workflow

### From Code → Plasmic
1. Make changes in your code editor
2. Save files (dev server hot-reloads)
3. Refresh Plasmic Studio to see updates

### From Plasmic → Code
1. Make visual changes in Plasmic Studio
2. Click "Publish" when done
3. Copy the generated code
4. Paste into your component files

## 📦 Advanced: Register Multiple Components

For a full visual editing experience, register all your key components:

```typescript
// In plasmic-host.tsx
import HomeScreen from './components/screens/HomeScreen';
import LobbyScreen from './components/screens/LobbyScreen';
import DrawingScreen from './components/screens/DrawingScreen';
import Button from './components/common/Button';
import Card from './components/common/Card';

const PLASMIC_COMPONENTS = [
  { name: 'HomeScreen', component: HomeScreen },
  { name: 'LobbyScreen', component: LobbyScreen },
  { name: 'DrawingScreen', component: DrawingScreen },
  { name: 'Button', component: Button },
  { name: 'Card', component: Card },
  // Add more...
];
```

## 🛠️ Troubleshooting

### Plasmic can't connect to localhost
- Make sure `npm run dev` is running
- Check that you're using `http://localhost:5173/plasmic-host.html`
- Disable any ad blockers or privacy extensions
- Try using `http://127.0.0.1:5173/plasmic-host.html` instead

### Changes aren't showing in Plasmic
- Refresh the Plasmic Studio page
- Check browser console for errors
- Make sure your component is properly registered

### Generated code doesn't match my style
- Use Plasmic mainly for layout and spacing
- Keep your custom CSS and animations in your codebase
- Use Plasmic for rapid prototyping, then refine manually

## 💡 Best Practices

1. **Start small**: Register 1-2 components first to get familiar
2. **Use for layouts**: Plasmic excels at spacing, positioning, and responsive design
3. **Keep logic in code**: Use Plasmic for UI, keep business logic in your codebase
4. **Version control**: Always commit before applying Plasmic changes
5. **Hybrid approach**: Use Plasmic for design iterations, then polish in code

## 🎯 Quick Reference

| Task | Command/URL |
|------|-------------|
| Start dev server | `npm run dev` |
| Plasmic host page | `http://localhost:5173/plasmic-host.html` |
| Plasmic Studio | `https://studio.plasmic.app/` |
| Register components | Edit `/src/plasmic-host.tsx` |
| Config file | `/plasmic.json` |

---

**Note**: Plasmic is best for visual tweaks and rapid prototyping. For complex interactions, state management, and business logic, continue editing in your code editor.
