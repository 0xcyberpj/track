import { useState, useEffect, useCallback, createContext, useContext } from 'react';

export type ThemeId = 'dark-emerald' | 'dark-ocean' | 'dark-violet' | 'dark-amber' | 'light-emerald' | 'light-slate' | 'light-rose' | 'light-mint';

export interface ThemeOption {
  id: ThemeId;
  name: string;
  mode: 'dark' | 'light';
  accent: string;       // hex color for preview swatch
  background: string;   // hex color for preview swatch
}

export const THEMES: ThemeOption[] = [
  { id: 'dark-emerald',  name: 'Emerald Night',  mode: 'dark',  accent: '#1a9d5c', background: '#050505' },
  { id: 'dark-ocean',    name: 'Ocean Depth',    mode: 'dark',  accent: '#2b7fff', background: '#070a12' },
  { id: 'dark-violet',   name: 'Violet Aura',    mode: 'dark',  accent: '#8b5cf6', background: '#0a0710' },
  { id: 'dark-amber',    name: 'Amber Glow',     mode: 'dark',  accent: '#f59e0b', background: '#0a0806' },
  { id: 'light-emerald', name: 'Emerald Fresh',  mode: 'light', accent: '#1a9d5c', background: '#f5f7f5' },
  { id: 'light-slate',   name: 'Slate Pro',      mode: 'light', accent: '#2563eb', background: '#f1f3f8' },
  { id: 'light-rose',    name: 'Rose Warm',      mode: 'light', accent: '#e11d48', background: '#f9f5f3' },
  { id: 'light-mint',    name: 'Mint Fresh',     mode: 'light', accent: '#0d9488', background: '#f3f8f7' },
];

const STORAGE_KEY = 'app-theme';

function getInitialTheme(): ThemeId {
  const stored = localStorage.getItem(STORAGE_KEY) as ThemeId | null;
  if (stored && THEMES.some(t => t.id === stored)) return stored;
  // Migration from old 'theme' key
  const old = localStorage.getItem('theme');
  if (old === 'light') return 'light-emerald';
  return 'light-emerald';
}

function applyTheme(themeId: ThemeId) {
  const root = document.documentElement;
  const theme = THEMES.find(t => t.id === themeId)!;

  // Set dark class
  if (theme.mode === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }

  // Set data-theme attribute for CSS
  root.setAttribute('data-theme', themeId);

  // Persist
  localStorage.setItem(STORAGE_KEY, themeId);
  localStorage.removeItem('theme'); // clean up old key
}

interface ThemeContextValue {
  theme: ThemeId;
  themeOption: ThemeOption;
  isDark: boolean;
  setTheme: (id: ThemeId) => void;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>(getInitialTheme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const setTheme = useCallback((id: ThemeId) => {
    setThemeState(id);
  }, []);

  const themeOption = THEMES.find(t => t.id === theme)!;
  const isDark = themeOption.mode === 'dark';

  const toggleMode = useCallback(() => {
    const currentMode = THEMES.find(t => t.id === theme)!.mode;
    if (currentMode === 'dark') {
      setThemeState('light-emerald');
    } else {
      setThemeState('dark-emerald');
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, themeOption, isDark, setTheme, toggleMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
