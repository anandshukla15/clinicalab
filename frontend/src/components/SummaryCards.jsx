import React from 'react';
import { AlertOctagon, AlertTriangle, CheckCircle2, Layers } from 'lucide-react';

export default function SummaryCards({ summary, activeFilter, onSelectFilter }) {
  const { critical = 0, warning = 0, normal = 0, total = 0 } = summary || {};

  const cards = [
    {
      id: 'ALL',
      title: 'Total Tests',
      count: total,
      icon: Layers,
      color: 'cyan',
      border: 'border-cyan-500/30',
      bg: 'bg-slate-900/80 hover:bg-slate-800/80',
      text: 'text-cyan-400',
      badge: 'All results',
    },
    {
      id: 'CRITICAL',
      title: 'Critical Attention',
      count: critical,
      icon: AlertOctagon,
      color: 'rose',
      border: 'border-rose-500/30',
      bg: 'bg-rose-950/20 hover:bg-rose-950/30',
      text: 'text-rose-400',
      badge: 'Immediate review',
      glow: critical > 0 ? 'ring-1 ring-rose-500/50 glow-red' : '',
    },
    {
      id: 'WARNING',
      title: 'Warning / Borderline',
      count: warning,
      icon: AlertTriangle,
      color: 'amber',
      border: 'border-amber-500/30',
      bg: 'bg-amber-950/20 hover:bg-amber-950/30',
      text: 'text-amber-400',
      badge: 'Out-of-range',
      glow: warning > 0 ? 'ring-1 ring-amber-500/50 glow-amber' : '',
    },
    {
      id: 'NORMAL',
      title: 'Normal Reference',
      count: normal,
      icon: CheckCircle2,
      color: 'emerald',
      border: 'border-emerald-500/30',
      bg: 'bg-emerald-950/20 hover:bg-emerald-950/30',
      text: 'text-emerald-400',
      badge: 'In physiological range',
      glow: normal > 0 ? 'glow-emerald' : '',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 my-6">
      {cards.map((c) => {
        const Icon = c.icon;
        const isSelected = activeFilter === c.id;

        return (
          <button
            key={c.id}
            type="button"
            onClick={() => onSelectFilter && onSelectFilter(c.id)}
            className={`text-left p-4 rounded-2xl border transition-all duration-200 cursor-pointer ${
              c.bg
            } ${c.border} ${c.glow || ''} ${
              isSelected
                ? 'ring-2 ring-cyan-400 shadow-lg scale-[1.02]'
                : 'opacity-90 hover:opacity-100 hover:scale-[1.01]'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-400">{c.title}</span>
              <Icon className={`w-4 h-4 ${c.text}`} />
            </div>
            <div className="flex items-baseline justify-between">
              <span className={`text-3xl font-extrabold tracking-tight ${c.text}`}>
                {c.count}
              </span>
              <span className="text-[10px] uppercase font-semibold text-slate-500">
                {c.badge}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
