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
  const currentSubItem = currentDomainConfig?.subItems.find(s => s.id === activeSubView);

  return (
    <header
      id="s2s-top-header"
      className={`h-14 px-6 border-b flex items-center justify-between shrink-0 select-none z-20 transition-colors ${
        isDark ? 'bg-[#121218] border-[#22222c]' : 'bg-white border-slate-200'
      }`}
    >
      {/* Left: Domain Breadcrumb */}
      <div className="flex items-center gap-2">
        <span className="text-base">{activeDomain === 'home' ? '🏠' : (currentDomainConfig?.icon || '⚡')}</span>
        <span className={`text-xs font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
          {activeDomain === 'home' ? 'Home Hub' : currentDomainConfig?.label}
        </span>
        {currentSubItem && (
          <>
            <span className="text-zinc-500 text-xs">/</span>
            <span className="text-xs font-semibold text-orange-500">
              {currentSubItem.label}
            </span>
          </>
        )}
      </div>

      {/* Right: Environment, Theme & Account Switcher */}
      <div className="flex items-center gap-2.5 shrink-0">
        <EnvironmentToggle variant="pill" />
        <ThemeToggle variant="pill" />

        {/* Account Switcher Dropdown */}
        <div className="relative shrink-0" ref={dropdownRef}>
          <button
            id="btn-instagram-page-switcher"
            type="button"
            onClick={() => setIsAccountDropdownOpen(!isAccountDropdownOpen)}
            className={`flex items-center gap-2 px-3 py-1.5 border rounded-xl text-xs transition-all cursor-pointer shadow-xs ${
              isDark
                ? 'bg-[#1a1a24] hover:bg-[#222230] border-[#303042] text-white'
                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
            }`}
          >
            {selectedAccount ? (
              <>
                <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 p-0.5 shrink-0">
                  <div className={`w-full h-full rounded-full flex items-center justify-center text-[9px] font-bold uppercase ${
                    isDark ? 'bg-[#11121c] text-white' : 'bg-white text-slate-900'
                  }`}>
                    {selectedAccount.username.charAt(0)}
                  </div>
                </div>
                <span className="font-bold truncate max-w-[110px]">@{selectedAccount.username}</span>
              </>
            ) : (
              <span className="text-zinc-400">No Account</span>
            )}
            <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${isAccountDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {isAccountDropdownOpen && (
            <div
              className={`absolute right-0 mt-2 w-72 border rounded-2xl shadow-2xl p-2 z-50 text-xs animate-in fade-in slide-in-from-top-2 ${
                isDark ? 'bg-[#181824] border-[#303044]' : 'bg-white border-slate-200'
              }`}
            >
              <div className="px-3 py-2 border-b border-zinc-800 text-[11px] font-bold text-zinc-400 flex items-center justify-between">
                <span>CONNECTED ACCOUNTS</span>
                <span className="font-mono">{accounts.length} Active</span>
              </div>

              <div className="py-1.5 space-y-1 max-h-56 overflow-y-auto">
                {accounts.map((acc) => {
                  const isCurrent = acc.id === selectedAccount?.id;
                  return (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => {
                        onSelectAccount(acc);
                        setIsAccountDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors cursor-pointer ${
                        isCurrent
                          ? isDark
                            ? 'bg-[#252536] text-white border border-[#3e3e56]'
                            : 'bg-orange-50 text-slate-900 border border-orange-200'
                          : isDark
                          ? 'hover:bg-[#1f1f2c] text-zinc-300'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 p-0.5 shrink-0">
                          <div className={`w-full h-full rounded-full flex items-center justify-center text-[9px] font-bold uppercase ${
                            isDark ? 'bg-[#121218] text-white' : 'bg-white text-slate-900'
                          }`}>
                            {acc.username.charAt(0)}
                          </div>
                        </div>
                        <div className="truncate">
                          <div className="font-bold truncate">@{acc.username}</div>
                          <div className="text-[10px] text-zinc-400 truncate">{acc.displayName}</div>
                        </div>
                      </div>
                      {isCurrent && <Check className="w-4 h-4 text-orange-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  id="btn-dropdown-connect-page"
                  onClick={() => {
                    setIsAccountDropdownOpen(false);
                    onOpenConnectModal();
                  }}
                  className="w-full py-2 px-3 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
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
