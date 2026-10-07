import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <aside aria-label="Connectivity Status" className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl border border-amber-600/40 bg-amber-950/90 backdrop-blur-md px-3.5 py-2 text-xs font-semibold text-amber-200 shadow-xl">
      <span className="relative flex h-2.5 w-2.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
      </span>
      <WifiOff className="w-3.5 h-3.5 text-amber-300" />
      <span>Offline Mode — Cached sports data is being displayed.</span>
    </aside>
  );
};
