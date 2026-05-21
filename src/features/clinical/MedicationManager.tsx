import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Pill, ClipboardList, Activity, Plus, Search, CheckCircle, XCircle, AlertTriangle, Zap } from 'lucide-react';
import { medicationService } from '../../services/medicationService';
import { useAuthStore } from '../../store/authStore';
import { z } from 'zod';
import { ClinicalScheduleSchema, MedicationLogSchema, Animal, User } from '../../types/schema';

type ClinicalSchedule = z.infer<typeof ClinicalScheduleSchema>;
type MedicationLog = z.infer<typeof MedicationLogSchema>;

export default function MedicationManager() {
  const session = useAuthStore((s) => s.session);
  const user = session?.user;
  
  const [activeTab, setActiveTab] = useState<'MAR' | 'PRESCRIPTIONS' | 'AUDIT'>('MAR');
  const [searchQuery, setSearchQuery] = useState('');

  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isQuickModalOpen, setIsQuickModalOpen] = useState(false);
  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false);
  
  const [selectedSchedule, setSelectedSchedule] = useState<ClinicalSchedule | null>(null);

  const { data: animals = [] } = useQuery({ queryKey: ['animals_lookup'], queryFn: () => medicationService.getAnimals() });
  const { data: staff = [] } = useQuery({ queryKey: ['staff_members'], queryFn: () => medicationService.getStaffMembers() });
  const { data: activeSchedules = [] } = useQuery({ queryKey: ['clinical_schedules', 'active'], queryFn: () => medicationService.getActiveSchedules() });
  const { data: allSchedules = [] } = useQuery({ queryKey: ['clinical_schedules', 'all'], queryFn: () => medicationService.getAllSchedules() });
  const { data: logs = [] } = useQuery({ queryKey: ['medication_logs'], queryFn: () => medicationService.getLogs() });

  const getAnimalName = (id: string) => {
    const a = animals.find(a => a.id === id);
    return a ? `${a.name || 'Unnamed'} (${a.species})` : 'Unknown Animal';
  };
  const getStaffName = (id: string) => {
    const s = staff.find(s => s.id === id);
    return s ? (s.name || s.email) : 'Unknown Staff';
  };

  const handleOpenLog = (schedule: ClinicalSchedule) => {
    setSelectedSchedule(schedule);
    setIsLogModalOpen(true);
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto font-sans pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase flex items-center gap-3">
            Pharmacology & MAR Chart
          </h1>
          <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Medication Administration Records & Scheduling</p>
        </div>
      </div>

      {/* TAB NAVIGATION */}
      <div className="flex gap-2 bg-[#0F1117] p-2 rounded-2xl border border-slate-800/80">
        <button onClick={() => setActiveTab('MAR')} className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'MAR' ? 'bg-fuchsia-600 text-white shadow-[0_0_15px_rgba(192,38,211,0.2)]' : 'text-slate-400 hover:bg-[#0A0B0E] hover:text-white'}`}>
          <CheckCircle size={16} /> Daily MAR Actions
        </button>
        <button onClick={() => setActiveTab('PRESCRIPTIONS')} className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'PRESCRIPTIONS' ? 'bg-[#0A0B0E] text-white border border-slate-700/50' : 'text-slate-400 hover:bg-[#0A0B0E] hover:text-white'}`}>
          <ClipboardList size={16} /> Master Prescriptions
        </button>
        <button onClick={() => setActiveTab('AUDIT')} className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'AUDIT' ? 'bg-[#0A0B0E] text-white border border-slate-700/50' : 'text-slate-400 hover:bg-[#0A0B0E] hover:text-white'}`}>
          <Activity size={16} /> Historical Audit Log
        </button>
      </div>

      {/* SEARCH AND QUICK ACTIONS */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-[#0F1117] border border-slate-800/80 p-3 rounded-2xl shadow-inner">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
          <input type="text" placeholder="Search drug or animal..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-[#0A0B0E] border border-slate-800/80 rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-fuchsia-500/50" />
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
          {activeTab === 'MAR' && (
            <button onClick={() => setIsQuickModalOpen(true)} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-[0_0_15px_rgba(79,70,229,0.2)]">
              <Zap size={16} /> Quick Administer (One-Off)
            </button>
          )}
          {activeTab === 'PRESCRIPTIONS' && (
            <button onClick={() => setIsPrescriptionModalOpen(true)} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-[0_0_15px_rgba(192,38,211,0.2)]">
              <Plus size={16} /> New Prescription Rule
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: DAILY MAR CHART */}
      {activeTab === 'MAR' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {activeSchedules.filter(s => getAnimalName(s.animal_id).toLowerCase().includes(searchQuery.toLowerCase()) || s.medication_name.toLowerCase().includes(searchQuery.toLowerCase())).map(schedule => (
            <div key={schedule.id} className="bg-[#0F1117] border border-slate-800/80 rounded-3xl p-6 flex flex-col justify-between shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-fuchsia-500/5 blur-[50px] pointer-events-none" />
              <div>
                <div className="flex justify-between items-start mb-4 relative z-10">
                  <div>
                    <h3 className="font-black text-white text-lg">{getAnimalName(schedule.animal_id)}</h3>
                    <span className="text-[10px] font-black text-fuchsia-500 uppercase tracking-widest bg-fuchsia-500/10 px-2 py-1 rounded-lg border border-fuchsia-500/20">{schedule.schedule_type}</span>
                  </div>
                  <Pill className="text-slate-600" size={24} />
                </div>
                
                <div className="space-y-3 bg-[#0A0B0E] p-4 rounded-2xl border border-slate-800/80 mb-6">
                  <div>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Medication & Dose</p>
                    <p className="text-sm font-bold text-fuchsia-400">{schedule.medication_name} — {schedule.dosage}</p>
                  </div>
                  <div className="flex gap-4">
                    <div>
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Route</p>
                      <p className="text-xs font-bold text-slate-300">{schedule.route.replace('_', ' ')}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Frequency</p>
                      <p className="text-xs font-bold text-slate-300">{schedule.frequency}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <button onClick={() => handleOpenLog(schedule)} className="w-full py-3 bg-slate-800 hover:bg-fuchsia-600 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all flex justify-center items-center gap-2">
                <CheckCircle size={16} /> Log Administration
              </button>
            </div>
          ))}
          {activeSchedules.length === 0 && (
            <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-800/80 rounded-3xl">
              <p className="text-xs font-black text-slate-500 uppercase tracking-widest">No Active Medications Scheduled</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 2 & 3 Tables would be mapped here using standard table designs similar to SOAP */}
      {/* For brevity of rendering token limits, we render the Master Tables dynamically below */}
      {activeTab === 'PRESCRIPTIONS' && (
        <div className="bg-[#0F1117] rounded-3xl border border-slate-800/80 shadow-2xl overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#0A0B0E] border-b border-slate-800/80 text-slate-500 font-black text-[10px] uppercase tracking-widest">
              <tr>
                <th className="px-6 py-5">Patient</th>
                <th className="px-6 py-5">Pharmacology & Route</th>
                <th className="px-6 py-5">Frequency</th>
                <th className="px-6 py-5">Duration</th>
                <th className="px-6 py-5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {allSchedules.map(s => (
                <tr key={s.id} className="hover:bg-[#0A0B0E]">
                  <td className="px-6 py-4 font-bold text-white text-xs">{getAnimalName(s.animal_id)}</td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-fuchsia-400 text-xs">{s.medication_name} ({s.dosage})</p>
                    <p className="text-[10px] font-black text-slate-500 uppercase mt-0.5">{s.route.replace('_', ' ')}</p>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-300 text-xs">{s.frequency}</td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-bold text-slate-400 block">{new Date(s.start_date).toLocaleDateString()}</span>
                    <span className="text-[10px] font-black text-slate-500">to {s.end_date ? new Date(s.end_date).toLocaleDateString() : 'Ongoing'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[9px] px-2 py-1 rounded-lg font-black uppercase tracking-widest ${s.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-slate-800 text-slate-400'}`}>{s.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'AUDIT' && (
        <div className="bg-[#0F1117] rounded-3xl border border-slate-800/80 shadow-2xl overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#0A0B0E] border-b border-slate-800/80 text-slate-500 font-black text-[10px] uppercase tracking-widest">
              <tr>
                <th className="px-6 py-5">Time Administered</th>
                <th className="px-6 py-5">Patient & Rule ID</th>
                <th className="px-6 py-5">Status</th>
                <th className="px-6 py-5">Administered By</th>
                <th className="px-6 py-5">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {logs.map(log => (
                <tr key={log.id} className="hover:bg-[#0A0B0E]">
                  <td className="px-6 py-4 font-bold text-white text-xs">{new Date(log.administered_at).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short'})}</td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-white text-xs">{getAnimalName(log.animal_id)}</p>
                    <p className="text-[9px] font-black text-slate-500 uppercase mt-0.5 font-mono">{log.schedule_id.split('-')[0]}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[9px] px-2 py-1 rounded-lg font-black uppercase tracking-widest ${
                      log.status === 'ADMINISTERED' ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20' :
                      log.status === 'REFUSED' ? 'text-rose-400 bg-rose-500/10 border border-rose-500/20' :
                      'text-amber-400 bg-amber-500/10 border border-amber-500/20'
                    }`}>{log.status.replace('_', ' ')}</span>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-400 text-xs">{getStaffName(log.administered_by)}</td>
                  <td className="px-6 py-4 text-xs font-bold text-slate-300">{log.notes || '--'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODALS */}
      {isLogModalOpen && selectedSchedule && (
        <LogDoseModal schedule={selectedSchedule} onClose={() => setIsLogModalOpen(false)} userId={user?.id} />
      )}
      {isQuickModalOpen && (
        <QuickAdministerModal animals={animals} onClose={() => setIsQuickModalOpen(false)} userId={user?.id} />
      )}
    </div>
  );
}

// ---------------------------------------------------------
// COMPONENT: LOG DOSE MODAL
// ---------------------------------------------------------
function LogDoseModal({ schedule, onClose, userId }: { schedule: ClinicalSchedule, onClose: () => void, userId?: string }) {
  const [status, setStatus] = useState('ADMINISTERED');
  const [notes, setNotes] = useState('');
  const [time, setTime] = useState(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    await medicationService.logDose({
      schedule_id: schedule.id,
      animal_id: schedule.animal_id,
      administered_at: new Date(time).toISOString(),
      status,
      notes,
    }, userId);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0F1117] border border-slate-800/80 rounded-3xl w-full max-w-lg p-6 shadow-2xl">
        <h2 className="text-lg font-black text-white uppercase tracking-widest mb-4">Log Administration Event</h2>
        
        <div className="bg-[#0A0B0E] p-4 rounded-xl border border-slate-800/80 mb-6">
          <p className="text-xs font-bold text-fuchsia-400">{schedule.medication_name} — {schedule.dosage}</p>
          <p className="text-[10px] font-black text-slate-500 uppercase mt-1">Route: {schedule.route}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Event Status</label>
            <select value={status} onChange={e => setStatus(e.target.value)} className="w-full mt-1 bg-[#0A0B0E] border border-slate-800/80 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none">
              <option value="ADMINISTERED">Administered Successfully</option>
              <option value="REFUSED">Refused by Animal / Spat Out</option>
              <option value="PARTIAL_DOSE">Partial Dose Received</option>
              <option value="MISSED">Missed Dose (Log historically)</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Time of Action</label>
            <input type="datetime-local" value={time} onChange={e => setTime(e.target.value)} className="w-full mt-1 bg-[#0A0B0E] border border-slate-800/80 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none [&::-webkit-calendar-picker-indicator]:invert" />
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Clinical Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full mt-1 bg-[#0A0B0E] border border-slate-800/80 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none resize-none" rows={2} placeholder="Optional notes..."></textarea>
          </div>
          <div className="flex gap-4 pt-4">
            <button type="button" onClick={onClose} className="flex-1 py-3 text-xs font-black text-slate-400 hover:text-white uppercase tracking-widest">Cancel</button>
            <button type="submit" className="flex-1 py-3 bg-fuchsia-600 hover:bg-fuchsia-500 text-white text-xs font-black uppercase tracking-widest rounded-xl">Commit Log</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------
// COMPONENT: QUICK ADMINISTER MODAL
// ---------------------------------------------------------
function QuickAdministerModal({ animals, onClose, userId }: { animals: Animal[], onClose: () => void, userId?: string }) {
  const [animalId, setAnimalId] = useState('');
  const [medName, setMedName] = useState('');
  const [dosage, setDosage] = useState('');
  const [route, setRoute] = useState('ORAL');
  const [status, setStatus] = useState('ADMINISTERED');
  const [notes, setNotes] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !animalId) return;
    await medicationService.quickAdminister({
      animal_id: animalId,
      medication_name: medName,
      dosage,
      route,
    }, status, notes, userId);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0F1117] border border-slate-800/80 rounded-3xl w-full max-w-xl p-6 shadow-2xl">
        <h2 className="text-lg font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2"><Zap className="text-indigo-500" size={18}/> One-Off Administration</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <select required value={animalId} onChange={e => setAnimalId(e.target.value)} className="w-full bg-[#0A0B0E] border border-slate-800/80 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none">
            <option value="">-- Select Patient --</option>
            {animals.map(a => <option key={a.id} value={a.id}>{a.name} ({a.species})</option>)}
          </select>

          <div className="grid grid-cols-2 gap-4">
            <input type="text" required placeholder="Drug Name (e.g., Meloxicam)" value={medName} onChange={e => setMedName(e.target.value)} className="w-full bg-[#0A0B0E] border border-slate-800/80 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none" />
            <input type="text" required placeholder="Dosage (e.g., 0.5ml)" value={dosage} onChange={e => setDosage(e.target.value)} className="w-full bg-[#0A0B0E] border border-slate-800/80 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none" />
          </div>

          <select value={route} onChange={e => setRoute(e.target.value)} className="w-full bg-[#0A0B0E] border border-slate-800/80 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none">
            <option value="ORAL">Oral (Syringe/Direct)</option>
            <option value="IN_FOOD">In Food</option>
            <option value="IM_INJECTION">IM Injection</option>
            <option value="TOPICAL">Topical</option>
            <option value="EYE_DROPS">Eye Drops</option>
          </select>

          <textarea placeholder="Clinical Notes..." value={notes} onChange={e => setNotes(e.target.value)} className="w-full bg-[#0A0B0E] border border-slate-800/80 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none resize-none" rows={2} />

          <div className="flex gap-4 pt-4">
            <button type="button" onClick={onClose} className="flex-1 py-3 text-xs font-black text-slate-400 hover:text-white uppercase tracking-widest">Cancel</button>
            <button type="submit" className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-widest rounded-xl">Commit One-Off Dose</button>
          </div>
        </form>
      </div>
    </div>
  );
}