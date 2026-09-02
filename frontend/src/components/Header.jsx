import React from 'react';
import { Activity, ShieldCheck, Cpu, Database, Stethoscope } from 'lucide-react';

export default function Header({ backendHealthy }) {
  return (
    <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-white">
            <Activity className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                Clinical Lab Results Analyzer
              </h1>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                LangGraph + MCP + Gemini
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Deterministic clinical range classification & patient-friendly explainable AI
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 text-xs text-slate-400 bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-700/50">
            <Cpu className="w-3.5 h-3.5 text-blue-400" />
            <span>LangGraph Agent</span>
            <span className="text-slate-600">•</span>
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span>MCP Tool Server</span>
          </div>

          <div className="flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full border bg-slate-800/80 border-slate-700">
            <span
              className={`w-2 h-2 rounded-full ${
                backendHealthy === true
                  ? 'bg-emerald-400 shadow-sm shadow-emerald-400'
                  : backendHealthy === false
                  ? 'bg-rose-500 shadow-sm shadow-rose-500'
                  : 'bg-amber-400 animate-pulse'
              }`}
            />
            <span className={backendHealthy ? 'text-emerald-400' : 'text-slate-300'}>
              {backendHealthy === true
                ? 'Backend Ready'
                : backendHealthy === false
                ? 'Backend Offline'
                : 'Checking API...'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
