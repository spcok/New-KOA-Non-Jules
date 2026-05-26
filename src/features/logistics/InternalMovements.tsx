import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRightLeft, MapPin, ClipboardList, Loader2, PawPrint } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import type { Animal, InternalMovement, User } from '../../types/schema';

// Placeholder for your actual service logic
const mockSaveMovement = async (payload: any, userId: string) => { return Promise.resolve(); };

export function InternalMovements() {
  const currentUser = useAuthStore(s => s.user);
  const queryClient = useQueryClient();

  const { data: animals = [] } = useQuery<Animal[]>({ queryKey: ['animals'], queryFn: () => [], staleTime: Infinity });
  const { data: movements = [] } = useQuery<InternalMovement[]>({ queryKey: ['internal_movements'], queryFn: () => [], staleTime: Infinity });
  const { data: users = [] } = useQuery<User[]>({ queryKey: ['users'], queryFn: () => [], staleTime: Infinity });

  const activeAnimals = animals.filter(a => !a.is_deleted && !a.archived);
  
  const recentMovements = movements
    .filter(m => !m.is_deleted)
    .sort((a, b) => new Date(b.movement_date).getTime() - new Date(a.movement_date).getTime())
    .slice(0, 50);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [animalId, setAnimalId] = useState('');
  const [movementDate, setMovementDate] = useState(new Date().toISOString().split('T')[0]);
  const [toLocation, setToLocation] = useState('');
  const [reason, setReason] = useState('');

  const selectedAnimal = animals.find(a => a.id === animalId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.id || !animalId || !toLocation || !movementDate) return;

    setIsSubmitting(true);
    const payload: Partial<InternalMovement> = {
      animal_id: animalId,
      movement_date: movementDate,
      from_location: selectedAnimal?.location || null,
      to_location: toLocation,
      reason_notes: reason || null,
      moved_by: currentUser.id,
    };

    const optimisticMovement: InternalMovement = {
      ...payload,
      id: crypto.randomUUID(),
      is_deleted: false,
      created_at: new Date().toISOString(),
    } as InternalMovement;

    // Optimistically update movements and the animal's current location
    queryClient.setQueryData(['internal_movements'], (old: InternalMovement[] = []) => [optimisticMovement, ...old]);
    queryClient.setQueryData(['animals'], (old: Animal[] = []) => 
      old.map(a => a.id === animalId ? { ...a, location: toLocation } : a)
    );

    try {
      // Replace with logisticsService.saveInternalMovement when wired up
      await mockSaveMovement(payload, currentUser.id);
      setAnimalId(''); setToLocation(''); setReason('');
    } catch (error) {
      console.error("Mutation failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto font-sans pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase flex items-center gap-3">
            Internal Movements
          </h1>
          <p className="text-slate-400 mt-1 flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
            Logistics <span className="text-slate-700">|</span> 🔄 Enclosure Transfers
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: Entry Form */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-[#0F1117] rounded-3xl border border-slate-800/80 shadow-2xl p-6">
            <h2 className="text-sm font-black text-white uppercase tracking-widest mb-5 border-b border-slate-800/80 pb-4 flex items-center gap-2">
              <ArrowRightLeft size={18} className="text-blue-500" /> Log Relocation
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Animal Subject</label>
                <select required value={animalId} onChange={(e) => setAnimalId(e.target.value)} className="w-full bg-[#0A0B0E] border border-slate-800/80 rounded-xl px-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-blue-500/50 appearance-none">
                  <option value="" disabled>Select Animal...</option>
                  {activeAnimals.map(a => <option key={a.id} value={a.id}>{a.name} ({a.species})</option>)}
                </select>
              </div>

              {selectedAnimal && (
                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                  <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">Current Logged Location:</p>
                  <p className="text-xs font-bold text-slate-200">{selectedAnimal.location || 'Unassigned'}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Date</label>
                  <input type="date" required value={movementDate} onChange={(e) => setMovementDate(e.target.value)} className="w-full bg-[#0A0B0E] border border-slate-800/80 rounded-xl px-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-blue-500/50 [&::-webkit-calendar-picker-indicator]:invert" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">New Enclosure / Tag</label>
                  <input type="text" required value={toLocation} onChange={(e) => setToLocation(e.target.value)} placeholder="e.g. Aviary 4" className="w-full bg-[#0A0B0E] border border-slate-800/80 rounded-xl px-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-blue-500/50" />
                </div>
              </div>

              <div className="space-y-1.5 pt-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Reason for Move (Optional)</label>
                <textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Enclosure maintenance..." className="w-full bg-[#0A0B0E] border border-slate-800/80 rounded-xl px-4 py-3 text-xs font-bold text-white focus:outline-none focus:border-blue-500/50 resize-none" />
              </div>

              <button type="submit" disabled={isSubmitting || !animalId || !toLocation} className="w-full mt-2 flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-[0_0_15px_rgba(37,99,235,0.15)]">
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <MapPin size={16} />}
                {isSubmitting ? 'Processing...' : 'Confirm Relocation'}
              </button>
            </form>
          </div>
        </div>

        {/* RIGHT COLUMN: Ledger */}
        <div className="lg:col-span-2 bg-[#0F1117] rounded-3xl border border-slate-800/80 shadow-2xl p-6 flex flex-col min-h-[600px]">
          <div className="flex items-center justify-between mb-6 border-b border-slate-800/80 pb-4">
            <h2 className="text-lg font-black text-white uppercase tracking-widest flex items-center gap-2">
              <ClipboardList size={20} className="text-blue-500" /> Relocation Ledger
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
            {recentMovements.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500">
                <ArrowRightLeft size={40} className="mb-4 opacity-30" />
                <p className="text-xs font-black uppercase tracking-widest">No internal movements recorded.</p>
              </div>
            ) : (
              recentMovements.map(move => {
                const animal = animals.find(a => a.id === move.animal_id);
                const user = users.find(u => u.id === move.moved_by);
                return (
                  <div key={move.id} className="p-5 rounded-2xl border bg-[#0A0B0E] border-slate-800/80 hover:border-slate-700 transition-colors">
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
                        <span className="text-[9px] font-black text-blue-400 bg-blue-500/10 px-2 py-1 rounded border border-blue-500/20 uppercase">
                          {new Date(move.movement_date).toLocaleDateString()}
                        </span>
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">By: {user?.initials || 'SYS'}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 text-xs font-bold text-slate-300 bg-[#0F1117] p-3 rounded-xl border border-slate-800/50 mb-3">
                      <span className="text-slate-500 line-through truncate w-1/3 text-right">{move.from_location || 'Unknown'}</span>
                      <ArrowRightLeft size={14} className="text-blue-500 shrink-0 mx-auto" />
                      <span className="text-emerald-400 truncate w-1/3">{move.to_location}</span>
                    </div>

                    {move.reason_notes && (
                      <p className="text-[11px] text-slate-400 italic">"{move.reason_notes}"</p>
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