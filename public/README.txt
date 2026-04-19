╔══════════════════════════════════════════════════════════════════╗
║                    COURSE PLAYER — README                        ║
╚══════════════════════════════════════════════════════════════════╝

A standalone offline video course player that automatically detects
and plays video courses from any local folder.


═══════════════════════════════════════════════════════════════════
  QUICK START
═══════════════════════════════════════════════════════════════════

1. Copy these two files into your course folder:
   - standalone-player.html
   - player.bat

2. Double-click player.bat

3. Your browser opens with all course videos loaded!

   Example folder structure:
   
   D:\Courses\RedHat Linux\
   ├── player.bat
   ├── standalone-player.html
   ├── Module 1 - Getting Started\
   │   ├── 01 - Introduction.mp4
   │   ├── 02 - Installation.mp4
   │   └── 03 - Configuration.mp4
   ├── Module 2 - File System\
   │   ├── 04 - Directories.mp4
   │   └── 05 - Permissions.mp4
   └── Module 3 - Networking\
       ├── 06 - Network Config.mp4
       └── 07 - Firewall.mp4


═══════════════════════════════════════════════════════════════════
  REQUIREMENTS
═══════════════════════════════════════════════════════════════════

For FULL functionality (auto-detection of videos):
  - Python 3.x (recommended) OR Node.js 14+
  
  Python: https://www.python.org/downloads/
  Node.js: https://nodejs.org/

Without Python/Node.js:
  - The player opens directly in your browser
  - You can manually select your course folder
  - Works on Chrome, Edge (with folder access permission)
  - Some browsers may have limited functionality


═══════════════════════════════════════════════════════════════════
  SUPPORTED VIDEO FORMATS
═══════════════════════════════════════════════════════════════════

  .mp4   .mkv   .avi   .webm   .mov   .flv   .wmv   .m4v
  .mpg   .mpeg  .3gp

Note: Browser playback depends on codec support.
MP4 (H.264) and WebM work in all browsers.
MKV and AVI may require transcoding for some browsers.


═══════════════════════════════════════════════════════════════════
  FEATURES
═══════════════════════════════════════════════════════════════════

AUTO-DETECTION
  - Automatically scans folder and subfolders for videos
  - Smart sorting: natural number order (2 before 10)
  - Organized by folder structure (course modules)

VIDEO PLAYER
  - Clean, distraction-free interface
  - Playback speed control (0.5x to 2x)
  - Auto-play next video (toggle on/off)
  - Volume control with mute option
  - Fullscreen mode

PROGRESS TRACKING
  - Videos auto-marked as watched at 90% completion
  - Manual mark as complete/incomplete
  - Visual progress indicators (checkmarks, progress bar)
  - Overall course progress percentage
  - Resume from last watched position
  - All progress saved in browser (localStorage)

ORGANIZATION
  - Collapsible folder tree view
  - Search/filter videos by name
  - Estimated time remaining

KEYBOARD SHORTCUTS
  Space      Play / Pause
  ←          Seek back 10 seconds
  →          Seek forward 10 seconds
  ↑          Volume up
  ↓          Volume down
  N          Next video
  P          Previous video
  M          Toggle mute
  F          Toggle fullscreen
  /          Focus search
  ?          Show keyboard shortcuts
  Esc        Close modal

THEME
  - Dark mode (default) and Light mode
  - Toggle via header button


═══════════════════════════════════════════════════════════════════
  DATA STORAGE
═══════════════════════════════════════════════════════════════════

All data is stored locally in your browser's localStorage:
  - Video completion status
  - Last watched position for each video
  - Last played video
  - User preferences (theme, autoplay, speed, volume)
  - Course-specific data (identified by folder path)

Data persists across browser sessions.
Clearing browser data will reset progress.


═══════════════════════════════════════════════════════════════════
  TROUBLESHOOTING
═══════════════════════════════════════════════════════════════════

"No videos found"
  - Make sure video files are in the course folder or subfolders
  - Check that video files have supported extensions
  - Try refreshing the page

"Server won't start"
  - Port 8080 may be in use. Close other programs using it.
  - Make sure Python or Node.js is installed and in your PATH

"Videos won't play"
  - Some formats (MKV, AVI) may not play in all browsers
  - Try converting to MP4 (H.264) for best compatibility
  - Chrome and Edge have the best format support

"Progress not saving"
  - Don't use Incognito/Private browsing mode
  - Make sure localStorage is enabled in browser settings

"Folder access denied" (file:// mode)
  - Use player.bat instead of opening HTML directly
  - Or use Chrome/Edge and grant folder access permission


═══════════════════════════════════════════════════════════════════
  TECHNICAL NOTES
═══════════════════════════════════════════════════════════════════

- Pure HTML, CSS, and vanilla JavaScript
- No external dependencies or internet required
- Works offline completely
- Cross-browser compatible (Chrome, Firefox, Edge)
- Responsive design (desktop and tablets)
- Handles file paths with spaces and special characters

The player uses Python's built-in http.server module (or Node.js)
to serve files locally. This allows JavaScript to scan directories
and serve video files that may not be directly accessible via
the file:// protocol due to browser security restrictions.


═══════════════════════════════════════════════════════════════════
  LICENSE
═══════════════════════════════════════════════════════════════════

Free to use. No attribution required.
