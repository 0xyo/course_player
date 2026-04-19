import { motion, AnimatePresence } from 'framer-motion';
import type { ShortcutFeedback } from '../types';

interface ShortcutOverlayProps {
  feedback: ShortcutFeedback | null;
}

export default function ShortcutOverlay({ feedback }: ShortcutOverlayProps) {
  return (
    <AnimatePresence>
      {feedback && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.15 }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[80]"
        >
          <div className="flex items-center gap-2 px-4 py-2 bg-black/80 backdrop-blur-md rounded-xl border border-zinc-700/50">
            <kbd className="px-2 py-0.5 bg-zinc-800 rounded text-xs font-mono text-amber-400">{feedback.key}</kbd>
            <span className="text-xs text-zinc-400">{feedback.label}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}