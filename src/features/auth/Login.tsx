import React, { useState } from 'react';
import { ShieldAlert, Loader2, Lock, AlertTriangle } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured) {
      setError("Authentication is disabled because Supabase is not configured. Please set the environment variables in .env.example/Settings.");
      return;
    }
    
    setLoading(true);
    setError(null);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) setError(signInError.message);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0B0E] p-4 font-sans">
      <div className="w-full max-w-md bg-[#0F1117] border border-slate-800/80 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        
        {/* Glow effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-emerald-500/20 blur-[64px] rounded-full pointer-events-none" />

        <div className="flex flex-col items-center mb-8 relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-[#0A0B0E] border border-slate-800/80 flex items-center justify-center mb-4 shadow-inner">
            <ShieldAlert size={32} className="text-emerald-500" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Vetaura Systems</h1>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-2">Clinical Access Portal</p>
        </div>

        {!isSupabaseConfigured && (
          <div className="mb-6 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-start gap-3 relative z-10">
            <AlertTriangle size={16} className="text-yellow-500 mt-0.5 shrink-0" />
            <p className="text-xs font-bold text-yellow-500 leading-relaxed">
              Supabase integration is missing. Check your Settings to supply VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.
            </p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5 relative z-10">
          {error && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-3">
              <Lock size={16} className="text-rose-400 mt-0.5 shrink-0" />
              <p className="text-xs font-bold text-rose-400 leading-relaxed">{error}</p>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Staff Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-[#0A0B0E] border border-slate-800/80 rounded-xl text-sm font-bold text-white focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all shadow-inner"
              placeholder="vet@facility.com"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Passcode</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-[#0A0B0E] border border-slate-800/80 rounded-xl text-sm font-bold text-white focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all shadow-inner"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(16,185,129,0.15)] flex items-center justify-center gap-2 mt-2"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : 'Authenticate'}
          </button>
        </form>
      </div>
    </div>
  );
}