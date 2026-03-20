import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    // Check localStorage first
    const stored = localStorage.getItem('theme');
    if (stored) return stored;
    // Check system preference
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  useEffect(() => {
    // Save to localStorage
    localStorage.setItem('theme', theme);
    // Update document class
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(t => (t === 'light' ? 'dark' : 'light'));
  };

  const colors =
    theme === 'light'
      ? {
          bg: '#ffffff',
          bgSecondary: '#f9fafb',
          bgTertiary: '#f1f5f9',
          text: '#0f172a',
          textSecondary: '#64748b',
          textTertiary: '#94a3b8',
          border: '#e2e8f0',
          borderSecondary: '#cbd5e1',
          primary: '#3b82f6',
          primaryLight: '#eff6ff',
          sidebar: '#f8fafc',
          sidebarText: '#0f172a',
          modal: '#ffffff',
        }
      : {
          bg: '#0f172a',
          bgSecondary: '#1e293b',
          bgTertiary: '#334155',
          text: '#f1f5f9',
          textSecondary: '#cbd5e1',
          textTertiary: '#94a3b8',
          border: '#334155',
          borderSecondary: '#475569',
          primary: '#60a5fa',
          primaryLight: 'rgba(59, 130, 246, 0.1)',
          sidebar: '#1e293b',
          sidebarText: '#f1f5f9',
          modal: '#1e293b',
        };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, colors }}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
