import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Wrench, Plus, X, Search, Save, Loader2, AlertCircle, HardHat } from 'lucide-react';
import { maintenanceService } from '../../services/maintenanceService';
import { useAuthStore } from '../../store/authStore';
import { MaintenanceTicket, User } from '../../types/schema';

export default function MaintenanceTickets() {
  const user = useAuthStore((s) => s.user);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: tickets = [], isLoading } = useQuery<MaintenanceTicket[]>({
    queryKey: ['maintenance_tickets'],
    queryFn: () => maintenanceService.getTickets(),
  });

  const { data: staffMembers = [] } = useQuery<User[]>({
    queryKey: ['staff_members'],
    queryFn: () => maintenanceService.getStaffMembers(),
  });

  const filteredTickets = tickets.filter(ticket => 
    (ticket.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (ticket.location || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (ticket.equipment_tag || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStaffName = (id: string | null | undefined) => {
    if (!id) return 'Unassigned';
    const staff = staffMembers.find(s => s.id === id);
    return staff ? (staff.name || staff.email) : 'Unknown';
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto font-sans pb-12">
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase flex items-center gap-3">
            Maintenance Log
          </h1>
          <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Enclosure Repairs & Infrastructure Management</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-[#0F1117] border border-slate-800/80 p-3 rounded-2xl shadow-inner">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
          <input 
            type="text" 
            placeholder="Search by title, location, or tag..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0A0B0E] border border-slate-800/80 rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-blue-500/50" 
          />
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-[0_0_15px_rgba(37,99,235,0.15)]"
        >
          <Plus size={16} /> Submit Ticket
        </button>
      </div>

      <div className="bg-[#0F1117] rounded-3xl border border-slate-800/80 shadow-2xl overflow-hidden relative">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#0A0B0E] border-b border-slate-800/80 text-slate-500 font-black text-[10px] uppercase tracking-widest">
              <tr>
                <th className="px-6 py-5">Date Logged</th>
                <th className="px-6 py-5 w-1/3">Issue Title & Location</th>
                <th className="px-6 py-5">Category</th>
                <th className="px-6 py-5">Priority</th>
                <th className="px-6 py-5">Assigned To</th>
                <th className="px-6 py-5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {isLoading ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-xs font-black text-slate-500 uppercase tracking-widest animate-pulse">Accessing Infrastructure Logs...</td></tr>
              ) : filteredTickets.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-xs font-black text-slate-500 uppercase tracking-widest">No matching tickets found</td></tr>
              ) : (
                filteredTickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-[#0A0B0E] transition-colors">
                    <td className="px-6 py-4 text-xs font-bold text-slate-400 whitespace-nowrap">
                      {new Date(ticket.created_at || '').toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs font-bold text-white">{ticket.title}</p>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-0.5">{ticket.location} {ticket.equipment_tag && `| TAG: ${ticket.equipment_tag}`}</p>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
                      {ticket.category}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest ${
                        ticket.priority === 'CRITICAL' ? 'text-rose-400 bg-rose-500/10 border border-rose-500/20' :
                        ticket.priority === 'HIGH' ? 'text-orange-400 bg-orange-500/10 border border-orange-500/20' :
                        ticket.priority === 'MEDIUM' ? 'text-amber-400 bg-amber-500/10 border border-amber-500/20' :
                        'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                      }`}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-400">
                      {getStaffName(ticket.assigned_to)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-black uppercase tracking-widest ${
                        ticket.status === 'RESOLVED' ? 'text-emerald-500' : 
                        ticket.status === 'IN_PROGRESS' ? 'text-blue-400' :
                        ticket.status === 'WAITING_ON_PARTS' ? 'text-amber-500' :
                        'text-slate-500'
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

      {isModalOpen && (
        <MaintenanceModal 
          onClose={() => setIsModalOpen(false)} 
          userId={user?.id}
          staffMembers={staffMembers}
        />
      )}
    </div>
  );
}

function MaintenanceModal({ onClose, userId, staffMembers }: { onClose: () => void, userId?: string, staffMembers: User[] }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('ENCLOSURE REPAIR');
  const [priority, setPriority] = useState('MEDIUM');
  const [equipmentTag, setEquipmentTag] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('OPEN');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    setIsSubmitting(true);
    try {
      await maintenanceService.saveTicket({
        title,
        location,
        category,
        priority,
        equipment_tag: equipmentTag,
        assigned_to: assignedTo,
        description,
        status,
      }, userId);
      onClose();
    } catch (err) {
      console.error("Failed to save maintenance ticket", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-sans">
      <div className="bg-[#0F1117] border border-slate-800/80 rounded-3xl w-full max-w-4xl h-[90vh] flex flex-col shadow-2xl relative overflow-hidden">
        
        <div className="bg-[#0F1117]/90 backdrop-blur border-b border-slate-800/80 p-5 flex justify-between items-center z-20 shrink-0">
          <h2 className="text-lg font-black text-white uppercase tracking-widest flex items-center gap-2">
            <Wrench size={18} className="text-blue-500" /> Maintenance Request
          </h2>
          <button type="button" onClick={onClose} className="text-slate-500 hover:text-white font-bold text-xs uppercase tracking-widest transition-colors"><X size={20} /></button>
        </div>

        <form id="maintenance-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Issue Title</label>
              <input type="text" required value={title} onChange={e => setTitle(e.target.value)} placeholder="E.g., Broken hinge on Aviary Gate 3" className="w-full bg-[#0A0B0E] border border-slate-800/80 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-blue-500/50" />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Location / Enclosure</label>
              <input type="text" required value={location} onChange={e => setLocation(e.target.value)} className="w-full bg-[#0A0B0E] border border-slate-800/80 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-blue-500/50" />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Equipment / Asset Tag (Optional)</label>
              <input type="text" value={equipmentTag} onChange={e => setEquipmentTag(e.target.value)} placeholder="E.g., PUMP-014" className="w-full bg-[#0A0B0E] border border-slate-800/80 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-blue-500/50" />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Category</label>
              <select value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-[#0A0B0E] border border-slate-800/80 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-blue-500/50 appearance-none">
                <option value="ENCLOSURE REPAIR">Enclosure Repair</option>
                <option value="PLUMBING">Plumbing & Water Systems</option>
                <option value="ELECTRICAL">Electrical & Heating</option>
                <option value="LANDSCAPING">Landscaping & Fencing</option>
                <option value="VEHICLE">Vehicle Maintenance</option>
                <option value="GENERAL">General / Facility</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <AlertCircle size={14} className="text-amber-500" /> Priority Level
              </label>
              <select value={priority} onChange={e => setPriority(e.target.value)} className="w-full bg-[#0A0B0E] border border-slate-800/80 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-blue-500/50 appearance-none">
                <option value="LOW">LOW (Cosmetic / Non-Urgent)</option>
                <option value="MEDIUM">MEDIUM (Standard Repair)</option>
                <option value="HIGH">HIGH (Affects Operations)</option>
                <option value="CRITICAL">CRITICAL (Animal Security / Health Risk)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center bg-[#0A0B0E] border border-slate-800/80 p-5 rounded-2xl shadow-inner mt-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest flex items-center gap-2">
                <HardHat size={14} /> Assign Technician
              </label>
              <select 
                value={assignedTo} 
                onChange={e => setAssignedTo(e.target.value)} 
                className="w-full bg-[#0F1117] border border-slate-800/80 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-blue-500/50 appearance-none"
              >
                <option value="">-- Unassigned (Open Queue) --</option>
                {staffMembers.map(staff => (
                  <option key={staff.id} value={staff.id}>
                    {staff.name || staff.email} {staff.initials ? `(${staff.initials})` : ''}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Current Status</label>
              <select value={status} onChange={e => setStatus(e.target.value)} className="w-full bg-[#0F1117] border border-slate-800/80 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-blue-500/50 appearance-none">
                <option value="OPEN">OPEN - New Ticket</option>
                <option value="IN_PROGRESS">IN PROGRESS - Working</option>
                <option value="WAITING_ON_PARTS">WAITING ON PARTS</option>
                <option value="RESOLVED">RESOLVED - Completed</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5 mt-6">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Full Description of Required Work</label>
            <textarea required value={description} onChange={e => setDescription(e.target.value)} rows={4} className="w-full bg-[#0A0B0E] border border-slate-800/80 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-blue-500/50 resize-none shadow-inner" placeholder="Provide precise details of the malfunction or required repair..." />
          </div>

        </form>
        
        <div className="p-5 border-t border-slate-800/80 bg-[#0F1117]/90 backdrop-blur shrink-0 flex justify-end z-20">
          <button type="submit" form="maintenance-form" disabled={isSubmitting} className="px-8 py-3.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 flex items-center gap-2 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(37,99,235,0.15)]">
            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Submit Ticket
          </button>
        </div>
      </div>
    </div>
  );
}