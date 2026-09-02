import React, { useState } from 'react';
import { Download, AlertOctagon, AlertTriangle, CheckCircle2, Filter, AlertCircle, FileDown } from 'lucide-react';
import ResultCard from './ResultCard';

export default function ResultsSection({ results, validationErrors = [], onClear }) {
  const [filter, setFilter] = useState('ALL');

  if (!results || results.length === 0) {
    if (validationErrors.length > 0) {
      return (
        <div className="my-6 p-6 rounded-3xl bg-rose-950/20 border border-rose-500/30 text-rose-300">
          <h3 className="font-bold text-sm flex items-center gap-2 mb-2 text-rose-200">
            <AlertCircle className="w-5 h-5 text-rose-400" />
            Validation Errors Detected
          </h3>
          <ul className="space-y-1 text-xs">
            {validationErrors.map((err, i) => (
              <li key={i}>
                Row {err.row_index || '—'}: {err.error}
              </li>
            ))}
          </ul>
        </div>
      );
    }
    return null;
  }

  // Filter items
  const filteredResults = results.filter((item) => {
    if (filter === 'ALL') return true;
    return item.status === filter;
  });

  const downloadJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(results, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'clinical_analysis_results.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="my-8 space-y-6">
      {/* Partial failure / Validation Errors Banner */}
      {validationErrors && validationErrors.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs">
          <div className="flex items-center gap-2 font-bold mb-1.5 text-amber-300">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>Notice: {validationErrors.length} row(s) could not be processed</span>
          </div>
          <ul className="list-disc list-inside space-y-1 opacity-90">
            {validationErrors.map((err, i) => (
              <li key={i}>
                {err.row_index ? `Row ${err.row_index}: ` : ''}
                {err.error}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 mr-2">
            <Filter className="w-3.5 h-3.5 text-cyan-400" /> Filter:
          </span>
          <button
            type="button"
            onClick={() => setFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filter === 'ALL'
                ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/20'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            All Results ({results.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('CRITICAL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filter === 'CRITICAL'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                : 'bg-slate-800 text-rose-300 hover:bg-slate-700'
            }`}
          >
            🚨 Critical ({results.filter((r) => r.status === 'CRITICAL').length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('WARNING')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filter === 'WARNING'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                : 'bg-slate-800 text-amber-300 hover:bg-slate-700'
            }`}
          >
            ⚠️ Warning ({results.filter((r) => r.status === 'WARNING').length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('NORMAL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filter === 'NORMAL'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'bg-slate-800 text-emerald-300 hover:bg-slate-700'
            }`}
          >
            ✅ Normal ({results.filter((r) => r.status === 'NORMAL').length})
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={downloadJson}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            <FileDown className="w-3.5 h-3.5 text-cyan-400" />
            Export JSON
          </button>
          {onClear && (
            <button
              type="button"
              onClick={onClear}
              className="px-3 py-1.5 text-xs font-medium rounded-xl bg-slate-800/80 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 transition-colors"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Results List */}
      <div className="space-y-4">
        {filteredResults.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/40 rounded-3xl border border-slate-800 text-slate-400 text-sm">
            No lab results found matching the <strong>{filter}</strong> filter.
          </div>
        ) : (
          filteredResults.map((item, idx) => (
            <ResultCard key={`${item.test_name}-${idx}`} item={item} />
          ))
        )}
      </div>
    </div>
  );
}
