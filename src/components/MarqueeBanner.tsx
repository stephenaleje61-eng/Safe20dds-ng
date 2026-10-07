import React from 'react';
import { ShieldCheck, Flame, Radio } from 'lucide-react';

export const MarqueeBanner: React.FC = () => {
  const textItem = 'SURE ODD — SPORTS PREDICTIONS & LIVE SCORES';

  return (
    <div className="relative w-full overflow-hidden bg-gradient-to-r from-emerald-950 via-emerald-900 to-red-950 border-b border-emerald-600/30 text-white text-xs font-bold tracking-widest uppercase select-none py-1.5 z-40">
      <div className="animate-marquee flex items-center whitespace-nowrap">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center gap-6 mx-4">
            <span className="flex items-center gap-2 text-emerald-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              {textItem}
            </span>
            <span className="text-red-400 font-black">★</span>
            <span className="flex items-center gap-1.5 text-white/90 font-medium tracking-normal text-[11px]">
              <Radio className="w-3 h-3 text-red-500 animate-pulse shrink-0" />
              100% Free-to-Play Analytics · Zero Gambling Risk
            </span>
            <span className="text-emerald-400 font-black">★</span>
            <span className="flex items-center gap-1.5 text-amber-300 font-semibold tracking-normal text-[11px]">
              <Flame className="w-3 h-3 text-amber-400 shrink-0" />
              Verified Tactical Models &amp; Daily Statistics
            </span>
            <span className="text-white/40">/</span>
          </div>
        ))}
      </div>
    </div>
  );
};
