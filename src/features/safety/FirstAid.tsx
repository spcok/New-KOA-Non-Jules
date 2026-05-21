import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BriefcaseMedical, Plus, X, Search, Activity, Save, Loader2, Stethoscope, UserCircle } from 'lucide-react';
import { firstAidService } from '../../services/firstAidService';
import { useAuthStore } from '../../store/authStore';
import { FirstAidLog, User } from '../../types/schema';

export default function FirstAid() {
  const user = useAuthStore((s) => s.user);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: logs = [], isLoading } = useQuery<FirstAidLog[]>({
    queryKey: ['first_aid_logs'],
    queryFn: () => firstAidService.getFirstAidLogs(),
  });

  const filteredLogs = logs.filter(log => 
    (log.person_involved_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (log.provided_aid || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto font-sans pb-12">
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase flex items-center gap-3">
            First Aid Register
          </h1>
          <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Clinical Administration & Treatment Logging</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-[#0F1117] border border-slate-800/80 p-3 rounded-2xl shadow-inner">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
          <input 
            type="text" 
            placeholder="Search patient or treatment..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0A0B0E] border border-slate-800/80 rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-emerald-500/50" 
          />
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.15)]"
        >
          <Plus size={16} /> Log Treatment
        </button>
      </div>

      <div className="bg-[#0F1117] rounded-3xl border border-slate-800/80 shadow-2xl overflow-hidden relative">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#0A0B0E] border-b border-slate-800/80 text-slate-500 font-black text-[10px] uppercase tracking-widest">
              <tr>
                <th className="px-6 py-5">Date</th>
                <th className="px-6 py-5">Patient Name</th>
                <th className="px-6 py-5 w-1/3">Injury Details</th>
                <th className="px-6 py-5 w-1/3">Treatment Administered</th>
                <th className="px-6 py-5">Outcome</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {isLoading ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-xs font-black text-slate-500 uppercase tracking-widest animate-pulse">Accessing Medical Vault...</td></tr>
              ) : filteredLogs.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-xs font-black text-slate-500 uppercase tracking-widest">No medical records found</td></tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#0A0B0E] transition-colors">
                    <td className="px-6 py-4 text-xs font-bold text-white whitespace-nowrap">
                      {new Date(log.incident_date).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs font-bold text-white">{log.person_involved_name}</p>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-0.5">{log.person_type}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs font-bold text-slate-300 line-clamp-2">{log.injury_details}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-2">
                        <Stethoscope size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                        <p className="text-xs font-bold text-emerald-400 line-clamp-2">{log.provided_aid}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-black uppercase tracking-widest ${
                        log.outcome === 'REFERRED' ? 'text-rose-400' :
                        log.outcome === 'MONITORING' ? 'text-amber-400' :
                        'text-slate-400'
                      }`}>
                        {log.outcome || 'RESOLVED'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <FirstAidModal 
          onClose={() => setIsModalOpen(false)} 
          userId={user?.id}
        />
      )}
    </div>
  );
}

function FirstAidModal({ onClose, userId }: { onClose: () => void, userId?: string }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Query staff to populate the First Aider dropdown
  const { data: staffMembers = [] } = useQuery<User[]>({
    queryKey: ['staff_members'],
    queryFn: () => firstAidService.getStaffMembers(),
  });
  
  const [incidentDate, setIncidentDate] = useState(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  });
  
  const [personName, setPersonName] = useState('');
  const [personType, setPersonType] = useState('KEEPER');
  const [location, setLocation] = useState('');
  const [whatHappened, setWhatHappened] = useState('');
  const [injuryDetails, setInjuryDetails] = useState('');
  const [providedAid, setProvidedAid] = useState('');
  const [witnesses, setWitnesses] = useState('');
  const [outcome, setOutcome] = useState('RESOLVED');
  
  // UUID Dropdown mapping
  const [firstAiderId, setFirstAiderId] = useState(userId || '');
  
  const [isRiddor, setIsRiddor] = useState(false);
  const [animalInvolved, setAnimalInvolved] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);
    try {
      await firstAidService.saveFirstAidLog({
        incident_date: new Date(incidentDate).toISOString(),
        person_involved_name: personName,
        person_type: personType,
        location: location,
        what_happened: whatHappened,
        injury_details: injuryDetails,
        provided_aid: providedAid,
        witnesses: witnesses,
        outcome: outcome,
        is_riddor_reportable: isRiddor,
        animal_involved: animalInvolved,
        first_aider_id: firstAiderId || undefined, 
      });
      onClose();
    } catch (err) {
      console.error("Failed to save first aid record", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-sans">
      <div className="bg-[#0F1117] border border-slate-800/80 rounded-3xl w-full max-w-4xl h-[90vh] flex flex-col shadow-2xl relative overflow-hidden">
        
        <div className="bg-[#0F1117]/90 backdrop-blur border-b border-slate-800/80 p-5 flex justify-between items-center z-20 shrink-0">
          <h2 className="text-lg font-black text-white uppercase tracking-widest flex items-center gap-2">
            <BriefcaseMedical size={18} className="text-emerald-500" /> First Aid Administration Log
          </h2>
          <button type="button" onClick={onClose} className="text-slate-500 hover:text-white font-bold text-xs uppercase tracking-widest transition-colors"><X size={20} /></button>
        </div>

        <form id="first-aid-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Date & Time of Treatment</label>
              <input type="datetime-local" required value={incidentDate} onChange={e => setIncidentDate(e.target.value)} className="w-full bg-[#0A0B0E] border border-slate-800/80 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-emerald-500/50 [&::-webkit-calendar-picker-indicator]:invert" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Location of Injury/Treatment</label>
              <input type="text" required value={location} onChange={e => setLocation(e.target.value)} className="w-full bg-[#0A0B0E] border border-slate-800/80 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-emerald-500/50" />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Patient Name</label>
              <input type="text" required value={personName} onChange={e => setPersonName(e.target.value)} className="w-full bg-[#0A0B0E] border border-slate-800/80 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-emerald-500/50" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Patient Category</label>
              <select value={personType} onChange={e => setPersonType(e.target.value)} className="w-full bg-[#0A0B0E] border border-slate-800/80 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-emerald-500/50 appearance-none">
                <option value="KEEPER">Staff / Keeper</option>
                <option value="PUBLIC">Public / Visitor</option>
                <option value="CONTRACTOR">Contractor</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          <div className="space-y-6 pt-4 border-t border-slate-800/80">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center bg-[#0A0B0E] border border-slate-800/80 p-5 rounded-2xl shadow-inner">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                  <UserCircle size={14} /> Attending First Aider
                </label>
                <select 
                  value={firstAiderId} 
                  onChange={e => setFirstAiderId(e.target.value)} 
                  required
                  className="w-full bg-[#0F1117] border border-slate-800/80 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-emerald-500/50 appearance-none"
                >
                  <option value="">-- Select First Aider --</option>
                  {staffMembers.map(staff => (
                    <option key={staff.id} value={staff.id}>
                      {staff.name || staff.email} {staff.initials ? `(${staff.initials})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">What Happened?</label>
              <textarea required value={whatHappened} onChange={e => setWhatHappened(e.target.value)} rows={2} className="w-full bg-[#0A0B0E] border border-slate-800/80 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-emerald-500/50 resize-none shadow-inner" placeholder="Brief description of how the injury occurred..." />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nature of Injury</label>
              <textarea required value={injuryDetails} onChange={e => setInjuryDetails(e.target.value)} rows={2} className="w-full bg-[#0A0B0E] border border-slate-800/80 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-emerald-500/50 resize-none shadow-inner" placeholder="E.g., Laceration on left index finger, 2cm long..." />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Activity size={14} className="text-emerald-500" />
                Treatment Administered & Kit Usage
              </label>
              <textarea required value={providedAid} onChange={e => setProvidedAid(e.target.value)} rows={3} className="w-full bg-[#0A0B0E] border border-emerald-900/30 rounded-xl px-4 py-3 text-sm font-bold text-emerald-100 focus:outline-none focus:border-emerald-500/50 resize-none shadow-inner" placeholder="E.g., Cleaned with saline, applied 1x sterile dressing..." />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Witnesses (If any)</label>
              <input type="text" value={witnesses} onChange={e => setWitnesses(e.target.value)} className="w-full bg-[#0A0B0E] border border-slate-800/80 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-emerald-500/50" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Post-Treatment Outcome</label>
                <select value={outcome} onChange={e => setOutcome(e.target.value)} className="w-full bg-[#0A0B0E] border border-slate-800/80 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-emerald-500/50 appearance-none">
                  <option value="RESOLVED">RESOLVED - Returned to work/visit</option>
                  <option value="MONITORING">MONITORING - Requires observation</option>
                  <option value="REFERRED">REFERRED - Sent to A&E / Doctor</option>
                  <option value="OTHER">OTHER</option>
                </select>
              </div>

              <div className="flex gap-4">
                 <label className="flex items-center gap-2 cursor-pointer bg-[#0A0B0E] border border-slate-800/80 p-3 rounded-xl shadow-inner flex-1">
                   <input type="checkbox" checked={animalInvolved} onChange={e => setAnimalInvolved(e.target.checked)} className="w-5 h-5 rounded bg-[#0F1117] border-slate-800/80 text-emerald-500 focus:ring-emerald-500" />
                   <span className="text-xs font-black text-slate-300 uppercase tracking-widest">Animal Involved</span>
                 </label>
                 
                 <label className="flex items-center gap-2 cursor-pointer bg-rose-500/5 border border-rose-500/20 p-3 rounded-xl shadow-inner flex-1">
                   <input type="checkbox" checked={isRiddor} onChange={e => setIsRiddor(e.target.checked)} className="w-5 h-5 rounded bg-[#0F1117] border-slate-800/80 text-rose-500 focus:ring-rose-500" />
                   <span className="text-xs font-black text-rose-400 uppercase tracking-widest">RIDDOR Flag</span>
                 </label>
              </div>
            </div>
          </div>

        </form>
        
        <div className="p-5 border-t border-slate-800/80 bg-[#0F1117]/90 backdrop-blur shrink-0 flex justify-end z-20">
          <button type="submit" form="first-aid-form" disabled={isSubmitting} className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 flex items-center gap-2 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.15)]">
            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Commit Medical Record
          </button>
        </div>
      </div>
    </div>
  );
}