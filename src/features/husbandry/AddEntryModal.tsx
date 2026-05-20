import React, { useState } from 'react';
import { dailyLogService } from '../../services/dailyLogService';
import { X, Save } from 'lucide-react';
import { Animal, DailyLog } from '../../types/schema';
import { useAuthStore } from '../../store/authStore';

interface AddEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  animal: Animal;
  initialType: string;
  existingLog: DailyLog | undefined;
  viewDate: string;
}

export default function AddEntryModal({ 
  isOpen, onClose, animal, initialType, existingLog, viewDate 
}: AddEntryModalProps) {
  
  // IMMUTABLE STORE LAW: Accessing state with explicit selection
  const user = useAuthStore((s) => s.user);

  const [time, setTime] = useState(() => 
    existingLog?.log_date 
      ? new Date(existingLog.log_date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
      : new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  );
  
  const [initials, setInitials] = useState('');
  const [notes, setNotes] = useState(() => existingLog?.notes || '');
  
  const unit = (animal.weight_unit || 'g').toLowerCase();
  const isLbs = unit === 'lbs' || unit === 'lb';
  const isOz = unit === 'oz';
  const isKg = unit === 'kg';

  // Hydrate weight states directly inline upon structural initialization
  const [weightData, setWeightData] = useState(() => {
    const g = existingLog?.weight_grams;
    if (g == null) return { lbs: '', oz: '', eighths: '', standard: '' };
    
    if (isLbs || isOz) {
      const totalOz = g / 28.349523125;
      let eighths = Math.round((totalOz - Math.floor(totalOz)) * 8);
      let oz = Math.floor(totalOz);
      if (eighths === 8) { eighths = 0; oz++; }
      
      if (isLbs) {
        const lbs = Math.floor(oz / 16);
        oz = oz % 16;
        return { lbs: lbs.toString(), oz: oz.toString(), eighths: eighths ? eighths.toString() : '', standard: '' };
      } else {
        return { lbs: '', oz: oz.toString(), eighths: eighths ? eighths.toString() : '', standard: '' };
      }
    } else if (isKg) {
      return { lbs: '', oz: '', eighths: '', standard: (g / 1000).toString() };
    } else {
      return { lbs: '', oz: '', eighths: '', standard: g.toString() };
    }
  });

  const [ambientTemp, setAmbientTemp] = useState(() => existingLog?.temperature_c?.toString() ?? '');
  const [baskingTemp, setBaskingTemp] = useState(() => existingLog?.basking_temp_c?.toString() ?? '');
  const [coolTemp, setCoolTemp] = useState(() => existingLog?.cool_temp_c?.toString() ?? '');
  const [mistLevel, setMistLevel] = useState('Medium');

  if (!isOpen) return null;

  const isAmbientOnly = animal.category !== 'EXOTICS' || animal.ambient_temp_only;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) {
      console.error("Cannot save log: No authenticated identity user present.");
      return;
    }

    const submitDate = new Date(`${viewDate}T${time}:00`).toISOString();
    
    let finalNotes = notes;
    if (!existingLog) {
       if (initialType === 'MISTING') finalNotes = `Level: ${mistLevel}\n${finalNotes}`;
       if (initials) finalNotes = `[${initials.toUpperCase()}] ${finalNotes}`;
    } else if (initials && !finalNotes.includes(`[${initials.toUpperCase()}]`)) {
       finalNotes = `[${initials.toUpperCase()}] ${finalNotes}`;
    }

    let finalWeightGrams: number | null = null;
    if (initialType === 'WEIGHT') {
      if (isLbs || isOz) {
         if (weightData.lbs || weightData.oz || weightData.eighths) {
            const lbs = Number(weightData.lbs || 0);
            const oz = Number(weightData.oz || 0);
            const eighths = Number(weightData.eighths || 0);
            const totalOz = (isLbs ? lbs * 16 : 0) + oz + (eighths / 8);
            finalWeightGrams = Number((totalOz * 28.349523125).toFixed(2));
         }
      } else {
         if (weightData.standard !== '') {
            const val = Number(weightData.standard);
            finalWeightGrams = isKg ? Number((val * 1000).toFixed(2)) : val;
         }
      }
    }

    // NULL LAW: Strictly evaluate empty configurations to explicit null markers
    await dailyLogService.saveLog({
      id: existingLog?.id,
      animal_id: animal.id as string,
      log_date: submitDate,
      log_type: initialType,
      notes: finalNotes || null,
      weight_grams: finalWeightGrams,
      weight_unit: animal.weight_unit || 'g',
      temperature_c: ambientTemp === '' ? null : Number(ambientTemp),
      basking_temp_c: baskingTemp === '' ? null : Number(baskingTemp),
      cool_temp_c: coolTemp === '' ? null : Number(coolTemp),
      ...(existingLog ? {} : { created_by: user.id }),
      modified_by: user.id,
    }, user.id);

    onClose();
  };

  const titles: Record<string, string> = {
    'WEIGHT': 'Record Weight',
    'FEED': 'Record Feed',
    'MISTING': 'Record Misting',
    'ENV': 'Environment Logs'
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-sans">
      <div className="bg-[#0F1117] border border-slate-800/80 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden relative">
        <div className="bg-[#0A0B0E] border-b border-slate-800/80 p-5 flex justify-between items-center relative z-10">
          <div>
            <h2 className="text-sm font-black text-white uppercase tracking-widest">{titles[initialType] || 'Log Entry'}</h2>
            <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mt-0.5">{animal.name}</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 bg-[#0F1117] hover:bg-rose-500/10 text-slate-500 hover:text-rose-500 rounded-xl transition-colors border border-slate-800/80 hover:border-rose-500/20">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 relative z-10">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Time</label>
              <input type="time" value={time} onChange={e => setTime(e.target.value)} required className="w-full bg-[#0A0B0E] border border-slate-800/80 rounded-xl px-4 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-emerald-500/50 [&::-webkit-calendar-picker-indicator]:invert" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Initials</label>
              <input type="text" value={initials} onChange={e => setInitials(e.target.value)} maxLength={3} className="w-full bg-[#0A0B0E] border border-slate-800/80 rounded-xl px-4 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-emerald-500/50 uppercase placeholder:text-slate-700" placeholder="e.g. JM" />
            </div>
          </div>

          {initialType === 'WEIGHT' && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Weight Data</label>
              {isLbs ? (
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <input type="number" min="0" value={weightData.lbs} onChange={e => setWeightData({...weightData, lbs: e.target.value})} className="w-full bg-[#0A0B0E] border border-slate-800/80 rounded-xl pl-3 pr-8 py-3 text-sm font-bold text-white focus:outline-none focus:border-emerald-500/50" placeholder="lb" autoFocus />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-500 uppercase tracking-widest">lb</span>
                  </div>
                  <div className="flex-1 relative">
                    <input type="number" min="0" max="15" value={weightData.oz} onChange={e => setWeightData({...weightData, oz: e.target.value})} className="w-full bg-[#0A0B0E] border border-slate-800/80 rounded-xl pl-3 pr-8 py-3 text-sm font-bold text-white focus:outline-none focus:border-emerald-500/50" placeholder="oz" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-500 uppercase tracking-widest">oz</span>
                  </div>
                  <div className="flex-1 relative">
                    <input type="number" min="0" max="7" value={weightData.eighths} onChange={e => setWeightData({...weightData, eighths: e.target.value})} className="w-full bg-[#0A0B0E] border border-slate-800/80 rounded-xl pl-3 pr-8 py-3 text-sm font-bold text-white focus:outline-none focus:border-emerald-500/50" placeholder="1/8" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-500 uppercase tracking-widest">/8</span>
                  </div>
                </div>
              ) : isOz ? (
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <input type="number" min="0" value={weightData.oz} onChange={e => setWeightData({...weightData, oz: e.target.value})} className="w-full bg-[#0A0B0E] border border-slate-800/80 rounded-xl pl-3 pr-8 py-3 text-sm font-bold text-white focus:outline-none focus:border-emerald-500/50" placeholder="oz" autoFocus />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-500 uppercase tracking-widest">oz</span>
                  </div>
                  <div className="flex-1 relative">
                    <input type="number" min="0" max="7" value={weightData.eighths} onChange={e => setWeightData({...weightData, eighths: e.target.value})} className="w-full bg-[#0A0B0E] border border-slate-800/80 rounded-xl pl-3 pr-8 py-3 text-sm font-bold text-white focus:outline-none focus:border-emerald-500/50" placeholder="1/8" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-500 uppercase tracking-widest">/8</span>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <input type="number" step="0.1" value={weightData.standard} onChange={e => setWeightData({...weightData, standard: e.target.value})} className="w-full bg-[#0A0B0E] border border-slate-800/80 rounded-xl pl-4 pr-10 py-3 text-sm font-bold text-white focus:outline-none focus:border-emerald-500/50" placeholder={`e.g. ${isKg ? '1.5' : '350'}`} autoFocus />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-500 uppercase tracking-widest">{unit}</span>
                </div>
              )}
            </div>
          )}

          {initialType === 'MISTING' && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Misting Level</label>
              <select value={mistLevel} onChange={e => setMistLevel(e.target.value)} className="w-full bg-[#0A0B0E] border border-slate-800/80 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-emerald-500/50 appearance-none">
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
          )}

          {initialType === 'ENV' && isAmbientOnly && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Ambient Temp (°C)</label>
              <input type="number" step="0.1" value={ambientTemp} onChange={e => setAmbientTemp(e.target.value)} className="w-full bg-[#0A0B0E] border border-slate-800/80 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-emerald-500/50" autoFocus />
            </div>
          )}

          {initialType === 'ENV' && !isAmbientOnly && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Basking Temp (°C)</label>
                <input type="number" step="0.1" value={baskingTemp} onChange={e => setBaskingTemp(e.target.value)} className="w-full bg-[#0A0B0E] border border-slate-800/80 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-emerald-500/50" autoFocus />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Cool Temp (°C)</label>
                <input type="number" step="0.1" value={coolTemp} onChange={e => setCoolTemp(e.target.value)} className="w-full bg-[#0A0B0E] border border-slate-800/80 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-emerald-500/50" />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
              {initialType === 'FEED' ? 'Items Fed / Remnants (Ops List Pending)' : 'Notes & Observations'}
            </label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="w-full bg-[#0A0B0E] border border-slate-800/80 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-emerald-500/50 resize-none" />
          </div>

          <div className="pt-2">
            <button type="submit" className="w-full flex items-center justify-center gap-2 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.15)]">
              <Save size={16} /> Save Entry
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}