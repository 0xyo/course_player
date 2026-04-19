import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import type { VideoFile, CourseProgress, PlayerSettings, Bookmark, Toast, ShortcutFeedback } from './types';
import { buildTree, flattenTree } from './utils/videoUtils';
import { useLocalStorage } from './hooks/useLocalStorage';
import VideoPlayer from './components/VideoPlayer';
import Playlist from './components/Playlist';
import Header from './components/Header';
import ShortcutsModal from './components/ShortcutsModal';
import DownloadModal from './components/DownloadModal';
import ToastContainer from './components/ToastContainer';
import BookmarkPanel from './components/BookmarkPanel';
import ShortcutOverlay from './components/ShortcutOverlay';
import LoadCourse from './components/LoadCourse';

const COURSE_ID = 'demo-redhat-linux';

export default function App() {
  // Track which course is loaded (for storage key)
  const [currentCourseId, setCurrentCourseId] = useState<string>(COURSE_ID);
  const [showLoadDialog, setShowLoadDialog] = useState(false);

  // Video state - start with empty videos (no sample course)
  const [videos, setVideos] = useLocalStorage<VideoFile[]>(`videos-${currentCourseId}`, []);
  const [currentVideoId, setCurrentVideoId] = useLocalStorage<string | null>(`currentVideo-${currentCourseId}`, null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isPlaylistOpen, setIsPlaylistOpen] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showDownload, setShowDownload] = useState(false);
  const [showBookmarks, setShowBookmarks] = useState(false);

  // Bookmarks - start with empty bookmarks (no sample course)
  const [bookmarks, setBookmarks] = useLocalStorage<Bookmark[]>(`bookmarks-${currentCourseId}`, []);

  // Toast notifications
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastIdRef = useRef(0);

  // Shortcut feedback
  const [shortcutFeedback, setShortcutFeedback] = useState<ShortcutFeedback | null>(null);
  const shortcutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const addToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = `toast-${++toastIdRef.current}`;
    setToasts((prev) => [...prev.slice(-4), { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleLoadCourse = useCallback((loadedVideos: VideoFile[], courseName: string) => {
    const courseId = `local-${Date.now()}`; // Unique ID for this course
    setCurrentCourseId(courseId);
    setVideos(loadedVideos);
    setCurrentVideoId(loadedVideos[0]?.id || null);
    setShowLoadDialog(false);
    addToast(`Loaded: ${courseName} (${loadedVideos.length} videos)`, 'info');
  }, [setVideos, setCurrentVideoId, addToast]);

  const showShortcutFeedback = useCallback((key: string, label: string) => {
    setShortcutFeedback({ key, label });
    if (shortcutTimerRef.current) clearTimeout(shortcutTimerRef.current);
    shortcutTimerRef.current = setTimeout(() => setShortcutFeedback(null), 800);
  }, []);

  // Settings
  const [settings, setSettings] = useLocalStorage<PlayerSettings>('player-settings', {
    theme: 'dark',
    autoplay: true,
    playbackSpeed: 1,
    volume: 1,
    lastVideoId: null,
    showBookmarks: false,
  });

  // ── Build tree from videos ──
  const tree = useMemo(() => buildTree(videos), [videos]);

  // Collect all folder paths for expanded state
  const allFolderPaths = useMemo(() => {
    const paths: string[] = [];
    function walk(nodes: typeof tree) {
      for (const n of nodes) {
        paths.push(n.path);
        walk(n.children);
      }
    }
    walk(tree);
    return paths;
  }, [tree]);

  const [foldersExpanded, setFoldersExpanded] = useLocalStorage<Record<string, boolean>>(
    `folders-expanded-${currentCourseId}`,
    Object.fromEntries(allFolderPaths.map(p => [p, true]))
  );

  const toggleFolder = useCallback((folderPath: string) => {
    setFoldersExpanded((prev) => {
      const next = { ...prev };
      next[folderPath] = !prev[folderPath];
      return next;
    });
  }, []);

  // Current video
  const currentVideo = useMemo(
    () => videos.find((v) => v.id === currentVideoId) || null,
    [videos, currentVideoId]
  );

  const currentVideoProgress = useMemo(() => {
    if (!currentVideo) return 0;
    return currentVideo.lastPosition;
  }, [currentVideo]);

  // Course progress
  const courseProgress = useMemo<CourseProgress>(() => {
    const totalVideos = videos.length;
    const completedVideos = videos.filter((v) => v.watched).length;
    const totalDuration = videos.reduce((sum, v) => sum + v.duration, 0);
    const watchedDuration = videos.filter((v) => v.watched).reduce((sum, v) => sum + v.duration, 0);
    const estimatedTimeRemaining = totalDuration - watchedDuration;
    const percentage = totalVideos > 0 ? Math.round((completedVideos / totalVideos) * 100) : 0;
    return { totalVideos, completedVideos, percentage, totalDuration, watchedDuration, estimatedTimeRemaining };
  }, [videos]);

  // Video selection
  const selectVideo = useCallback(
    (video: VideoFile) => {
      setCurrentVideoId(video.id);
      setSettings((prev) => ({ ...prev, lastVideoId: video.id }));
      setIsPlaylistOpen(false);
    },
    [setCurrentVideoId, setSettings]
  );

  // Flatten tree for next/prev navigation
  const videoList = useMemo(() => flattenTree(tree), [tree]);
  const currentIndex = useMemo(() => videoList.findIndex((v) => v.id === currentVideoId), [videoList, currentVideoId]);

  const goNext = useCallback(() => {
    if (currentIndex < videoList.length - 1) {
      selectVideo(videoList[currentIndex + 1]);
    }
  }, [currentIndex, videoList, selectVideo]);

  const goPrevious = useCallback(() => {
    if (currentIndex > 0) {
      selectVideo(videoList[currentIndex - 1]);
    }
  }, [currentIndex, videoList, selectVideo]);

  // Progress tracking
  const handleProgress = useCallback(
    (videoId: string, position: number, duration: number) => {
      setVideos((prev) => prev.map((v) => (v.id === videoId ? { ...v, lastPosition: position, duration: duration || v.duration } : v)));
    },
    [setVideos]
  );

  const handleComplete = useCallback(
    (videoId: string) => {
      setVideos((prev) => prev.map((v) => (v.id === videoId ? { ...v, watched: true } : v)));
      const v = videos.find(v => v.id === videoId);
      if (v) addToast(`✓ Completed: ${v.name}`, 'success');
    },
    [setVideos, videos, addToast]
  );

  const toggleWatched = useCallback(
    (videoId: string) => {
      const v = videos.find(v => v.id === videoId);
      setVideos((prev) => prev.map((v) => (v.id === videoId ? { ...v, watched: !v.watched } : v)));
      if (v) addToast(v.watched ? `Marked incomplete: ${v.name}` : `✓ Marked complete: ${v.name}`, v.watched ? 'warning' : 'success');
    },
    [setVideos, videos, addToast]
  );

  // Bookmark handlers
  const addBookmark = useCallback((videoId: string, time: number) => {
    const v = videos.find(v => v.id === videoId);
    const label = v ? `${v.name} @ ${Math.floor(time / 60)}:${String(Math.floor(time % 60)).padStart(2, '0')}` : 'Bookmark';
    setBookmarks((prev) => [...prev, { id: `bm-${Date.now()}`, videoId, time, label, createdAt: Date.now() }]);
    addToast('Bookmark added', 'success');
  }, [videos, setBookmarks, addToast]);

  const deleteBookmark = useCallback((id: string) => {
    setBookmarks((prev) => prev.filter(b => b.id !== id));
    addToast('Bookmark removed', 'warning');
  }, [setBookmarks, addToast]);

  const seekToBookmark = useCallback((time: number) => {
    const video = document.querySelector('video');
    if (video) video.currentTime = time;
    setShowBookmarks(false);
  }, []);

  // Settings handlers
  const toggleTheme = useCallback(() => {
    setSettings((prev) => ({ ...prev, theme: prev.theme === 'dark' ? 'light' : 'dark' }));
  }, [setSettings]);

  const toggleAutoplay = useCallback(() => {
    setSettings((prev) => ({ ...prev, autoplay: !prev.autoplay }));
    addToast(settings.autoplay ? 'Autoplay disabled' : 'Autoplay enabled', 'info');
  }, [setSettings, settings.autoplay, addToast]);

  const handleSpeedChange = useCallback(
    (speed: number) => {
      setSettings((prev) => ({ ...prev, playbackSpeed: speed }));
      addToast(`Speed: ${speed}x`, 'info');
    },
    [setSettings, addToast]
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        if (e.key === 'Escape') (e.target as HTMLElement).blur();
        return;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const w = window as any;
      switch (e.key) {
        case ' ':
          e.preventDefault();
          w.__togglePlay?.();
          showShortcutFeedback('Space', 'Play / Pause');
          break;
        case 'ArrowLeft':
          e.preventDefault();
          w.__seek?.(-10);
          showShortcutFeedback('←', '-10s');
          break;
        case 'ArrowRight':
          e.preventDefault();
          w.__seek?.(10);
          showShortcutFeedback('→', '+10s');
          break;
        case 'j': case 'J':
          w.__seek?.(-10);
          showShortcutFeedback('J', '-10s');
          break;
        case 'l': case 'L':
          w.__seek?.(10);
          showShortcutFeedback('L', '+10s');
          break;
        case 'n': case 'N':
          goNext();
          showShortcutFeedback('N', 'Next video');
          break;
        case 'p': case 'P':
          goPrevious();
          showShortcutFeedback('P', 'Previous video');
          break;
        case 'f': case 'F':
          if (document.fullscreenElement) document.exitFullscreen();
          else document.querySelector('[data-player]')?.requestFullscreen();
          showShortcutFeedback('F', 'Fullscreen');
          break;
        case 'b': case 'B':
          if (currentVideoId) {
            const video = document.querySelector('video');
            if (video) addBookmark(currentVideoId, video.currentTime);
          }
          showShortcutFeedback('B', 'Add bookmark');
          break;
        case '/':
          e.preventDefault();
          (document.querySelector('input[type="text"]') as HTMLElement | null)?.focus();
          showShortcutFeedback('/', 'Search');
          break;
        case '?':
          setShowShortcuts(true);
          break;
        case 'Escape':
          setShowShortcuts(false);
          setShowDownload(false);
          setShowBookmarks(false);
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goNext, goPrevious, currentVideoId, addBookmark, showShortcutFeedback]);

  // Auto-select last video
  useEffect(() => {
    if (!currentVideoId && settings.lastVideoId) {
      setCurrentVideoId(settings.lastVideoId);
    } else if (!currentVideoId && videos.length > 0) {
      setCurrentVideoId(videos[0].id);
    }
  }, []);

  // Apply theme
  // Apply theme
  useEffect(() => {
    document.documentElement.classList.toggle('light-theme', settings.theme === 'light');
  }, [settings.theme]);

  // Show LoadCourse dialog if requested or no videos loaded
  if (showLoadDialog || videos.length === 0) {
    return (
      <div className={`h-screen ${settings.theme === 'dark' ? 'bg-[#08080d]' : 'bg-gray-50'}`}>
        <LoadCourse onLoadCourse={handleLoadCourse} onClose={() => setShowLoadDialog(false)} />
      </div>
    );
  }

  return (
    <div className={`h-screen flex flex-col overflow-hidden ${settings.theme === 'dark' ? 'bg-[#08080d]' : 'bg-gray-50'}`}>
      <Header
        courseTitle="RedHat Linux Administration"
        courseProgress={courseProgress}
        settings={settings}
        onToggleTheme={toggleTheme}
        onToggleAutoplay={toggleAutoplay}
        currentVideo={currentVideo}
        onShowInfo={() => setShowShortcuts(true)}
        onShowDownload={() => setShowDownload(true)}
        onLoadCourse={() => setShowLoadDialog(true)}
        showBookmarks={showBookmarks}
        onToggleBookmarks={() => setShowBookmarks(!showBookmarks)}
      />

      <div className="flex-1 flex overflow-hidden">
        <VideoPlayer
          video={currentVideo}
          autoplay={settings.autoplay}
          playbackSpeed={settings.playbackSpeed}
          onProgress={handleProgress}
          onComplete={handleComplete}
          onNext={goNext}
          onPrevious={goPrevious}
          onSpeedChange={handleSpeedChange}
          lastPosition={currentVideoProgress}
          bookmarks={bookmarks}
          onAddBookmark={addBookmark}
          onSeekToBookmark={seekToBookmark}
          videoIndex={currentIndex}
          totalVideos={videoList.length}
        />

        <Playlist
          tree={tree}
          currentVideo={currentVideo}
          courseProgress={courseProgress}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSelectVideo={selectVideo}
          onToggleFolder={toggleFolder}
          onToggleWatched={toggleWatched}
          isOpen={isPlaylistOpen}
          onToggleOpen={() => setIsPlaylistOpen(!isPlaylistOpen)}
          foldersExpanded={foldersExpanded}
        />
      </div>

      <ShortcutsModal isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />
      <DownloadModal isOpen={showDownload} onClose={() => setShowDownload(false)} />
      <BookmarkPanel
        isOpen={showBookmarks}
        onClose={() => setShowBookmarks(false)}
        bookmarks={bookmarks}
        onSeekToBookmark={seekToBookmark}
        onDeleteBookmark={deleteBookmark}
        currentVideoId={currentVideoId}
      />
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <ShortcutOverlay feedback={shortcutFeedback} />
    </div>
  );
}
