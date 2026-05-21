import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Stethoscope, Plus, X, Search, Save, Loader2, FileText, Weight } from 'lucide-react';
import { clinicalService } from '../../services/clinicalService';
import { useAuthStore } from '../../store/authStore';
import { ClinicalRecord, Animal, User } from '../../types/schema';

export default function ClinicalRecords() {
  const session = useAuthStore((s) => s.session);
  const user = session?.user;
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: records = [], isLoading: loadingRecords } = useQuery<ClinicalRecord[]>({
    queryKey: ['clinical_records'],
    queryFn: () => clinicalService.getClinicalRecords(),
  });

  const { data: animals = [] } = useQuery<Animal[]>({
    queryKey: ['animals_lookup'],
    queryFn: () => clinicalService.getAnimals(),
  });

  const { data: staffMembers = [] } = useQuery<User[]>({
    queryKey: ['staff_members'],
    queryFn: () => clinicalService.getStaffMembers(),
  });

  const getAnimalName = (id: string) => {
    const animal = animals.find(a => a.id === id);
    return animal ? `${animal.name || 'Unknown'} (${animal.species})` : 'Unknown Animal';
  };

  const getStaffName = (id: string) => {
    const staff = staffMembers.find(s => s.id === id);
    return staff ? (staff.name || staff.email) : 'Unknown Conductor';
  };

  const formatDisplayString = (str: string) => {
    return str.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  const filteredRecords = records.filter(record => {
    const animalName = getAnimalName(record.animal_id).toLowerCase();
    return animalName.includes(searchQuery.toLowerCase()) || 
           (record.record_type || '').toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto font-sans pb-12">
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase flex items-center gap-3">
            Clinical Records (SOAP)
          </h1>
          <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Veterinary Examinations & Treatment Plans</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-[#0F1117] border border-slate-800/80 p-3 rounded-2xl shadow-inner">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
          <input 
            type="text" 
            placeholder="Search by animal or record type..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0A0B0E] border border-slate-800/80 rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-teal-500/50" 
          />
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-[0_0_15px_rgba(20,184,166,0.15)]"
        >
          <Plus size={16} /> Add Clinical Record
        </button>
      </div>

      <div className="bg-[#0F1117] rounded-3xl border border-slate-800/80 shadow-2xl overflow-hidden relative">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#0A0B0E] border-b border-slate-800/80 text-slate-500 font-black text-[10px] uppercase tracking-widest">
              <tr>
                <th className="px-6 py-5">Date</th>
                <th className="px-6 py-5">Patient</th>
                <th className="px-6 py-5">Record Type</th>
                <th className="px-6 py-5 w-1/3">Assessment & Plan</th>
                <th className="px-6 py-5">Conducted By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {loadingRecords ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-xs font-black text-slate-500 uppercase tracking-widest animate-pulse">Accessing Medical Vault...</td></tr>
              ) : filteredRecords.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-xs font-black text-slate-500 uppercase tracking-widest">No clinical records found</td></tr>
              ) : (
                filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-[#0A0B0E] transition-colors">
                    <td className="px-6 py-4 text-xs font-bold text-white whitespace-nowrap">
                      {new Date(record.record_date).toLocaleString('en-GB', { dateStyle: 'short' })}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs font-bold text-white">{getAnimalName(record.animal_id)}</p>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-0.5">{record.weight_grams}g</p>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-teal-400 uppercase tracking-widest">
                      {formatDisplayString(record.record_type)}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Assessment:</p>
                      <p className="text-xs font-bold text-slate-300 line-clamp-1 mb-2">{record.soap_assessment}</p>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Plan:</p>
                      <p className="text-xs font-bold text-slate-300 line-clamp-1">{record.soap_plan}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold text-slate-400">
                        {getStaffName(record.conducted_by)}
                      </span>
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-0.5">
                        {record.conductor_role === 'OWNER_DIRECTOR' ? 'Owner / Director' : formatDisplayString(record.conductor_role)}
                      </p>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <ClinicalRecordModal 
          onClose={() => setIsModalOpen(false)} 
          userId={user?.id}
          animals={animals}
          staff={staffMembers}
        />
      )}
    </div>
  );
}

function ClinicalRecordModal({ onClose, userId, animals, staff }: { onClose: () => void, userId?: string, animals: Animal[], staff: User[] }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [animalId, setAnimalId] = useState('');
  const [recordType, setRecordType] = useState('ROUTINE_EXAM');
  const [recordDate, setRecordDate] = useState(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  });
  const [weightGrams, setWeightGrams] = useState<number | ''>('');
  
  const [subjective, setSubjective] = useState('');
  const [objective, setObjective] = useState('');
  const [assessment, setAssessment] = useState('');
  const [plan, setPlan] = useState('');

  const [conductorRole, setConductorRole] = useState('KEEPER');
  const [conductedBy, setConductedBy] = useState(userId || '');
  const [externalVetName, setExternalVetName] = useState('');
  const [externalClinic, setExternalClinic] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !animalId) return;

    setIsSubmitting(true);
    try {
      await clinicalService.saveClinicalRecord({
        animal_id: animalId,
        record_type: recordType,
        record_date: new Date(recordDate).toISOString(),
        soap_subjective: subjective,
        soap_objective: objective,
        soap_assessment: assessment,
        soap_plan: plan,
        weight_grams: Number(weightGrams), // DATA INTEGRITY FIX: Removed coercion
        conductor_role: conductorRole,
        conducted_by: conductedBy,
        external_vet_name: conductorRole === 'EXTERNAL_VET' ? externalVetName : null,
        external_vet_clinic: conductorRole === 'EXTERNAL_VET' ? externalClinic : null,
      }, userId);
      onClose();
    } catch (err) {
      console.error("Failed to save clinical record", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-sans">
      <div className="bg-[#0F1117] border border-slate-800/80 rounded-3xl w-full max-w-4xl h-[90vh] flex flex-col shadow-2xl relative overflow-hidden">
        
        <div className="bg-[#0F1117]/90 backdrop-blur border-b border-slate-800/80 p-5 flex justify-between items-center z-20 shrink-0">
          <h2 className="text-lg font-black text-white uppercase tracking-widest flex items-center gap-2">
            <FileText size={18} className="text-teal-500" /> Medical SOAP Record
          </h2>
          <button type="button" onClick={onClose} className="text-slate-500 hover:text-white font-bold text-xs uppercase tracking-widest transition-colors"><X size={20} /></button>
        </div>

        <form id="clinical-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
          
          {/* Section 1: Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-[#0A0B0E] p-5 rounded-2xl border border-slate-800/80 shadow-inner">
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[10px] font-black text-teal-500 uppercase tracking-widest">Select Patient (Animal)</label>
              <select required value={animalId} onChange={e => setAnimalId(e.target.value)} className="w-full bg-[#0F1117] border border-slate-800/80 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-teal-500/50 appearance-none">
                <option value="">-- Select Patient --</option>
                {animals.map(a => (
                  <option key={a.id} value={a.id}>{a.name || 'Unnamed'} ({a.species})</option>
                ))}
              </select>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-teal-500 uppercase tracking-widest flex items-center gap-2"><Weight size={12}/> Current Weight (g)</label>
              <input type="number" required value={weightGrams} onChange={e => setWeightGrams(e.target.value === '' ? '' : Number(e.target.value))} className="w-full bg-[#0F1117] border border-slate-800/80 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-teal-500/50" />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Date of Exam</label>
              <input type="datetime-local" required value={recordDate} onChange={e => setRecordDate(e.target.value)} className="w-full bg-[#0F1117] border border-slate-800/80 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-teal-500/50 [&::-webkit-calendar-picker-indicator]:invert" />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Record Type</label>
              <select required value={recordType} onChange={e => setRecordType(e.target.value)} className="w-full bg-[#0F1117] border border-slate-800/80 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-teal-500/50 appearance-none">
                <option value="ROUTINE_EXAM">Routine / Examination</option>
                <option value="ILLNESS">Illness</option>
                <option value="TRIAGE">Triage</option>
                <option value="VACCINATION">Vaccination</option>
                <option value="SURGERY">Surgery</option>
                <option value="BIRTH_LAYING">Birth / Laying eggs</option>
                <option value="POST_MORTEM">Post-Mortem</option>
              </select>
            </div>
          </div>

          {/* Section 2: SOAP */}
          <div className="space-y-4">
             <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-800/80 pb-2">S.O.A.P. Clinical Matrix</h3>
             
             <div className="space-y-1.5">
               <label className="text-[10px] font-black text-teal-500 uppercase tracking-widest">Subjective (History, observations, reported symptoms)</label>
               <textarea required value={subjective} onChange={e => setSubjective(e.target.value)} rows={3} className="w-full bg-[#0A0B0E] border border-slate-800/80 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-teal-500/50 resize-none shadow-inner" />
             </div>

             <div className="space-y-1.5">
               <label className="text-[10px] font-black text-teal-500 uppercase tracking-widest">Objective (Vital signs, physical exam findings, lab results)</label>
               <textarea required value={objective} onChange={e => setObjective(e.target.value)} rows={3} className="w-full bg-[#0A0B0E] border border-slate-800/80 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-teal-500/50 resize-none shadow-inner" />
             </div>

             <div className="space-y-1.5">
               <label className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Assessment (Diagnosis, differential diagnosis)</label>
               <textarea required value={assessment} onChange={e => setAssessment(e.target.value)} rows={2} className="w-full bg-[#0A0B0E] border border-slate-800/80 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-amber-500/50 resize-none shadow-inner" />
             </div>

             <div className="space-y-1.5">
               <label className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Plan (Treatments, medications, follow-up)</label>
               <textarea required value={plan} onChange={e => setPlan(e.target.value)} rows={3} className="w-full bg-[#0A0B0E] border border-slate-800/80 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-indigo-500/50 resize-none shadow-inner" />
             </div>
          </div>

          {/* Section 3: Conductor Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-800/80">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Conductor Role</label>
              <select value={conductorRole} onChange={e => setConductorRole(e.target.value)} className="w-full bg-[#0A0B0E] border border-slate-800/80 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-teal-500/50 appearance-none">
                <option value="EXTERNAL_VET">External Vet</option>
                <option value="OWNER_DIRECTOR">Owner / Director</option>
                <option value="HEAD_KEEPER">Head Keeper</option>
                <option value="SENIOR_KEEPER">Senior Keeper</option>
                <option value="KEEPER">Keeper</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Internal Staff Reference</label>
              <select required value={conductedBy} onChange={e => setConductedBy(e.target.value)} className="w-full bg-[#0A0B0E] border border-slate-800/80 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-teal-500/50 appearance-none">
                <option value="">-- Select Staff --</option>
                {staff.map(s => (
                  <option key={s.id} value={s.id}>{s.name || s.email}</option>
                ))}
              </select>
            </div>

            {conductorRole === 'EXTERNAL_VET' && (
              <>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">External Vet Name</label>
                  <input type="text" required value={externalVetName} onChange={e => setExternalVetName(e.target.value)} className="w-full bg-[#0A0B0E] border border-slate-800/80 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-teal-500/50" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">External Clinic</label>
                  <input type="text" required value={externalClinic} onChange={e => setExternalClinic(e.target.value)} className="w-full bg-[#0A0B0E] border border-slate-800/80 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-teal-500/50" />
                </div>
              </>
            )}
          </div>

        </form>
        
        <div className="p-5 border-t border-slate-800/80 bg-[#0F1117]/90 backdrop-blur shrink-0 flex justify-end z-20">
          <button type="submit" form="clinical-form" disabled={isSubmitting} className="px-8 py-3.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 flex items-center gap-2 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(20,184,166,0.15)]">
            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Commit Medical Record
          </button>
        </div>
      </div>
    </div>
  );
}