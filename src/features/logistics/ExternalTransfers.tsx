import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRightLeft, FileWarning, ClipboardList, Loader2, PawPrint } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { logisticsService } from '../../services/logisticsService';
import type { Animal, ExternalTransfer, User } from '../../types/schema';

export function ExternalTransfers() {
  const currentUser = useAuthStore(s => s.user);
  const queryClient = useQueryClient();

  const { data: animals = [] } = useQuery<Animal[]>({ queryKey: ['animals'], queryFn: () => [], staleTime: Infinity });
  const { data: transfers = [] } = useQuery<ExternalTransfer[]>({ queryKey: ['external_transfers'], queryFn: () => [], staleTime: Infinity });
  const { data: users = [] } = useQuery<User[]>({ queryKey: ['users'], queryFn: () => [], staleTime: Infinity });

  // Only allow active animals for new transfers
  const activeAnimals = animals.filter(a => !a.is_deleted && !a.archived);
  
  const recentTransfers = transfers
    .filter(t => !t.is_deleted)
    .sort((a, b) => new Date(b.transfer_date).getTime() - new Date(a.transfer_date).getTime())
    .slice(0, 50);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [animalId, setAnimalId] = useState('');
  const [transferType, setTransferType] = useState('ACQUISITION');
  const [transferDate, setTransferDate] = useState(new Date().toISOString().split('T')[0]);
  const [entityName, setEntityName] = useState('');
  const [contactDetails, setContactDetails] = useState('');
  const [notes, setNotes] = useState('');

  const isTerminal = transferType === 'DEATH' || transferType === 'DEPARTURE';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.id || !animalId || !transferDate || !entityName) return;

    setIsSubmitting(true);
    const payload: Partial<ExternalTransfer> = {
      animal_id: animalId,
      transfer_type: transferType,
      transfer_date: transferDate,
      entity_name: entityName,
      contact_details: contactDetails || null,
      notes: notes || null,
      authorized_by: currentUser.id,
    };

    const optimisticTransfer: ExternalTransfer = {
      ...payload,
      id: crypto.randomUUID(),
      is_deleted: false,
      created_at: new Date().toISOString(),
    } as ExternalTransfer;

    // Optimistic cache update
    queryClient.setQueryData(['external_transfers'], (old: ExternalTransfer[] = []) => [optimisticTransfer, ...old]);
    
    if (isTerminal) {
      queryClient.setQueryData(['animals'], (old: Animal[] = []) => 
        old.map(a => a.id === animalId ? { ...a, archived: true, archive_type: transferType } : a)
      );
    }

    try {
      await logisticsService.saveExternalTransfer(payload, currentUser.id);
      setAnimalId(''); setEntityName(''); setContactDetails(''); setNotes('');
    } catch (error) {
      console.error("Mutation failed.", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'ACQUISITION': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'DEPARTURE': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'DEATH': return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      default: return 'text-blue-400 bg-blue-500/10 border-blue-500/20'; // Loans
    }
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto font-sans pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase flex items-center gap-3">
            External Transfers
          </h1>
          <p className="text-slate-400 mt-1 flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
            Logistics <span className="text-slate-700">|</span> 🚛 Acquisitions & Dispositions
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: Entry Form */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-[#0F1117] rounded-3xl border border-slate-800/80 shadow-2xl p-6">
            <h2 className="text-sm font-black text-white uppercase tracking-widest mb-5 border-b border-slate-800/80 pb-4 flex items-center gap-2">
              <ArrowRightLeft size={18} className="text-blue-500" /> Log Transaction
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Animal Subject</label>
                <select required value={animalId} onChange={(e) => setAnimalId(e.target.value)} className="w-full bg-[#0A0B0E] border border-slate-800/80 rounded-xl px-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-blue-500/50 appearance-none">
                  <option value="" disabled>Select Animal...</option>
                  {activeAnimals.map(a => <option key={a.id} value={a.id}>{a.name} ({a.species})</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Transaction Type</label>
                  <select required value={transferType} onChange={(e) => setTransferType(e.target.value)} className="w-full bg-[#0A0B0E] border border-slate-800/80 rounded-xl px-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-blue-500/50 appearance-none">
                    <option value="ACQUISITION">Acquisition</option>
                    <option value="LOAN_IN">Loan In</option>
                    <option value="LOAN_OUT">Loan Out</option>
                    <option value="DEPARTURE">Departure</option>
                    <option value="DEATH">Death</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Date</label>
                  <input type="date" required value={transferDate} onChange={(e) => setTransferDate(e.target.value)} className="w-full bg-[#0A0B0E] border border-slate-800/80 rounded-xl px-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-blue-500/50 [&::-webkit-calendar-picker-indicator]:invert" />
                </div>
              </div>

              {isTerminal && (
                <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl mt-2">
                  <FileWarning size={14} className="text-rose-400 shrink-0" />
                  <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest">This transaction will permanently archive the animal profile.</p>
                </div>
              )}

              <div className="space-y-1.5 pt-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Entity / Origin / Destination Name</label>
                <input type="text" required value={entityName} onChange={(e) => setEntityName(e.target.value)} placeholder="e.g. London Zoo" className="w-full bg-[#0A0B0E] border border-slate-800/80 rounded-xl px-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-blue-500/50" />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Contact Details (Optional)</label>
                <input type="text" value={contactDetails} onChange={(e) => setContactDetails(e.target.value)} placeholder="e.g. John Doe, 077..." className="w-full bg-[#0A0B0E] border border-slate-800/80 rounded-xl px-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-blue-500/50" />
              </div>

              <div className="space-y-1.5 pt-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Additional Notes</label>
                <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Transportation details, health cert numbers..." className="w-full bg-[#0A0B0E] border border-slate-800/80 rounded-xl px-4 py-3 text-xs font-bold text-white focus:outline-none focus:border-blue-500/50 resize-none" />
              </div>

              <button type="submit" disabled={isSubmitting || !animalId || !entityName} className="w-full mt-2 flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-[0_0_15px_rgba(37,99,235,0.15)]">
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <ClipboardList size={16} />}
                {isSubmitting ? 'Processing...' : 'Commit Transaction'}
              </button>
            </form>
          </div>
        </div>

        {/* RIGHT COLUMN: Ledger */}
        <div className="lg:col-span-2 bg-[#0F1117] rounded-3xl border border-slate-800/80 shadow-2xl p-6 flex flex-col min-h-[600px]">
          <div className="flex items-center justify-between mb-6 border-b border-slate-800/80 pb-4">
            <h2 className="text-lg font-black text-white uppercase tracking-widest flex items-center gap-2">
              <ArrowRightLeft size={20} className="text-blue-500" /> Transaction Ledger
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
            {recentTransfers.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500">
                <ClipboardList size={40} className="mb-4 opacity-30" />
                <p className="text-xs font-black uppercase tracking-widest">No external transfers on record.</p>
              </div>
            ) : (
              recentTransfers.map(transfer => {
                const animal = animals.find(a => a.id === transfer.animal_id);
                const user = users.find(u => u.id === transfer.authorized_by);
                
                return (
                  <div key={transfer.id} className="p-5 rounded-2xl border bg-[#0A0B0E] border-slate-800/80 hover:border-slate-700 transition-colors">
                    <div className="flex items-start justify-between mb-3 border-b border-slate-800/80 pb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#0F1117] border border-slate-800 flex items-center justify-center">
                          <PawPrint size={14} className="text-slate-400" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-200">{animal?.name || 'Unknown Animal'}</p>
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-0.5">{animal?.species}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`text-[9px] font-black px-2 py-1 rounded border uppercase tracking-widest ${getTypeColor(transfer.transfer_type)}`}>
                          {transfer.transfer_type.replace('_', ' ')}
                        </span>
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1.5">
                          {new Date(transfer.transfer_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-xs font-bold text-slate-300 bg-[#0F1117] p-3 rounded-xl border border-slate-800/50 mb-3 flex flex-col gap-1">
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Entity / Origin:</span>
                      <span className="text-blue-400">{transfer.entity_name}</span>
                      {transfer.contact_details && <span className="text-slate-400 text-[10px]">{transfer.contact_details}</span>}
                    </div>

                    {transfer.notes && (
                      <p className="text-[11px] text-slate-400 italic">"{transfer.notes}"</p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}