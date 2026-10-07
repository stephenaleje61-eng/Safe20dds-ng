import React from 'react';
import { useAuth } from '../context/AuthContext';
import { PWAInstallButton } from './PWAInstallButton';
import {
  Sparkles,
  Radio,
  Crown,
  Users,
  MessageSquare,
  ShieldAlert,
  LogIn,
  LogOut,
  User as UserIcon,
} from 'lucide-react';

export type ActiveTab = 'predictions' | 'livescores' | 'vip' | 'community' | 'chat' | 'admin';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenAuth: () => void;
  onOpenProfile: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenAuth,
  onOpenProfile,
}) => {
  const { user, isAdmin, isVip, logout } = useAuth();

  const navItems = [
    { id: 'predictions', label: 'Predictions', icon: Sparkles },
    { id: 'livescores', label: 'Live Scores', icon: Radio, hasBadge: true },
    { id: 'vip', label: 'VIP Analysis', icon: Crown },
    { id: 'community', label: 'Community', icon: Users },
    { id: 'chat', label: 'Match Chat', icon: MessageSquare },
  ];

  if (isAdmin) {
    navItems.push({ id: 'admin', label: 'Admin Hub', icon: ShieldAlert });
  }

  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-800 bg-slate-950/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 h-16">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('predictions')}
            className="flex items-center gap-2.5 text-left group cursor-pointer focus:outline-hidden"
          >
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl overflow-hidden group-hover:scale-105 transition-transform">
              <img
                src="/icon.svg"
                alt="Sure Odd Official Logo"
                className="h-10 w-10 rounded-xl object-contain shadow-md"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-black tracking-tight text-white group-hover:text-emerald-400 transition-colors">
                  SURE ODD
                </span>
                <span className="rounded-md bg-emerald-950 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400 ring-1 ring-emerald-800/60">
                  PRO
                </span>
              </div>
              <p className="text-[10px] font-medium text-slate-400 leading-none">
                Sports Analytics &amp; Predictions
              </p>
            </div>
          </button>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as ActiveTab)}
                className={`relative flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                  isActive
                    ? 'bg-emerald-950/80 text-emerald-400 ring-1 ring-emerald-700/50 shadow-inner'
                    : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {item.hasBadge && (
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                  </span>
                )}
                {item.id === 'admin' && (
                  <span className="rounded-sm bg-red-950 px-1 py-0.2 text-[9px] font-bold text-red-400 ring-1 ring-red-800">
                    ADMIN
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Action Cluster */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* PWA Install Button */}
          <PWAInstallButton />

          {/* User Account Controls */}
          {user ? (
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenProfile}
                className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/80 px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:border-slate-700 transition cursor-pointer"
                title="View your account"
              >
                <div className="h-6 w-6 rounded-lg bg-emerald-800/60 flex items-center justify-center text-[11px] font-bold text-emerald-300">
                  {user.username.slice(0, 2).toUpperCase()}
                </div>
                <span className="hidden sm:inline max-w-[100px] truncate">{user.username}</span>
                {isVip && (
                  <span className="rounded-full bg-amber-950 px-1.5 py-0.5 text-[9px] font-bold text-amber-300 border border-amber-800/70">
                    VIP
                  </span>
                )}
                {isAdmin && (
                  <span className="rounded-full bg-red-950 px-1.5 py-0.5 text-[9px] font-bold text-red-400 border border-red-800/70">
                    ADMIN
                  </span>
                )}
              </button>

              <button
                onClick={logout}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-850 hover:text-red-400 transition cursor-pointer"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-3.5 py-2 text-xs font-bold text-white shadow-md hover:from-red-500 hover:to-red-600 active:scale-95 transition cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar for Android/Mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-slate-800 bg-slate-950/95 backdrop-blur-lg px-2 py-1.5 flex items-center justify-around shadow-2xl safe-area-bottom">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as ActiveTab)}
              className={`flex flex-col items-center py-1 px-2 rounded-lg transition-all cursor-pointer ${
                isActive ? 'text-emerald-400 font-bold' : 'text-slate-400 font-medium'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-400 scale-110' : 'text-slate-400'}`} />
                {item.hasBadge && (
                  <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-500 ring-1 ring-slate-950" />
                )}
              </div>
              <span className="text-[10px] mt-0.5 leading-none">{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
