import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ShieldAlert, Plus, X, Search, Save, Loader2, AlertTriangle, FileText } from 'lucide-react';
import { incidentService } from '../../services/incidentService';
import { useAuthStore } from '../../store/authStore';
import { Incident } from '../../types/schema';

export default function Incidents() {
  const user = useAuthStore((s) => s.user);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: incidents = [], isLoading } = useQuery<Incident[]>({
    queryKey: ['incidents'],
    queryFn: () => incidentService.getIncidents(),
  });

  const filteredIncidents = incidents.filter(inc => 
    (inc.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (inc.location || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto font-sans pb-12">
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase flex items-center gap-3">
            Incidents Ledger
          </h1>
          <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Management, Liability & Regulatory Compliance</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-[#0F1117] border border-slate-800/80 p-3 rounded-2xl shadow-inner">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
          <input 
            type="text" 
            placeholder="Search by title or location..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0A0B0E] border border-slate-800/80 rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-rose-500/50" 
          />
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-[0_0_15px_rgba(225,29,72,0.15)]"
        >
          <Plus size={16} /> Log Facility Incident
        </button>
      </div>

      <div className="bg-[#0F1117] rounded-3xl border border-slate-800/80 shadow-2xl overflow-hidden relative">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#0A0B0E] border-b border-slate-800/80 text-slate-500 font-black text-[10px] uppercase tracking-widest">
              <tr>
                <th className="px-6 py-5">Date</th>
                <th className="px-6 py-5">Incident Title</th>
                <th className="px-6 py-5">Severity</th>
                <th className="px-6 py-5">Status</th>
                <th className="px-6 py-5">Medical Link</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {isLoading ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-xs font-black text-slate-500 uppercase tracking-widest animate-pulse">Loading Ledger...</td></tr>
              ) : filteredIncidents.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-xs font-black text-slate-500 uppercase tracking-widest">No matching incidents found</td></tr>
              ) : (
                filteredIncidents.map((inc) => (
                  <tr key={inc.id} className="hover:bg-[#0A0B0E] transition-colors">
                    <td className="px-6 py-4 text-xs font-bold text-white whitespace-nowrap">
                      {new Date(inc.incident_date).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs font-bold text-white">{inc.title}</p>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-0.5">{inc.incident_type} | {inc.location}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest ${
                        inc.severity === 'CRITICAL' ? 'text-rose-400 bg-rose-500/10 border border-rose-500/20' :
                        inc.severity === 'HIGH' ? 'text-orange-400 bg-orange-500/10 border border-orange-500/20' :
                        inc.severity === 'MEDIUM' ? 'text-amber-400 bg-amber-500/10 border border-amber-500/20' :
                        'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                      }`}>
                        {inc.severity}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-black uppercase tracking-widest ${inc.investigation_status === 'CLOSED' ? 'text-slate-500' : 'text-blue-400'}`}>
                        {inc.investigation_status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {inc.first_aid_required ? (
                         <span className="text-[10px] font-black text-rose-500 flex items-center gap-1 uppercase tracking-widest"><AlertTriangle size={12}/> Treatment Rendered</span>
                      ) : (
                         <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">None Required</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <IncidentModal 
          onClose={() => setIsModalOpen(false)} 
          userId={user?.id}
        />
      )}
    </div>
  );
}

function IncidentModal({ onClose, userId }: { onClose: () => void, userId?: string }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [incidentDate, setIncidentDate] = useState(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  });
  
  const [title, setTitle] = useState('');
  const [incidentType, setIncidentType] = useState('Property Damage');
  const [severity, setSeverity] = useState('LOW');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [immediateAction, setImmediateAction] = useState('');
  const [rootCause, setRootCause] = useState('');
  const [preventionAction, setPreventionAction] = useState('');
  const [status, setStatus] = useState('OPEN');
  
  const [animalInvolved, setAnimalInvolved] = useState(false);
  const [firstAidRequired, setFirstAidRequired] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    setIsSubmitting(true);
    try {
      await incidentService.saveIncident({
        title,
        incident_date: new Date(incidentDate).toISOString(),
        incident_type: incidentType,
        severity,
        location,
        description,
        immediate_action_taken: immediateAction,
        animal_involved: animalInvolved,
        first_aid_required: firstAidRequired,
        root_cause_analysis: rootCause,
        prevention_action: preventionAction,
        investigation_status: status,
        investigation_officer_id: userId, // Temporarily bind to the submitter
      });
      onClose();
    } catch (err) {
      console.error("Failed to save incident", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-sans">
      <div className="bg-[#0F1117] border border-slate-800/80 rounded-3xl w-full max-w-4xl h-[90vh] flex flex-col shadow-2xl relative overflow-hidden">
        
        <div className="bg-[#0F1117]/90 backdrop-blur border-b border-slate-800/80 p-5 flex justify-between items-center z-20 shrink-0">
          <h2 className="text-lg font-black text-white uppercase tracking-widest flex items-center gap-2">
            <FileText size={18} className="text-rose-500" /> Facility Incident Report
          </h2>
          <button type="button" onClick={onClose} className="text-slate-500 hover:text-white font-bold text-xs uppercase tracking-widest transition-colors"><X size={20} /></button>
        </div>

        <form id="incident-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Incident Title</label>
              <input type="text" required value={title} onChange={e => setTitle(e.target.value)} placeholder="E.g., Perimeter fence breach at enclosure 4" className="w-full bg-[#0A0B0E] border border-slate-800/80 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-rose-500/50" />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Date & Time</label>
              <input type="datetime-local" required value={incidentDate} onChange={e => setIncidentDate(e.target.value)} className="w-full bg-[#0A0B0E] border border-slate-800/80 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-rose-500/50 [&::-webkit-calendar-picker-indicator]:invert" />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Location</label>
              <input type="text" required value={location} onChange={e => setLocation(e.target.value)} className="w-full bg-[#0A0B0E] border border-slate-800/80 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-rose-500/50" />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Severity Classification</label>
              <select value={severity} onChange={e => setSeverity(e.target.value)} className="w-full bg-[#0A0B0E] border border-slate-800/80 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-rose-500/50 appearance-none">
                <option value="LOW">LOW - Minor disruption, no immediate danger</option>
                <option value="MEDIUM">MEDIUM - Notable disruption or property damage</option>
                <option value="HIGH">HIGH - Major breach, safety compromised</option>
                <option value="CRITICAL">CRITICAL - ZLA reportable, emergency response</option>
              </select>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Incident Category</label>
              <input type="text" required value={incidentType} onChange={e => setIncidentType(e.target.value)} placeholder="Security, Maintenance, Escape, etc." className="w-full bg-[#0A0B0E] border border-slate-800/80 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-rose-500/50" />
            </div>
          </div>

          <div className="bg-[#0A0B0E] border border-slate-800/80 p-5 rounded-2xl space-y-4 shadow-inner">
             <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={animalInvolved} onChange={e => setAnimalInvolved(e.target.checked)} className="w-5 h-5 rounded bg-[#0F1117] border-slate-800/80 text-rose-500 focus:ring-rose-500" />
                  <span className="text-xs font-black text-slate-300 uppercase tracking-widest">Animal Involved</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={firstAidRequired} onChange={e => setFirstAidRequired(e.target.checked)} className="w-5 h-5 rounded bg-[#0F1117] border-slate-800/80 text-rose-500 focus:ring-rose-500" />
                  <div>
                    <span className="text-xs font-black text-rose-400 uppercase tracking-widest block">First Aid Administered</span>
                    <span className="text-[9px] font-bold text-slate-500 uppercase">Requires corresponding First Aid Log</span>
                  </div>
                </label>
             </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Full Description of Incident</label>
              <textarea required value={description} onChange={e => setDescription(e.target.value)} rows={4} className="w-full bg-[#0A0B0E] border border-slate-800/80 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-rose-500/50 resize-none shadow-inner" />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Immediate Actions Taken</label>
              <textarea value={immediateAction} onChange={e => setImmediateAction(e.target.value)} rows={2} className="w-full bg-[#0A0B0E] border border-slate-800/80 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-rose-500/50 resize-none shadow-inner" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Root Cause Analysis</label>
                <textarea value={rootCause} onChange={e => setRootCause(e.target.value)} rows={3} className="w-full bg-[#0A0B0E] border border-slate-800/80 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-rose-500/50 resize-none shadow-inner" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Preventative Actions Required</label>
                <textarea value={preventionAction} onChange={e => setPreventionAction(e.target.value)} rows={3} className="w-full bg-[#0A0B0E] border border-slate-800/80 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-rose-500/50 resize-none shadow-inner" />
              </div>
            </div>

            <div className="space-y-1.5 md:w-1/3">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Investigation Status</label>
              <select value={status} onChange={e => setStatus(e.target.value)} className="w-full bg-[#0A0B0E] border border-slate-800/80 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-rose-500/50 appearance-none">
                <option value="OPEN">OPEN - Awaiting Review</option>
                <option value="INVESTIGATING">INVESTIGATING - Active inquiry</option>
                <option value="CLOSED">CLOSED - Concluded</option>
              </select>
            </div>
          </div>

        </form>
        
        <div className="p-5 border-t border-slate-800/80 bg-[#0F1117]/90 backdrop-blur shrink-0 flex justify-end z-20">
          <button type="submit" form="incident-form" disabled={isSubmitting} className="px-8 py-3.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 flex items-center gap-2 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(225,29,72,0.15)]">
            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Commit to Ledger
          </button>
        </div>
      </div>
    </div>
  );
}