# 🎨 Plasmic Visual Editor - Quick Start

## ✅ Setup Complete!

Plasmic has been integrated into your project. You can now visually edit your React components!

## 🚀 Next Steps

### 1. Start Your Dev Server (Already Running ✓)
Your dev server is already running at `http://localhost:5173`

### 2. Access the Plasmic Host Page
Open a new browser tab and go to:
```
http://localhost:5173/plasmic-host.html
```

You should see a blank page - this is normal! This is the canvas where Plasmic will render your components.

### 3. Create a Plasmic Account
1. Go to: https://studio.plasmic.app/
2. Sign up for a free account
3. Create a new project called "ANO Game"

### 4. Connect Plasmic to Your App
In the Plasmic Studio:
1. Click "Project settings" (gear icon in top right)
2. Select "Code" tab on the left
3. Choose "Code components" 
4. Enter your host URL: `http://localhost:5173/plasmic-host.html`
5. Click "Connect"

### 5. Register Your First Component

Edit `/src/plasmic-host.tsx` and uncomment the HomeScreen registration:

```typescript
// 1. Uncomment the import
import HomeScreen from './components/screens/HomeScreen';

// 2. Uncomment the registerComponent call
registerComponent(HomeScreen, {
  name: 'HomeScreen',
  props: {
    player: MOCK_PLAYER,
    onPlay: () => console.log('Play clicked'),
    onProfile: () => console.log('Profile clicked'),
    onSettings: () => console.log('Settings clicked'),
    onStore: () => console.log('Store clicked'),
    onCasino: () => console.log('Casino clicked'),
    onLevelProgress: () => console.log('Level clicked'),
    onGallery: () => console.log('Gallery clicked'),
  },
  importPath: './components/screens/HomeScreen',
});
```

3. Save the file
4. Refresh the Plasmic Studio
5. You'll see "HomeScreen" appear in the left sidebar under "Code Components"!

### 6. Start Editing!

Drag the HomeScreen component onto the canvas and start editing:
- Adjust spacing and padding
- Change colors and fonts
- Rearrange elements
- Add new components

## 📖 Full Documentation

See the complete guide at: `.agent/workflows/plasmic-visual-editing.md`

Or just type: `/plasmic-visual-editing`

## 💡 Tips

- **Start simple**: Register one component at a time
- **Use for layout**: Plasmic is great for spacing, colors, and positioning
- **Keep logic in code**: Business logic stays in your TypeScript files
- **Iterate fast**: Make visual changes in Plasmic, refine in code

## ❓ Troubleshooting

**Plasmic can't connect?**
- Make sure dev server is running (`npm run dev`)
- Try `http://127.0.0.1:5173/plasmic-host.html` instead
- Check browser console for errors

**Component not appearing?**
- Make sure you uncommented both the import AND registerComponent
- Refresh Plasmic Studio
- Check for TypeScript errors

---

**You're all set!** 🎉 

Go to https://studio.plasmic.app/ to start visually editing your components!
