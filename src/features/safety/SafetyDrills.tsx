import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Siren, Plus, X, Search, Save, Loader2, Users, AlertTriangle, ShieldCheck } from 'lucide-react';
import { safetyDrillService } from '../../services/safetyDrillService';
import { useAuthStore } from '../../store/authStore';
import { SafetyDrill, User } from '../../types/schema';

export default function SafetyDrills() {
  const user = useAuthStore((s) => s.user);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: drills = [], isLoading } = useQuery<SafetyDrill[]>({
    queryKey: ['safety_drills'],
    queryFn: () => safetyDrillService.getDrills(),
  });

  const filteredDrills = drills.filter(drill => 
    (drill.drill_type || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (drill.scenario_description || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto font-sans pb-12">
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase flex items-center gap-3">
            Safety Drills
          </h1>
          <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Live Crisis Tracking & ZLA Compliance Drills</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-[#0F1117] border border-slate-800/80 p-3 rounded-2xl shadow-inner">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
          <input 
            type="text" 
            placeholder="Search scenarios or types..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0A0B0E] border border-slate-800/80 rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-rose-500/50" 
          />
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-[0_0_15px_rgba(225,29,72,0.15)]"
        >
          <Plus size={16} /> Log Emergency Event
        </button>
      </div>

      <div className="bg-[#0F1117] rounded-3xl border border-slate-800/80 shadow-2xl overflow-hidden relative">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#0A0B0E] border-b border-slate-800/80 text-slate-500 font-black text-[10px] uppercase tracking-widest">
              <tr>
                <th className="px-6 py-5">Date</th>
                <th className="px-6 py-5">Type & Nature</th>
                <th className="px-6 py-5 w-1/3">Scenario Details</th>
                <th className="px-6 py-5">Duration</th>
                <th className="px-6 py-5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {isLoading ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-xs font-black text-slate-500 uppercase tracking-widest animate-pulse">Accessing Compliance Records...</td></tr>
              ) : filteredDrills.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-xs font-black text-slate-500 uppercase tracking-widest">No protocol records found</td></tr>
              ) : (
                filteredDrills.map((drill) => (
                  <tr key={drill.id} className="hover:bg-[#0A0B0E] transition-colors">
                    <td className="px-6 py-4 text-xs font-bold text-white whitespace-nowrap">
                      {new Date(drill.drill_date).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 mb-1">
                        {!drill.is_simulation && <span className="px-2 py-0.5 bg-rose-500 text-white text-[9px] font-black uppercase tracking-widest rounded shadow-[0_0_10px_rgba(225,29,72,0.5)] animate-pulse">REAL EVENT</span>}
                        {drill.is_simulation && <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 border border-blue-500/20 text-[9px] font-black uppercase tracking-widest rounded">SIMULATION</span>}
                      </div>
                      <p className="text-xs font-black text-slate-300 uppercase tracking-widest mt-0.5">{drill.drill_type.replace('_', ' ')}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs font-bold text-slate-300 line-clamp-2">{drill.scenario_description}</p>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Area: {drill.areas_involved}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-black text-indigo-400">
                        {Math.floor(drill.duration_seconds / 60)}m {drill.duration_seconds % 60}s
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-black uppercase tracking-widest ${
                        drill.status === 'REVIEW_REQUIRED' ? 'text-amber-500' : 'text-emerald-500'
                      }`}>
                        {drill.status}
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
        <SafetyDrillModal 
          onClose={() => setIsModalOpen(false)} 
          userId={user?.id}
        />
      )}
    </div>
  );
}

function SafetyDrillModal({ onClose, userId }: { onClose: () => void, userId?: string }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Data Fetching for Live Roll Call
  const { data: staffMembers = [] } = useQuery<User[]>({
    queryKey: ['staff_members'],
    queryFn: () => safetyDrillService.getStaffMembers(),
  });

  const { data: activeTimesheets = [] } = useQuery({
    queryKey: ['active_timesheets_rollcall'],
    queryFn: () => safetyDrillService.getActiveTimesheets(),
  });

  // Derived State: Currently Active Staff
  const activeStaffIds = useMemo(() => new Set(activeTimesheets.map(t => t.user_id)), [activeTimesheets]);
  const activeStaffList = useMemo(() => staffMembers.filter(s => activeStaffIds.has(s.id)), [staffMembers, activeStaffIds]);
  const inactiveStaffList = useMemo(() => staffMembers.filter(s => !activeStaffIds.has(s.id)), [staffMembers, activeStaffIds]);

  // Form State
  const [isSimulation, setIsSimulation] = useState(true);
  const [drillDate, setDrillDate] = useState(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  });
  
  const [drillType, setDrillType] = useState('FIRE_EVACUATION');
  const [scenarioDescription, setScenarioDescription] = useState('');
  const [areasInvolved, setAreasInvolved] = useState('');
  
  // Duration State (User friendly Mins/Secs converted to DB Integer)
  const [durationMins, setDurationMins] = useState(0);
  const [durationSecs, setDurationSecs] = useState(0);

  const [issuesObserved, setIssuesObserved] = useState('');
  const [correctiveActions, setCorrectiveActions] = useState('');
  const [status, setStatus] = useState('COMPLETED');

  // Roll Call Specific State
  const [accountedStaffIds, setAccountedStaffIds] = useState<Set<string>>(new Set());
  const [visitorCount, setVisitorCount] = useState(0);
  const [manualStaffOverrideId, setManualStaffOverrideId] = useState('');

  const toggleAccountedStaff = (id: string) => {
    setAccountedStaffIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setIsSubmitting(true);

    try {
      // 1. Convert duration to integer seconds
      const totalDurationSeconds = (durationMins * 60) + durationSecs;

      // 2. Compile Live Roll Call Text if it's an evacuation
      let finalIssues = issuesObserved;
      let rollCallCompleted = false;

      if (drillType === 'FIRE_EVACUATION') {
        rollCallCompleted = true; // Flag for ZLA tracking
        const unaccounted = activeStaffList.filter(s => !accountedStaffIds.has(s.id));
        const manuallyAdded = inactiveStaffList.filter(s => accountedStaffIds.has(s.id));

        let rollCallText = `\n\n[SYSTEM GENERATED ROLL CALL AUDIT]\n- Visitors/Contractors Headcount: ${visitorCount}\n`;
        
        if (unaccounted.length > 0) {
          rollCallText += `- UNACCOUNTED FOR (Clocked In): ${unaccounted.map(s => s.name || s.email).join(', ')}\n`;
        } else {
          rollCallText += `- All actively clocked-in staff accounted for.\n`;
        }

        if (manuallyAdded.length > 0) {
          rollCallText += `- PRESENT BUT NOT CLOCKED IN: ${manuallyAdded.map(s => s.name || s.email).join(', ')}\n`;
        }

        finalIssues = (finalIssues ? finalIssues + '\n' : '') + rollCallText;
      }

      await safetyDrillService.saveDrill({
        drill_date: new Date(drillDate).toISOString(),
        drill_type: drillType,
        scenario_description: scenarioDescription,
        areas_involved: areasInvolved,
        duration_seconds: totalDurationSeconds,
        roll_call_completed: rollCallCompleted,
        issues_observed: finalIssues,
        corrective_actions: correctiveActions,
        status: status,
        is_simulation: isSimulation,
      }, userId);
      onClose();
    } catch (err) {
      console.error("Failed to save emergency protocol record", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-sans">
      <div className="bg-[#0F1117] border border-slate-800/80 rounded-3xl w-full max-w-4xl h-[90vh] flex flex-col shadow-2xl relative overflow-hidden">
        
        <div className="bg-[#0F1117]/90 backdrop-blur border-b border-slate-800/80 p-5 flex justify-between items-center z-20 shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-black text-white uppercase tracking-widest flex items-center gap-2">
              <Siren size={18} className="text-rose-500" /> Emergency Protocol Form
            </h2>
            
            {/* The Simulation / Real Emergency Master Toggle */}
            <button 
              type="button"
              onClick={() => setIsSimulation(!isSimulation)}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                isSimulation 
                  ? 'bg-[#0A0B0E] border border-slate-800/80 text-slate-400 hover:text-white' 
                  : 'bg-rose-500 text-white shadow-[0_0_15px_rgba(225,29,72,0.5)] animate-pulse'
              }`}
            >
              {isSimulation ? 'Mode: Training Simulation' : 'MODE: REAL EMERGENCY'}
            </button>
          </div>
          <button type="button" onClick={onClose} className="text-slate-500 hover:text-white font-bold text-xs uppercase tracking-widest transition-colors"><X size={20} /></button>
        </div>

        <form id="drill-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Protocol Type</label>
              <select value={drillType} onChange={e => setDrillType(e.target.value)} className="w-full bg-[#0A0B0E] border border-slate-800/80 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-rose-500/50 appearance-none">
                <option value="FIRE_EVACUATION">Fire / Structural Evacuation (Live Roll Call)</option>
                <option value="ANIMAL_ESCAPE">Animal Escape / Retrieval</option>
                <option value="PUBLIC_INCIDENT">Major Public Incident / Lockdown</option>
                <option value="OTHER">Other Emergency Protocol</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Date & Time of Event</label>
              <input type="datetime-local" required value={drillDate} onChange={e => setDrillDate(e.target.value)} className="w-full bg-[#0A0B0E] border border-slate-800/80 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-rose-500/50 [&::-webkit-calendar-picker-indicator]:invert" />
            </div>
            
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Scenario Description</label>
              <input type="text" required value={scenarioDescription} onChange={e => setScenarioDescription(e.target.value)} placeholder="E.g., Eagle Owl untethered in public viewing area" className="w-full bg-[#0A0B0E] border border-slate-800/80 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-rose-500/50" />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Areas / Zones Affected</label>
              <input type="text" required value={areasInvolved} onChange={e => setAreasInvolved(e.target.value)} placeholder="E.g., Flying Field, Reception" className="w-full bg-[#0A0B0E] border border-slate-800/80 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-rose-500/50" />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Response Duration</label>
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <input type="number" min="0" required value={durationMins} onChange={e => setDurationMins(parseInt(e.target.value) || 0)} className="w-full bg-[#0A0B0E] border border-slate-800/80 rounded-xl pl-4 pr-12 py-3 text-sm font-bold text-white focus:outline-none focus:border-rose-500/50" />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-500 uppercase">Mins</span>
                </div>
                <div className="flex-1 relative">
                  <input type="number" min="0" max="59" required value={durationSecs} onChange={e => setDurationSecs(parseInt(e.target.value) || 0)} className="w-full bg-[#0A0B0E] border border-slate-800/80 rounded-xl pl-4 pr-12 py-3 text-sm font-bold text-white focus:outline-none focus:border-rose-500/50" />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-500 uppercase">Secs</span>
                </div>
              </div>
            </div>
          </div>

          {/* DYNAMIC BIFURCATION: THE LIVE ROLL CALL MATRIX */}
          {drillType === 'FIRE_EVACUATION' && (
            <div className="bg-rose-500/5 border border-rose-500/20 p-5 rounded-2xl space-y-6 shadow-inner relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 blur-[50px] pointer-events-none" />
              
              <div className="flex items-center gap-3 relative z-10">
                <Users className="text-rose-500" size={20} />
                <h3 className="font-black text-white uppercase tracking-widest text-sm">Emergency Roll Call (Live Timesheet Matrix)</h3>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-rose-500/20 pb-2">Currently Clocked-In Staff</p>
                  {activeStaffList.length === 0 ? (
                    <div className="text-xs font-bold text-amber-500 flex items-center gap-2 bg-amber-500/10 p-3 rounded-lg border border-amber-500/20">
                      <AlertTriangle size={14} /> No staff currently clocked into the system.
                    </div>
                  ) : (
                    activeStaffList.map(staff => (
                      <label key={staff.id} className="flex items-center justify-between p-3 bg-[#0F1117] border border-slate-800/80 rounded-xl cursor-pointer hover:border-rose-500/50 transition-colors shadow-inner">
                        <span className="text-sm font-bold text-white">{staff.name || staff.email}</span>
                        <input 
                          type="checkbox" 
                          checked={accountedStaffIds.has(staff.id)}
                          onChange={() => toggleAccountedStaff(staff.id)}
                          className="w-5 h-5 rounded bg-[#0A0B0E] border-slate-800/80 text-emerald-500 focus:ring-emerald-500" 
                        />
                      </label>
                    ))
                  )}
                </div>

                <div className="space-y-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Non-Staff / Visitor Headcount</label>
                    <input 
                      type="number" 
                      min="0" 
                      value={visitorCount} 
                      onChange={e => setVisitorCount(parseInt(e.target.value) || 0)} 
                      className="w-full bg-[#0F1117] border border-slate-800/80 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-rose-500/50" 
                      placeholder="Enter number of visitors at assembly point"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Manual Staff Override (Forgot to clock in)</label>
                    <div className="flex gap-2">
                      <select 
                        value={manualStaffOverrideId} 
                        onChange={e => setManualStaffOverrideId(e.target.value)} 
                        className="flex-1 bg-[#0F1117] border border-slate-800/80 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-rose-500/50 appearance-none"
                      >
                        <option value="">Select off-duty staff present...</option>
                        {inactiveStaffList.map(staff => (
                          <option key={staff.id} value={staff.id}>{staff.name || staff.email}</option>
                        ))}
                      </select>
                      <button 
                        type="button"
                        onClick={() => {
                          if (manualStaffOverrideId && !accountedStaffIds.has(manualStaffOverrideId)) {
                            toggleAccountedStaff(manualStaffOverrideId);
                            setManualStaffOverrideId('');
                          }
                        }}
                        disabled={!manualStaffOverrideId}
                        className="px-4 py-3 bg-[#0F1117] border border-slate-800/80 rounded-xl text-emerald-500 hover:bg-emerald-500/10 hover:border-emerald-500/50 disabled:opacity-50 transition-colors"
                      >
                        <ShieldCheck size={18} />
                      </button>
                    </div>
                  </div>

                  {/* Render manually added overrides */}
                  {inactiveStaffList.filter(s => accountedStaffIds.has(s.id)).length > 0 && (
                    <div className="space-y-2 mt-4">
                      <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest border-b border-emerald-500/20 pb-2">Manual Overrides Accounted For</p>
                      {inactiveStaffList.filter(s => accountedStaffIds.has(s.id)).map(staff => (
                        <div key={staff.id} className="flex justify-between items-center text-xs font-bold text-slate-300 bg-[#0F1117]/50 px-3 py-2 rounded-lg border border-emerald-500/20">
                          {staff.name || staff.email}
                          <button type="button" onClick={() => toggleAccountedStaff(staff.id)} className="text-rose-500 hover:text-rose-400"><X size={14}/></button>
                        </div>
                      ))}
                    </div>
                  )}

                </div>
              </div>
            </div>
          )}
          {/* END LIVE ROLL CALL MATRIX */}

          <div className="space-y-6 pt-4 border-t border-slate-800/80">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Issues / Failures Observed</label>
              <textarea value={issuesObserved} onChange={e => setIssuesObserved(e.target.value)} rows={3} className="w-full bg-[#0A0B0E] border border-slate-800/80 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-rose-500/50 resize-none shadow-inner" placeholder="E.g., Fire door in reception failed to close, radio comms unclear..." />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Corrective Actions Required (Plan of Action)</label>
              <textarea value={correctiveActions} onChange={e => setCorrectiveActions(e.target.value)} rows={3} className="w-full bg-[#0A0B0E] border border-slate-800/80 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-rose-500/50 resize-none shadow-inner" placeholder="E.g., Maintenance ticket logged for door hinge, staff retraining scheduled..." />
            </div>

            <div className="space-y-1.5 md:w-1/3">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Protocol Status</label>
              <select value={status} onChange={e => setStatus(e.target.value)} className="w-full bg-[#0A0B0E] border border-slate-800/80 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-rose-500/50 appearance-none">
                <option value="COMPLETED">COMPLETED - Successful</option>
                <option value="REVIEW_REQUIRED">REVIEW REQUIRED - Major Failures</option>
                <option value="PLANNED">PLANNED - Scheduled Drill</option>
              </select>
            </div>
          </div>

        </form>
        
        <div className="p-5 border-t border-slate-800/80 bg-[#0F1117]/90 backdrop-blur shrink-0 flex justify-end z-20">
          <button type="submit" form="drill-form" disabled={isSubmitting} className={`px-8 py-3.5 flex items-center gap-2 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all disabled:opacity-50 ${isSimulation ? 'bg-blue-600 hover:bg-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.15)]' : 'bg-rose-600 hover:bg-rose-500 shadow-[0_0_20px_rgba(225,29,72,0.5)]'}`}>
            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {isSimulation ? 'Commit Training Log' : 'Commit Emergency Record'}
          </button>
        </div>
      </div>
    </div>
  );
}