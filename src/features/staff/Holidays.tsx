import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarDays, Clock, CheckCircle2, XCircle, Palmtree, UserCheck, Inbox } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { rotaService } from '../../services/rotaService';
import type { LeaveRequest, User } from '../../types/schema';

// const LEAVE_MANAGEMENT_ROLES = ['ADMIN', 'HEAD KEEPER', 'SENIOR KEEPER', 'OWNER DIRECTOR'];

export function Holidays() {
  const currentUser = useAuthStore(s => s.user);
  const queryClient = useQueryClient();
  
  // --- TEMPORARY RBAC BYPASS FOR DEV ---
  const canManageLeave = true; 
  // const userRole = currentUser?.role?.toUpperCase() || '';
  // const canManageLeave = LEAVE_MANAGEMENT_ROLES.includes(userRole);
  // -------------------------------------

  const { data: leaveRequests = [] } = useQuery<LeaveRequest[]>({ queryKey: ['leave_requests'], queryFn: () => [], staleTime: Infinity });
  const { data: users = [] } = useQuery<User[]>({ queryKey: ['users'], queryFn: () => [], staleTime: Infinity });

  const activeRequests = leaveRequests.filter(l => !l.is_deleted);
  
  // Filter views based on role
  const myRequests = activeRequests.filter(l => l.user_id === currentUser?.id).sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());
  const pendingTeamRequests = activeRequests.filter(l => l.status === 'pending' && l.user_id !== currentUser?.id);

  // Form State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.id || !startDate || !endDate) return;

    setIsSubmitting(true);
    const payload: Partial<LeaveRequest> = {
      user_id: currentUser.id,
      start_date: startDate,
      end_date: endDate,
      status: 'pending',
      notes: notes || null,
    };

    const optimisticRequest: LeaveRequest = {
      ...payload,
      id: crypto.randomUUID(),
      is_deleted: false,
      created_at: new Date().toISOString(),
    } as LeaveRequest;

    queryClient.setQueryData(['leave_requests'], (old: LeaveRequest[] = []) => [optimisticRequest, ...old]);

    try {
      await rotaService.saveLeaveRequest(payload, currentUser.id);
      setStartDate('');
      setEndDate('');
      setNotes('');
    } catch (error) {
      console.error("Mutation failed, fallback to outbox handled.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (request: LeaveRequest, newStatus: 'approved' | 'rejected') => {
    if (!currentUser?.id) return;

    const payload: Partial<LeaveRequest> = {
      id: request.id,
      status: newStatus,
      reviewed_by: currentUser.id
    };

    // Optimistic cache injection
    queryClient.setQueryData(['leave_requests'], (old: LeaveRequest[] = []) => 
      old.map(l => l.id === request.id ? { ...l, status: newStatus, reviewed_by: currentUser.id } : l)
    );

    try {
      await rotaService.saveLeaveRequest(payload, currentUser.id);
    } catch (error) {
      console.error("Status update failed, queueing to outbox.");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved': return <span className="flex items-center gap-1 text-[10px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-lg uppercase tracking-widest"><CheckCircle2 size={12}/> Approved</span>;
      case 'rejected': return <span className="flex items-center gap-1 text-[10px] font-black text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-1 rounded-lg uppercase tracking-widest"><XCircle size={12}/> Rejected</span>;
      default: return <span className="flex items-center gap-1 text-[10px] font-black text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-lg uppercase tracking-widest"><Clock size={12}/> Pending</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto font-sans">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase flex items-center gap-3">
            Holiday & Leave
          </h1>
          <p className="text-slate-400 mt-1 flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
            {canManageLeave ? 'Management Dashboard | 🛡️ Approvals Active (Dev Mode)' : 'Staff Portal | 🌴 Submit Requests'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: Request Form */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-[#0F1117] rounded-3xl border border-slate-800/80 shadow-2xl p-6">
            <h2 className="text-sm font-black text-white uppercase tracking-widest mb-5 border-b border-slate-800/80 pb-4 flex items-center gap-2">
              <Palmtree size={18} className="text-blue-500"/> Request Time Off
            </h2>
            <form onSubmit={handleSubmitRequest} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Start Date</label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-[#0A0B0E] border border-slate-800/80 rounded-xl px-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-blue-500/50 transition-colors shadow-inner"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">End Date (Inclusive)</label>
                <input
                  type="date"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-[#0A0B0E] border border-slate-800/80 rounded-xl px-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-blue-500/50 transition-colors shadow-inner"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Notes / Reason (Optional)</label>
                <textarea
                  rows={3}
                  placeholder="e.g., Annual family holiday..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-[#0A0B0E] border border-slate-800/80 rounded-xl px-4 py-3 text-xs font-bold text-white placeholder-slate-700 focus:outline-none focus:border-blue-500/50 transition-colors shadow-inner resize-none"
                />
              </div>

              <button 
                type="submit"
                disabled={isSubmitting || !startDate || !endDate}
                className="w-full mt-2 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-[0_0_15px_rgba(37,99,235,0.15)]"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </form>
          </div>
        </div>

        {/* RIGHT COLUMN: Ledger & Management Inbox */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* MANAGEMENT INBOX (Only visible if canManageLeave is true) */}
          {canManageLeave && (
            <div className="bg-[#0F1117] rounded-3xl border border-slate-800/80 shadow-2xl p-6 flex flex-col max-h-[400px]">
              <div className="flex items-center justify-between mb-5 border-b border-slate-800/80 pb-4">
                <h2 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                  <Inbox size={18} className="text-amber-500" /> Team Action Inbox
                </h2>
                <span className="text-[10px] font-black text-amber-500 bg-amber-500/10 px-2 py-1 rounded-lg uppercase tracking-widest">
                  {pendingTeamRequests.length} Pending
                </span>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
                {pendingTeamRequests.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-600 py-8">
                    <CheckCircle2 size={32} className="mb-3 opacity-30" />
                    <p className="text-[10px] font-black uppercase tracking-widest">Inbox Zero. All caught up.</p>
                  </div>
                ) : (
                  pendingTeamRequests.map(request => {
                    const staff = users.find(u => u.id === request.user_id);
                    return (
                      <div key={request.id} className="p-4 rounded-2xl border border-slate-800/80 bg-[#0A0B0E] flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-[#0F1117] border border-slate-800 flex items-center justify-center">
                            <UserCheck size={16} className="text-slate-400" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-200">{staff?.name || 'Unknown Staff'}</p>
                            <p className="text-xs font-bold text-slate-500 mt-0.5">
                              {new Date(request.start_date).toLocaleDateString()} to {new Date(request.end_date).toLocaleDateString()}
                            </p>
                            {request.notes && <p className="text-[10px] text-slate-400 italic mt-1 max-w-md line-clamp-1">"{request.notes}"</p>}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleUpdateStatus(request, 'rejected')}
                            className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 font-black text-[10px] uppercase tracking-widest rounded-xl transition-all"
                          >
                            Reject
                          </button>
                          <button 
                            onClick={() => handleUpdateStatus(request, 'approved')}
                            className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 font-black text-[10px] uppercase tracking-widest rounded-xl transition-all"
                          >
                            Approve
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* MY PERSONAL LEDGER */}
          <div className="bg-[#0F1117] rounded-3xl border border-slate-800/80 shadow-2xl p-6 flex flex-col flex-1 min-h-[300px]">
            <div className="flex items-center justify-between mb-5 border-b border-slate-800/80 pb-4">
              <h2 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                <CalendarDays size={18} className="text-blue-500" /> My Leave History
              </h2>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
              {myRequests.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-600 py-8">
                  <Palmtree size={32} className="mb-3 opacity-30" />
                  <p className="text-[10px] font-black uppercase tracking-widest">No holiday requests filed.</p>
                </div>
              ) : (
                myRequests.map(request => (
                  <div key={request.id} className="p-4 rounded-2xl border border-slate-800/80 bg-[#0A0B0E] flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-slate-200">
                        {new Date(request.start_date).toLocaleDateString()} to {new Date(request.end_date).toLocaleDateString()}
                      </p>
                      {request.notes && <p className="text-[10px] text-slate-500 mt-1">"{request.notes}"</p>}
                    </div>
                    {getStatusBadge(request.status)}
                  </div>
                ))
              )}
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}