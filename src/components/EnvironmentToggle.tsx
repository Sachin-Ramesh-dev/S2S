import React from 'react';
import { FlaskConical, Radio, ShieldAlert } from 'lucide-react';
import { useEnvironment, AppEnvironment } from '../context/EnvironmentContext';
import { useTheme } from '../context/ThemeContext';

interface EnvironmentToggleProps {
  variant?: 'pill' | 'card' | 'badge';
  className?: string;
  onEnvironmentChange?: (env: AppEnvironment) => void;
}

export const EnvironmentToggle: React.FC<EnvironmentToggleProps> = ({
  variant = 'pill',
  className = '',
  onEnvironmentChange
}) => {
  const { environment, isDemoMode, isLiveMode, setEnvironment } = useEnvironment();
  const { isDark } = useTheme();

  const handleSelect = (env: AppEnvironment) => {
    if (env !== environment) {
      setEnvironment(env);
      if (onEnvironmentChange) onEnvironmentChange(env);
    }
  };

  if (variant === 'badge') {
    return (
      <div
        id="badge-environment-status"
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
          isLiveMode
            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
            : 'bg-amber-500/10 text-amber-400 border-amber-500/25'
        } ${className}`}
      >
        {isLiveMode ? (
          <>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Live Production</span>
          </>
        ) : (
          <>
            <FlaskConical className="w-3 h-3 text-amber-400" />
            <span>Demo Sandbox</span>
          </>
        )}
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div
        className={`p-4 rounded-xl border transition-all ${
          isDark ? 'bg-[#18181c] border-[#26262a]' : 'bg-slate-50 border-slate-200'
        } ${className}`}
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Environment Execution Mode
            </div>
            <div className={`text-[11px] mt-0.5 ${isDark ? 'text-[#a1a1aa]' : 'text-slate-500'}`}>
              Select whether to explore with simulated demo datasets or execute against live production APIs.
            </div>
          </div>
          <div
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
              isLiveMode
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
            }`}
          >
            {isLiveMode ? '● LIVE' : '🧪 DEMO'}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            id="btn-env-demo-card"
            onClick={() => handleSelect('demo')}
            className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
              isDemoMode
                ? isDark
                  ? 'bg-amber-500/15 border-amber-500/50 text-white shadow-xs'
                  : 'bg-amber-50 border-amber-300 text-amber-950 shadow-xs'
                : isDark
                ? 'bg-[#141416] border-[#222226] text-zinc-400 hover:border-zinc-700'
                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <FlaskConical className={`w-4 h-4 ${isDemoMode ? 'text-amber-400' : 'text-zinc-500'}`} />
              <span className="font-bold text-xs">Demo Sandbox</span>
            </div>
            <p className="text-[10px] opacity-80 leading-relaxed">
              Pre-loaded with @bajajfinance sample datasets, mock audits, and zero-token testing presets.
            </p>
          </button>

          <button
            type="button"
            id="btn-env-live-card"
            onClick={() => handleSelect('live')}
            className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
              isLiveMode
                ? isDark
                  ? 'bg-emerald-500/15 border-emerald-500/50 text-white shadow-xs'
                  : 'bg-emerald-50 border-emerald-300 text-emerald-950 shadow-xs'
                : isDark
                ? 'bg-[#141416] border-[#222226] text-zinc-400 hover:border-zinc-700'
                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <Radio className={`w-4 h-4 ${isLiveMode ? 'text-emerald-400' : 'text-zinc-500'}`} />
              <span className="font-bold text-xs">Live Production</span>
            </div>
            <p className="text-[10px] opacity-80 leading-relaxed">
              Requires real Meta Graph API tokens (v20.0). Isolates demo fixtures to show real connected assets only.
            </p>
          </button>
        </div>
      </div>
    );
  }

  // Default 'pill' variant for Top Navigation Bar
  return (
    <div
      id="environment-toggle-pill"
      className={`inline-flex items-center p-0.5 rounded-xl border transition-all ${
        isDark
          ? 'bg-[#181820] border-[#2c2c3a]'
          : 'bg-slate-100 border-slate-300 shadow-2xs'
      } ${className}`}
    >
      <button
        type="button"
        id="btn-toggle-demo-mode"
        onClick={() => handleSelect('demo')}
        title="Switch to Demo Sandbox Mode"
        aria-label="Demo Sandbox Mode"
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
          isDemoMode
            ? isDark
              ? 'bg-[#2a241b] text-amber-300 shadow-xs border border-amber-600/40 font-bold'
              : 'bg-white text-amber-700 shadow-xs border border-amber-300 font-bold'
            : 'text-zinc-400 hover:text-zinc-200'
        }`}
      >
        <FlaskConical className={`w-3.5 h-3.5 ${isDemoMode ? 'text-amber-400' : 'text-zinc-500'}`} />
        <span className="hidden md:inline">Demo Sandbox</span>
        <span className="md:hidden">Demo</span>
      </button>

      <button
        type="button"
        id="btn-toggle-live-mode"
        onClick={() => handleSelect('live')}
        title="Switch to Live Production Mode"
        aria-label="Live Production Mode"
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
          isLiveMode
            ? isDark
              ? 'bg-[#15281e] text-emerald-300 shadow-xs border border-emerald-600/40 font-bold'
              : 'bg-white text-emerald-700 shadow-xs border border-emerald-300 font-bold'
            : 'text-zinc-400 hover:text-zinc-200'
        }`}
      >
        <span
          className={`w-2 h-2 rounded-full ${
            isLiveMode ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'
          }`}
        />
        <span className="hidden md:inline">Live Production</span>
        <span className="md:hidden">Live</span>
      </button>
    </div>
  );
};
