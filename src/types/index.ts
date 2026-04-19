export interface VideoFile {
  id: string;
  name: string;
  /** Full relative path from course root, e.g. "Module 1/Lesson 1/02 - Intro.mp4" */
  path: string;
  /** Only the immediate parent folder name, e.g. "Lesson 1" */
  folder: string;
  /** Full path of immediate parent, e.g. "Module 1/Lesson 1" */
  folderPath: string;
  url: string;
  duration: number;
  watched: boolean;
  lastPosition: number;
  order: number;
}

/** Recursive tree node — a folder can contain videos AND sub-folders */
export interface TreeNode {
  id: string;
  name: string;
  path: string;
  depth: number;
  videos: VideoFile[];
  children: TreeNode[];
  expanded: boolean;
}

export interface CourseProgress {
  totalVideos: number;
  completedVideos: number;
  percentage: number;
  totalDuration: number;
  watchedDuration: number;
  estimatedTimeRemaining: number;
}

export interface PlayerSettings {
  theme: 'dark' | 'light';
  autoplay: boolean;
  playbackSpeed: number;
  volume: number;
  lastVideoId: string | null;
  showBookmarks: boolean;
}

export interface Bookmark {
  id: string;
  videoId: string;
  time: number;
  label: string;
  createdAt: number;
}

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'info' | 'warning';
  duration?: number;
}

export interface ShortcutFeedback {
  key: string;
  label: string;
}
