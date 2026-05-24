// src/features/staff/RotaManager.tsx
import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Calendar as CalendarIcon, Clock, UserCheck, ChevronLeft, ChevronRight, Lock, Palmtree } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { rotaService } from '../../services/rotaService';
import type { Shift, LeaveRequest, User } from '../../types/schema';

// We'll keep this here for when we re-enable RBAC
const ROTA_MANAGEMENT_ROLES = ['ADMIN', 'HEAD KEEPER', 'SENIOR KEEPER', 'OWNER DIRECTOR'];

export function RotaManager() {
  const currentUser = useAuthStore(s => s.user);
  const queryClient = useQueryClient();
  
  // --- TEMPORARY RBAC BYPASS ---
  // const userRole = currentUser?.role?.toUpperCase() || '';
  // const canManageRota = ROTA_MANAGEMENT_ROLES.includes(userRole);
  const canManageRota = true; // Hardcoded to true for development
  // -----------------------------

  const { data: shifts = [] } = useQuery<Shift[]>({ queryKey: ['shifts'], queryFn: () => [], staleTime: Infinity });
  const { data: leaveRequests = [] } = useQuery<LeaveRequest[]>({ queryKey: ['leave_requests'], queryFn: () => [], staleTime: Infinity });
  const { data: users = [] } = useQuery<User[]>({ queryKey: ['users'], queryFn: () => [], staleTime: Infinity });

  const activeShifts = shifts.filter(s => !s.is_deleted);
  const activeUsers = users.filter(u => !u.is_deleted && u.is_active);
  
  const approvedLeaves = leaveRequests.filter(l => !l.is_deleted && l.status === 'approved');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userId, setUserId] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [assignedArea, setAssignedArea] = useState('');

  const handleScheduleShift = async (e: React.FormEvent) => {
    e.preventDefault();
    // Removed the !canManageRota block since it's hardcoded to true anyway, 
    // but kept the other safety checks.
    if (!currentUser?.id || !userId || !startTime || !endTime) return;

    setIsSubmitting(true);
    const payload: Partial<Shift> = {
      user_id: userId,
      start_time: new Date(startTime).toISOString(),
      end_time: new Date(endTime).toISOString(),
      assigned_area: assignedArea || null,
    };

    const optimisticShift: Shift = {
      ...payload,
      id: crypto.randomUUID(),
      is_deleted: false,
      created_at: new Date().toISOString(),
    } as Shift;

    queryClient.setQueryData(['shifts'], (old: Shift[] = []) => [...old, optimisticShift]);

    try {
      await rotaService.saveShift(payload, currentUser.id);
      setUserId('');
      setStartTime('');
      setEndTime('');
      setAssignedArea('');
    } catch (error) {
      console.error("Mutation failed, fallback to outbox handled.", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto font-sans">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase flex items-center gap-3">
            Rota & Scheduling
          </h1>
          <p className="text-slate-400 mt-1 flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
            {canManageRota ? 'Management Dashboard | 🛡️ Full Access (Dev Mode)' : 'Keeper View | 🔒 Read-Only Rota'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* LEFT COLUMN: Controls & Forms */}
        <div className="lg:col-span-1 space-y-6">
          {canManageRota ? (
            <div className="bg-[#0F1117] rounded-3xl border border-slate-800/80 shadow-2xl p-6">
              <h2 className="text-sm font-black text-white uppercase tracking-widest mb-5 border-b border-slate-800/80 pb-4">
                Deploy Shift
              </h2>
              <form onSubmit={handleScheduleShift} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Assign Staff</label>
                  <select
                    required
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    className="w-full bg-[#0A0B0E] border border-slate-800/80 rounded-xl px-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-blue-500/50 transition-colors shadow-inner appearance-none"
                  >
                    <option value="" disabled>Select a staff member...</option>
                    {activeUsers.map(user => {
                      const isOnLeave = approvedLeaves.some(l => l.user_id === user.id);
                      return (
                        <option key={user.id} value={user.id} className={isOnLeave ? "text-amber-500" : ""}>
                          {user.name} ({user.role || 'Unassigned Role'}) {isOnLeave ? ' [ON LEAVE]' : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Start Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full bg-[#0A0B0E] border border-slate-800/80 rounded-xl px-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-blue-500/50 transition-colors shadow-inner"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">End Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full bg-[#0A0B0E] border border-slate-800/80 rounded-xl px-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-blue-500/50 transition-colors shadow-inner"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Area / Zone</label>
                  <input
                    type="text"
                    placeholder="e.g., Quarantine, Displays"
                    value={assignedArea}
                    onChange={(e) => setAssignedArea(e.target.value)}
                    className="w-full bg-[#0A0B0E] border border-slate-800/80 rounded-xl px-4 py-2.5 text-xs font-bold text-white placeholder-slate-700 focus:outline-none focus:border-blue-500/50 transition-colors shadow-inner"
                  />
                </div>

                <button 
                  type="submit"
                  disabled={isSubmitting || !userId || !startTime || !endTime}
                  className="w-full mt-2 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-[0_0_15px_rgba(37,99,235,0.15)]"
                >
                  {isSubmitting ? 'Saving...' : 'Deploy Shift'}
                </button>
              </form>
            </div>
          ) : (
            <div className="bg-[#0F1117] rounded-3xl border border-slate-800/80 shadow-2xl p-6 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-12 h-12 bg-slate-800/50 rounded-full flex items-center justify-center text-slate-400">
                <Lock size={20} />
              </div>
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-widest">Read-Only View</h3>
                <p className="text-xs font-bold text-slate-500 mt-2">
                  Shift scheduling is restricted to management. You can view your upcoming shifts on the calendar to the right.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Calendar Visualization */}
        <div className="lg:col-span-3 bg-[#0F1117] rounded-3xl border border-slate-800/80 shadow-2xl p-6 flex flex-col h-[800px]">
          
          <div className="flex items-center justify-between mb-6 border-b border-slate-800/80 pb-4">
            <h2 className="text-lg font-black text-white uppercase tracking-widest flex items-center gap-2">
              <CalendarIcon size={20} className="text-blue-500" /> Current Rota
            </h2>
            <div className="flex gap-2">
              <button className="p-2 bg-[#0A0B0E] border border-slate-800 hover:border-slate-600 rounded-lg text-slate-400 transition-colors">
                <ChevronLeft size={16} />
              </button>
              <button className="px-4 py-2 bg-[#0A0B0E] border border-slate-800 rounded-lg text-xs font-bold text-white uppercase tracking-widest">
                Today
              </button>
              <button className="p-2 bg-[#0A0B0E] border border-slate-800 hover:border-slate-600 rounded-lg text-slate-400 transition-colors">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {activeShifts.length === 0 && approvedLeaves.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500">
                <Clock size={40} className="mb-4 opacity-30" />
                <p className="text-xs font-black uppercase tracking-widest">No shifts or leave mapped in local vault.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* 1. Render Approved Leaves */}
                {approvedLeaves.map(leave => {
                  const assignee = users.find(u => u.id === leave.user_id);
                  const isMyLeave = currentUser?.id === leave.user_id;

                  return (
                    <div 
                      key={leave.id} 
                      className={`p-4 rounded-2xl border flex items-center justify-between shadow-inner transition-colors ${
                        isMyLeave 
                          ? 'bg-amber-500/10 border-amber-500/30' 
                          : 'bg-[#0A0B0E] border-slate-800/80'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-[#0F1117] border border-slate-800 flex items-center justify-center">
                          <Palmtree size={16} className={isMyLeave ? 'text-amber-400' : 'text-slate-500'} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-200">
                            {assignee?.name || 'Unknown Staff'}
                            {isMyLeave && <span className="ml-2 text-[9px] bg-amber-500 text-white px-1.5 py-0.5 rounded uppercase tracking-wider">You</span>}
                          </p>
                          <p className="text-xs font-bold text-slate-500 mt-0.5">
                            {new Date(leave.start_date).toLocaleDateString()} - {new Date(leave.end_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-black text-amber-500 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg uppercase tracking-widest">
                          APPROVED HOLIDAY
                        </span>
                      </div>
                    </div>
                  );
                })}

                {/* 2. Render Standard Shifts */}
                {activeShifts.map(shift => {
                  const assignee = users.find(u => u.id === shift.user_id);
                  const isMyShift = currentUser?.id === shift.user_id;

                  return (
                    <div 
                      key={shift.id} 
                      className={`p-4 rounded-2xl border flex items-center justify-between shadow-inner transition-colors ${
                        isMyShift 
                          ? 'bg-blue-600/10 border-blue-500/30' 
                          : 'bg-[#0A0B0E] border-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-[#0F1117] border border-slate-800 flex items-center justify-center">
                          <UserCheck size={16} className={isMyShift ? 'text-blue-400' : 'text-slate-400'} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-200">
                            {assignee?.name || 'Unknown Staff'}
                            {isMyShift && <span className="ml-2 text-[9px] bg-blue-500 text-white px-1.5 py-0.5 rounded uppercase tracking-wider">You</span>}
                          </p>
                          <p className="text-xs font-bold text-slate-500 mt-0.5">
                            {new Date(shift.start_time).toLocaleDateString()} | {new Date(shift.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(shift.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-black text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-lg uppercase tracking-widest">
                          {shift.assigned_area || 'General Duties'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}