import { motion, AnimatePresence } from 'framer-motion';
import { X, Keyboard } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const shortcuts = [
  { keys: ['Space'], description: 'Play / Pause', category: 'Playback' },
  { keys: ['←'], description: 'Seek back 10 seconds', category: 'Playback' },
  { keys: ['→'], description: 'Seek forward 10 seconds', category: 'Playback' },
  { keys: ['J'], description: 'Seek back 10 seconds', category: 'Playback' },
  { keys: ['L'], description: 'Seek forward 10 seconds', category: 'Playback' },
  { keys: ['↑'], description: 'Volume up', category: 'Audio' },
  { keys: ['↓'], description: 'Volume down', category: 'Audio' },
  { keys: ['M'], description: 'Toggle mute', category: 'Audio' },
  { keys: ['N'], description: 'Next video', category: 'Navigation' },
  { keys: ['P'], description: 'Previous video', category: 'Navigation' },
  { keys: ['F'], description: 'Toggle fullscreen', category: 'View' },
  { keys: ['B'], description: 'Add bookmark', category: 'Bookmarks' },
  { keys: ['/'], description: 'Focus search', category: 'Navigation' },
  { keys: ['?'], description: 'Show shortcuts', category: 'View' },
  { keys: ['Esc'], description: 'Close modal', category: 'View' },
];

export default function ShortcutsModal({ isOpen, onClose }: ShortcutsModalProps) {
  // Group shortcuts by category
  const categories = shortcuts.reduce<Record<string, typeof shortcuts>>((acc, s) => {
    if (!acc[s.category]) acc[s.category] = [];
    acc[s.category].push(s);
    return acc;
  }, {});

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-[#16161e]/95 backdrop-blur-xl border border-zinc-700/50 rounded-2xl w-full max-w-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-zinc-800/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center">
                  <Keyboard className="w-4 h-4 text-amber-500" />
                </div>
                <h2 className="text-lg font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Keyboard Shortcuts</h2>
              </div>
              <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 max-h-[60vh] overflow-y-auto">
              {Object.entries(categories).map(([category, items]) => (
                <div key={category} className="mb-5 last:mb-0">
                  <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">{category}</h3>
                  <div className="space-y-1">
                    {items.map((s) => (
                      <div key={s.keys[0]} className="flex items-center justify-between py-1.5">
                        <span className="text-sm text-zinc-400">{s.description}</span>
                        <div className="flex gap-1">
                          {s.keys.map((key) => (
                            <kbd
                              key={key}
                              className="px-2.5 py-1 bg-zinc-800/80 border border-zinc-700/50 rounded-lg text-xs font-mono text-zinc-300 min-w-[28px] text-center"
                            >
                              {key}
                            </kbd>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
