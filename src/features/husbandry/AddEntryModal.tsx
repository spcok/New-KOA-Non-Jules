import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { dailyLogService } from '../../services/dailyLogService';
import { X, Save, Plus, Trash2 } from 'lucide-react';
import { Animal, DailyLog, OperationalList } from '../../types/schema';
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

  const { data: foodOptions = [] } = useQuery({ 
    queryKey: ['operational_lists', 'FOOD_TYPE'], 
    queryFn: async () => (await supabase.from('operational_lists').select('*').eq('category', 'FOOD_TYPE').eq('is_deleted', false)).data as OperationalList[] 
  });

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

  // WEIGHT STATES
  const [weightNotRequired, setWeightNotRequired] = useState(() => (existingLog as any)?.weight_not_required || false);

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

  // MULTI-ITEM FEED STATES
  const [feedNotRequired, setFeedNotRequired] = useState(false);
  const [feedItems, setFeedItems] = useState<{ id: string, foodType: string, qty: string }[]>([
    { id: crypto.randomUUID(), foodType: '', qty: '' }
  ]);

  const addFeedItem = () => setFeedItems([...feedItems, { id: crypto.randomUUID(), foodType: '', qty: '' }]);
  const removeFeedItem = (id: string) => setFeedItems(feedItems.filter(item => item.id !== id));
  const updateFeedItem = (id: string, field: 'foodType' | 'qty', value: string) => {
    setFeedItems(feedItems.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  // ENV STATES
  const [ambientTemp, setAmbientTemp] = useState(() => existingLog?.temperature_c?.toString() ?? '');
  const [baskingTemp, setBaskingTemp] = useState(() => existingLog?.basking_temp_c?.toString() ?? '');
  const [coolTemp, setCoolTemp] = useState(() => existingLog?.cool_temp_c?.toString() ?? '');
  const [mistLevel, setMistLevel] = useState('Medium');

  if (!isOpen) return null;

  const isAmbientOnly = animal.category !== 'EXOTICS' || animal.ambient_temp_only;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    const submitDate = new Date(`${viewDate}T${time}:00`).toISOString();
    let finalNotes = notes;
    let finalFeedDetails = null;

    // Process Multi-Item JSON and auto-generate readable string for the ledger
    if (initialType === 'FEED' && !existingLog) {
      if (feedNotRequired) {
        finalNotes = `[FAST DAY / FEED OMITTED]\n${finalNotes}`.trim();
      } else {
        const validItems = feedItems.filter(item => item.foodType && item.qty);
        if (validItems.length > 0) {
          finalFeedDetails = validItems.map(item => ({ food_type: item.foodType, quantity: Number(item.qty) }));
          const feedString = validItems.map(i => `${i.qty}x ${i.foodType}`).join(', ');
          finalNotes = `Fed: ${feedString}\n${finalNotes}`.trim();
        }
      }
    }

    if (!existingLog) {
       if (initialType === 'MISTING') finalNotes = `Level: ${mistLevel}\n${finalNotes}`;
       if (initials) finalNotes = `[${initials.toUpperCase()}] ${finalNotes}`;
    } else if (initials && !finalNotes.includes(`[${initials.toUpperCase()}]`)) {
       finalNotes = `[${initials.toUpperCase()}] ${finalNotes}`;
    }

    let finalWeightGrams: number | null = null;
    if (initialType === 'WEIGHT' && !weightNotRequired) {
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
      weight_not_required: weightNotRequired,
      weight_grams: finalWeightGrams,
      weight_unit: animal.weight_unit || 'g',
      feed_details: finalFeedDetails, // <-- INJECT JSONB HERE
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

        <form onSubmit={handleSubmit} className="p-6 space-y-5 relative z-10 max-h-[80vh] overflow-y-auto custom-scrollbar">
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

          {/* ... (WEIGHT SECTION REMAINS EXACTLY THE SAME AS PREVIOUS ITERATION) ... */}
          {initialType === 'WEIGHT' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Weight Data</label>
              </div>

              <label className="flex items-center gap-3 bg-[#0A0B0E] p-3 rounded-xl border border-slate-800/80 shadow-inner cursor-pointer transition-colors hover:border-amber-500/30">
                <input 
                  type="checkbox" 
                  checked={weightNotRequired} 
                  onChange={e => {
                      setWeightNotRequired(e.target.checked);
                      if (e.target.checked) setWeightData({ lbs: '', oz: '', eighths: '', standard: '' });
                  }} 
                  className="w-4 h-4 text-amber-500 bg-[#0F1117] rounded border-slate-700 focus:ring-amber-500/50 focus:ring-offset-[#0A0B0E]" 
                />
                <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Weight Omitted / Not Required</span>
              </label>

              <div className={`transition-opacity duration-200 ${weightNotRequired ? 'opacity-30 pointer-events-none' : ''}`}>
                {isLbs ? (
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <input type="number" min="0" value={weightData.lbs} onChange={e => setWeightData({...weightData, lbs: e.target.value})} className="w-full bg-[#0A0B0E] border border-slate-800/80 rounded-xl pl-3 pr-8 py-3 text-sm font-bold text-white focus:outline-none focus:border-emerald-500/50" placeholder="lb" autoFocus={!weightNotRequired} />
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
                      <input type="number" min="0" value={weightData.oz} onChange={e => setWeightData({...weightData, oz: e.target.value})} className="w-full bg-[#0A0B0E] border border-slate-800/80 rounded-xl pl-3 pr-8 py-3 text-sm font-bold text-white focus:outline-none focus:border-emerald-500/50" placeholder="oz" autoFocus={!weightNotRequired} />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-500 uppercase tracking-widest">oz</span>
                    </div>
                    <div className="flex-1 relative">
                      <input type="number" min="0" max="7" value={weightData.eighths} onChange={e => setWeightData({...weightData, eighths: e.target.value})} className="w-full bg-[#0A0B0E] border border-slate-800/80 rounded-xl pl-3 pr-8 py-3 text-sm font-bold text-white focus:outline-none focus:border-emerald-500/50" placeholder="1/8" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-500 uppercase tracking-widest">/8</span>
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <input type="number" step="0.1" value={weightData.standard} onChange={e => setWeightData({...weightData, standard: e.target.value})} className="w-full bg-[#0A0B0E] border border-slate-800/80 rounded-xl pl-4 pr-10 py-3 text-sm font-bold text-white focus:outline-none focus:border-emerald-500/50" placeholder={`e.g. ${isKg ? '1.5' : '350'}`} autoFocus={!weightNotRequired} />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-500 uppercase tracking-widest">{unit}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {initialType === 'FEED' && !existingLog && (
            <div className="space-y-3">
              <label className="flex items-center gap-3 bg-[#0A0B0E] p-3 rounded-xl border border-slate-800/80 shadow-inner cursor-pointer transition-colors hover:border-rose-500/30">
                <input 
                  type="checkbox" 
                  checked={feedNotRequired} 
                  onChange={e => {
                      setFeedNotRequired(e.target.checked);
                      if (e.target.checked) setFeedItems([{ id: crypto.randomUUID(), foodType: '', qty: '' }]);
                  }} 
                  className="w-4 h-4 text-rose-500 bg-[#0F1117] rounded border-slate-700 focus:ring-rose-500/50 focus:ring-offset-[#0A0B0E]" 
                />
                <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Fast Day / Feed Not Required</span>
              </label>

              <div className={`transition-opacity duration-200 space-y-3 ${feedNotRequired ? 'opacity-30 pointer-events-none' : ''}`}>
                {feedItems.map((item, index) => (
                  <div key={item.id} className="grid grid-cols-[1fr_80px_auto] gap-3 items-end">
                    <div className="space-y-1.5">
                      {index === 0 && <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Food Type</label>}
                      <select value={item.foodType} onChange={e => updateFeedItem(item.id, 'foodType', e.target.value)} className="w-full bg-[#0A0B0E] border border-slate-800/80 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-emerald-500/50 appearance-none">
                        <option value="">Select...</option>
                        {foodOptions.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      {index === 0 && <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Qty</label>}
                      <input type="number" step="0.1" value={item.qty} onChange={e => updateFeedItem(item.id, 'qty', e.target.value)} className="w-full bg-[#0A0B0E] border border-slate-800/80 rounded-xl px-3 py-3 text-sm font-bold text-white focus:outline-none focus:border-emerald-500/50 text-center" placeholder="0" />
                    </div>
                    {feedItems.length > 1 ? (
                      <button type="button" onClick={() => removeFeedItem(item.id)} className="p-3 mb-[1px] bg-[#0A0B0E] border border-slate-800/80 hover:bg-rose-500/10 text-slate-500 hover:text-rose-500 hover:border-rose-500/30 rounded-xl transition-colors">
                        <Trash2 size={16} />
                      </button>
                    ) : (
                      <div className="w-[42px]"></div> /* Placeholder for alignment */
                    )}
                  </div>
                ))}
                
                <button type="button" onClick={addFeedItem} className="mt-2 text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1 hover:text-emerald-400 transition-colors">
                  <Plus size={12} /> Add Food Item
                </button>
              </div>
            </div>
          )}

          {/* ... (MISTING AND ENV SECTIONS REMAIN EXACTLY THE SAME) ... */}
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
              {initialType === 'FEED' && !existingLog ? 'Additional Notes / Remnants' : 'Notes & Observations'}
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