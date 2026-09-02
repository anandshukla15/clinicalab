import React from 'react';
import { Plus, Trash2, ArrowRight, Sparkles, RefreshCw, Zap } from 'lucide-react';

const COMMON_PRESETS = {
  normal: [
    { test_name: 'Hemoglobin', value: '14.5', unit: 'g/dL' },
    { test_name: 'Glucose', value: '88', unit: 'mg/dL' },
    { test_name: 'Potassium', value: '4.2', unit: 'mmol/L' },
    { test_name: 'Platelets', value: '260000', unit: 'cells/uL' },
  ],
  warning: [
    { test_name: 'Hemoglobin', value: '11.2', unit: 'g/dL' },
    { test_name: 'Glucose', value: '126', unit: 'mg/dL' },
    { test_name: 'Potassium', value: '5.3', unit: 'mmol/L' },
    { test_name: 'Creatinine', value: '1.6', unit: 'mg/dL' },
  ],
  critical: [
    { test_name: 'Potassium', value: '6.8', unit: 'mmol/L' },
    { test_name: 'Hemoglobin', value: '6.1', unit: 'g/dL' },
    { test_name: 'Platelets', value: '32000', unit: 'cells/uL' },
    { test_name: 'Glucose', value: '420', unit: 'mg/dL' },
  ],
};

const SUGGESTED_TESTS = [
  { name: 'Hemoglobin', unit: 'g/dL' },
  { name: 'Glucose', unit: 'mg/dL' },
  { name: 'Potassium', unit: 'mmol/L' },
  { name: 'Platelets', unit: 'cells/uL' },
  { name: 'Sodium', unit: 'mmol/L' },
  { name: 'Creatinine', unit: 'mg/dL' },
  { name: 'WBC', unit: 'cells/uL' },
  { name: 'Calcium', unit: 'mg/dL' },
  { name: 'BUN', unit: 'mg/dL' },
  { name: 'ALT', unit: 'U/L' },
  { name: 'AST', unit: 'U/L' },
  { name: 'Bilirubin', unit: 'mg/dL' },
  { name: 'Cholesterol', unit: 'mg/dL' },
  { name: 'TSH', unit: 'uIU/mL' },
];

export default function LabInputForm({ rows, setRows, onAnalyze, loading }) {
  const handleRowChange = (index, field, val) => {
    const updated = [...rows];
    updated[index][field] = val;

    // Auto-populate unit if user picked a known test
    if (field === 'test_name') {
      const match = SUGGESTED_TESTS.find(
        (t) => t.name.toLowerCase() === val.trim().toLowerCase()
      );
      if (match && !updated[index].unit) {
        updated[index].unit = match.unit;
      }
    }

    setRows(updated);
  };

  const addRow = () => {
    setRows([...rows, { test_name: '', value: '', unit: '' }]);
  };

  const removeRow = (index) => {
    if (rows.length <= 1) {
      setRows([{ test_name: '', value: '', unit: '' }]);
    } else {
      setRows(rows.filter((_, idx) => idx !== index));
    }
  };

  const loadPreset = (type) => {
    if (COMMON_PRESETS[type]) {
      setRows(COMMON_PRESETS[type].map((item) => ({ ...item })));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onAnalyze();
  };

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>Manual Lab Results Entry</span>
          </h2>
          <p className="text-xs text-slate-400">
            Enter numerical test values and units to evaluate against deterministic clinical reference ranges.
          </p>
        </div>

        {/* Presets */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] text-slate-400 font-medium mr-1 flex items-center gap-1">
            <Zap className="w-3 h-3 text-cyan-400" /> Quick Panels:
          </span>
          <button
            type="button"
            onClick={() => loadPreset('normal')}
            className="text-xs px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-colors"
          >
            Normal Panel
          </button>
          <button
            type="button"
            onClick={() => loadPreset('warning')}
            className="text-xs px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 transition-colors"
          >
            Warning Panel
          </button>
          <button
            type="button"
            onClick={() => loadPreset('critical')}
            className="text-xs px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-colors"
          >
            Critical Panel
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-3">
          <div className="hidden sm:grid sm:grid-cols-12 gap-3 text-xs font-semibold text-slate-400 px-3 py-1">
            <div className="col-span-5">Test Name</div>
            <div className="col-span-3">Measured Value</div>
            <div className="col-span-3">Measurement Unit</div>
            <div className="col-span-1 text-center">Action</div>
          </div>

          {rows.map((row, idx) => (
            <div
              key={idx}
              className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-3 bg-slate-950/60 p-3 sm:p-2 rounded-2xl border border-slate-800/80 items-center transition-all focus-within:border-cyan-500/50"
            >
              {/* Test Name */}
              <div className="sm:col-span-5">
                <label className="sm:hidden block text-[11px] text-slate-400 mb-1">
                  Test Name
                </label>
                <input
                  type="text"
                  list="test-suggestions"
                  placeholder="e.g. Hemoglobin, Glucose, Potassium"
                  value={row.test_name}
                  onChange={(e) => handleRowChange(idx, 'test_name', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  required
                />
              </div>

              {/* Value */}
              <div className="sm:col-span-3">
                <label className="sm:hidden block text-[11px] text-slate-400 mb-1">
                  Value
                </label>
                <input
                  type="number"
                  step="any"
                  placeholder="e.g. 9.2"
                  value={row.value}
                  onChange={(e) => handleRowChange(idx, 'value', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 font-mono"
                  required
                />
              </div>

              {/* Unit */}
              <div className="sm:col-span-3">
                <label className="sm:hidden block text-[11px] text-slate-400 mb-1">
                  Unit
                </label>
                <input
                  type="text"
                  placeholder="e.g. g/dL, mg/dL, mmol/L"
                  value={row.unit}
                  onChange={(e) => handleRowChange(idx, 'unit', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  required
                />
              </div>

              {/* Delete */}
              <div className="sm:col-span-1 flex justify-end sm:justify-center">
                <button
                  type="button"
                  onClick={() => removeRow(idx)}
                  className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors"
                  title="Remove row"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Datalist for autocomplete */}
        <datalist id="test-suggestions">
          {SUGGESTED_TESTS.map((t) => (
            <option key={t.name} value={t.name} />
          ))}
        </datalist>

        <div className="flex flex-wrap items-center justify-between gap-4 mt-5 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={addRow}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-cyan-400" />
            Add Another Test
          </button>

          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Analyzing via LangGraph...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Analyze Results
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
