import { useMemo } from 'react';
import type { VideoFile, TreeNode, CourseProgress } from '../types';
import { formatDuration, formatTimeRemaining, countVideos, searchTree } from '../utils/videoUtils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown, ChevronRight, Search,
  X, Circle, CircleCheck, BookOpen, FolderOpen, Folder
} from 'lucide-react';

interface PlaylistProps {
  tree: TreeNode[];
  currentVideo: VideoFile | null;
  courseProgress: CourseProgress;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSelectVideo: (video: VideoFile) => void;
  onToggleFolder: (folderPath: string) => void;
  onToggleWatched: (videoId: string) => void;
  isOpen: boolean;
  onToggleOpen: () => void;
  foldersExpanded: Record<string, boolean>;
}

// Circular progress ring component
function ProgressRing({ percentage, size = 44, strokeWidth = 3.5 }: { percentage: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="currentColor" strokeWidth={strokeWidth} className="text-zinc-800" />
      <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="url(#progressGrad)" strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-700 ease-out" />
      <defs>
        <linearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#fbbf24" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/** Recursive tree node renderer */
function TreeNodeItem({
  node,
  currentVideo,
  onSelectVideo,
  onToggleFolder,
  onToggleWatched,
  foldersExpanded,
}: {
  node: TreeNode;
  currentVideo: VideoFile | null;
  onSelectVideo: (video: VideoFile) => void;
  onToggleFolder: (folderPath: string) => void;
  onToggleWatched: (videoId: string) => void;
  foldersExpanded: Record<string, boolean>;
}) {
  const expanded = foldersExpanded[node.path] !== false;
  const counts = countVideos(node);
  const pct = counts.total > 0 ? Math.round((counts.watched / counts.total) * 100) : 0;
  const isTopLevel = node.depth === 0;
  const hasChildren = node.children.length > 0;
  const hasVideos = node.videos.length > 0;
  // A node is "collapsible" if it has children OR if it has videos (or both)
  const isCollapsible = hasChildren || hasVideos;

  return (
    <div>
      {/* Folder header */}
      <button
        onClick={() => isCollapsible && onToggleFolder(node.path)}
        className={`w-full flex items-center gap-2 text-left transition-colors group ${
          isTopLevel ? 'px-4 py-2.5 hover:bg-zinc-800/30' : 'px-4 py-2 hover:bg-zinc-800/20'
        }`}
        style={{ paddingLeft: `${16 + node.depth * 16}px` }}
      >
        {/* Chevron — only show if collapsible */}
        {isCollapsible ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={expanded ? 'down' : 'right'}
              initial={{ rotate: expanded ? -90 : 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: expanded ? 90 : -90, opacity: 0 }}
              transition={{ duration: 0.12 }}
              className="flex-shrink-0"
            >
              {expanded ? (
                <ChevronDown className="w-3.5 h-3.5 text-zinc-500 group-hover:text-amber-400 transition-colors" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-amber-400 transition-colors" />
              )}
            </motion.div>
          </AnimatePresence>
        ) : (
          <span className="w-3.5 flex-shrink-0" />
        )}

        {/* Folder icon */}
        {hasChildren ? (
          <FolderOpen className={`w-4 h-4 flex-shrink-0 transition-colors ${
            isTopLevel ? 'text-zinc-500 group-hover:text-amber-500/70' : 'text-zinc-600 group-hover:text-amber-500/50'
          }`} />
        ) : (
          <Folder className={`w-4 h-4 flex-shrink-0 transition-colors ${
            isTopLevel ? 'text-zinc-500 group-hover:text-amber-500/70' : 'text-zinc-600 group-hover:text-amber-500/50'
          }`} />
        )}

        {/* Folder name */}
        <span className={`flex-1 truncate transition-colors ${
          isTopLevel
            ? 'text-xs font-semibold text-zinc-300 group-hover:text-zinc-100'
            : 'text-[11px] font-medium text-zinc-500 group-hover:text-zinc-300'
        }`}>
          {node.name}
        </span>

        {/* Mini progress + count */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className={`overflow-hidden rounded-full ${isTopLevel ? 'w-10 h-1' : 'w-8 h-0.5'} bg-zinc-800`}>
            <div className="h-full bg-amber-500/60 rounded-full transition-all" style={{ width: `${pct}%` }} />
          </div>
          <span className={`text-zinc-600 w-7 text-right ${isTopLevel ? 'text-[10px]' : 'text-[9px]'}`}>
            {counts.watched}/{counts.total}
          </span>
        </div>
      </button>

      {/* Expanded content: videos first, then child folders */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {/* Direct videos in this folder (e.g. intro/overview videos) */}
            {node.videos.map((video) => {
              const isActive = currentVideo?.id === video.id;
              return (
                <VideoItem
                  key={video.id}
                  video={video}
                  isActive={isActive}
                  depth={node.depth}
                  onSelectVideo={onSelectVideo}
                  onToggleWatched={onToggleWatched}
                />
              );
            })}

            {/* Child folders (lessons, etc.) */}
            {node.children.map((child) => (
              <TreeNodeItem
                key={child.path}
                node={child}
                currentVideo={currentVideo}
                onSelectVideo={onSelectVideo}
                onToggleFolder={onToggleFolder}
                onToggleWatched={onToggleWatched}
                foldersExpanded={foldersExpanded}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Single video item in the tree */
function VideoItem({
  video,
  isActive,
  depth,
  onSelectVideo,
  onToggleWatched,
}: {
  video: VideoFile;
  isActive: boolean;
  depth: number;
  onSelectVideo: (video: VideoFile) => void;
  onToggleWatched: (videoId: string) => void;
}) {
  return (
    <div
      className={`group/item flex items-center gap-2.5 py-1.5 cursor-pointer transition-all ${
        isActive
          ? 'bg-amber-500/8 border-l-2 border-amber-500'
          : 'hover:bg-zinc-800/15 border-l-2 border-transparent'
      }`}
      style={{ paddingLeft: `${32 + depth * 16}px`, paddingRight: '16px' }}
      onClick={() => onSelectVideo(video)}
    >
      {/* Status icon */}
      <button
        onClick={(e) => { e.stopPropagation(); onToggleWatched(video.id); }}
        className="flex-shrink-0 transition-transform hover:scale-110"
      >
        {video.watched ? (
          <CircleCheck className="w-4 h-4 text-emerald-400" />
        ) : isActive ? (
          <div className="relative">
            <Circle className="w-4 h-4 text-amber-400" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
            </div>
          </div>
        ) : (
          <Circle className="w-4 h-4 text-zinc-700 hover:text-zinc-500 transition-colors" />
        )}
      </button>

      {/* Video info */}
      <div className="flex-1 min-w-0">
        <p className={`text-[13px] truncate transition-colors leading-snug ${
          isActive ? 'text-amber-300 font-semibold' : video.watched ? 'text-zinc-500 line-through decoration-zinc-700' : 'text-zinc-300'
        }`}>
          {video.name}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[11px] text-zinc-600 font-mono">{formatDuration(video.duration)}</span>
          {video.lastPosition > 0 && !video.watched && !isActive && (
            <span className="text-[11px] text-amber-500/50">• {formatDuration(video.lastPosition)} in</span>
          )}
          {isActive && video.duration > 0 && (
            <span className="text-[11px] text-amber-400/60">• playing</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Playlist({
  tree,
  currentVideo,
  courseProgress,
  searchQuery,
  onSearchChange,
  onSelectVideo,
  onToggleFolder,
  onToggleWatched,
  isOpen,
  onToggleOpen,
  foldersExpanded,
}: PlaylistProps) {
  const filteredTree = useMemo(() => searchTree(tree, searchQuery), [tree, searchQuery]);

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={onToggleOpen}
        className="lg:hidden fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-br from-amber-500 to-amber-400 text-black rounded-full shadow-lg shadow-amber-500/30 flex items-center justify-center"
      >
        <BookOpen className="w-6 h-6" />
      </button>

      {/* Overlay for mobile */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={onToggleOpen}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <div
        className={`fixed lg:relative right-0 top-0 h-full z-50 lg:z-auto w-80 lg:w-[360px] bg-[#0e0e15]/95 backdrop-blur-xl border-l border-zinc-800/60 flex flex-col transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Course Progress Header */}
        <div className="p-4 border-b border-zinc-800/60">
          <div className="flex items-center gap-3">
            <div className="relative flex-shrink-0">
              <ProgressRing percentage={courseProgress.percentage} />
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-amber-400">
                {courseProgress.percentage}%
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Course Progress</h3>
              <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${courseProgress.percentage}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
              <div className="flex items-center justify-between mt-1.5 text-[10px] text-zinc-500">
                <span>{courseProgress.completedVideos}/{courseProgress.totalVideos} completed</span>
                <span>{courseProgress.totalDuration > 0 ? `~${formatTimeRemaining(courseProgress.estimatedTimeRemaining)} left` : 'Loading duration...'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-zinc-800/60">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search videos..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-zinc-900/60 border border-zinc-700/40 rounded-xl pl-9 pr-9 py-2.5 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-amber-500/40 focus:ring-1 focus:ring-amber-500/20 transition-all"
            />
            {searchQuery && (
              <button onClick={() => onSearchChange('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Tree view */}
        <div className="flex-1 overflow-y-auto">
          {filteredTree.map((node) => (
            <TreeNodeItem
              key={node.path}
              node={node}
              currentVideo={currentVideo}
              onSelectVideo={onSelectVideo}
              onToggleFolder={onToggleFolder}
              onToggleWatched={onToggleWatched}
              foldersExpanded={foldersExpanded}
            />
          ))}

          {filteredTree.length === 0 && (
            <div className="p-8 text-center">
              <Search className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
              <p className="text-zinc-500 text-sm">No videos found</p>
            </div>
          )}
        </div>

        {/* Total duration footer */}
        <div className="p-3 border-t border-zinc-800/60 bg-[#0a0a10]/50">
          <div className="flex items-center justify-between text-[11px] text-zinc-500">
            <span>Total Duration</span>
            <span className="font-mono">
              {courseProgress.totalDuration > 0 
                ? formatDuration(courseProgress.totalDuration)
                : <span className="text-zinc-600 italic">Loading...</span>
              }
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
