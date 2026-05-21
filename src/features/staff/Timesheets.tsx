import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Clock, Search, AlertCircle } from 'lucide-react';
import { timesheetService } from '../../services/timesheetService';
import { Timesheet, User } from '../../types/schema';

export default function Timesheets() {
  const [searchQuery, setSearchQuery] = useState('');

  const { data: timesheets = [], isLoading: loadingTimesheets } = useQuery<Timesheet[]>({
    queryKey: ['timesheets'],
    queryFn: () => timesheetService.getTimesheets(),
  });

  const { data: staffMembers = [], isLoading: loadingStaff } = useQuery<User[]>({
    queryKey: ['staff_members'],
    queryFn: () => timesheetService.getStaffMembers(),
  });

  const filteredTimesheets = timesheets.filter(ticket => {
    const staff = staffMembers.find(s => s.id === ticket.user_id);
    const staffName = staff ? (staff.name || staff.email || '') : '';
    return staffName.toLowerCase().includes(searchQuery.toLowerCase()) ||
           ticket.status.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const getStaffName = (id: string | null | undefined) => {
    if (!id) return 'Unknown';
    const staff = staffMembers.find(s => s.id === id);
    return staff ? (staff.name || staff.email) : 'Unknown';
  };

  const calculateHours = (inTime: string, outTime: string | null | undefined) => {
    if (!outTime) return '--';
    const start = new Date(inTime).getTime();
    const end = new Date(outTime).getTime();
    const hours = (end - start) / (1000 * 60 * 60);
    return hours.toFixed(2) + 'h';
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto font-sans pb-12">
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase flex items-center gap-3">
            Timesheet Log
          </h1>
          <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Historical Shift Data & Hours</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-[#0F1117] border border-slate-800/80 p-3 rounded-2xl shadow-inner">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
          <input 
            type="text" 
            placeholder="Search staff or status..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0A0B0E] border border-slate-800/80 rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-indigo-500/50" 
          />
        </div>
      </div>

      <div className="bg-[#0F1117] rounded-3xl border border-slate-800/80 shadow-2xl overflow-hidden relative">
        <div className="w-full overflow-x-auto max-h-[700px] custom-scrollbar">
          <table className="w-full text-left text-sm relative">
            <thead className="bg-[#0A0B0E] border-b border-slate-800/80 text-slate-500 font-black text-[10px] uppercase tracking-widest sticky top-0 z-10">
              <tr>
                <th className="px-6 py-5">Date</th>
                <th className="px-6 py-5">Staff Member</th>
                <th className="px-6 py-5">Clock In</th>
                <th className="px-6 py-5">Clock Out</th>
                <th className="px-6 py-5">Total Hours</th>
                <th className="px-6 py-5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {(loadingTimesheets || loadingStaff) ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-xs font-black text-slate-500 uppercase tracking-widest animate-pulse">Accessing Time Logs...</td></tr>
              ) : filteredTimesheets.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-xs font-black text-slate-500 uppercase tracking-widest">No timesheets found</td></tr>
              ) : (
                filteredTimesheets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-[#0A0B0E] transition-colors">
                    <td className="px-6 py-4 text-xs font-bold text-slate-400 whitespace-nowrap">
                      {new Date(ticket.shift_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-white">
                      {getStaffName(ticket.user_id)}
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-300">
                      {new Date(ticket.clock_in_time).toLocaleTimeString('en-GB', { timeStyle: 'short' })}
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-300">
                      <div className="flex items-center gap-2">
                        {ticket.clock_out_time ? new Date(ticket.clock_out_time).toLocaleTimeString('en-GB', { timeStyle: 'short' }) : '--:--'}
                        {ticket.auto_clocked_out && (
                          <span className="text-amber-500" title="System auto-clocked out at 18:00">
                            <AlertCircle size={14} />
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-black text-indigo-400">
                      {calculateHours(ticket.clock_in_time, ticket.clock_out_time)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest ${
                        ticket.status === 'ACTIVE' ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20' :
                        'text-slate-400 bg-slate-500/10 border border-slate-500/20'
                      }`}>
                        {ticket.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}