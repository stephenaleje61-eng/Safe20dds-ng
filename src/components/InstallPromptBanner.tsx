import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, X, Sparkles } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

export const InstallPromptBanner: React.FC = () => {
  const { isInstalled } = usePWAInstall();
  const [dismissed, setDismissed] = useState(() => {
    return localStorage.getItem('sureodd_pwa_banner_dismissed') === 'true';
  });

  if (isInstalled || dismissed) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('sureodd_pwa_banner_dismissed', 'true');
  };

  return (
    <div className="relative w-full bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 border-b border-emerald-700/40 px-4 py-2 text-slate-200 text-xs shadow-md">
      <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 text-center sm:text-left">
          <img
            src="/icon.svg"
            alt="Sure Odd Logo"
            className="w-6 h-6 rounded-lg object-contain shrink-0 ring-1 ring-emerald-500/40"
          />
          <div className="flex flex-wrap items-center gap-1.5 justify-center sm:justify-start">
            <span className="font-bold text-white flex items-center gap-1">
              <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
              Install Sure Odd as an Android PWA App
            </span>
            <span className="text-slate-400 text-[11px]">
              — Instant home screen access &amp; offline score caching.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <PWAInstallButton compact />
          <button
            onClick={handleDismiss}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="Dismiss banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
