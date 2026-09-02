import React from 'react';
import { AlertOctagon, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function SeverityBadge({ status, size = 'md' }) {
  const isLg = size === 'lg';
  const isSm = size === 'sm';

  const pad = isLg ? 'px-3.5 py-1.5 text-sm' : isSm ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';
  const iconSize = isLg ? 'w-4 h-4' : isSm ? 'w-3 h-3' : 'w-3.5 h-3.5';

  switch (status?.toUpperCase()) {
    case 'CRITICAL':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-bold uppercase tracking-wider rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30 shadow-sm shadow-rose-950 ${pad}`}
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
          </span>
          <AlertOctagon className={iconSize} />
          CRITICAL
        </span>
      );
    case 'WARNING':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-bold uppercase tracking-wider rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-sm shadow-amber-950 ${pad}`}
        >
          <AlertTriangle className={iconSize} />
          WARNING
        </span>
      );
    case 'NORMAL':
    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-bold uppercase tracking-wider rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm shadow-emerald-950 ${pad}`}
        >
          <CheckCircle2 className={iconSize} />
          NORMAL
        </span>
      );
  }
}
