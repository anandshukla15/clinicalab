import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle, AlertCircle, ArrowRight, RefreshCw, Download, FileSpreadsheet } from 'lucide-react';

const SYNTHETIC_SAMPLES = {
  'normal.csv': `test_name,value,unit
Hemoglobin,14.5,g/dL
Glucose,88,mg/dL
Potassium,4.2,mmol/L
Platelets,260000,cells/uL
Sodium,140,mmol/L
Creatinine,0.9,mg/dL
WBC,6800,cells/uL
Calcium,9.4,mg/dL
BUN,14,mg/dL
ALT,25,U/L
AST,22,U/L
Bilirubin,0.8,mg/dL`,

  'warning.csv': `test_name,value,unit
Hemoglobin,11.2,g/dL
Glucose,126,mg/dL
Potassium,5.3,mmol/L
Platelets,125000,cells/uL
Sodium,131,mmol/L
Creatinine,1.6,mg/dL
WBC,12800,cells/uL
Calcium,10.8,mg/dL
BUN,28,mg/dL
ALT,75,U/L
AST,60,U/L
Bilirubin,1.8,mg/dL`,

  'critical.csv': `test_name,value,unit
Potassium,6.8,mmol/L
Hemoglobin,6.1,g/dL
Platelets,32000,cells/uL
Glucose,420,mg/dL
Sodium,118,mmol/L
Creatinine,4.8,mg/dL
WBC,34000,cells/uL
Calcium,6.1,mg/dL
BUN,65,mg/dL
ALT,380,U/L
AST,310,U/L
Bilirubin,6.2,mg/dL`,
};

export default function CsvUpload({ onAnalyzeCsv, loading }) {
  const [file, setFile] = useState(null);
  const [previewRows, setPreviewRows] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef(null);

  const processFile = (selectedFile) => {
    setErrorMsg('');
    if (!selectedFile) return;

    if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
      setErrorMsg('Please select a valid .csv file.');
      return;
    }

    setFile(selectedFile);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.split('\n').filter((l) => l.trim().length > 0);
      if (lines.length > 1) {
        const rows = lines.slice(1, 6).map((line) => line.split(','));
        setPreviewRows(rows);
      } else {
        setPreviewRows([]);
      }
    };
    reader.readAsText(selectedFile);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const loadSyntheticFile = (filename) => {
    const csvContent = SYNTHETIC_SAMPLES[filename];
    if (!csvContent) return;
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const syntheticFile = new File([blob], filename, { type: 'text/csv' });
    processFile(syntheticFile);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!file) {
      setErrorMsg('Please select or load a CSV file first.');
      return;
    }
    onAnalyzeCsv(file);
  };

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>CSV Batch Dataset Upload</span>
          </h2>
          <p className="text-xs text-slate-400">
            Upload anonymized laboratory datasets (e.g. Kaggle format). Partial errors will be isolated automatically.
          </p>
        </div>

        {/* Synthetic Sample Loaders */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] text-slate-400 font-medium mr-1 flex items-center gap-1">
            <FileSpreadsheet className="w-3 h-3 text-cyan-400" /> Synthetic Test Sets:
          </span>
          <button
            type="button"
            onClick={() => loadSyntheticFile('normal.csv')}
            className="text-xs px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-colors"
          >
            Load normal.csv
          </button>
          <button
            type="button"
            onClick={() => loadSyntheticFile('warning.csv')}
            className="text-xs px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 transition-colors"
          >
            Load warning.csv
          </button>
          <button
            type="button"
            onClick={() => loadSyntheticFile('critical.csv')}
            className="text-xs px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-colors"
          >
            Load critical.csv
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Drop Zone */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 ${
            dragActive
              ? 'border-cyan-400 bg-cyan-500/10'
              : file
              ? 'border-emerald-500/50 bg-emerald-950/10'
              : 'border-slate-700/80 bg-slate-950/40 hover:border-slate-600 hover:bg-slate-900/50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={(e) => processFile(e.target.files[0])}
            className="hidden"
          />

          <div className="flex flex-col items-center justify-center">
            {file ? (
              <div className="flex flex-col items-center">
                <div className="h-12 w-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-white">{file.name}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {(file.size / 1024).toFixed(1)} KB • Click to choose another file
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="h-12 w-12 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center mb-2">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-slate-200">
                  Drag and drop your CSV here, or <span className="text-cyan-400 underline">browse</span>
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Expected schema: <code className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">test_name,value,unit</code>
                </p>
              </div>
            )}
          </div>
        </div>

        {errorMsg && (
          <div className="mt-3 flex items-center gap-2 text-xs text-rose-400 bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* CSV Preview */}
        {previewRows.length > 0 && (
          <div className="mt-4 p-3 bg-slate-950/60 rounded-xl border border-slate-800">
            <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">
              File Preview (First {previewRows.length} rows)
            </span>
            <div className="mt-2 overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-800">
                    <th className="py-1 px-2 font-medium">Test Name</th>
                    <th className="py-1 px-2 font-medium">Value</th>
                    <th className="py-1 px-2 font-medium">Unit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900 font-mono text-slate-300">
                  {previewRows.map((r, i) => (
                    <tr key={i}>
                      <td className="py-1 px-2">{r[0] || '—'}</td>
                      <td className="py-1 px-2">{r[1] || '—'}</td>
                      <td className="py-1 px-2">{r[2] || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex justify-end mt-5 pt-4 border-t border-slate-800">
          <button
            type="submit"
            disabled={!file || loading}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Analyzing CSV with LangGraph...
              </>
            ) : (
              <>
                <UploadCloud className="w-4 h-4" />
                Analyze CSV Dataset
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
