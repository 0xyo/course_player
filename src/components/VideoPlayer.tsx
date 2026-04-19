import { useState, useRef, useEffect, useCallback } from 'react';
import type { VideoFile, Bookmark } from '../types';
import { formatDuration } from '../utils/videoUtils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Pause, SkipForward, SkipBack, Volume2, VolumeX,
  Maximize, ChevronRight, RotateCcw, Minimize,
  BookmarkPlus, PictureInPicture2, Rewind, FastForward
} from 'lucide-react';

interface VideoPlayerProps {
  video: VideoFile | null;
  autoplay: boolean;
  playbackSpeed: number;
  onProgress: (videoId: string, position: number, duration: number) => void;
  onComplete: (videoId: string) => void;
  onNext: () => void;
  onPrevious: () => void;
  onSpeedChange: (speed: number) => void;
  lastPosition: number;
  bookmarks: Bookmark[];
  onAddBookmark: (videoId: string, time: number) => void;
  onSeekToBookmark: (time: number) => void;
  videoIndex: number;
  totalVideos: number;
  onTimeUpdate?: (currentTime: number) => void;
}

export default function VideoPlayer({
  video,
  autoplay,
  playbackSpeed,
  onProgress,
  onComplete,
  onNext,
  onPrevious,
  onSpeedChange,
  lastPosition,
  bookmarks,
  onAddBookmark,
  onSeekToBookmark,
  videoIndex,
  totalVideos,
  onTimeUpdate,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const seekBarRef = useRef<HTMLDivElement>(null);
  const completionTrackerRef = useRef<boolean>(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showResumePrompt, setShowResumePrompt] = useState(false);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [skipIndicator, setSkipIndicator] = useState<{ direction: 'forward' | 'back'; seconds: number } | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverX, setHoverX] = useState(0);
  const speedMenuRef = useRef<HTMLDivElement>(null);
  const speeds = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
  const skipAmount = 10; // seconds to skip forward/backward

  // Reset completion tracker when video changes
  useEffect(() => {
    completionTrackerRef.current = false;
  }, [video?.id]);

  // Resume from last position
  useEffect(() => {
    if (video && lastPosition > 10) {
      setShowResumePrompt(true);
    } else {
      setShowResumePrompt(false);
    }
  }, [video?.id]);

  // Close speed menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (speedMenuRef.current && !speedMenuRef.current.contains(e.target as Node)) {
        setShowSpeedMenu(false);
      }
    };
    if (showSpeedMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showSpeedMenu]);

  const resumeFromPosition = useCallback(() => {
    if (videoRef.current && lastPosition > 0) {
      videoRef.current.currentTime = lastPosition;
    }
    setShowResumePrompt(false);
    videoRef.current?.play().catch(() => {});
    setIsPlaying(true);
  }, [lastPosition]);

  const startFromBeginning = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
    }
    setShowResumePrompt(false);
    videoRef.current?.play().catch(() => {});
    setIsPlaying(true);
  }, []);

  // Sync playback speed
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed, video?.id]);

  // Auto-play when video changes
  useEffect(() => {
    if (videoRef.current && video && autoplay && !showResumePrompt) {
      videoRef.current.play().catch(() => {});
    }
  }, [video?.id, autoplay]);

  // Track progress and auto-complete at 90%
  useEffect(() => {
    if (!video) return;
    const handleTimeUpdate = () => {
      if (!videoRef.current) return;
      const time = videoRef.current.currentTime;
      const dur = videoRef.current.duration;
      setCurrentTime(time);
      onTimeUpdate?.(time);
      if (videoRef.current.buffered.length > 0) {
        setBuffered(videoRef.current.buffered.end(videoRef.current.buffered.length - 1));
      }
      if (dur > 0) {
        onProgress(video.id, time, dur);
        if (time / dur >= 0.9 && !video.watched && !completionTrackerRef.current) {
          completionTrackerRef.current = true;
          onComplete(video.id);
        }
      }
    };
    const handleLoadedMetadata = () => {
      if (videoRef.current) setDuration(videoRef.current.duration);
    };
    const handleEnded = () => {
      setIsPlaying(false);
      if (autoplay) onNext();
    };
    // Sync isPlaying with actual video state
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    const el = videoRef.current;
    el?.addEventListener('timeupdate', handleTimeUpdate);
    el?.addEventListener('loadedmetadata', handleLoadedMetadata);
    el?.addEventListener('ended', handleEnded);
    el?.addEventListener('play', handlePlay);
    el?.addEventListener('pause', handlePause);
    el?.addEventListener('progress', handleTimeUpdate);

    return () => {
      el?.removeEventListener('timeupdate', handleTimeUpdate);
      el?.removeEventListener('loadedmetadata', handleLoadedMetadata);
      el?.removeEventListener('ended', handleEnded);
      el?.removeEventListener('play', handlePlay);
      el?.removeEventListener('pause', handlePause);
      el?.removeEventListener('progress', handleTimeUpdate);
    };
  }, [video?.id, autoplay, onNext]);

  // Auto-hide controls
  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    hideTimeoutRef.current = setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused) setShowControls(false);
    }, 3000);
  }, []);

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play().catch(() => {});
    } else {
      v.pause();
    }
    // isPlaying is synced via play/pause event listeners above
  }, []);

  const seek = useCallback((seconds: number) => {
    if (videoRef.current) {
      const dur = videoRef.current.duration || 0;
      const newTime = Math.max(0, Math.min(dur, videoRef.current.currentTime + seconds));
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      setSkipIndicator({ direction: seconds > 0 ? 'forward' : 'back', seconds: Math.abs(seconds) });
      setTimeout(() => setSkipIndicator(null), 700);
    }
  }, []);

  // Expose seek/togglePlay for keyboard shortcuts
  useEffect(() => {
    (window as unknown as Record<string, unknown>).__seek = seek;
    (window as unknown as Record<string, unknown>).__togglePlay = togglePlay;
    return () => {
      delete (window as unknown as Record<string, unknown>).__seek;
      delete (window as unknown as Record<string, unknown>).__togglePlay;
    };
  }, [seek, togglePlay]);

  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(!isMuted);
    }
  }, [isMuted]);

  const toggleFullscreen = useCallback(() => {
    if (containerRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        containerRef.current.requestFullscreen();
      }
    }
  }, []);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const togglePiP = useCallback(async () => {
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (videoRef.current) {
        await videoRef.current.requestPictureInPicture();
      }
    } catch { /* PiP not supported */ }
  }, []);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    setVolume(vol);
    if (videoRef.current) {
      videoRef.current.volume = vol;
      setIsMuted(vol === 0);
    }
  }, []);

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  // Click on video = toggle play, Double-click = toggle fullscreen
  const handleVideoClick = useCallback((e: React.MouseEvent) => {
    // Don't toggle play if clicking on controls area
    e.preventDefault();
    togglePlay();
  }, [togglePlay]);

  const handleVideoDoubleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    toggleFullscreen();
  }, [toggleFullscreen]);

  const handleSeekBarHover = useCallback((e: React.MouseEvent) => {
    if (!seekBarRef.current || !duration) return;
    const rect = seekBarRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, x / rect.width));
    setHoverTime(pct * duration);
    setHoverX(x);
  }, [duration]);

  // Handle seek bar click to seek
  const handleSeekBarClick = useCallback((e: React.MouseEvent) => {
    if (!seekBarRef.current || !duration) return;
    const rect = seekBarRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, x / rect.width));
    const newTime = pct * duration;
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  }, [duration]);

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPercent = duration > 0 ? (buffered / duration) * 100 : 0;
  const videoBookmarks = bookmarks.filter(b => b.videoId === video?.id);

  if (!video) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#08080d] relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute w-96 h-96 -top-48 -left-48 bg-amber-500/5 rounded-full blur-3xl animate-pulse" />
          <div className="absolute w-96 h-96 -bottom-48 -right-48 bg-amber-500/3 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center relative z-10">
          <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} className="w-28 h-28 mx-auto mb-8 rounded-full bg-gradient-to-br from-amber-500/20 to-amber-600/5 flex items-center justify-center border border-amber-500/20">
            <Play className="w-12 h-12 text-amber-500 ml-1" />
          </motion.div>
          <h2 className="text-3xl font-bold text-zinc-200 mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Ready to Learn</h2>
          <p className="text-zinc-500 text-lg mb-6">Select a video from the playlist to begin</p>
          <div className="flex items-center justify-center gap-6 text-xs text-zinc-600">
            <span className="flex items-center gap-1.5"><kbd className="px-2 py-0.5 bg-zinc-800 rounded text-zinc-400">Space</kbd> Play/Pause</span>
            <span className="flex items-center gap-1.5"><kbd className="px-2 py-0.5 bg-zinc-800 rounded text-zinc-400">N</kbd> Next</span>
            <span className="flex items-center gap-1.5"><kbd className="px-2 py-0.5 bg-zinc-800 rounded text-zinc-400">?</kbd> Shortcuts</span>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      data-player
      className="flex-1 relative bg-black group select-none"
      onMouseMove={resetHideTimer}
      onMouseLeave={() => { if (videoRef.current && !videoRef.current.paused) setShowControls(false); }}
    >
      <video
        ref={videoRef}
        src={video.url}
        className="w-full h-full object-contain"
        onClick={handleVideoClick}
        onDoubleClick={handleVideoDoubleClick}
        playsInline
      />

      {/* Skip indicator */}
      <AnimatePresence>
        {skipIndicator && (
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="absolute inset-0 flex items-center justify-center pointer-events-none z-[15]">
            <div className="flex items-center gap-2 px-6 py-3 bg-black/60 rounded-2xl backdrop-blur-sm">
              {skipIndicator.direction === 'back' ? <Rewind className="w-6 h-6 text-amber-400" /> : <FastForward className="w-6 h-6 text-amber-400" />}
              <span className="text-white font-bold text-lg">{skipIndicator.seconds}s</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Resume Prompt */}
      <AnimatePresence>
        {showResumePrompt && lastPosition > 10 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-20">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} transition={{ type: "spring", damping: 25, stiffness: 300 }} className="bg-[#16161e]/90 border border-zinc-700/50 rounded-2xl p-8 text-center max-w-md backdrop-blur-xl">
              <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-amber-500/15 flex items-center justify-center"><RotateCcw className="w-8 h-8 text-amber-500" /></div>
              <h3 className="text-xl font-bold text-white mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Resume Playback?</h3>
              <p className="text-zinc-400 mb-6">You left off at <span className="text-amber-400 font-mono font-bold">{formatDuration(lastPosition)}</span></p>
              <div className="flex gap-3 justify-center">
                <button onClick={startFromBeginning} className="px-6 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors font-medium border border-zinc-700/50">Start Over</button>
                <button onClick={resumeFromPosition} className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-black hover:from-amber-400 hover:to-amber-300 transition-all font-bold shadow-lg shadow-amber-500/20">Resume</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Play overlay on pause — more reliable with better event handling */}
      <AnimatePresence>
        {!isPlaying && !showResumePrompt && video && (
          <motion.div
            key="play-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer z-10"
            onClick={(e) => { 
              e.stopPropagation(); 
              e.preventDefault(); 
              togglePlay(); 
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                togglePlay();
              }
            }}
          >
            <motion.div 
              whileHover={{ scale: 1.1 }} 
              whileTap={{ scale: 0.95 }} 
              className="w-20 h-20 rounded-full bg-amber-500/90 flex items-center justify-center shadow-2xl shadow-amber-500/30 pointer-events-none"
            >
              <Play className="w-8 h-8 text-black ml-1" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent pt-20 pb-4 px-4 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Seek bar */}
        <div ref={seekBarRef} className="relative w-full h-5 flex items-center cursor-pointer group/seek mb-1 touch-none" onMouseMove={handleSeekBarHover} onMouseLeave={() => setHoverTime(null)} onClick={handleSeekBarClick}>
          <div className="absolute left-0 right-0 h-1 group-hover/seek:h-1.5 bg-white/20 rounded-full transition-all">
            <div className="absolute top-0 left-0 h-full bg-white/30 rounded-full transition-all" style={{ width: `${bufferedPercent}%` }} />
            <div className="absolute top-0 left-0 h-full bg-amber-500 rounded-full transition-all" style={{ width: `${progressPercent}%` }} />
            {videoBookmarks.map(bm => (
              <div key={bm.id} className="absolute top-1/2 -translate-y-1/2 w-0.5 h-3 bg-amber-300 rounded-full opacity-60 hover:opacity-100 z-10 cursor-pointer" style={{ left: `${duration > 0 ? (bm.time / duration) * 100 : 0}%` }} title={`${bm.label} (${formatDuration(bm.time)})`} onClick={(e) => { e.stopPropagation(); onSeekToBookmark(bm.time); }} />
            ))}
            <div className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-amber-400 rounded-full shadow-lg shadow-amber-500/40 opacity-0 group-hover/seek:opacity-100 transition-opacity z-10" style={{ left: `calc(${progressPercent}% - 7px)` }} />
          </div>
          <input type="range" min={0} max={duration || 0} value={currentTime} onChange={handleSeek} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" style={{ height: '20px' }} />
          {hoverTime !== null && (
            <div className="absolute -top-8 px-2 py-1 bg-black/80 rounded text-xs text-amber-400 font-mono pointer-events-none z-30" style={{ left: `${hoverX - 20}px` }}>{formatDuration(hoverTime)}</div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={onPrevious} className="text-white/80 hover:text-white transition-colors p-1 active:scale-95" title="Previous video"><SkipBack className="w-5 h-5" /></button>
            <button onClick={() => seek(-skipAmount)} className="text-white/80 hover:text-white transition-colors p-1 active:scale-95" title={`Rewind ${skipAmount}s`}><Rewind className="w-5 h-5" /></button>
            <button onClick={togglePlay} className="text-white hover:text-amber-400 transition-colors p-1 active:scale-95">{isPlaying ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7" />}</button>
            <button onClick={() => seek(skipAmount)} className="text-white/80 hover:text-white transition-colors p-1 active:scale-95" title={`Forward ${skipAmount}s`}><FastForward className="w-5 h-5" /></button>
            <button onClick={onNext} className="text-white/80 hover:text-white transition-colors p-1 active:scale-95" title="Next video"><SkipForward className="w-5 h-5" /></button>
            <div className="flex items-center gap-1.5 ml-2">
              <button onClick={toggleMute} className="text-white/80 hover:text-white transition-colors p-1 active:scale-95">{isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}</button>
              <input type="range" min={0} max={1} step={0.05} value={isMuted ? 0 : volume} onChange={handleVolumeChange} className="w-20 accent-amber-500 h-1" />
            </div>
            <span className="text-white/60 text-sm ml-2 font-mono tabular-nums">{formatDuration(currentTime)} / {formatDuration(duration)}</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => onAddBookmark(video.id, currentTime)} className="text-white/60 hover:text-amber-400 transition-colors p-1 active:scale-95" title="Add bookmark"><BookmarkPlus className="w-5 h-5" /></button>
            <button onClick={togglePiP} className="text-white/60 hover:text-amber-400 transition-colors p-1 active:scale-95" title="Picture in Picture"><PictureInPicture2 className="w-4 h-4" /></button>
            <div className="relative" ref={speedMenuRef}>
              <button onClick={() => setShowSpeedMenu(true)} className="text-white/70 hover:text-white transition-colors flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-md hover:bg-white/10 active:scale-95">{playbackSpeed}x</button>
              <AnimatePresence>
                {showSpeedMenu && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="absolute bottom-full right-0 mb-2 bg-[#16161e]/95 backdrop-blur-xl border border-zinc-700/50 rounded-xl py-1.5 min-w-[90px] shadow-2xl z-50">
                    {speeds.map((speed) => (
                      <button key={speed} onClick={() => { onSpeedChange(speed); setShowSpeedMenu(false); }} className={`w-full px-4 py-1.5 text-sm text-left hover:bg-white/10 transition-colors ${playbackSpeed === speed ? 'text-amber-400 font-bold' : 'text-white/70'}`}>{speed}x</button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <button onClick={toggleFullscreen} className="text-white/70 hover:text-white transition-colors p-1 active:scale-95">{isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}</button>
          </div>
        </div>
      </div>

      {/* Video title overlay */}
      <AnimatePresence>
        {showControls && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 via-black/40 to-transparent p-4 pt-5 z-[8]">
            <div className="flex items-center gap-2">
              <ChevronRight className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-white/50 text-xs font-medium uppercase tracking-wider">{video.folder}</span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <h2 className="text-white font-bold text-base" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{video.name}</h2>
              <span className="text-white/40 text-xs font-mono">{videoIndex + 1}/{totalVideos}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
