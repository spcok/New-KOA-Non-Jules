import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CalendarDays, Info } from 'lucide-react';
import type { Animal, DailyLog, FeedingSchedule } from '../../types/schema';

export function MissingRecords() {
  // 1. Strict local reads populated by SyncEngine
  const { data: animals = [] } = useQuery<Animal[]>({ queryKey: ['animals'], queryFn: () => [], staleTime: Infinity });
  const { data: dailyLogs = [] } = useQuery<DailyLog[]>({ queryKey: ['daily_logs'], queryFn: () => [], staleTime: Infinity });
  const { data: feedingSchedules = [] } = useQuery<FeedingSchedule[]>({ queryKey: ['feeding_schedules'], queryFn: () => [], staleTime: Infinity });

  // 2. Generate the last 7 days array (Oldest to Today)
  const last7Days = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      // Start from 6 days ago, up to today
      d.setDate(d.getDate() - (6 - i));
      return {
        iso: d.toISOString().split('T')[0],
        label: d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' })
      };
    });
  }, []);

  // 3. Process the matrix data
  const matrixData = useMemo(() => {
    const activeAnimals = animals.filter(a => !a.is_deleted && !a.archived);

    return activeAnimals.map(animal => {
      const days = last7Days.map(day => {
        // Check for Weight: Must have a log today with a valid weight number
        const hasWeight = dailyLogs.some(log => 
          log.animal_id === animal.id && 
          log.log_date.startsWith(day.iso) && 
          (log.weight_grams ?? 0) > 0
        );

        // Check for Feed: EITHER a completed feeding schedule OR a daily log marked as a feed
        const hasFeed = 
          feedingSchedules.some(feed => 
            feed.animal_id === animal.id && 
            feed.scheduled_date.startsWith(day.iso) && 
            feed.is_completed
          ) || 
          dailyLogs.some(log => 
            log.animal_id === animal.id && 
            log.log_date.startsWith(day.iso) && 
            log.log_type.toUpperCase().includes('FEED')
          );

        return { date: day.iso, hasWeight, hasFeed };
      });

      return { animal, days };
    });
  }, [animals, dailyLogs, feedingSchedules, last7Days]);

  // Helper to generate the exact pillbox gradient and text
  const getPillData = (hasWeight: boolean, hasFeed: boolean) => {
    const weightColor = hasWeight ? '#10b981' : '#f43f5e'; // Emerald vs Rose
    const feedColor = hasFeed ? '#10b981' : '#f43f5e';
    const gradient = `linear-gradient(90deg, ${weightColor} 50%, ${feedColor} 50%)`;

    let text = '';
    let textColor = '';

    if (hasWeight && hasFeed) {
      text = 'Complete';
      textColor = 'text-emerald-500';
    } else if (!hasWeight && !hasFeed) {
      text = 'Missing Both';
      textColor = 'text-rose-500';
    } else if (!hasWeight) {
      text = 'No Weight';
      textColor = 'text-amber-500';
    } else if (!hasFeed) {
      text = 'No Feed';
      textColor = 'text-amber-500';
    }

    return { gradient, text, textColor };
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto font-sans flex flex-col h-[calc(100vh-8rem)]">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 shrink-0">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase flex items-center gap-3">
            Husbandry Matrix
          </h1>
          <p className="text-slate-400 mt-1 flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
            7-Day Operational Audit <span className="text-slate-700">|</span> 📊 Live Tracking
          </p>
        </div>
        <div className="flex items-center gap-4 bg-[#0F1117] border border-slate-800/80 px-4 py-2.5 rounded-xl shadow-inner">
          <Info size={14} className="text-blue-500" />
          <div className="flex items-center gap-2">
            <div className="w-4 h-2 rounded-full" style={{ background: 'linear-gradient(90deg, #10b981 50%, #f43f5e 50%)' }} />
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Left = Weight</span>
          </div>
          <div className="flex items-center gap-2 border-l border-slate-800 pl-4">
            <div className="w-4 h-2 rounded-full" style={{ background: 'linear-gradient(90deg, #f43f5e 50%, #10b981 50%)' }} />
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Right = Feed</span>
          </div>
        </div>
      </div>

      {/* MATRIX TABLE */}
      <div className="bg-[#0F1117] rounded-3xl border border-slate-800/80 shadow-2xl flex-1 flex flex-col overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar flex-1">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead className="sticky top-0 z-10 bg-[#0A0B0E] shadow-md">
              <tr>
                <th className="p-5 border-b border-r border-slate-800/80 w-1/4">
                  <span className="text-xs font-black text-white uppercase tracking-widest">Animal / Subject</span>
                </th>
                {last7Days.map((day, idx) => (
                  <th key={day.iso} className={`p-4 border-b border-slate-800/80 text-center ${idx < 6 ? 'border-r' : ''}`}>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${idx === 6 ? 'text-blue-400' : 'text-slate-400'}`}>
                      {idx === 6 ? 'Today' : day.label}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {matrixData.map(({ animal, days }) => (
                <tr key={animal.id} className="hover:bg-slate-800/20 transition-colors">
                  {/* Animal Info */}
                  <td className="p-4 border-r border-slate-800/80 bg-[#0A0B0E]/50">
                    <p className="text-sm font-bold text-slate-200 truncate">{animal.name || 'Unnamed'}</p>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-0.5 truncate">
                      {animal.species || 'Unknown Species'}
                    </p>
                  </td>

                  {/* 7-Day Pillboxes */}
                  {days.map((day, idx) => {
                    const { gradient, text, textColor } = getPillData(day.hasWeight, day.hasFeed);
                    return (
                      <td key={day.date} className={`p-3 align-middle ${idx < 6 ? 'border-r border-slate-800/80' : ''}`}>
                        <div className="flex flex-col items-center justify-center gap-2">
                          <div 
                            className="w-16 h-2.5 rounded-full shadow-inner border border-black/20"
                            style={{ background: gradient }}
                          />
                          <span className={`text-[9px] font-black uppercase tracking-wider ${textColor}`}>
                            {text}
                          </span>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
              {matrixData.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    <CalendarDays size={32} className="mx-auto mb-3 opacity-30" />
                    <p className="text-xs font-black uppercase tracking-widest">No active animals in database.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}