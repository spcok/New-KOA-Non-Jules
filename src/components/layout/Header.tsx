import React, { useState } from 'react';
import { LogOut, Play, Square, Loader2 } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useQuery } from '@tanstack/react-query';
import { timesheetService } from '../../services/timesheetService';

export function Header() {
  const signOut = useAuthStore((s) => s.signOut);
  const session = useAuthStore((s) => s.session);
  const [isProcessing, setIsProcessing] = useState(false);

  // Poll for the active shift. This silently triggers the auto-checkout if a stale shift is found.
  const { data: activeShift, isLoading: checkingShift } = useQuery({
    queryKey: ['active_shift', session?.user?.id],
    queryFn: () => timesheetService.getActiveShift(session?.user?.id as string),
    enabled: !!session?.user?.id,
  });

  const handleClockAction = async () => {
    if (!session?.user?.id) return;
    setIsProcessing(true);
    try {
      if (activeShift) {
        await timesheetService.clockOut(activeShift, session.user.id);
      } else {
        await timesheetService.clockIn(session.user.id);
      }
    } catch (error) {
      console.error("Failed to update timesheet", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <header className="h-16 bg-[#0F1117] border-b border-slate-800/80 flex items-center justify-between px-6 shrink-0 z-10 sticky top-0">
      
      {/* LEFT SIDE: Active Shift Controls */}
      <div className="flex items-center gap-4">
        {session?.user?.id && (
          <button 
            onClick={handleClockAction}
            disabled={isProcessing || checkingShift}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all disabled:opacity-50 ${
              activeShift 
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-[0_0_15px_rgba(225,29,72,0.15)]' 
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.15)]'
            }`}
          >
            {isProcessing || checkingShift ? <Loader2 size={14} className="animate-spin" /> : activeShift ? <Square size={14} /> : <Play size={14} />}
            {activeShift ? 'Clock Out' : 'Clock In'}
          </button>
        )}
      </div>

      {/* RIGHT SIDE: User Info & Logout */}
      <div className="flex items-center gap-4">
        <span className="text-slate-400 font-bold text-xs uppercase tracking-widest hidden sm:block">
          {session?.user?.email || 'Guest User'}
        </span>
        <div className="h-4 w-px bg-slate-800/80 hidden sm:block"></div>
        <button
          onClick={() => signOut()}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-black uppercase tracking-widest text-slate-500 hover:text-white hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all"
        >
          <LogOut size={14} />
          <span className="hidden sm:inline">Log Out</span>
        </button>
      </div>
      
    </header>
  );
}