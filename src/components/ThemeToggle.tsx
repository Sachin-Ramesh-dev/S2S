import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface ThemeToggleProps {
  variant?: 'pill' | 'sidebar' | 'icon';
  isCollapsed?: boolean;
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  variant = 'pill',
  isCollapsed = false,
  className = ''
}) => {
  const { theme, isDark, toggleTheme } = useTheme();

  if (variant === 'sidebar') {
    if (isCollapsed) {
      return (
        <button
          id="btn-theme-toggle-collapsed"
          type="button"
          onClick={toggleTheme}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className={`w-full flex items-center justify-center p-2 rounded-lg transition-all cursor-pointer ${
            isDark
              ? 'text-amber-400 hover:text-amber-300 hover:bg-[#1f1f25]'
              : 'text-amber-600 hover:text-amber-700 hover:bg-slate-100'
          } ${className}`}
        >
          {isDark ? (
            <Sun className="w-4 h-4 transition-transform hover:rotate-45" />
          ) : (
            <Moon className="w-4 h-4 transition-transform hover:-rotate-12" />
          )}
        </button>
      );
    }

    return (
      <button
        id="btn-theme-toggle-sidebar"
        type="button"
        onClick={toggleTheme}
        title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
          isDark
            ? 'text-[#a1a1aa] hover:text-[#f4f4f5] hover:bg-[#1a1a1e]'
            : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
        } ${className}`}
      >
        <div className="flex items-center gap-2.5">
          {isDark ? (
            <Sun className="w-4 h-4 text-amber-400 shrink-0" />
          ) : (
            <Moon className="w-4 h-4 text-slate-700 shrink-0" />
          )}
          <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
        </div>

        {/* Toggle Switch Track */}
        <div
          className={`w-8 h-4.5 rounded-full p-0.5 transition-colors relative flex items-center ${
            isDark ? 'bg-[#2a2a32] border border-[#3f3f4a]' : 'bg-orange-500 border border-orange-600'
          }`}
        >
          <div
            className={`w-3.5 h-3.5 rounded-full shadow-xs transition-transform transform ${
              isDark ? 'translate-x-0 bg-[#a1a1aa]' : 'translate-x-3.5 bg-white'
            }`}
          />
        </div>
      </button>
    );
  }

  if (variant === 'icon') {
    return (
      <button
        id="btn-theme-toggle-icon"
        type="button"
        onClick={toggleTheme}
        title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
          isDark
            ? 'bg-[#1e1e24] hover:bg-[#282832] border-[#30303c] text-amber-400 hover:text-amber-300'
            : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700 hover:text-slate-900 shadow-2xs'
        } ${className}`}
      >
        {isDark ? (
          <Sun className="w-4 h-4 transition-transform hover:rotate-45" />
        ) : (
          <Moon className="w-4 h-4 transition-transform hover:-rotate-12" />
        )}
      </button>
    );
  }

  // Default 'pill' variant
  return (
    <div
      id="theme-toggle-pill"
      className={`inline-flex items-center p-0.5 rounded-xl border transition-all ${
        isDark
          ? 'bg-[#181820] border-[#2c2c3a]'
          : 'bg-slate-100 border-slate-300 shadow-2xs'
      } ${className}`}
    >
      <button
        type="button"
        onClick={() => {
          if (!isDark) return;
          toggleTheme();
        }}
        title="Light Mode"
        aria-label="Activate Light Mode"
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
          !isDark
            ? 'bg-white text-orange-600 shadow-xs border border-orange-200/80 font-bold'
            : 'text-zinc-400 hover:text-zinc-200'
        }`}
      >
        <Sun className={`w-3.5 h-3.5 ${!isDark ? 'text-orange-500' : 'text-zinc-400'}`} />
        <span className="hidden sm:inline">Light</span>
      </button>

      <button
        type="button"
        onClick={() => {
          if (isDark) return;
          toggleTheme();
        }}
        title="Dark Mode"
        aria-label="Activate Dark Mode"
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
          isDark
            ? 'bg-[#282836] text-white shadow-xs border border-[#3e3e52] font-bold'
            : 'text-slate-500 hover:text-slate-900'
        }`}
      >
        <Moon className={`w-3.5 h-3.5 ${isDark ? 'text-amber-400' : 'text-slate-400'}`} />
        <span className="hidden sm:inline">Dark</span>
      </button>
    </div>
  );
};
