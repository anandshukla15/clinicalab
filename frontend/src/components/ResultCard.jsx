import React, { useState } from 'react';
import { 
  AlertCircle, 
  HelpCircle, 
  Sparkles, 
  ArrowUpRight, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  Activity,
  Compass,
  Database,
  ShieldAlert
} from 'lucide-react';
import SeverityBadge from './SeverityBadge';

export default function ResultCard({ item }) {
  const [expanded, setExpanded] = useState(true);

  const {
    test_name,
    value,
    unit,
    status,
    reference_range,
    why_flagged,
    explanation,
    possible_significance,
    suggested_next_steps = [],
    normal_min,
    normal_max,
    critical_min,
    critical_max,
    lookup_source = 'local',
  } = item;

  // Compute visual position in range if min and max exist
  const hasRangeNumbers = normal_min !== undefined && normal_max !== undefined;
  let gaugePercent = 50;
  if (hasRangeNumbers) {
    const minBound = critical_min !== undefined ? critical_min : normal_min * 0.7;
    const maxBound = critical_max !== undefined ? critical_max : normal_max * 1.3;
    const rangeSpan = maxBound - minBound;
    if (rangeSpan > 0) {
      gaugePercent = Math.max(5, Math.min(95, ((value - minBound) / rangeSpan) * 100));
    }
  }

  const borderClass =
    status === 'CRITICAL'
      ? 'border-rose-500/40 bg-rose-950/10'
      : status === 'WARNING'
      ? 'border-amber-500/40 bg-amber-950/10'
      : 'border-emerald-500/30 bg-emerald-950/10';

  const cardGlow =
    status === 'CRITICAL'
      ? 'shadow-rose-950/30'
      : status === 'WARNING'
      ? 'shadow-amber-950/30'
      : 'shadow-emerald-950/20';

  return (
    <div
      className={`rounded-3xl border ${borderClass} p-5 backdrop-blur-xl shadow-xl ${cardGlow} transition-all duration-200`}
    >
      {/* Card Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white tracking-tight">{test_name}</h3>
              {lookup_source === 'mcp' && (
                <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-purple-500/15 text-purple-300 border border-purple-500/30">
                  <Database className="w-3 h-3" /> MCP Tool Lookup
                </span>
              )}
            </div>
            <span className="text-xs text-slate-400">
              Target Standard: <span className="text-slate-200 font-medium">{reference_range}</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-2xl font-black text-white font-mono tracking-tight">
              {value}
            </span>
            <span className="text-xs font-semibold text-slate-400 ml-1.5">{unit}</span>
          </div>

          <SeverityBadge status={status} size="md" />

          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            title={expanded ? 'Collapse' : 'Expand'}
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Visual Range Indicator Bar */}
      {hasRangeNumbers && (
        <div className="my-4 px-1">
          <div className="flex justify-between text-[11px] text-slate-400 font-mono mb-1">
            <span>Critical Low: {critical_min ?? '—'}</span>
            <span className="text-emerald-400 font-semibold">Normal: {normal_min} – {normal_max} {unit}</span>
            <span>Critical High: {critical_max ?? '—'}</span>
          </div>
          <div className="relative w-full h-3 bg-slate-800 rounded-full overflow-hidden p-0.5">
            {/* Zones */}
            <div className="absolute inset-0 flex">
              <div className="w-1/4 bg-rose-500/20 border-r border-rose-500/30" />
              <div className="w-1/2 bg-emerald-500/25 border-r border-emerald-500/30" />
              <div className="w-1/4 bg-rose-500/20" />
            </div>
            {/* Marker */}
            <div
              className={`absolute top-0 bottom-0 w-3 -ml-1.5 rounded-full shadow-md transition-all duration-500 ${
                status === 'CRITICAL'
                  ? 'bg-rose-400 ring-2 ring-rose-200'
                  : status === 'WARNING'
                  ? 'bg-amber-400 ring-2 ring-amber-200'
                  : 'bg-emerald-400 ring-2 ring-emerald-200'
              }`}
              style={{ left: `${gaugePercent}%` }}
              title={`Measured: ${value} ${unit}`}
            />
          </div>
        </div>
      )}

      {/* Card Body */}
      {expanded && (
        <div className="space-y-4 pt-1 text-sm">
          {/* Why flagged? (Deterministic Python classification explanation) */}
          <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              <ShieldAlert className="w-4 h-4 text-cyan-400" />
              <span>Why Was This Flagged?</span>
              <span className="text-[10px] lowercase font-normal px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400">
                deterministic reference evaluation
              </span>
            </div>
            <p className="text-slate-200 text-xs leading-relaxed font-medium">
              {why_flagged}
            </p>
          </div>

          {/* AI Clinical Interpretation (Gemini LLM) */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900/95 to-slate-900/60 border border-slate-800">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>AI Clinical Explanation</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">
                Google Gemini
              </span>
            </div>
            <p className="text-slate-300 text-xs leading-relaxed mb-3">
              {explanation}
            </p>

            {/* Possible Clinical Significance */}
            {possible_significance && (
              <div className="mt-2 pt-2.5 border-t border-slate-800/80">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                  Possible Clinical Significance
                </span>
                <p className="text-xs text-slate-300/90 leading-relaxed italic">
                  "{possible_significance}"
                </p>
              </div>
            )}
          </div>

          {/* Suggested Next Steps */}
          {suggested_next_steps && suggested_next_steps.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5 mb-2">
                <Compass className="w-3.5 h-3.5 text-blue-400" />
                Suggested Next Steps & Clinical Recommendations
              </span>
              <ul className="space-y-1.5">
                {suggested_next_steps.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-slate-300 leading-normal">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
