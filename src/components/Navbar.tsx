import React from 'react';
import {
  Activity,
  Bell,
  Calendar,
  Settings,
  Info,
  Radio,
  Sun,
  Moon,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';

interface NavbarProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
  unreadAlertCount: number;
  tinyFishConnected: boolean;
  isSampleMode: boolean;
  onExitSampleMode: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRoute,
  onNavigate,
  unreadAlertCount,
  tinyFishConnected,
  isSampleMode,
  onExitSampleMode,
  darkMode,
  onToggleDarkMode,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity },
    { id: 'alerts', label: 'Alerts', icon: Bell, badge: unreadAlertCount },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'about', label: 'About', icon: Info },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-[#FFFFFF]/85 dark:bg-[#131B3A]/85 border-b border-[#E7E2D8] dark:border-[#24305E] transition-colors duration-200">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            <div className="relative w-9 h-9 flex items-center justify-center rounded-xl bg-gradient-to-br from-[#0E9AA7] to-[#0B7F8A] text-white shadow-sm shadow-[#0E9AA7]/25 group-hover:scale-105 transition-transform duration-200">
              {/* Radar ring effect */}
              <div className="absolute inset-0 rounded-xl border border-white/30 animate-pulse-subtle" />
              <div className="absolute inset-[-4px] rounded-2xl border border-[#0E9AA7]/30 animate-slow-spin pointer-events-none" />
              <Radio className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-display text-xl font-bold tracking-tight text-[#1E2A5A] dark:text-[#F1F5F9]">
                  Watchdog
                </span>
                <span className="text-[10px] uppercase font-mono font-semibold tracking-wider px-1.5 py-0.5 rounded bg-[#CFEDEF] dark:bg-[#0E9AA7]/20 text-[#0E9AA7] dark:text-[#76E4EC]">
                  v2
                </span>
              </div>
              <p className="text-[11px] text-[#94A3B8] font-sans -mt-0.5 hidden sm:block">
                One tracker for anything on the web
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                currentRoute === item.id ||
                (item.id === 'dashboard' && currentRoute.startsWith('watch'));
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`relative flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-[#FAF8F4] dark:bg-[#1E2A5A] text-[#0E9AA7] dark:text-[#76E4EC] shadow-xs'
                      : 'text-[#475569] dark:text-[#94A3B8] hover:text-[#1E2A5A] dark:hover:text-[#F1F5F9] hover:bg-[#FAF8F4]/80 dark:hover:bg-[#1E2A5A]/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  {item.badge && item.badge > 0 ? (
                    <span className="ml-1 px-1.5 py-0.2 rounded-full text-[11px] font-mono font-bold bg-[#E8734A] text-white">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>

          {/* Right Action Pill & Mode Badges */}
          <div className="flex items-center gap-2.5">
            {isSampleMode && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FBE3D6] dark:bg-[#E8734A]/20 border border-[#E8734A]/40 text-[#E8734A] text-xs font-mono font-semibold">
                <span className="w-2 h-2 rounded-full bg-[#E8734A] animate-ping" />
                <span>SAMPLE</span>
                <button
                  onClick={onExitSampleMode}
                  className="ml-1 underline hover:text-[#C0392B] font-sans text-[11px]"
                  title="Switch back to live tracker data"
                >
                  Exit
                </button>
              </div>
            )}

            {/* Status Pill: Green if connected, Amber if key needed */}
            <button
              onClick={() => onNavigate('settings')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors shadow-xs ${
                tinyFishConnected
                  ? 'bg-[#E0EFE8] dark:bg-[#1B8A5A]/20 border-[#1B8A5A]/30 text-[#1B8A5A] dark:text-[#4ADE80]'
                  : 'bg-[#FEF3C7] dark:bg-[#C77700]/20 border-[#C77700]/40 text-[#92400E] dark:text-[#FBBF24]'
              }`}
              title={
                tinyFishConnected
                  ? 'TinyFish Web Agent API connected'
                  : 'TinyFish API key missing. Click to add in Settings'
              }
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  tinyFishConnected
                    ? 'bg-[#1B8A5A] dark:bg-[#4ADE80] animate-pulse'
                    : 'bg-[#C77700] dark:bg-[#FBBF24]'
                }`}
              />
              <span className="hidden sm:inline">
                {tinyFishConnected ? 'Live · TinyFish connected' : 'Add your TinyFish key'}
              </span>
              <span className="sm:hidden">
                {tinyFishConnected ? 'Connected' : 'Add Key'}
              </span>
            </button>

            {/* Dark mode toggle */}
            <button
              onClick={onToggleDarkMode}
              className="p-2 rounded-lg text-[#475569] dark:text-[#94A3B8] hover:bg-[#FAF8F4] dark:hover:bg-[#1E2A5A] transition-colors"
              aria-label="Toggle visual mode"
              title={darkMode ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            >
              {darkMode ? <Sun className="w-4 h-4 text-[#FBBF24]" /> : <Moon className="w-4 h-4 text-[#1E2A5A]" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Tab Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FFFFFF]/95 dark:bg-[#131B3A]/95 backdrop-blur-md border-t border-[#E7E2D8] dark:border-[#24305E] px-2 py-1.5 flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            currentRoute === item.id ||
            (item.id === 'dashboard' && currentRoute.startsWith('watch'));
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg text-[10px] font-medium relative transition-colors ${
                isActive
                  ? 'text-[#0E9AA7] dark:text-[#76E4EC]'
                  : 'text-[#94A3B8] hover:text-[#475569]'
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span>{item.label}</span>
              {item.badge && item.badge > 0 ? (
                <span className="absolute top-0 right-2 w-4 h-4 rounded-full bg-[#E8734A] text-white text-[9px] font-mono font-bold flex items-center justify-center">
                  {item.badge > 9 ? '9+' : item.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>
    </>
  );
};
