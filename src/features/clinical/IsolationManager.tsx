import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ShieldAlert, ShieldCheck, Lock, Unlock, Search, Plus, X, AlertTriangle, FileText, Loader2 } from 'lucide-react';
import { isolationService } from '../../services/isolationService';
import { useAuthStore } from '../../store/authStore';
import { z } from 'zod';
import { IsolationLogSchema, Animal, User } from '../../types/schema';

type IsolationLog = z.infer<typeof IsolationLogSchema>;

export default function IsolationManager() {
  const session = useAuthStore((s) => s.session);
  const user = session?.user;

  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'AUDIT'>('ACTIVE');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isLockdownModalOpen, setIsLockdownModalOpen] = useState(false);
  const [clearanceModalData, setClearanceModalData] = useState<IsolationLog | null>(null);

  const { data: animals = [] } = useQuery({ queryKey: ['animals_lookup'], queryFn: () => isolationService.getAnimals() });
  const { data: staff = [] } = useQuery({ queryKey: ['staff_members'], queryFn: () => isolationService.getStaffMembers() });
  const { data: activeIsolations = [] } = useQuery({ queryKey: ['isolation_logs', 'active'], queryFn: () => isolationService.getActiveIsolations() });
  const { data: allIsolations = [] } = useQuery({ queryKey: ['isolation_logs', 'all'], queryFn: () => isolationService.getAllIsolations() });

  const getAnimalName = (id: string) => {
    const a = animals.find(a => a.id === id);
    return a ? `${a.name || 'Unnamed'} (${a.species})` : 'Unknown Animal';
  };

  const getStaffName = (id: string | null | undefined) => {
    if (!id) return 'System';
    const s = staff.find(s => s.id === id);
    return s ? (s.name || s.email) : 'Unknown Staff';
  };

  const calculateDaysInIsolation = (startDate: string) => {
    const start = new Date(startDate).getTime();
    const now = new Date().getTime();
    const days = Math.floor((now - start) / (1000 * 60 * 60 * 24));
    return days === 0 ? 'Day 1' : `${days} Days`;
  };

  const formatReason = (reason: string | null | undefined) => (reason || '').replace(/_/g, ' ');

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto font-sans pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase flex items-center gap-3">
            <ShieldAlert className="text-amber-500" size={32} />
            Biosecurity & Quarantine
          </h1>
          <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Active Isolation Protocols & Veterinary Clearance</p>
        </div>
      </div>

      {/* TAB NAVIGATION */}
      <div className="flex gap-2 bg-[#0F1117] p-2 rounded-2xl border border-slate-800/80">
        <button onClick={() => setActiveTab('ACTIVE')} className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'ACTIVE' ? 'bg-amber-600 text-white shadow-[0_0_15px_rgba(245,158,11,0.2)]' : 'text-slate-400 hover:bg-[#0A0B0E] hover:text-white'}`}>
          <Lock size={16} /> Active Quarantine Ward
        </button>
        <button onClick={() => setActiveTab('AUDIT')} className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'AUDIT' ? 'bg-[#0A0B0E] text-white border border-slate-700/50' : 'text-slate-400 hover:bg-[#0A0B0E] hover:text-white'}`}>
          <FileText size={16} /> Historical Biosecurity Audit
        </button>
      </div>

      {/* SEARCH AND ACTION */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-[#0F1117] border border-slate-800/80 p-3 rounded-2xl shadow-inner">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
          <input type="text" placeholder="Search patient or location..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-[#0A0B0E] border border-slate-800/80 rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-amber-500/50" />
        </div>
        
        {activeTab === 'ACTIVE' && (
          <button onClick={() => setIsLockdownModalOpen(true)} className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-[0_0_15px_rgba(245,158,11,0.2)]">
            <Plus size={16} /> Initiate Lockdown
          </button>
        )}
      </div>

      {/* TAB 1: ACTIVE QUARANTINE GRID */}
      {activeTab === 'ACTIVE' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeIsolations.filter(i => getAnimalName(i.animal_id).toLowerCase().includes(searchQuery.toLowerCase()) || i.location.toLowerCase().includes(searchQuery.toLowerCase())).map(isolation => (
            <div key={isolation.id} className="bg-[#0F1117] border border-amber-500/30 rounded-3xl p-6 flex flex-col justify-between shadow-[0_0_20px_rgba(245,158,11,0.05)] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-amber-500/0 via-amber-500 to-amber-500/0 opacity-50" />
              
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-black text-white text-lg flex items-center gap-2">
                      <AlertTriangle className="text-amber-500" size={18} />
                      {getAnimalName(isolation.animal_id)}
                    </h3>
                    <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest bg-[#0A0B0E] inline-block px-2 py-0.5 rounded border border-slate-800">
                      Location: <span className="text-amber-400">{isolation.location}</span>
                    </p>
                  </div>
                </div>

                <div className="space-y-3 bg-[#0A0B0E] p-4 rounded-2xl border border-slate-800/80 mb-6">
                  <div>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Reason for Isolation</p>
                    <p className="text-sm font-bold text-white uppercase tracking-widest">{formatReason(isolation.isolation_reason)}</p>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-800/80">
                    <div>
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Time in Quarantine</p>
                      <p className="text-xl font-black text-amber-500">{calculateDaysInIsolation(isolation.start_date)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Start Date</p>
                      <p className="text-xs font-bold text-slate-300">{new Date(isolation.start_date).toLocaleDateString('en-GB')}</p>
                    </div>
                  </div>
                </div>
              </div>

              <button onClick={() => setClearanceModalData(isolation)} className="w-full py-3 bg-slate-800 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all flex justify-center items-center gap-2">
                <ShieldCheck size={16} /> Grant Medical Clearance
              </button>
            </div>
          ))}
          {activeIsolations.length === 0 && (
            <div className="col-span-full py-16 text-center border-2 border-dashed border-slate-800/80 rounded-3xl">
              <ShieldCheck size={48} className="mx-auto text-emerald-500/50 mb-4" />
              <p className="text-sm font-black text-emerald-500 uppercase tracking-widest">All Clear. No Active Quarantines.</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: HISTORICAL AUDIT LEDGER */}
      {activeTab === 'AUDIT' && (
        <div className="bg-[#0F1117] rounded-3xl border border-slate-800/80 shadow-2xl overflow-hidden relative">
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#0A0B0E] border-b border-slate-800/80 text-slate-500 font-black text-[10px] uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-5">Patient & Location</th>
                  <th className="px-6 py-5">Reason</th>
                  <th className="px-6 py-5">Duration Log</th>
                  <th className="px-6 py-5">Status & Clearance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {allIsolations.filter(i => getAnimalName(i.animal_id).toLowerCase().includes(searchQuery.toLowerCase())).map(log => (
                  <tr key={log.id} className="hover:bg-[#0A0B0E]">
                    <td className="px-6 py-4">
                      <p className="font-bold text-white text-xs">{getAnimalName(log.animal_id)}</p>
                      <p className="text-[10px] font-black text-slate-500 uppercase mt-0.5">Loc: {log.location}</p>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-300 text-xs uppercase tracking-widest">
                      {formatReason(log.isolation_reason)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold text-slate-400 block">{new Date(log.start_date).toLocaleDateString('en-GB')}</span>
                      <span className="text-[10px] font-black text-slate-500">to {log.end_date ? new Date(log.end_date).toLocaleDateString('en-GB') : 'Present'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[9px] px-2 py-1 rounded-lg font-black uppercase tracking-widest inline-block mb-1 ${
                        log.status === 'ACTIVE' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 
                        log.status === 'CLEARED' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 
                        'bg-slate-800 text-slate-400'
                      }`}>
                        {log.status}
                      </span>
                      {log.clearance_notes && (
                        <p className="text-[10px] font-bold text-slate-400 line-clamp-2 w-64 italic">"{log.clearance_notes}"</p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODALS */}
      {isLockdownModalOpen && (
        <InitiateLockdownModal animals={animals} onClose={() => setIsLockdownModalOpen(false)} userId={user?.id} />
      )}
      
      {clearanceModalData && (
        <MedicalClearanceModal 
          isolation={clearanceModalData} 
          animalName={getAnimalName(clearanceModalData.animal_id)}
          onClose={() => setClearanceModalData(null)} 
          userId={user?.id} 
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------
// COMPONENT: INITIATE LOCKDOWN MODAL
// ---------------------------------------------------------
function InitiateLockdownModal({ animals, onClose, userId }: { animals: Animal[], onClose: () => void, userId?: string }) {
  const [animalId, setAnimalId] = useState('');
  const [reason, setReason] = useState('NEW_ARRIVAL');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !animalId) return;
    setIsSubmitting(true);
    try {
      await isolationService.saveIsolation({
        animal_id: animalId,
        start_date: new Date(startDate).toISOString(),
        isolation_reason: reason,
        location,
        status: 'ACTIVE',
      }, userId);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0F1117] border border-amber-500/30 rounded-3xl w-full max-w-lg p-6 shadow-[0_0_40px_rgba(245,158,11,0.15)] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-amber-500" />
        <h2 className="text-lg font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2"><Lock className="text-amber-500" size={20}/> Initiate Quarantine</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Select Patient</label>
            <select required value={animalId} onChange={e => setAnimalId(e.target.value)} className="w-full bg-[#0A0B0E] border border-slate-800/80 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-amber-500/50">
              <option value="">-- Patient --</option>
              {animals.map(a => <option key={a.id} value={a.id}>{a.name} ({a.species})</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Reason for Isolation</label>
            <select value={reason} onChange={e => setReason(e.target.value)} className="w-full bg-[#0A0B0E] border border-slate-800/80 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-amber-500/50">
              <option value="NEW_ARRIVAL">New Arrival (Standard Quarantine)</option>
              <option value="INFECTIOUS_DISEASE">Infectious Disease / Symptomatic</option>
              <option value="POST_SURGERY">Post-Surgery Recovery</option>
              <option value="UNKNOWN_ILLNESS">Unknown Illness Observation</option>
              <option value="BEHAVIORAL">Behavioral Aggression</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Isolation Location / Pen Name</label>
            <input type="text" required placeholder="e.g., Quarantine Block A" value={location} onChange={e => setLocation(e.target.value)} className="w-full bg-[#0A0B0E] border border-slate-800/80 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-amber-500/50" />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Date & Time of Lockdown</label>
            <input type="datetime-local" required value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-[#0A0B0E] border border-slate-800/80 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-amber-500/50 [&::-webkit-calendar-picker-indicator]:invert" />
          </div>

          <div className="flex gap-4 pt-6">
            <button type="button" onClick={onClose} className="flex-1 py-3 text-xs font-black text-slate-400 hover:text-white uppercase tracking-widest transition-colors">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="flex-1 py-3 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-[0_0_15px_rgba(245,158,11,0.2)] flex items-center justify-center gap-2">
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
              Enforce Lockdown
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------
// COMPONENT: MEDICAL CLEARANCE MODAL
// ---------------------------------------------------------
function MedicalClearanceModal({ isolation, animalName, onClose, userId }: { isolation: IsolationLog, animalName: string, onClose: () => void, userId?: string }) {
  const [status, setStatus] = useState('CLEARED');
  const [clearanceNotes, setClearanceNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setIsSubmitting(true);
    try {
      await isolationService.saveIsolation({
        ...isolation,
        status,
        clearance_notes: clearanceNotes,
        end_date: new Date().toISOString(),
      }, userId);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0F1117] border border-emerald-500/30 rounded-3xl w-full max-w-lg p-6 shadow-[0_0_40px_rgba(16,185,129,0.1)] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500" />
        <h2 className="text-lg font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2"><Unlock className="text-emerald-500" size={20}/> Medical Clearance</h2>
        
        <div className="bg-[#0A0B0E] p-4 rounded-xl border border-slate-800/80 mb-6">
          <p className="text-xs font-bold text-white mb-1">Patient: <span className="text-emerald-400">{animalName}</span></p>
          <p className="text-[10px] font-black text-slate-500 uppercase">Isolated since: {new Date(isolation.start_date).toLocaleDateString('en-GB')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Resolution Outcome</label>
            <select value={status} onChange={e => setStatus(e.target.value)} className="w-full bg-[#0A0B0E] border border-slate-800/80 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-emerald-500/50">
              <option value="CLEARED">Cleared for release from Quarantine</option>
              <option value="EUTHANISED_DIED">Patient Deceased / Euthanised</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2">Mandatory Clearance Notes</label>
            <textarea required placeholder="e.g., Negative AI swab received, visually healthy." value={clearanceNotes} onChange={e => setClearanceNotes(e.target.value)} className="w-full bg-[#0A0B0E] border border-slate-800/80 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-emerald-500/50 resize-none shadow-inner" rows={3} />
          </div>

          <div className="flex gap-4 pt-6">
            <button type="button" onClick={onClose} className="flex-1 py-3 text-xs font-black text-slate-400 hover:text-white uppercase tracking-widest transition-colors">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)] flex items-center justify-center gap-2">
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
              Confirm Clearance
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}