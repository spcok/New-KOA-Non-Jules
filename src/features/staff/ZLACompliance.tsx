import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ShieldAlert, CheckCircle2, AlertTriangle, FileBadge, PawPrint } from 'lucide-react';
import type { Animal } from '../../types/schema';

interface AuditResult {
  animal: Animal;
  missingFields: string[];
  isCompliant: boolean;
}

export function ZLACompliance() {
  const { data: animals = [] } = useQuery<Animal[]>({ 
    queryKey: ['animals'], 
    queryFn: () => [], 
    staleTime: Infinity 
  });

  const activeAnimals = animals.filter(a => !a.is_deleted && !a.archived);

  // Compute compliance strictly on the client side against ZLA 1981 / SSSMZP Section 9
  const { auditResults, complianceScore, criticalFails } = useMemo(() => {
    const results: AuditResult[] = activeAnimals.map(animal => {
      const missingFields: string[] = [];

      // 1. Taxonomy & Identification
      if (!animal.name) missingFields.push('House Name / Identifier');
      if (!animal.species) missingFields.push('Common Species Name');
      if (!animal.latin_name) missingFields.push('Scientific (Latin) Name');
      if (!animal.gender) missingFields.push('Sex / Gender');
      if (!animal.red_list_status) missingFields.push('IUCN Red List Status');
      
      // ZLA ID Exemption logic: Must have an ID OR be explicitly marked as un-ID-able
      if (!animal.microchip_id && !animal.ring_number && !animal.has_no_id) {
        missingFields.push('Identification (Microchip/Ring OR "No ID" ticked)');
      }

      // 2. Life History 
      // ZLA Exemption logic: Must have DOB OR be explicitly marked unknown
      if (!animal.date_of_birth && !animal.is_dob_unknown) {
        missingFields.push('Date of Birth (OR "DOB Unknown" ticked)');
      }

      // Parentage Exemption logic
      if (!animal.sire_id && !animal.dam_id && !animal.parent_mob_id && !animal.lineage_unknown) {
        missingFields.push('Parentage (Sire/Dam OR "Lineage Unknown" ticked)');
      }

      // 3. Origin & Acquisition (Relies on string presence. Typing "Unknown" passes)
      if (!animal.origin) {
        missingFields.push('Origin (Captive/Wild/Unknown)');
      }
      
      if (!animal.acquisition_date || !animal.acquisition_type) {
        missingFields.push('Acquisition Date & Method');
      }

      return {
        animal,
        missingFields,
        isCompliant: missingFields.length === 0
      };
    });

    const fails = results.filter(r => !r.isCompliant);
    const score = activeAnimals.length > 0 
      ? Math.round(((activeAnimals.length - fails.length) / activeAnimals.length) * 100) 
      : 100;

    return { auditResults: results, complianceScore: score, criticalFails: fails };
  }, [activeAnimals]);

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto font-sans">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase flex items-center gap-3">
            ZLA Profile Compliance
          </h1>
          <p className="text-slate-400 mt-1 flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
            Section 9 SSSMZP Audit <span className="text-slate-700">|</span> 🛡️ Live Diagnostics
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#0F1117] rounded-3xl border border-slate-800/80 shadow-2xl p-6 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-[#0A0B0E] border border-slate-800 flex items-center justify-center mb-4">
            <PawPrint size={24} className="text-blue-500" />
          </div>
          <p className="text-4xl font-black text-white">{activeAnimals.length}</p>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Active Profiles</p>
        </div>

        <div className="bg-[#0F1117] rounded-3xl border border-slate-800/80 shadow-2xl p-6 flex flex-col items-center justify-center text-center">
          <div className={`w-16 h-16 rounded-full bg-[#0A0B0E] border flex items-center justify-center mb-4 transition-colors ${complianceScore === 100 ? 'border-emerald-500/50' : 'border-amber-500/50'}`}>
            <FileBadge size={24} className={`transition-colors ${complianceScore === 100 ? 'text-emerald-500' : 'text-amber-500'}`} />
          </div>
          <p className={`text-4xl font-black transition-colors ${complianceScore === 100 ? 'text-emerald-400' : 'text-amber-400'}`}>
            {complianceScore}%
          </p>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Compliance Score</p>
        </div>

        <div className="bg-[#0F1117] rounded-3xl border border-slate-800/80 shadow-2xl p-6 flex flex-col items-center justify-center text-center">
          <div className={`w-16 h-16 rounded-full bg-[#0A0B0E] border flex items-center justify-center mb-4 transition-colors ${criticalFails.length > 0 ? 'border-rose-500/50' : 'border-slate-800'}`}>
            <AlertTriangle size={24} className={`transition-colors ${criticalFails.length > 0 ? 'text-rose-500' : 'text-slate-500'}`} />
          </div>
          <p className={`text-4xl font-black transition-colors ${criticalFails.length > 0 ? 'text-rose-500' : 'text-slate-200'}`}>
            {criticalFails.length}
          </p>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Profiles Requiring Action</p>
        </div>
      </div>

      <div className="bg-[#0F1117] rounded-3xl border border-slate-800/80 shadow-2xl p-6">
        <div className="flex items-center justify-between mb-6 border-b border-slate-800/80 pb-4">
          <h2 className="text-sm font-black text-white uppercase tracking-widest">
            Audit Deficiencies
          </h2>
          {criticalFails.length > 0 && (
            <span className="text-[10px] font-black text-rose-400 bg-rose-500/10 px-3 py-1 rounded-lg uppercase tracking-widest border border-rose-500/20">
              {criticalFails.reduce((acc, curr) => acc + curr.missingFields.length, 0)} Total Errors
            </span>
          )}
        </div>
        
        {criticalFails.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500">
            <CheckCircle2 size={48} className="mb-4 text-emerald-500/50" />
            <p className="text-sm font-black uppercase tracking-widest text-emerald-400">All Active Profiles meet SSSMZP Requirements</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {criticalFails.map(result => (
              <div key={result.animal.id} className="p-5 rounded-2xl border border-rose-500/20 bg-[#0A0B0E] flex flex-col gap-4 shadow-inner">
                <div className="flex items-start justify-between border-b border-slate-800/80 pb-3">
                  <div>
                    <p className="text-sm font-bold text-slate-200">{result.animal.name || 'Unnamed'}</p>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-0.5">{result.animal.species || 'Unknown Species'}</p>
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <AlertTriangle size={12} className="text-rose-500"/> Required Fields Missing:
                  </p>
                  <ul className="space-y-1.5">
                    {result.missingFields.map((field, idx) => (
                      <li key={idx} className="text-[11px] font-bold text-rose-400/90 flex items-start gap-2 leading-tight">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1 shrink-0"></span> {field}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}