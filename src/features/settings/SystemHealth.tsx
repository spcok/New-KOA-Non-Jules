import React, { useEffect, useState } from 'react';
import { Activity, HardDrive, Download, Trash2, Server, WifiOff, AlertTriangle } from 'lucide-react';
import { useOutboxStore } from '../../store/outboxStore';

export default function SystemHealth() {
  // ZUSTAND LAW: Strict selector usage
  const pendingMutations = useOutboxStore(s => s.mutations);
  const clearOutbox = useOutboxStore(s => s.clearMutations);

  const [storage, setStorage] = useState({ used: 0, total: 0, percent: 0 });
  const [isExporting, setIsExporting] = useState(false);

  // Storage API Estimation (Read-only RAM/Disk check)
  useEffect(() => {
    if (navigator.storage && navigator.storage.estimate) {
      navigator.storage.estimate().then(estimate => {
        const used = (estimate.usage || 0) / (1024 * 1024); // MB
        const total = (estimate.quota || 0) / (1024 * 1024); // MB
        const percent = total > 0 ? (used / total) * 100 : 0;
        setStorage({ used, total, percent });
      });
    }
  }, []);

  const exportLocalDatabase = async () => {
    setIsExporting(true);
    try {
      // Placeholder for TanStack DB export utility
      console.warn("Export triggered. Awaiting DB export hook implementation.");
      await new Promise(r => setTimeout(r, 1000));
    } finally {
      setIsExporting(false);
    }
  };

  const purgeLocalDatabase = async () => {
    const confirm = window.confirm('CRITICAL WARNING: This will permanently delete the local Electric-Sync vault and any unsaved offline mutations. Do you wish to proceed?');
    if (!confirm) return;
    
    clearOutbox();
    // Additional IndexedDB purge logic goes here
    window.location.reload();
  };

  return (
    <div className="bg-[#0F1117] rounded-3xl border border-slate-800/80 overflow-hidden shadow-2xl font-sans max-w-4xl">
      <div className="border-b border-slate-800/80 p-6 bg-[#0A0B0E] flex justify-between items-center">
        <div>
          <h2 className="text-lg font-black text-white flex items-center gap-2 uppercase tracking-tight">
            <Activity size={20} className="text-indigo-500" /> Diagnostics & Health
          </h2>
          <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-widest">Local Vault & Uplink Status</p>
        </div>
      </div>

      <div className="p-6 space-y-6">
        
        {/* Offline Outbox Status */}
        <div className="bg-[#0A0B0E] rounded-2xl border border-slate-800/80 p-5 shadow-inner">
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-2 rounded-xl ${pendingMutations.length > 0 ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
              {pendingMutations.length > 0 ? <WifiOff size={20} /> : <Server size={20} />}
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-tight">Uplink Outbox Status</h3>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Pending Offline Mutations</p>
            </div>
          </div>
          
          <div className="flex items-center justify-between bg-[#0F1117] border border-slate-800/80 p-4 rounded-xl">
            <div className="flex items-center gap-3">
              <span className="text-2xl font-black text-white">{pendingMutations.length}</span>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Queued Actions</span>
            </div>
            {pendingMutations.length > 0 && (
              <div className="flex items-center gap-2 text-[10px] font-black text-amber-500 uppercase tracking-widest bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg">
                <AlertTriangle size={14} /> Awaiting Network
              </div>
            )}
          </div>
        </div>

        {/* Local Storage Quota */}
        <div className="bg-[#0A0B0E] rounded-2xl border border-slate-800/80 p-5 shadow-inner">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-indigo-600/10 text-indigo-400 rounded-xl">
              <HardDrive size={20} />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-tight">Local Vault Capacity</h3>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">IndexedDB Storage Quota</p>
            </div>
          </div>

          <div className="bg-[#0F1117] border border-slate-800/80 p-4 rounded-xl space-y-3">
            <div className="flex justify-between text-xs font-black uppercase tracking-widest">
              <span className="text-white">{storage.used.toFixed(2)} MB Used</span>
              <span className="text-slate-500">{storage.total.toFixed(2)} MB Total</span>
            </div>
            <div className="w-full bg-[#0A0B0E] rounded-full h-2.5 border border-slate-800/80 overflow-hidden">
              <div 
                className={`h-2.5 rounded-full ${storage.percent > 80 ? 'bg-rose-500' : 'bg-indigo-500'}`} 
                style={{ width: `${Math.min(storage.percent, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Diagnostic Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-800/80">
          <div className="bg-[#0A0B0E] p-4 rounded-2xl border border-slate-800/80 shadow-inner flex flex-col justify-between">
            <div>
              <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Data Snapshot</h4>
              <p className="text-[10px] font-bold text-slate-500 mb-4 leading-relaxed">Download a JSON snapshot of the current IndexedDB state for manual backup.</p>
            </div>
            <button 
              onClick={exportLocalDatabase}
              disabled={isExporting}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#0F1117] border border-slate-700 text-slate-300 text-[10px] uppercase tracking-widest font-black rounded-xl hover:text-white hover:border-slate-500 transition-all disabled:opacity-50"
            >
              <Download size={14} />
              {isExporting ? 'Exporting...' : 'Export Local JSON'}
            </button>
          </div>

          <div className="bg-rose-950/10 p-4 rounded-2xl border border-rose-900/30 shadow-inner flex flex-col justify-between">
            <div>
              <h4 className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-1">Emergency Purge</h4>
              <p className="text-[10px] font-bold text-rose-500/70 mb-4 leading-relaxed">Permanently destroy the local vault. This action forces a fresh download on next boot.</p>
            </div>
            <button 
              onClick={purgeLocalDatabase}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-rose-900/20 text-rose-500 border border-rose-900/50 text-[10px] uppercase tracking-widest font-black rounded-xl hover:bg-rose-900 hover:text-white transition-all shadow-[0_0_15px_rgba(225,29,72,0.1)]"
            >
              <Trash2 size={14} />
              Nuke Local Vault
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}