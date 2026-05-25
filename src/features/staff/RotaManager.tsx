// src/features/staff/RotaManager.tsx
import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Calendar as CalendarIcon, Clock, UserCheck, ChevronLeft, ChevronRight, Lock, Palmtree, Repeat, CalendarDays, Rocket } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { rotaService } from '../../services/rotaService';
import type { Shift, LeaveRequest, User, ShiftPattern } from '../../types/schema';

// const ROTA_MANAGEMENT_ROLES = ['ADMIN', 'HEAD KEEPER', 'SENIOR KEEPER', 'OWNER DIRECTOR'];

const DAYS_OF_WEEK = [
  { key: 'monday', label: 'Mon' },
  { key: 'tuesday', label: 'Tue' },
  { key: 'wednesday', label: 'Wed' },
  { key: 'thursday', label: 'Thu' },
  { key: 'friday', label: 'Fri' },
  { key: 'saturday', label: 'Sat' },
  { key: 'sunday', label: 'Sun' },
] as const;

export function RotaManager() {
  const currentUser = useAuthStore(s => s.user);
  const queryClient = useQueryClient();
  
  // --- TEMPORARY RBAC BYPASS ---
  const canManageRota = true; 
  // -----------------------------

  const [activeTab, setActiveTab] = useState<'LIVE' | 'PATTERNS'>('LIVE');

  const { data: shifts = [] } = useQuery<Shift[]>({ queryKey: ['shifts'], queryFn: () => [], staleTime: Infinity });
  const { data: leaveRequests = [] } = useQuery<LeaveRequest[]>({ queryKey: ['leave_requests'], queryFn: () => [], staleTime: Infinity });
  const { data: users = [] } = useQuery<User[]>({ queryKey: ['users'], queryFn: () => [], staleTime: Infinity });
  const { data: patterns = [] } = useQuery<ShiftPattern[]>({ queryKey: ['shift_patterns'], queryFn: () => [], staleTime: Infinity });

  const activeShifts = shifts.filter(s => !s.is_deleted);
  const activeUsers = users.filter(u => !u.is_deleted && u.is_active);
  const activePatterns = patterns.filter(p => !p.is_deleted);
  const approvedLeaves = leaveRequests.filter(l => !l.is_deleted && l.status === 'approved');

  // Live Shift Form State
  const [isSubmittingShift, setIsSubmittingShift] = useState(false);
  const [shiftUserId, setShiftUserId] = useState('');
  const [shiftStart, setShiftStart] = useState('');
  const [shiftEnd, setShiftEnd] = useState('');
  const [shiftArea, setShiftArea] = useState('');

  // Pattern Form State
  const [isSubmittingPattern, setIsSubmittingPattern] = useState(false);
  const [patternUserId, setPatternUserId] = useState('');
  const [patternStart, setPatternStart] = useState('08:00');
  const [patternEnd, setPatternEnd] = useState('17:00');
  const [patternArea, setPatternArea] = useState('');
  const [patternDays, setPatternDays] = useState<Record<string, boolean>>({
    monday: false, tuesday: false, wednesday: false, thursday: false, friday: false, saturday: false, sunday: false
  });

  const handleScheduleShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.id || !shiftUserId || !shiftStart || !shiftEnd) return;

    setIsSubmittingShift(true);
    const payload: Partial<Shift> = {
      user_id: shiftUserId,
      start_time: new Date(shiftStart).toISOString(),
      end_time: new Date(shiftEnd).toISOString(),
      assigned_area: shiftArea || null,
    };

    const optimisticShift: Shift = { ...payload, id: crypto.randomUUID(), is_deleted: false, created_at: new Date().toISOString() } as Shift;
    queryClient.setQueryData(['shifts'], (old: Shift[] = []) => [...old, optimisticShift]);

    try {
      await rotaService.saveShift(payload, currentUser.id);
      setShiftUserId(''); setShiftStart(''); setShiftEnd(''); setShiftArea('');
    } catch (error) {
      console.error("Mutation failed, fallback to outbox handled.");
    } finally {
      setIsSubmittingShift(false);
    }
  };

  const handleSavePattern = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.id || !patternUserId || !patternStart || !patternEnd) return;

    setIsSubmittingPattern(true);
    const payload: Partial<ShiftPattern> = {
      user_id: patternUserId,
      start_time: patternStart,
      end_time: patternEnd,
      assigned_area: patternArea || null,
      ...patternDays
    };

    const optimisticPattern: ShiftPattern = { ...payload, id: crypto.randomUUID(), is_deleted: false, created_at: new Date().toISOString() } as ShiftPattern;
    queryClient.setQueryData(['shift_patterns'], (old: ShiftPattern[] = []) => [...old, optimisticPattern]);

    try {
      await rotaService.saveShiftPattern(payload, currentUser.id);
      setPatternUserId(''); setPatternArea('');
      setPatternDays({ monday: false, tuesday: false, wednesday: false, thursday: false, friday: false, saturday: false, sunday: false });
    } catch (error) {
      console.error("Mutation failed, fallback to outbox handled.");
    } finally {
      setIsSubmittingPattern(false);
    }
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto font-sans">
      
      {/* HEADER & TABS */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase flex items-center gap-3">
            Rota & Scheduling
          </h1>
          <p className="text-slate-400 mt-1 flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
            {canManageRota ? 'Management Dashboard | 🛡️ Full Access (Dev Mode)' : 'Keeper View | 🔒 Read-Only Rota'}
          </p>
        </div>

        {canManageRota && (
          <div className="flex bg-[#0F1117] border border-slate-800/80 p-1.5 rounded-2xl gap-1 shadow-inner">
            <button
              onClick={() => setActiveTab('LIVE')}
              className={`flex items-center gap-2 min-w-[120px] justify-center py-2.5 px-4 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${
                activeTab === 'LIVE' ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20' : 'text-slate-500 hover:text-slate-300 border border-transparent'
              }`}
            >
              <CalendarDays size={14} /> Live Rota
            </button>
            <button
              onClick={() => setActiveTab('PATTERNS')}
              className={`flex items-center gap-2 min-w-[120px] justify-center py-2.5 px-4 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${
                activeTab === 'PATTERNS' ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20' : 'text-slate-500 hover:text-slate-300 border border-transparent'
              }`}
            >
              <Repeat size={14} /> Recurring Patterns
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* LEFT COLUMN: Controls */}
        <div className="lg:col-span-1 space-y-6">
          {!canManageRota ? (
            <div className="bg-[#0F1117] rounded-3xl border border-slate-800/80 shadow-2xl p-6 flex flex-col items-center text-center space-y-4">
              <div className="w-12 h-12 bg-slate-800/50 rounded-full flex items-center justify-center text-slate-400"><Lock size={20} /></div>
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-widest">Read-Only View</h3>
                <p className="text-xs font-bold text-slate-500 mt-2">Scheduling is restricted to management.</p>
              </div>
            </div>
          ) : activeTab === 'LIVE' ? (
            /* LIVE SHIFT FORM */
            <div className="bg-[#0F1117] rounded-3xl border border-slate-800/80 shadow-2xl p-6">
              <h2 className="text-sm font-black text-white uppercase tracking-widest mb-5 border-b border-slate-800/80 pb-4">Deploy Ad-Hoc Shift</h2>
              <form onSubmit={handleScheduleShift} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Assign Staff</label>
                  <select required value={shiftUserId} onChange={(e) => setShiftUserId(e.target.value)} className="w-full bg-[#0A0B0E] border border-slate-800/80 rounded-xl px-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-blue-500/50 transition-colors shadow-inner appearance-none">
                    <option value="" disabled>Select staff...</option>
                    {activeUsers.map(u => <option key={u.id} value={u.id} className={approvedLeaves.some(l => l.user_id === u.id) ? "text-amber-500" : ""}>{u.name} {approvedLeaves.some(l => l.user_id === u.id) ? '[LEAVE]' : ''}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Start Time</label>
                  <input type="datetime-local" required value={shiftStart} onChange={(e) => setShiftStart(e.target.value)} className="w-full bg-[#0A0B0E] border border-slate-800/80 rounded-xl px-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-blue-500/50" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">End Time</label>
                  <input type="datetime-local" required value={shiftEnd} onChange={(e) => setShiftEnd(e.target.value)} className="w-full bg-[#0A0B0E] border border-slate-800/80 rounded-xl px-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-blue-500/50" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Area / Zone</label>
                  <input type="text" placeholder="e.g., Quarantine" value={shiftArea} onChange={(e) => setShiftArea(e.target.value)} className="w-full bg-[#0A0B0E] border border-slate-800/80 rounded-xl px-4 py-2.5 text-xs font-bold text-white placeholder-slate-700 focus:outline-none focus:border-blue-500/50" />
                </div>
                <button type="submit" disabled={isSubmittingShift || !shiftUserId || !shiftStart || !shiftEnd} className="w-full mt-2 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-[0_0_15px_rgba(37,99,235,0.15)]">
                  {isSubmittingShift ? 'Saving...' : 'Deploy Shift'}
                </button>
              </form>
            </div>
          ) : (
            /* PATTERN BUILDER FORM */
            <div className="bg-[#0F1117] rounded-3xl border border-slate-800/80 shadow-2xl p-6">
              <h2 className="text-sm font-black text-white uppercase tracking-widest mb-5 border-b border-slate-800/80 pb-4">Build Core Pattern</h2>
              <form onSubmit={handleSavePattern} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Staff Member</label>
                  <select required value={patternUserId} onChange={(e) => setPatternUserId(e.target.value)} className="w-full bg-[#0A0B0E] border border-slate-800/80 rounded-xl px-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-blue-500/50 appearance-none">
                    <option value="" disabled>Select staff...</option>
                    {activeUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Days</label>
                  <div className="grid grid-cols-4 gap-2">
                    {DAYS_OF_WEEK.map(day => (
                      <button
                        key={day.key}
                        type="button"
                        onClick={() => setPatternDays(prev => ({ ...prev, [day.key]: !prev[day.key] }))}
                        className={`py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border ${
                          patternDays[day.key] ? 'bg-blue-600 text-white border-blue-500 shadow-[0_0_10px_rgba(37,99,235,0.2)]' : 'bg-[#0A0B0E] text-slate-500 border-slate-800/80 hover:border-slate-600'
                        }`}
                      >
                        {day.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Default Start</label>
                    <input type="time" required value={patternStart} onChange={(e) => setPatternStart(e.target.value)} className="w-full bg-[#0A0B0E] border border-slate-800/80 rounded-xl px-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-blue-500/50" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Default End</label>
                    <input type="time" required value={patternEnd} onChange={(e) => setPatternEnd(e.target.value)} className="w-full bg-[#0A0B0E] border border-slate-800/80 rounded-xl px-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-blue-500/50" />
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Default Area (Optional)</label>
                  <input type="text" placeholder="e.g., Birds of Prey" value={patternArea} onChange={(e) => setPatternArea(e.target.value)} className="w-full bg-[#0A0B0E] border border-slate-800/80 rounded-xl px-4 py-2.5 text-xs font-bold text-white placeholder-slate-700 focus:outline-none focus:border-blue-500/50" />
                </div>

                <button type="submit" disabled={isSubmittingPattern || !patternUserId || !Object.values(patternDays).some(Boolean)} className="w-full mt-2 py-3 bg-[#0A0B0E] border border-slate-800 hover:border-blue-500/50 disabled:opacity-50 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-inner">
                  {isSubmittingPattern ? 'Saving...' : 'Save Pattern'}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Visualization (Contextual based on Tab) */}
        <div className="lg:col-span-3 bg-[#0F1117] rounded-3xl border border-slate-800/80 shadow-2xl p-6 flex flex-col h-[800px]">
          
          {activeTab === 'LIVE' ? (
            /* LIVE CALENDAR VIEW */
            <>
              <div className="flex items-center justify-between mb-6 border-b border-slate-800/80 pb-4">
                <h2 className="text-lg font-black text-white uppercase tracking-widest flex items-center gap-2"><CalendarIcon size={20} className="text-blue-500" /> Current Rota</h2>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3">
                {activeShifts.length === 0 && approvedLeaves.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500"><Clock size={40} className="mb-4 opacity-30" /><p className="text-xs font-black uppercase tracking-widest">No shifts mapped.</p></div>
                ) : (
                  <>
                    {approvedLeaves.map(leave => {
                      const u = users.find(x => x.id === leave.user_id);
                      return (
                        <div key={leave.id} className="p-4 rounded-2xl border flex items-center justify-between bg-[#0A0B0E] border-slate-800/80">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-[#0F1117] border border-slate-800 flex items-center justify-center"><Palmtree size={16} className="text-amber-500" /></div>
                            <div><p className="text-sm font-bold text-slate-200">{u?.name || 'Unknown'}</p><p className="text-xs font-bold text-slate-500 mt-0.5">{new Date(leave.start_date).toLocaleDateString()} - {new Date(leave.end_date).toLocaleDateString()}</p></div>
                          </div>
                          <span className="text-[10px] font-black text-amber-500 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg uppercase tracking-widest">APPROVED HOLIDAY</span>
                        </div>
                      );
                    })}
                    {activeShifts.map(shift => {
                      const u = users.find(x => x.id === shift.user_id);
                      return (
                        <div key={shift.id} className="p-4 rounded-2xl border flex items-center justify-between bg-[#0A0B0E] border-slate-800/80 hover:border-slate-700">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-[#0F1117] border border-slate-800 flex items-center justify-center"><UserCheck size={16} className="text-slate-400" /></div>
                            <div><p className="text-sm font-bold text-slate-200">{u?.name || 'Unknown'}</p><p className="text-xs font-bold text-slate-500 mt-0.5">{new Date(shift.start_time).toLocaleDateString()} | {new Date(shift.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(shift.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p></div>
                          </div>
                          <span className="text-[10px] font-black text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-lg uppercase tracking-widest">{shift.assigned_area || 'General'}</span>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            </>
          ) : (
            /* PATTERNS MANAGEMENT VIEW */
            <>
              <div className="flex items-center justify-between mb-6 border-b border-slate-800/80 pb-4">
                <div>
                  <h2 className="text-lg font-black text-white uppercase tracking-widest flex items-center gap-2"><Repeat size={20} className="text-blue-500" /> Active Patterns</h2>
                  <p className="text-xs text-slate-500 mt-1">Core schedules applied during rota generation.</p>
                </div>
                <button className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-[0_0_15px_rgba(37,99,235,0.15)]">
                  <Rocket size={16} /> Rollout Rota
                </button>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3">
                {activePatterns.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500"><Repeat size={40} className="mb-4 opacity-30" /><p className="text-xs font-black uppercase tracking-widest">No patterns mapped.</p></div>
                ) : (
                  activePatterns.map(pattern => {
                    const u = users.find(x => x.id === pattern.user_id);
                    const activeDays = DAYS_OF_WEEK.filter(d => (pattern as any)[d.key]).map(d => d.label).join(', ');
                    return (
                      <div key={pattern.id} className="p-5 rounded-2xl border flex flex-col gap-3 bg-[#0A0B0E] border-slate-800/80">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-bold text-slate-200 flex items-center gap-2"><UserCheck size={14} className="text-blue-500"/> {u?.name || 'Unknown Staff'}</p>
                          <span className="text-[10px] font-black text-slate-400 bg-[#0F1117] border border-slate-800 px-3 py-1.5 rounded-lg uppercase tracking-widest">{pattern.start_time} - {pattern.end_time}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-blue-400">{activeDays}</p>
                          <p className="text-[10px] font-black uppercase text-slate-500">{pattern.assigned_area || 'General Duties'}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}