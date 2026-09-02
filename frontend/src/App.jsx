import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import DisclaimerBanner from './components/DisclaimerBanner';
import SummaryCards from './components/SummaryCards';
import LabInputForm from './components/LabInputForm';
import CsvUpload from './components/CsvUpload';
import ResultsSection from './components/ResultsSection';
import { apiService } from './services/api';
import { PenTool, UploadCloud, Activity, AlertCircle, Info, Stethoscope } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('form'); // 'form' | 'csv'
  const [backendHealthy, setBackendHealthy] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resultsData, setResultsData] = useState(null);
  const [activeFilter, setActiveFilter] = useState('ALL');

  // Form rows initial state
  const [rows, setRows] = useState([
    { test_name: 'Hemoglobin', value: '9.2', unit: 'g/dL' },
    { test_name: 'Glucose', value: '95', unit: 'mg/dL' },
    { test_name: 'Potassium', value: '6.8', unit: 'mmol/L' },
  ]);

  // Check health on mount
  useEffect(() => {
    checkBackend();
    const interval = setInterval(checkBackend, 15000);
    return () => clearInterval(interval);
  }, []);

  const checkBackend = async () => {
    try {
      const data = await apiService.checkHealth();
      if (data && data.status === 'ok') {
        setBackendHealthy(true);
      } else {
        setBackendHealthy(false);
      }
    } catch {
      setBackendHealthy(false);
    }
  };

  const handleAnalyzeManual = async () => {
    setError('');
    // Basic frontend check
    const validRows = rows.filter((r) => r.test_name.trim() && r.value !== '');
    if (validRows.length === 0) {
      setError('Please provide at least one valid laboratory test with a numerical value.');
      return;
    }

    const payload = validRows.map((r) => ({
      test_name: r.test_name.trim(),
      value: parseFloat(r.value),
      unit: r.unit.trim(),
    }));

    setLoading(true);
    try {
      const response = await apiService.analyzeLabs(payload);
      setResultsData(response);
      setActiveFilter('ALL');
    } catch (err) {
      console.error('Analysis error:', err);
      const msg =
        err.response?.data?.detail ||
        err.message ||
        'Failed to connect to backend service. Please verify the FastAPI server is running.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeCsv = async (file) => {
    setError('');
    setLoading(true);
    try {
      const response = await apiService.analyzeCsv(file);
      setResultsData(response);
      setActiveFilter('ALL');
    } catch (err) {
      console.error('CSV Analysis error:', err);
      const msg =
        err.response?.data?.detail ||
        err.message ||
        'Failed to analyze CSV. Please ensure the format matches test_name,value,unit';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleClearResults = () => {
    setResultsData(null);
    setError('');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-white">
      {/* Header */}
      <Header backendHealthy={backendHealthy} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Medical Disclaimer Banner */}
        <DisclaimerBanner />

        {/* Global Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-3 shadow-lg">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <strong className="font-semibold block text-rose-200">Analysis Error</strong>
              <span>{error}</span>
            </div>
            <button
              onClick={() => setError('')}
              className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Mode Switcher Tabs */}
        <div className="flex items-center gap-2 p-1.5 bg-slate-900/90 rounded-2xl border border-slate-800 w-fit mb-6 shadow-inner">
          <button
            type="button"
            onClick={() => setActiveTab('form')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'form'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <PenTool className="w-3.5 h-3.5" />
            Manual Lab Input
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('csv')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'csv'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5" />
            Upload CSV File
          </button>
        </div>

        {/* Input Interface */}
        {activeTab === 'form' ? (
          <LabInputForm
            rows={rows}
            setRows={setRows}
            onAnalyze={handleAnalyzeManual}
            loading={loading}
          />
        ) : (
          <CsvUpload onAnalyzeCsv={handleAnalyzeCsv} loading={loading} />
        )}

        {/* Results Presentation */}
        {resultsData && (
          <div className="mt-8 pt-6 border-t border-slate-800/80">
            {/* Metric Summary Cards */}
            <SummaryCards
              summary={resultsData.summary}
              activeFilter={activeFilter}
              onSelectFilter={(f) => setActiveFilter(f)}
            />

            {/* Results List */}
            <ResultsSection
              results={resultsData.results}
              validationErrors={resultsData.validation_errors}
              onClear={handleClearResults}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-900/40 mt-12 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-cyan-400" />
            <span>Clinical Lab Results Analyzer MVP</span>
            <span className="text-slate-700">•</span>
            <span>Deterministic Python Engine + LangGraph + MCP + Google Gemini</span>
          </div>
          <div className="text-slate-500">
            For educational and clinical evaluation demonstration.
          </div>
        </div>
      </footer>
    </div>
  );
}
