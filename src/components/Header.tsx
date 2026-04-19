import type { VideoFile, CourseProgress, PlayerSettings } from '../types';
import { formatTimeRemaining } from '../utils/videoUtils';
import { motion } from 'framer-motion';
import {
  Sun, Moon, ToggleLeft, ToggleRight, Download, Info, GraduationCap, FolderOpen, Bookmark
} from 'lucide-react';

interface HeaderProps {
  courseTitle: string;
  courseProgress: CourseProgress;
  settings: PlayerSettings;
  onToggleTheme: () => void;
  onToggleAutoplay: () => void;
  currentVideo: VideoFile | null;
  onShowInfo: () => void;
  onShowDownload: () => void;
  onLoadCourse?: () => void;
  showBookmarks?: boolean;
  onToggleBookmarks?: () => void;
}

export default function Header({
  courseTitle,
  courseProgress,
  settings,
  onToggleTheme,
  onToggleAutoplay,
  currentVideo,
  onShowInfo,
  onShowDownload,
  onLoadCourse,
  showBookmarks = false,
  onToggleBookmarks,
}: HeaderProps) {
  return (
    <header className="h-14 bg-[#0e0e15]/95 backdrop-blur-xl border-b border-zinc-800/50 flex items-center justify-between px-4 lg:px-5 flex-shrink-0">
      {/* Left: Course title */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/5 flex items-center justify-center flex-shrink-0 border border-amber-500/20">
          <GraduationCap className="w-4.5 h-4.5 text-amber-500" />
        </div>
        <div className="min-w-0">
          <h1 className="text-sm font-bold text-zinc-200 truncate" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{courseTitle}</h1>
          {currentVideo && (
            <motion.p
              key={currentVideo.id}
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[11px] text-zinc-500 truncate hidden sm:block"
            >
              {currentVideo.name}
            </motion.p>
          )}
        </div>
      </div>

      {/* Center: Progress */}
      <div className="hidden md:flex items-center gap-4 mx-6">
        <div className="flex items-center gap-2.5">
          <div className="w-36 h-1.5 bg-zinc-800 rounded-full overflow-hidden relative">
            <motion.div
              className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${courseProgress.percentage}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
          </div>
          <span className="text-xs font-bold text-amber-400 w-10 text-right font-mono">{courseProgress.percentage}%</span>
        </div>
        <div className="h-4 w-px bg-zinc-800" />
        <span className="text-xs text-zinc-500 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/60" />
          ~{formatTimeRemaining(courseProgress.estimatedTimeRemaining)} left
        </span>
      </div>

      {/* Right: Controls */}
      <div className="flex items-center gap-1">
        <button
          onClick={onToggleAutoplay}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
            settings.autoplay
              ? 'bg-amber-500/12 text-amber-400 border border-amber-500/20'
              : 'bg-zinc-800/30 text-zinc-500 border border-transparent'
          }`}
        >
          {settings.autoplay ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
          <span className="hidden sm:inline">Auto</span>
        </button>

        {onLoadCourse && (
          <button
            onClick={onLoadCourse}
            className="p-2 rounded-lg text-zinc-500 hover:text-amber-400 hover:bg-zinc-800/40 transition-all"
            title="Load local course folder"
          >
            <FolderOpen className="w-4 h-4" />
          </button>
        )}

        {onToggleBookmarks && (
          <button
            onClick={onToggleBookmarks}
            className={`p-2 rounded-lg transition-all ${
              showBookmarks
                ? 'text-amber-400 bg-amber-500/10 border border-amber-500/20'
                : 'text-zinc-500 hover:text-amber-400 hover:bg-zinc-800/40'
            }`}
            title="View bookmarks (B)"
          >
            <Bookmark className="w-4 h-4" />
          </button>
        )}

        <button
          onClick={onShowDownload}
          className="p-2 rounded-lg text-zinc-500 hover:text-amber-400 hover:bg-zinc-800/40 transition-all"
          title="Download standalone player"
        >
          <Download className="w-4 h-4" />
        </button>

        <button
          onClick={onShowInfo}
          className="p-2 rounded-lg text-zinc-500 hover:text-amber-400 hover:bg-zinc-800/40 transition-all"
          title="Keyboard shortcuts"
        >
          <Info className="w-4 h-4" />
        </button>

        <button
          onClick={onToggleTheme}
          className="p-2 rounded-lg text-zinc-500 hover:text-amber-400 hover:bg-zinc-800/40 transition-all"
          title="Toggle theme"
        >
          {settings.theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
}
