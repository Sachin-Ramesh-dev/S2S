import React, { useState, useRef, useEffect } from 'react';
import { Instagram, ChevronDown, Check, Plus } from 'lucide-react';
import { InstagramAccount } from '../types/instagram';
import { DomainId, SubViewId, S2S_DOMAINS } from '../types/navigation';
import { EnvironmentToggle } from './EnvironmentToggle';
import { ThemeToggle } from './ThemeToggle';
import { useTheme } from '../context/ThemeContext';

interface S2STopHeaderProps {
  activeDomain: DomainId;
  activeSubView: SubViewId;
  accounts: InstagramAccount[];
  selectedAccount: InstagramAccount | null;
  onSelectAccount: (acc: InstagramAccount) => void;
  onOpenConnectModal: () => void;
}

export const S2STopHeader: React.FC<S2STopHeaderProps> = ({
  activeDomain,
  activeSubView,
  accounts,
  selectedAccount,
  onSelectAccount,
  onOpenConnectModal
}) => {
  const { isDark } = useTheme();
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsAccountDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentDomainConfig = S2S_DOMAINS.find(d => d.id === activeDomain);
  const currentSubItem = currentDomainConfig?.subItems?.find(s => s.id === activeSubView);

  return (
    <header
      id="s2s-top-header"
      className={`h-14 px-6 border-b flex items-center justify-between shrink-0 select-none z-20 transition-colors ${
        isDark ? 'bg-[#18181B] border-[#27272A]' : 'bg-white border-neutral-200'
      }`}
    >
      {/* Left: Domain Breadcrumb */}
      <div className="flex items-center gap-2">
        <span className="text-sm">{activeDomain === 'home' ? '🏠' : (currentDomainConfig?.icon || '⚡')}</span>
        <span className={`text-xs font-bold uppercase tracking-wider font-heading ${isDark ? 'text-zinc-200' : 'text-neutral-800'}`}>
          {activeDomain === 'home' ? 'Home / Action Center' : (currentDomainConfig?.label || activeDomain)}
        </span>
        {currentSubItem && (
          <>
            <span className="text-neutral-400 dark:text-zinc-600 text-xs">/</span>
            <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-zinc-800 text-neutral-700 dark:text-zinc-300 border border-neutral-200 dark:border-zinc-700">
              {currentSubItem.label}
            </span>
          </>
        )}
      </div>

      {/* Center: Clean negative space */}
      <div className="flex-1" />

      {/* Right: Environment, Theme & Account Switcher */}
      <div className="flex items-center gap-2 shrink-0">
        <EnvironmentToggle variant="pill" />
        <ThemeToggle variant="pill" />

        {/* Account Switcher Dropdown */}
        <div className="relative shrink-0" ref={dropdownRef}>
          <button
            id="btn-instagram-page-switcher"
            type="button"
            onClick={() => setIsAccountDropdownOpen(!isAccountDropdownOpen)}
            className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-xs active:scale-[0.98] ${
              isDark
                ? 'bg-[#202025] hover:bg-[#27272F] border-zinc-800 text-zinc-200'
                : 'bg-white hover:bg-neutral-50 border-neutral-200 text-neutral-800'
            }`}
          >
            {selectedAccount ? (
              <>
                <div className="w-5 h-5 rounded-md border border-neutral-200 dark:border-zinc-700 bg-amber-400/20 text-amber-600 dark:text-amber-300 flex items-center justify-center text-[10px] font-black uppercase shrink-0">
                  {selectedAccount.username.charAt(0)}
                </div>
                <span className="font-semibold truncate max-w-[110px]">@{selectedAccount.username}</span>
              </>
            ) : (
              <span className="text-zinc-400 font-medium">No Account</span>
            )}
            <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${isAccountDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {isAccountDropdownOpen && (
            <div
              className={`absolute right-0 mt-2 w-72 border rounded-xl shadow-lg p-2 z-50 text-xs animate-in fade-in slide-in-from-top-1 ${
                isDark ? 'bg-[#1E1E24] border-zinc-800' : 'bg-white border-neutral-200'
              }`}
            >
              <div className="px-3 py-2 border-b border-neutral-200 dark:border-zinc-800 text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-zinc-400 flex items-center justify-between font-heading">
                <span>Connected Accounts</span>
                <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded font-medium text-[10px]">{accounts.length} Active</span>
              </div>

              <div className="py-1.5 space-y-1 max-h-56 overflow-y-auto">
                {accounts.map((acc) => {
                  const isCurrent = acc.id === selectedAccount?.id;
                  return (
                    <button
                      key={acc.id}
                      id={`account-opt-${acc.id}`}
                      type="button"
                      onClick={() => {
                        onSelectAccount(acc);
                        setIsAccountDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors cursor-pointer border ${
                        isCurrent
                          ? isDark
                            ? 'bg-zinc-800 text-zinc-100 border-zinc-700'
                            : 'bg-neutral-100 text-neutral-900 border-neutral-300'
                          : isDark
                          ? 'hover:bg-zinc-800/50 text-zinc-300 border-transparent'
                          : 'hover:bg-neutral-50 text-neutral-700 border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <div className="w-6 h-6 rounded-md border border-[#171717] bg-[#B9A7FF] flex items-center justify-center text-[10px] font-black uppercase text-[#111111] shrink-0">
                          {acc.username.charAt(0)}
                        </div>
                        <div className="truncate">
                          <div className="font-bold truncate">@{acc.username}</div>
                          <div className="text-[10px] text-zinc-400 truncate">{acc.displayName}</div>
                        </div>
                      </div>
                      {isCurrent && <Check className="w-4 h-4 text-[#111111] dark:text-[#45D9A6] shrink-0 font-black" />}
                    </button>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-[#171717]/20 dark:border-[#383844]">
                <button
                  type="button"
                  id="btn-dropdown-connect-page"
                  onClick={() => {
                    setIsAccountDropdownOpen(false);
                    onOpenConnectModal();
                  }}
                  className="w-full py-2 px-3 bg-[#45D9A6] hover:bg-[#34c391] text-[#111111] rounded-lg text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-[#171717] shadow-[1.5px_1.5px_0_#111111] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none font-heading"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Connect Instagram Page</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
