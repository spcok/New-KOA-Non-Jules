import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from '@tanstack/react-form';
import { supabase } from '../../lib/supabase';
import { Animal, FeedingSchedule as FeedingScheduleType, OperationalList } from '../../types/schema';
import { feedingService } from '../../services/feedingService';
import { useAuthStore } from '../../store/authStore';
import { CalendarClock, Plus, Trash2, Loader2, Utensils, RefreshCw, Calendar as CalIcon, Filter } from 'lucide-react';

const getLocalDateString = () => new Date().toISOString().split('T')[0];

export default function FeedingSchedule() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<string>('EXOTICS');
  const categories = ['OWLS', 'RAPTORS', 'MAMMALS', 'EXOTICS'];

  // Filters and Views
  const [filterAnimalId, setFilterAnimalId] = useState<string>('ALL');
  const [viewLayout, setViewLayout] = useState<'individual' | 'grouped'>('individual');

  // 1. Data Fetching
  const { data: animals = [], isLoading: loadingAnimals } = useQuery({ 
    queryKey: ['animals'], 
    queryFn: async () => (await supabase.from('animals').select('*').eq('is_deleted', false)).data as Animal[] 
  });

  const { data: schedules = [], isLoading: loadingSchedules } = useQuery({ 
    queryKey: ['feeding_schedules'], 
    queryFn: async () => (await supabase.from('feeding_schedules').select('*').eq('is_deleted', false).eq('is_completed', false)).data as FeedingScheduleType[] 
  });

  const { data: foodOptions = [] } = useQuery({ 
    queryKey: ['operational_lists', 'FOOD_TYPE'], 
    queryFn: async () => (await supabase.from('operational_lists').select('*').eq('category', 'FOOD_TYPE').eq('is_deleted', false)).data as OperationalList[] 
  });

  const filteredAnimals = animals.filter(a => (a.category || '').toUpperCase() === activeTab);
  
  // Base Sorting
  const upcomingSchedules = [...schedules].sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date));

  // Applying Filters and Groupings
  const displayedSchedules = useMemo(() => {
      let filtered = upcomingSchedules;
      if (filterAnimalId !== 'ALL') {
          filtered = filtered.filter(s => s.animal_id === filterAnimalId);
      }
      return filtered;
  }, [upcomingSchedules, filterAnimalId]);

  const groupedSchedules = useMemo(() => {
      const groups = new Map();
      displayedSchedules.forEach(schedule => {
          // Group by identical feed parameters
          const key = `${schedule.animal_id}_${schedule.food_type}_${schedule.quantity}_${schedule.interval_days || 'single'}_${schedule.calci_dust}`;
          
          if (!groups.has(key)) {
              groups.set(key, { 
                  ...schedule, 
                  count: 1, 
                  end_date: schedule.scheduled_date, 
                  start_date: schedule.scheduled_date, 
                  child_ids: [schedule.id] 
              });
          } else {
              const existing = groups.get(key);
              existing.count += 1;
              if (schedule.scheduled_date > existing.end_date) existing.end_date = schedule.scheduled_date;
              if (schedule.scheduled_date < existing.start_date) existing.start_date = schedule.scheduled_date;
              existing.child_ids.push(schedule.id);
          }
      });
      return Array.from(groups.values());
  }, [displayedSchedules]);

  // 2. TanStack Form Definition
  const session = useAuthStore(state => state.session);
  const form = useForm({
    defaultValues: {
      animal_id: '',
      food_type: '',
      quantity: 1,
      calci_dust: false,
      feed_not_required: false,
      schedule_mode: 'single' as 'single' | 'interval',
      target_date: getLocalDateString(),
      interval_days: 3,
      occurrences: 5
    },
    onSubmit: async ({ value }) => {
        let datesToSchedule: string[] = [];

        if (value.schedule_mode === 'single') {
            datesToSchedule.push(value.target_date);
        } else {
            const [y, m, d] = value.target_date.split('-').map(Number);
            const startDate = new Date(y, m - 1, d);

            for (let i = 0; i < value.occurrences; i++) {
                const current = new Date(startDate);
                current.setDate(startDate.getDate() + (i * value.interval_days));
                datesToSchedule.push(current.toISOString().split('T')[0]);
            }
        }

        const newSchedules = datesToSchedule.map(date => ({
            animal_id: value.animal_id,
            scheduled_date: date,
            food_type: value.feed_not_required ? 'NOT REQUIRED' : value.food_type,
            quantity: value.feed_not_required ? 0 : value.quantity,
            calci_dust: value.calci_dust,
            feed_not_required: value.feed_not_required,
            is_completed: value.feed_not_required, // Auto-complete if it's a fast day
            is_deleted: false,
            interval_days: value.schedule_mode === 'interval' ? value.interval_days : null
        }));

        if (!session?.user?.id) return;
        await feedingService.bulkCreateSchedules(newSchedules as Omit<FeedingScheduleType, 'id' | 'created_at' | 'updated_at'>[], session.user.id);
        form.reset();
    }
  });

  if (loadingAnimals || loadingSchedules) return <div className="flex justify-center items-center min-h-screen bg-[#0F1117]"><Loader2 className="animate-spin text-emerald-500 w-12 h-12" /></div>;

  const inputClass = "w-full px-4 py-2.5 bg-[#0F1117] border border-slate-800/80 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-emerald-500/50 transition-all shadow-inner";

  return (
    <div className="bg-[#0F1117] min-h-screen text-slate-300 font-sans p-4 lg:p-8 pb-32">
      <div className="max-w-[1600px] mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-white uppercase tracking-tight flex items-center gap-3">
              Feeding Schedule
            </h1>
            <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-widest">Plan & Forecast Animal Diets</p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
          
          {/* LEFT: The Form Builder */}
          <div className="xl:col-span-1 bg-[#0A0B0E] p-6 rounded-2xl border border-slate-800/80 shadow-2xl h-fit">
             <h4 className="text-xs font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2 border-b border-slate-800/80 pb-4">
                <Plus size={16} className="text-emerald-500"/> Generate Schedules
             </h4>

             <div className="flex overflow-x-auto scrollbar-hide bg-[#0F1117] p-1.5 rounded-xl gap-1 mb-5 border border-slate-800/80 shadow-inner">
                {categories.map(cat => (
                    <button 
                        key={cat} onClick={() => { setActiveTab(cat); form.setFieldValue('animal_id', ''); }}
                        className={`flex-1 min-w-[70px] py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === cat ? 'bg-emerald-600/10 text-emerald-400 border border-emerald-500/20 shadow-sm' : 'text-slate-500 hover:text-white hover:bg-slate-800/50'}`}
                    >
                        {cat}
                    </button>
                ))}
             </div>

             <form onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); form.handleSubmit(); }} className="space-y-4">
                <form.Field name="animal_id" children={(field) => (
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Animal *</label>
                        <select value={field.state.value} onChange={e => field.handleChange(e.target.value)} className={inputClass} required>
                            <option value="">Select Animal...</option>
                            {filteredAnimals.map(a => <option key={a.id} value={a.id!}>{a.name} ({a.species})</option>)}
                        </select>
                    </div>
                )}/>

                <form.Field name="feed_not_required" children={(field) => (
                    <div className="flex items-center gap-3 bg-rose-500/10 p-3 rounded-xl border border-rose-500/20 shadow-inner">
                        <input type="checkbox" checked={field.state.value} onChange={e => field.handleChange(e.target.checked)} className="w-4 h-4 text-rose-500 bg-[#0A0B0E] rounded border-rose-500/50 focus:ring-rose-500/50" />
                        <span className="text-xs font-bold text-rose-400 uppercase tracking-widest">Fast Day / Not Required</span>
                    </div>
                )}/>

                <form.Subscribe selector={(state) => state.values.feed_not_required} children={(notRequired) => (
                  !notRequired ? (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                          <form.Field name="food_type" children={(field) => (
                              <div>
                                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Food Type *</label>
                                  {foodOptions.length > 0 ? (
                                      <select value={field.state.value} onChange={e => field.handleChange(e.target.value)} className={inputClass} required>
                                          <option value="">Select...</option>
                                          {foodOptions.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
                                      </select>
                                  ) : (
                                      <input value={field.state.value} onChange={e => field.handleChange(e.target.value)} className={inputClass} placeholder="E.g. Mice" required />
                                  )}
                              </div>
                          )}/>
                          <form.Field name="quantity" children={(field) => (
                              <div>
                                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Quantity *</label>
                                  <input type="number" step="0.1" value={field.state.value} onChange={e => field.handleChange(parseFloat(e.target.value))} className={inputClass} required />
                              </div>
                          )}/>
                      </div>

                      <form.Field name="calci_dust" children={(field) => (
                          <div className="flex items-center gap-3 bg-[#0F1117] p-3 rounded-xl border border-slate-800/80 shadow-inner">
                              <input type="checkbox" checked={field.state.value} onChange={e => field.handleChange(e.target.checked)} className="w-4 h-4 text-emerald-500 bg-[#0A0B0E] rounded border-slate-700 focus:ring-emerald-500/50" />
                              <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Include Calci-Dust</span>
                          </div>
                      )}/>
                    </>
                  ) : null
                )}/>

                <div className="pt-4 border-t border-slate-800/80">
                    <form.Field name="schedule_mode" children={(field) => (
                        <div className="flex bg-[#0F1117] p-1.5 rounded-xl border border-slate-800/80 mb-4">
                            <button type="button" onClick={() => field.handleChange('single')} className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${field.state.value === 'single' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500 hover:text-white'}`}>Single Feed</button>
                            <button type="button" onClick={() => field.handleChange('interval')} className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-1.5 ${field.state.value === 'interval' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500 hover:text-white'}`}><RefreshCw size={12}/> Auto-Interval</button>
                        </div>
                    )}/>

                    <form.Subscribe selector={(state) => state.values.schedule_mode} children={(mode) => (
                        <div className="space-y-4 bg-[#0F1117] p-4 rounded-xl border border-slate-800/80 shadow-inner">
                            <form.Field name="target_date" children={(field) => (
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">{mode === 'interval' ? 'Start Date' : 'Target Date'} *</label>
                                    <input type="date" value={field.state.value} onChange={e => field.handleChange(e.target.value)} className={inputClass} required/>
                                </div>
                            )}/>
                            
                            {mode === 'interval' && (
                                <div className="grid grid-cols-2 gap-4">
                                    <form.Field name="interval_days" children={(field) => (
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Repeat Every (Days)</label>
                                            <input type="number" min="1" value={field.state.value} onChange={e => field.handleChange(parseInt(e.target.value))} className={inputClass} required/>
                                        </div>
                                    )}/>
                                    <form.Field name="occurrences" children={(field) => (
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Occurrences</label>
                                            <input type="number" min="1" max="50" value={field.state.value} onChange={e => field.handleChange(parseInt(e.target.value))} className={inputClass} required/>
                                        </div>
                                    )}/>
                                </div>
                            )}
                        </div>
                    )}/>
                </div>

                <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]} children={([canSubmit, isSubmitting]) => (
                    <button type="submit" disabled={!canSubmit || isSubmitting as boolean} className="w-full mt-4 bg-emerald-600 text-white py-3.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-[0_0_15px_rgba(16,185,129,0.15)] flex items-center justify-center gap-2">
                        {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <CalendarClock size={16} />}
                        {isSubmitting ? 'SCHEDULING...' : 'CONFIRM SCHEDULE'}
                    </button>
                )}/>
             </form>
          </div>

          {/* RIGHT: The Data Table (Fixed Height with Internal Scroll) */}
          <div className="xl:col-span-2 bg-[#0A0B0E] rounded-2xl border border-slate-800/80 shadow-2xl flex flex-col h-[calc(100vh-10rem)] min-h-[600px]">
             
             {/* Table Header & Controls */}
             <div className="p-6 border-b border-slate-800/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                 <div>
                    <h4 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                        <Utensils size={16} className="text-emerald-500"/> Scheduled Feeds
                    </h4>
                    <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold tracking-widest">{displayedSchedules.length} Pending Feeds</p>
                 </div>

                 <div className="flex flex-wrap items-center gap-3">
                     {/* Animal Filter */}
                     <div className="flex items-center gap-2 bg-[#0F1117] p-1.5 rounded-xl border border-slate-800/80 shadow-inner">
                         <Filter size={14} className="text-slate-500 ml-2" />
                         <select 
                            value={filterAnimalId} 
                            onChange={(e) => setFilterAnimalId(e.target.value)}
                            className="bg-transparent text-[10px] font-black text-white uppercase tracking-widest border-none focus:ring-0 cursor-pointer outline-none py-1 pr-2 w-32 truncate"
                         >
                             <option value="ALL">All Animals</option>
                             {animals.map(a => <option key={a.id} value={a.id!}>{a.name}</option>)}
                         </select>
                     </div>

                     {/* View Toggle */}
                     <div className="bg-[#0F1117] p-1.5 rounded-xl flex border border-slate-800/80 shadow-inner">
                         <button onClick={() => setViewLayout('individual')} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewLayout === 'individual' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500 hover:text-white hover:bg-slate-800/50'}`}>Individual</button>
                         <button onClick={() => setViewLayout('grouped')} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewLayout === 'grouped' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500 hover:text-white hover:bg-slate-800/50'}`}>Grouped</button>
                     </div>
                 </div>
             </div>

             {/* Scrollable Table Area */}
             <div className="flex-1 overflow-y-auto custom-scrollbar p-6 pt-0">
                <table className="w-full text-left min-w-[600px] mt-4">
                    <thead className="bg-[#0A0B0E] sticky top-0 z-10 shadow-[0_1px_0_rgba(30,41,59,0.8)]">
                        <tr>
                            <th className="px-4 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest w-1/4">Date</th>
                            <th className="px-4 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest w-1/3">Animal</th>
                            <th className="px-4 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest w-1/3">Diet specifics</th>
                            <th className="px-4 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                        {displayedSchedules.length === 0 ? (
                             <tr><td colSpan={4} className="px-4 py-12 text-center text-xs font-black text-slate-500 uppercase tracking-widest">No upcoming schedules found.</td></tr>
                        ) : (
                            viewLayout === 'individual' ? (
                                displayedSchedules.map(schedule => {
                                    const animal = animals.find(a => a.id === schedule.animal_id);
                                    const dateObj = new Date(schedule.scheduled_date);
                                    const isToday = schedule.scheduled_date === getLocalDateString();

                                    return (
                                        <tr key={schedule.id} className="hover:bg-[#0F1117]/50 transition-colors group">
                                            <td className="px-4 py-3">
                                                <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-md border text-[10px] font-black uppercase tracking-widest ${isToday ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-[#0A0B0E] border-slate-800 text-slate-400'}`}>
                                                    <CalIcon size={12}/> {dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <p className="text-xs font-bold text-white uppercase tracking-tight">{animal?.name || 'Unknown'}</p>
                                            </td>
                                            <td className="px-4 py-3">
                                                {schedule.feed_not_required ? (
                                                  <p className="text-xs font-bold text-rose-500 uppercase tracking-widest">NOT REQUIRED</p>
                                                ) : (
                                                  <>
                                                    <p className="text-xs font-bold text-emerald-500 uppercase tracking-widest">{schedule.quantity}x {schedule.food_type}</p>
                                                    {schedule.calci_dust && <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5 block">+ Calci-Dust</span>}
                                                  </>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <button onClick={async () => {
                                                    if (!session?.user?.id) return;
                                                    await feedingService.deleteSchedule(schedule.id!, session.user.id);
                                                    queryClient.invalidateQueries({ queryKey: ['feeding_schedules'] });
                                                }} className="p-2 text-slate-600 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                groupedSchedules.map((group, idx) => {
                                    const animal = animals.find(a => a.id === group.animal_id);
                                    const startDateObj = new Date(group.start_date);
                                    const endDateObj = new Date(group.end_date);

                                    return (
                                        <tr key={idx} className="hover:bg-[#0F1117]/50 transition-colors group">
                                            <td className="px-4 py-3">
                                                <div className="flex flex-col gap-1">
                                                    <div className="inline-flex items-center gap-2 px-2 py-1 rounded-md border bg-[#0A0B0E] border-slate-800 text-slate-400 text-[9px] font-black uppercase tracking-widest w-fit">
                                                        Start: {startDateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                                    </div>
                                                    {group.count > 1 && (
                                                        <div className="inline-flex items-center gap-2 px-2 py-1 rounded-md border bg-[#0A0B0E] border-slate-800 text-slate-500 text-[9px] font-black uppercase tracking-widest w-fit">
                                                            End: {endDateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <p className="text-xs font-bold text-white uppercase tracking-tight">{animal?.name || 'Unknown'}</p>
                                            </td>
                                            <td className="px-4 py-3">
                                                {group.feed_not_required ? (
                                                  <p className="text-xs font-bold text-rose-500 uppercase tracking-widest">NOT REQUIRED</p>
                                                ) : (
                                                  <>
                                                    <p className="text-xs font-bold text-emerald-500 uppercase tracking-widest">{group.quantity}x {group.food_type} <span className="text-slate-500">({group.count} feeds)</span></p>
                                                    {group.calci_dust && <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5 block">+ Calci-Dust</span>}
                                                  </>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <button onClick={async () => {
                                                    if (!session?.user?.id) return;
                                                    await Promise.all(group.child_ids.map((id: string) => feedingService.deleteSchedule(id, session.user.id!)));
                                                    queryClient.invalidateQueries({ queryKey: ['feeding_schedules'] });
                                                }} className="p-2 text-slate-600 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100" title="Delete entire group">
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )
                        )}
                    </tbody>
                </table>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}