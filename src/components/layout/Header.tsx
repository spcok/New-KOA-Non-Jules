import React from 'react';
import { LogOut } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export function Header() {
  const signOut = useAuthStore((s) => s.signOut);
  const session = useAuthStore((s) => s.session);

  return (
    <header className="h-16 bg-[#0F1117] border-b border-slate-800/80 flex items-center justify-between px-6 shrink-0 z-10 sticky top-0">
      <div className="flex items-center">
        <span className="text-slate-300 font-bold text-sm">
          {session?.user?.email || 'Guest User'}
        </span>
      </div>
      <button
        onClick={() => signOut()}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest text-slate-400 hover:text-white hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all"
      >
        <LogOut size={14} />
        Log Out
      </button>
    </header>
  );
}
