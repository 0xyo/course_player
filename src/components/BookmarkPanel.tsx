import { motion, AnimatePresence } from 'framer-motion';
import type { Bookmark as BookmarkType } from '../types';
import { formatDuration } from '../utils/videoUtils';
import { X, BookmarkIcon, Trash2, Play } from 'lucide-react';

interface BookmarkPanelProps {
  isOpen: boolean;
  onClose: () => void;
  bookmarks: BookmarkType[];
  onSeekToBookmark: (time: number) => void;
  onDeleteBookmark: (id: string) => void;
  currentVideoId: string | null;
}

export default function BookmarkPanel({
  isOpen,
  onClose,
  bookmarks,
  onSeekToBookmark,
  onDeleteBookmark,
  currentVideoId,
}: BookmarkPanelProps) {
  // Show bookmarks for current video first, then others
  const sortedBookmarks = [...bookmarks].sort((a, b) => {
    const aCurrent = a.videoId === currentVideoId ? 0 : 1;
    const bCurrent = b.videoId === currentVideoId ? 0 : 1;
    if (aCurrent !== bCurrent) return aCurrent - bCurrent;
    return b.createdAt - a.createdAt;
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[90]"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-80 bg-[#12121a]/95 backdrop-blur-xl border-l border-zinc-800/60 z-[95] flex flex-col"
          >
            <div className="flex items-center justify-between p-4 border-b border-zinc-800/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center">
                  <BookmarkIcon className="w-4 h-4 text-amber-500 fill-amber-500" />
                </div>
                <h2 className="text-base font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Bookmarks</h2>
              </div>
              <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {sortedBookmarks.length === 0 ? (
                <div className="p-8 text-center">
                  <BookmarkIcon className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
                  <p className="text-zinc-500 text-sm">No bookmarks yet</p>
                  <p className="text-zinc-600 text-xs mt-1">Press B while watching to add one</p>
                </div>
              ) : (
                <div className="p-2">
                  {sortedBookmarks.map((bm, idx) => {
                    const isCurrentVideo = bm.videoId === currentVideoId;
                    return (
                      <motion.div
                        key={bm.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className={`group flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                          isCurrentVideo
                            ? 'bg-amber-500/8 border border-amber-500/15 hover:bg-amber-500/12'
                            : 'hover:bg-zinc-800/30 border border-transparent'
                        }`}
                        onClick={() => onSeekToBookmark(bm.time)}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          isCurrentVideo ? 'bg-amber-500/15' : 'bg-zinc-800/50'
                        }`}>
                          <Play className={`w-3.5 h-3.5 ${isCurrentVideo ? 'text-amber-400' : 'text-zinc-500'} ml-0.5`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-zinc-300 truncate">{bm.label}</p>
                          <p className="text-[11px] text-zinc-500 font-mono mt-0.5">{formatDuration(bm.time)}</p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteBookmark(bm.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 transition-all p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}