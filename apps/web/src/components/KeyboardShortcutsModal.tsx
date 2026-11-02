import React from 'react';
import { X, Command, Keyboard } from 'lucide-react';
import { useUI } from '../context/UIContext';

export const KeyboardShortcutsModal: React.FC = () => {
  const { shortcutsOpen, setShortcutsOpen } = useUI();

  if (!shortcutsOpen) return null;

  const shortcuts = [
    { key: 'Cmd / Ctrl + K', desc: 'Open global search & command palette' },
    { key: '?', desc: 'Toggle keyboard shortcuts reference' },
    { key: 'ESC', desc: 'Close open modal, drawer or palette' },
    { key: '1 - 6', desc: 'Fast navigation across operational portals' },
    { key: 'Space', desc: 'Pause / Resume disaster simulation playback' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-md bg-rq-surface border border-rq-border rounded-card shadow-floating overflow-hidden text-xs text-rq-ink"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-rq-border flex items-center justify-between bg-rq-surface-2">
          <div className="flex items-center space-x-2">
            <Keyboard className="w-4 h-4 text-rq-navy" />
            <span className="font-semibold text-sm">Keyboard Shortcuts</span>
          </div>
          <button
            onClick={() => setShortcutsOpen(false)}
            className="p-1 rounded text-rq-muted hover:text-rq-ink hover:bg-rq-surface transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 divide-y divide-rq-border">
          {shortcuts.map((s, idx) => (
            <div key={idx} className="py-2.5 flex items-center justify-between first:pt-0 last:pb-0">
              <span className="text-rq-muted">{s.desc}</span>
              <kbd className="px-2 py-1 bg-rq-surface-2 border border-rq-border rounded font-mono font-semibold text-rq-ink">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="p-3 bg-rq-surface-2 border-t border-rq-border text-center text-rq-muted text-xs">
          Press <kbd className="px-1.5 py-0.5 bg-rq-surface border border-rq-border rounded font-mono">ESC</kbd> to return to active workflow.
        </div>
      </div>
    </div>
  );
};

