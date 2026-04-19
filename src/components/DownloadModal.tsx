import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, FileCode, FileText, Terminal } from 'lucide-react';

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DownloadModal({ isOpen, onClose }: DownloadModalProps) {
  if (!isOpen) return null;

  const files = [
    {
      name: 'standalone-player.html',
      description: 'Complete standalone course player — copy to any course folder',
      icon: FileCode,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
    },
    {
      name: 'player.bat',
      description: 'Windows launcher — double-click to start the player',
      icon: Terminal,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
    },
    {
      name: 'README.txt',
      description: 'Setup and usage instructions',
      icon: FileText,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
    },
  ];

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
                  <Download className="w-4 h-4 text-amber-500" />
                </div>
                <h2 className="text-lg font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Download Standalone Player</h2>
              </div>
              <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5">
              <p className="text-sm text-zinc-400 mb-5">
                Download these files and place them in your course folder. Double-click <code className="text-amber-400 bg-zinc-800 px-1.5 py-0.5 rounded text-xs">player.bat</code> to launch.
              </p>
              <div className="space-y-2.5">
                {files.map((file) => (
                  <a
                    key={file.name}
                    href={`/${file.name}`}
                    download={file.name}
                    className="flex items-center gap-3 p-3.5 bg-zinc-800/30 border border-zinc-700/40 rounded-xl hover:border-amber-500/30 hover:bg-zinc-800/60 transition-all group"
                  >
                    <div className={`w-9 h-9 rounded-lg ${file.bg} flex items-center justify-center flex-shrink-0`}>
                      <file.icon className={`w-4.5 h-4.5 ${file.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-zinc-200 group-hover:text-amber-300 transition-colors">{file.name}</p>
                      <p className="text-xs text-zinc-500 truncate">{file.description}</p>
                    </div>
                    <Download className="w-4 h-4 text-zinc-600 group-hover:text-amber-400 transition-colors flex-shrink-0" />
                  </a>
                ))}
              </div>
              <div className="mt-5 p-3.5 bg-zinc-800/20 border border-zinc-700/30 rounded-xl">
                <p className="text-xs text-zinc-500 leading-relaxed">
                  <strong className="text-zinc-400">How it works:</strong> The BAT file starts a lightweight local HTTP server
                  (Python or Node.js) and opens the player in your browser. The player automatically scans the folder
                  for video files and organizes them by module. All progress is saved locally.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
