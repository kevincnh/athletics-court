import React from 'react';
import { CheckCircle2 } from 'lucide-react';

interface CourtProps {
  number: number;
  selected: boolean;
  onClick: () => void;
}

export function Court({ number, selected, onClick }: CourtProps) {
  return (
    <div
      onClick={onClick}
      className={`relative flex-1 min-h-[70px] sm:min-h-[125px] rounded-md border-[2px] sm:border-[6px] cursor-pointer transition-all duration-300 overflow-hidden group ${
        selected
          ? 'border-amber-400 shadow-[0_0_25px_rgba(251,191,36,0.6)] scale-[1.02] z-10'
          : 'border-white/90 hover:border-amber-200 hover:scale-[1.01]'
      }`}
    >
      {/* Outer court area (green) */}
      <div className="absolute inset-0 bg-[#3d7a5b] transition-colors duration-300 group-hover:bg-[#4a8f6e]"></div>

      {/* Inner court lines (blue with white borders) */}
      <div className="absolute top-[8%] bottom-[8%] left-[10%] right-[10%] border-[1px] sm:border-[3px] border-white/90 bg-[#34628f] transition-colors duration-300 group-hover:bg-[#3e74a8] flex flex-col">
        {/* Top half */}
        <div className="flex-1 flex flex-col">
          {/* Top service areas */}
          <div className="flex-1 flex flex-row">
            <div className="flex-1 border-r-[1px] sm:border-r-[3px] border-white/90"></div>
            <div className="flex-1"></div>
          </div>
          {/* Top kitchen (NVZ) */}
          <div className="h-[22%] border-t-[1px] sm:border-t-[3px] border-white/90 bg-white/5"></div>
        </div>

        {/* Net */}
        <div className="h-[2px] sm:h-[4px] bg-white/90 w-full relative z-10 shadow-sm">
          {/* Net posts */}
          <div className="absolute top-1/2 -translate-y-1/2 -left-1 sm:-left-2 w-1 sm:w-2 h-2 sm:h-4 bg-slate-300 rounded-sm shadow-sm"></div>
          <div className="absolute top-1/2 -translate-y-1/2 -right-1 sm:-right-2 w-1 sm:w-2 h-2 sm:h-4 bg-slate-300 rounded-sm shadow-sm"></div>
        </div>

        {/* Bottom half */}
        <div className="flex-1 flex flex-col">
          {/* Bottom kitchen (NVZ) */}
          <div className="h-[22%] border-b-[1px] sm:border-b-[3px] border-white/90 bg-white/5"></div>
          {/* Bottom service areas */}
          <div className="flex-1 flex flex-row">
            <div className="flex-1 border-r-[1px] sm:border-r-[3px] border-white/90"></div>
            <div className="flex-1"></div>
          </div>
        </div>
      </div>

      {/* Court Number Label */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className={`w-8 h-8 sm:w-16 sm:h-16 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 border-2 sm:border-4 ${
          selected ? 'bg-amber-400 border-amber-200 text-amber-950 scale-110 shadow-amber-500/50' : 'bg-white/95 border-white text-slate-800'
        }`}>
          <span className="font-black text-base sm:text-3xl tracking-tighter">{number}</span>
        </div>
      </div>

      {/* Selection Overlay Checkmark */}
      {selected && (
        <div className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-amber-400 text-amber-950 rounded-full shadow-lg p-0.5 sm:p-1 animate-in zoom-in duration-200">
          <CheckCircle2 size={20} strokeWidth={3} className="sm:w-6 sm:h-6" />
        </div>
      )}
    </div>
  );
}
