# 🎓 Course Video Player

A modern, feature-rich video player built with React and TypeScript for learning courses with nested folder structures. Load your local course folders and enjoy a complete learning experience with progress tracking, bookmarks, speed control, and more.

## ✨ Features

- **📁 Local Course Loading** - Select your local course folder using the File System Access API
- **📊 Course Progress Tracking** - Automatic save of watched status, position, and duration per video
- **🎯 Bookmarks** - Add bookmarks at specific timestamps and jump to them instantly
- **⚡ Playback Speed Control** - Play at 0.5x, 0.75x, 1x, 1.25x, 1.5x, 1.75x, or 2x speed
- **⏭️ Smart Skip Buttons** - Skip forward/backward by 10 seconds like YouTube
- **🎬 Interactive Seek Bar** - Click anywhere to seek, drag for smooth navigation
- **📱 Responsive Design** - Works on desktop, tablet, and mobile devices
- **🌙 Dark/Light Theme** - Toggle between dark and light modes
- **🔄 Autoplay** - Automatically advance to the next video when current finishes
- **📈 Course Duration** - Preloads video metadata to show total course duration upfront
- **🎨 Beautiful UI** - Modern design with smooth animations using Framer Motion
- **⌨️ Keyboard Shortcuts** - Full keyboard support for controls

## 🚀 Quick Start

### Browser Requirements
- **Google Chrome** (v96+)
- **Microsoft Edge** (v96+)
- **Brave Browser** (latest)

### Running Locally

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Using the Standalone Player

For offline use without npm:
1. Navigate to your course folder
2. Double-click `public/player.bat`
3. The standalone player opens in your default browser

## 📂 Project Structure

```
src/
├── components/          # React components
│   ├── VideoPlayer.tsx     # Main video player with controls
│   ├── Header.tsx          # Top navigation bar
│   ├── Playlist.tsx        # Course tree sidebar
│   ├── BookmarkPanel.tsx   # Bookmarks sidebar panel
│   ├── LoadCourse.tsx      # Folder picker UI
│   ├── ShortcutsModal.tsx  # Keyboard shortcuts modal
│   └── ...
├── hooks/              # React custom hooks
│   └── useLocalStorage.ts
├── utils/              # Utility functions
│   └── videoUtils.ts   # Tree building, formatting, search
├── types/              # TypeScript type definitions
│   └── index.ts
└── App.tsx             # Main app component
```

## 🎮 Controls

### Keyboard Shortcuts
- **Space** - Play/Pause
- **Arrow Left** - Rewind 10s
- **Arrow Right** - Forward 10s
- **M** - Mute/Unmute
- **F** - Fullscreen
- **B** - Toggle Bookmarks
- **Esc** - Close modals/panels

### Mouse
- **Click** on seek bar to jump to position
- **Drag** seek bar to scrub through video
- **Click** speed button to change playback speed
- **Hover** on bookmarks to see timestamp

## 📊 Course Format

Your course folder can have any structure. The player will:
1. **Scan all subfolders** for video files
2. **Create a nested tree** matching your folder structure
3. **Sort videos naturally** by path
4. **Preload metadata** to calculate total duration

**Supported Video Formats:**
- MP4
- MKV
- WebM
- AVI
- MOV
- FLV
- M4V

## 💾 Data Storage

All progress is saved locally in your browser using `localStorage`:
- Video watched status
- Last playback position
- Bookmarks
- Playback speed preference
- Theme preference

No data is sent to any server.

## 🛠️ Technologies

- **React 19** - UI framework
- **TypeScript 5.9** - Type safety
- **Vite 7.3** - Build tool
- **Tailwind CSS 4.2** - Styling
- **Framer Motion 12** - Animations
- **Lucide React** - Icons
- **HTML5 Video API** - Video playback

## 📝 License

MIT

## 🤝 Contributing

Feel free to submit issues and enhancement requests!

---

**Ready to learn?** Load your course folder and start watching! 🚀
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
