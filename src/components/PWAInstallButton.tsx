import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Share, PlusSquare, X } from 'lucide-react';

export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // Hide if already running in standalone PWA mode
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className={`flex items-center gap-2 rounded-lg bg-emerald-600 font-semibold text-white shadow-sm hover:bg-emerald-500 active:scale-95 transition-all cursor-pointer ${
          compact ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-1.5 text-xs sm:text-sm'
        }`}
        title="Install Sure Odd App on Android or Desktop"
      >
        <Download className="w-4 h-4 text-emerald-100 animate-bounce" />
        <span>Install App</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className={`flex items-center gap-1.5 rounded-lg border border-emerald-600/40 bg-emerald-950/40 font-medium text-emerald-300 hover:bg-emerald-900/50 transition cursor-pointer ${
            compact ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-xs sm:text-sm'
          }`}
          title="Install Sure Odd on iPhone / iPad"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Install iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
            <div className="w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl text-slate-100">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <img
                    src="/icon.svg"
                    alt="Sure Odd Logo"
                    className="w-7 h-7 rounded-lg object-contain shadow-sm"
                  />
                  <h3 className="text-base font-bold text-white">Install on iPhone / iPad</h3>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4 space-y-3 text-sm text-slate-300">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-xs font-semibold text-emerald-400 shrink-0">
                    1
                  </div>
                  <p>
                    Tap the <strong className="text-white inline-flex items-center gap-1">Share <Share className="w-3.5 h-3.5" /></strong> button in your Safari toolbar.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-xs font-semibold text-emerald-400 shrink-0">
                    2
                  </div>
                  <p>
                    Scroll down and tap <strong className="text-white inline-flex items-center gap-1">Add to Home Screen <PlusSquare className="w-3.5 h-3.5" /></strong>.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-xs font-semibold text-emerald-400 shrink-0">
                    3
                  </div>
                  <p>Confirm by tapping <strong className="text-white">Add</strong> in the top right corner.</p>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-6 w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 transition"
              >
                Got it
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Fallback for desktop browsers when prompt event hasn't fired yet
  return (
    <button
      onClick={() => {
        alert('To install Sure Odd: Tap your browser settings menu (⋮ or share icon) and select "Install app" or "Add to Home screen".');
      }}
      className={`flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 font-medium text-slate-200 hover:bg-slate-700/80 transition cursor-pointer ${
        compact ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-xs sm:text-sm'
      }`}
      title="Install App"
    >
      <Download className="w-3.5 h-3.5 text-emerald-400" />
      <span>Install App</span>
    </button>
  );
};
