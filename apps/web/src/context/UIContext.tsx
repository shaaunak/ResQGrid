import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface UIContextType {
  theme: Theme;
  toggleTheme: () => void;
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
  shortcutsOpen: boolean;
  setShortcutsOpen: (open: boolean) => void;
  density: 'compact' | 'normal';
  setDensity: (density: 'compact' | 'normal') => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem('resqgrid_theme') as Theme) || 'light';
  });
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [density, setDensity] = useState<'compact' | 'normal'>('normal');

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('resqgrid_theme', theme);
  }, [theme]);

  // Global key bindings: Cmd+K / Ctrl+K and ?
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger when inside inputs / textareas
      const tag = (e.target as HTMLElement)?.tagName;
      const isInput = tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable;

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      } else if (e.key === '?' && !isInput && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setShortcutsOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setCommandPaletteOpen(false);
        setShortcutsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <UIContext.Provider
      value={{
        theme,
        toggleTheme,
        commandPaletteOpen,
        setCommandPaletteOpen,
        shortcutsOpen,
        setShortcutsOpen,
        density,
        setDensity,
      }}
    >
      {children}
    </UIContext.Provider>
  );
};

export const useUI = (): UIContextType => {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error('useUI must be used within UIProvider');
  return ctx;
};
