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
      className={`h-14 px-6 border-b-2 flex items-center justify-between shrink-0 select-none z-20 transition-colors ${
        isDark ? 'bg-[#131316] border-[#383844]' : 'bg-[#F8F5EE] border-[#171717]'
      }`}
    >
      {/* Left: Domain Breadcrumb */}
      <div className="flex items-center gap-2.5">
        <span className="text-base">{activeDomain === 'home' ? '🏠' : (currentDomainConfig?.icon || '⚡')}</span>
        <span className={`text-xs font-black uppercase tracking-tight font-heading ${isDark ? 'text-[#F5F3EC]' : 'text-[#111111]'}`}>
          {activeDomain === 'home' ? 'HOME / ACTION CENTER' : (currentDomainConfig?.label?.toUpperCase() || activeDomain.toUpperCase())}
        </span>
        {currentSubItem && (
          <>
            <span className="text-[#171717] dark:text-[#9CA3AF] text-xs font-black">/</span>
            <span className="text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#FFD66B] text-[#111111] border border-[#171717] shadow-[1.5px_1.5px_0_#111111]">
              {currentSubItem.label}
            </span>
          </>
        )}
      </div>

      {/* Center: S2S Brand Motif (visible on md+) */}
      <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full border-2 border-[#171717] dark:border-[#383844] bg-white dark:bg-[#1E1E24] shadow-[2px_2px_0_#111111] dark:shadow-[2px_2px_0_#0A0A0D] text-[10px] font-black uppercase tracking-wider font-heading">
        <span className="px-1.5 py-0.5 rounded bg-[#FF4D5A]/15 text-[#C91A25] dark:text-[#FF7D87] font-black">SCROLL</span>
        <span className="text-[#6B7280] dark:text-zinc-500 font-bold">→</span>
        <span className="px-1.5 py-0.5 rounded bg-[#FFD66B]/30 text-[#8F5F00] dark:text-[#FFDF85] font-black">THINK</span>
        <span className="text-[#6B7280] dark:text-zinc-500 font-bold">→</span>
        <span className="px-1.5 py-0.5 rounded bg-[#B9A7FF]/25 text-[#522EB5] dark:text-[#CBBFFF] font-black">CREATE</span>
        <span className="text-[#6B7280] dark:text-zinc-500 font-bold">→</span>
        <span className="px-1.5 py-0.5 rounded bg-[#45D9A6]/25 text-[#0A6C48] dark:text-[#6EE7B7] font-black">PUBLISH</span>
        <span className="text-[#6B7280] dark:text-zinc-500 font-bold">→</span>
        <span className="px-1.5 py-0.5 rounded bg-[#7CC7FF]/25 text-[#0D5B9E] dark:text-[#93D5FF] font-black">LEARN</span>
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
            className={`flex items-center gap-2 px-3 py-1.5 border-2 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-[2.5px_2.5px_0_#111111] dark:shadow-[2.5px_2.5px_0_#0A0A0D] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none ${
              isDark
                ? 'bg-[#1E1E24] hover:bg-[#25252E] border-[#383844] text-[#F5F3EC]'
                : 'bg-white hover:bg-[#FBF9F4] border-[#171717] text-[#111111]'
            }`}
          >
            {selectedAccount ? (
              <>
                <div className="w-5 h-5 rounded-md border border-[#171717] bg-[#FFD66B] flex items-center justify-center text-[10px] font-black uppercase text-[#111111] shrink-0">
                  {selectedAccount.username.charAt(0)}
                </div>
                <span className="font-bold truncate max-w-[110px]">@{selectedAccount.username}</span>
              </>
            ) : (
              <span className="text-zinc-400 font-medium">No Account</span>
            )}
            <ChevronDown className={`w-3.5 h-3.5 text-zinc-500 transition-transform ${isAccountDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {isAccountDropdownOpen && (
            <div
              className={`absolute right-0 mt-2 w-72 border-2 rounded-xl shadow-[5px_5px_0_#111111] dark:shadow-[5px_5px_0_#0A0A0D] p-2 z-50 text-xs animate-in fade-in slide-in-from-top-2 ${
                isDark ? 'bg-[#1E1E24] border-[#383844]' : 'bg-white border-[#171717]'
              }`}
            >
              <div className="px-3 py-2 border-b-2 border-[#171717] dark:border-[#383844] text-[11px] font-black uppercase tracking-wider text-zinc-400 flex items-center justify-between font-heading">
                <span>CONNECTED ACCOUNTS</span>
                <span className="px-1.5 py-0.5 bg-[#45D9A6] text-[#111111] rounded font-bold">{accounts.length} Active</span>
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
                      className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors cursor-pointer border-2 ${
                        isCurrent
                          ? isDark
                            ? 'bg-[#2B2B36] text-[#F5F3EC] border-[#B9A7FF]'
                            : 'bg-[#FFD66B]/20 text-[#111111] border-[#171717]'
                          : isDark
                          ? 'hover:bg-[#25252E] text-zinc-300 border-transparent'
                          : 'hover:bg-[#F8F5EE] text-[#111111] border-transparent'
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

              <div className="pt-2 border-t-2 border-[#171717] dark:border-[#383844]">
                <button
                  type="button"
                  id="btn-dropdown-connect-page"
                  onClick={() => {
                    setIsAccountDropdownOpen(false);
                    onOpenConnectModal();
                  }}
                  className="w-full py-2 px-3 bg-[#45D9A6] hover:bg-[#34c391] text-[#111111] rounded-lg text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer border-2 border-[#171717] shadow-[2.5px_2.5px_0_#111111] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none font-heading"
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
