import { useState, useEffect } from 'react';
import { FolderOpen, X } from 'lucide-react';
import type { VideoFile } from '../types';

interface LoadCourseProps {
  onLoadCourse: (videos: VideoFile[], courseName: string) => void;
  onClose?: () => void;
}

const VIDEO_EXTENSIONS = ['.mp4', '.mkv', '.avi', '.webm', '.mov', '.flv', '.m4v'];

export default function LoadCourse({ onLoadCourse, onClose }: LoadCourseProps) {
  const [isLoading, setIsLoading] = useState(false);

  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Preload metadata for all videos to get durations upfront
  const preloadVideoMetadata = (videos: VideoFile[]): Promise<void> => {
    return new Promise((resolve) => {
      let loadedCount = 0;

      videos.forEach((video) => {
        const videoEl = document.createElement('video');
        videoEl.src = video.url;
        videoEl.preload = 'metadata';

        const cleanup = () => {
          videoEl.removeEventListener('loadedmetadata', onMetadataLoaded);
          videoEl.removeEventListener('error', onError);
        };

        const onMetadataLoaded = () => {
          video.duration = videoEl.duration || 0;
          cleanup();
          loadedCount++;
          if (loadedCount === videos.length) resolve();
        };

        const onError = () => {
          cleanup();
          loadedCount++;
          if (loadedCount === videos.length) resolve();
        };

        videoEl.addEventListener('loadedmetadata', onMetadataLoaded, { once: true });
        videoEl.addEventListener('error', onError, { once: true });
      });

      // Timeout after 30 seconds if some videos don't load
      setTimeout(() => resolve(), 30000);
    });
  };

  const generateId = (path: string) => {
    let hash = 0;
    for (let i = 0; i < path.length; i++) {
      const char = path.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return `v${Math.abs(hash).toString(36)}`;
  };

  const scanFolder = async () => {
    setIsLoading(true);
    try {
      // Request folder access (modern browsers)
      if (!('showDirectoryPicker' in window)) {
        alert(
          'Your browser does not support folder access.\n\n' +
          'Supported browsers:\n' +
          '• Google Chrome\n' +
          '• Microsoft Edge\n' +
          '• Brave Browser\n\n' +
          'Alternative: Use the standalone player.bat file included in the project.'
        );
        setIsLoading(false);
        return;
      }

      const dirHandle = await (window as any).showDirectoryPicker();
      const courseName = dirHandle.name;
      const videos: VideoFile[] = [];

      // Recursively scan directory
      const scanDir = async (handle: any, folderPath: string, depth: number) => {
        if (depth > 5) return; // Prevent deep recursion

        try {
          for await (const entry of handle.values()) {
            if (entry.kind === 'directory') {
              const newPath = folderPath ? `${folderPath}/${entry.name}` : entry.name;
              await scanDir(entry, newPath, depth + 1);
            } else if (entry.kind === 'file') {
              const fileName = entry.name.toLowerCase();
              const isVideo = VIDEO_EXTENSIONS.some(ext => fileName.endsWith(ext));

              if (isVideo) {
                const file = await entry.getFile();
                const url = URL.createObjectURL(file);
                const videoName = entry.name.replace(/\.[^.]+$/, '');
                const videoFolderPath = folderPath || 'Root';

                videos.push({
                  id: generateId(`${folderPath}/${entry.name}`),
                  name: videoName,
                  path: folderPath ? `${folderPath}/${entry.name}` : entry.name,
                  folder: folderPath ? folderPath.split('/').pop() || folderPath : 'Root',
                  folderPath: videoFolderPath,
                  url: url,
                  duration: 0,
                  watched: false,
                  lastPosition: 0,
                  order: videos.length,
                });
              }
            }
          }
        } catch (error) {
          console.warn('Error scanning directory:', error);
        }
      };

      await scanDir(dirHandle, '', 0);

      if (videos.length === 0) {
        alert('No video files found in the selected folder.\n\nSupported formats: MP4, MKV, AVI, WebM, MOV, FLV, M4V');
        setIsLoading(false);
        return;
      }

      // Sort videos naturally
      videos.sort((a, b) => a.path.localeCompare(b.path, undefined, { numeric: true, sensitivity: 'base' }));
      videos.forEach((v, i) => { v.order = i; });

      // Preload video metadata (duration) for all videos
      await preloadVideoMetadata(videos);

      onLoadCourse(videos, courseName);
    } catch (error) {
      if ((error as any).name !== 'AbortError') {
        console.error('Error loading course:', error);
        alert('Error loading course folder. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-zinc-900 via-zinc-800 to-black relative overflow-hidden">
      {/* Background animations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-96 h-96 -top-48 -left-48 bg-amber-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute w-96 h-96 -bottom-48 -right-48 bg-amber-500/3 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 text-center max-w-md px-6">
        {onClose && (
          <button
            onClick={onClose}
            className="absolute -top-16 -right-4 w-10 h-10 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-all border border-zinc-700 flex items-center justify-center"
            title="Close (ESC)"
          >
            <X className="w-5 h-5" />
          </button>
        )}
        <div className="mb-8 flex justify-center">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-500/30 to-amber-600/10 flex items-center justify-center border border-amber-500/20">
            <FolderOpen className="w-12 h-12 text-amber-500" />
          </div>
        </div>

        <h1 className="text-4xl font-bold text-white mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          Load Your Course
        </h1>
        <p className="text-zinc-400 text-lg mb-8">
          Select your local course folder to start watching
        </p>

        <button
          onClick={scanFolder}
          disabled={isLoading}
          className="w-full px-8 py-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-black hover:from-amber-400 hover:to-amber-300 transition-all font-bold text-lg shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <FolderOpen className="w-5 h-5" />
          {isLoading ? 'Scanning & Loading Video Data...' : 'Select Course Folder'}
        </button>

        <div className="mt-8 pt-8 border-t border-zinc-700">
          <p className="text-sm text-zinc-500 mb-3">Supported formats:</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {['.MP4', '.MKV', '.AVI', '.WebM', '.MOV', '.FLV'].map(ext => (
              <span key={ext} className="px-3 py-1 bg-zinc-800 rounded-full text-xs text-zinc-400 font-mono">
                {ext}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-zinc-700">
          <p className="text-xs text-zinc-600 mb-3">💡 Compatible Browsers:</p>
          <div className="text-left bg-zinc-900/50 rounded-lg p-4 space-y-1 text-xs text-zinc-400">
            <p>✓ Google Chrome / Chromium</p>
            <p>✓ Microsoft Edge</p>
            <p>✓ Brave Browser</p>
            <p className="text-amber-500 mt-3">Not supported? Use player.bat instead</p>
          </div>
        </div>

        {onClose && (
          <div className="mt-8 pt-8 border-t border-zinc-700 text-xs text-zinc-600">
            💡 Click the <span className="text-zinc-400 font-mono">X</span> button or press <span className="text-zinc-400 font-mono">ESC</span> to go back
          </div>
        )}
      </div>
    </div>
  );
}
