import React, { useState, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from '@tanstack/react-form';
import { CheckCircle2, AlertCircle, Building, Loader2, Save, UploadCloud, Image as ImageIcon } from 'lucide-react';
import { settingsService } from '../../services/settingsService';
import { Organisation } from '../../types/schema';

export default function OrgProfile() {
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const { data: org, isLoading } = useQuery({
    queryKey: ['organisation_profile'],
    queryFn: () => settingsService.getOrganisation(),
  });

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Loader2 className="animate-spin text-indigo-500" size={32} />
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest animate-pulse">Loading Profile...</p>
      </div>
    );
  }

  const defaultValues: Partial<Organisation> = org || {
    org_name: '', contact_email: '', contact_phone: '', address: '',
    zla_license_number: '', official_website: '', adoption_portal: '', logo_url: ''
  };

  return (
    <div className="bg-[#0F1117] rounded-3xl border border-slate-800/80 overflow-hidden shadow-2xl font-sans max-w-4xl">
      <div className="border-b border-slate-800/80 p-6 bg-[#0A0B0E] flex justify-between items-center">
        <div>
          <h2 className="text-lg font-black text-white flex items-center gap-2 uppercase tracking-tight">
            <Building size={20} className="text-indigo-500" /> Operational Profile
          </h2>
          <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-widest">Master Facility Demographics</p>
        </div>
        {toast && (
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${toast.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
            {toast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            {toast.message}
          </div>
        )}
      </div>

      <OrgForm defaultValues={defaultValues} onSuccess={() => {
        showToast('Profile updated & synced to vault', 'success');
        queryClient.invalidateQueries({ queryKey: ['organisation_profile'] });
      }} />
    </div>
  );
}

function OrgForm({ defaultValues, onSuccess }: { defaultValues: Partial<Organisation>, onSuccess: () => void }) {
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      setIsSaving(true);
      try {
        await settingsService.updateOrganisation(value);
        onSuccess();
      } catch (error) {
        console.error("Failed to save organisation", error);
      } finally {
        setIsSaving(false);
      }
    }
  });

  const handleLogoUpload = async (file: File) => {
    setIsUploading(true);
    try {
      // Assumes a bucket named 'public' exists in Supabase. Adjust 'logos' if needed.
      const url = await settingsService.uploadPublicFile(file, 'public', 'logos');
      form.setFieldValue('logo_url', url);
    } catch (error) {
      console.error("Failed to upload logo", error);
    } finally {
      setIsUploading(false);
    }
  };

  const inputClass = "mt-1.5 block w-full border border-slate-800/80 rounded-xl p-3 bg-[#0A0B0E] text-sm font-bold text-white focus:outline-none focus:border-indigo-500/50 transition-all shadow-inner";
  const labelClass = "block text-[10px] font-black text-slate-500 uppercase tracking-widest";

  return (
    <form onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); form.handleSubmit(); }} className="p-6">
      
      {/* Brand Identity / Logo Upload Section */}
      <div className="mb-8 p-6 bg-[#0A0B0E] rounded-2xl border border-slate-800/80 flex items-center gap-6">
        <form.Field name="logo_url" children={(field) => (
          <>
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="w-24 h-24 shrink-0 rounded-2xl border-2 border-dashed border-slate-700 hover:border-indigo-500 bg-[#0F1117] flex items-center justify-center cursor-pointer overflow-hidden transition-colors group relative"
            >
              {isUploading ? (
                <Loader2 className="animate-spin text-indigo-500" size={24} />
              ) : field.state.value ? (
                <>
                  <img src={field.state.value} alt="Org Logo" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <UploadCloud size={20} className="text-white" />
                  </div>
                </>
              ) : (
                <ImageIcon size={24} className="text-slate-600 group-hover:text-indigo-500 transition-colors" />
              )}
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-tight">Facility Logo</h3>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1 mb-3">Upload a PNG or JPEG (Max 2MB)</p>
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                ref={fileInputRef} 
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleLogoUpload(file);
                }} 
              />
              <button 
                type="button" 
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="px-4 py-2 bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600/20 transition-colors disabled:opacity-50"
              >
                {field.state.value ? 'Change Image' : 'Select Image'}
              </button>
            </div>
          </>
        )} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-5">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-800/80 pb-2">Core Identity</h3>
          <form.Field name="org_name" children={(field) => (
            <div>
              <label className={labelClass}>Organisation Name *</label>
              <input value={field.state.value || ''} onChange={(e) => field.handleChange(e.target.value)} required className={inputClass} />
            </div>
          )} />
          <form.Field name="zla_license_number" children={(field) => (
            <div>
              <label className={labelClass}>ZLA Licence Number</label>
              <input value={field.state.value || ''} onChange={(e) => field.handleChange(e.target.value)} className={inputClass} />
            </div>
          )} />
          <form.Field name="address" children={(field) => (
            <div>
              <label className={labelClass}>Registered Address</label>
              <textarea value={field.state.value || ''} onChange={(e) => field.handleChange(e.target.value)} rows={3} className={`${inputClass} resize-none`} />
            </div>
          )} />
        </div>

        <div className="space-y-5">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-800/80 pb-2">Digital Contact</h3>
          <form.Field name="contact_email" children={(field) => (
            <div>
              <label className={labelClass}>Contact Email</label>
              <input type="email" value={field.state.value || ''} onChange={(e) => field.handleChange(e.target.value)} className={inputClass} />
            </div>
          )} />
          <form.Field name="contact_phone" children={(field) => (
            <div>
              <label className={labelClass}>Contact Phone</label>
              <input value={field.state.value || ''} onChange={(e) => field.handleChange(e.target.value)} className={inputClass} />
            </div>
          )} />
          <form.Field name="official_website" children={(field) => (
            <div>
              <label className={labelClass}>Official Website</label>
              <input value={field.state.value || ''} onChange={(e) => field.handleChange(e.target.value)} className={inputClass} />
            </div>
          )} />
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-slate-800/80 flex justify-end">
        <button 
          type="submit" 
          disabled={isSaving}
          className="bg-indigo-600 text-white px-8 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(99,102,241,0.2)] transition-all"
        >
          {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Update Framework
        </button>
      </div>
    </form>
  );
}