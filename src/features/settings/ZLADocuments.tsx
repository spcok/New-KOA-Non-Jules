import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from '@tanstack/react-form';
import { FileText, Upload, Trash2, X, Loader2, Save } from 'lucide-react';
import { settingsService } from '../../services/settingsService';
import { ZLADocument } from '../../types/schema';

export default function ZLADocuments() {
  const queryClient = useQueryClient();
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['zla_documents'],
    queryFn: () => settingsService.getZLADocuments(),
  });

  const handleDeleteDocument = async (id: string) => {
    if (window.confirm('Delete document permanently?')) {
      await settingsService.deleteZLADocument(id);
      queryClient.invalidateQueries({ queryKey: ['zla_documents'] });
    }
  };

  return (
    <div className="bg-[#0F1117] rounded-3xl border border-slate-800/80 overflow-hidden shadow-2xl font-sans">
      <div className="border-b border-slate-800/80 p-6 flex justify-between items-center bg-[#0A0B0E]">
        <div>
          <h2 className="text-lg font-black text-white flex items-center gap-2 uppercase tracking-tight">
            <FileText size={20} className="text-emerald-500" /> Regulatory Vault
          </h2>
          <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-widest">Zoo Licensing Act (1981) Compliance</p>
        </div>
        <button 
          onClick={() => setIsDocModalOpen(true)}
          className="bg-emerald-600/10 text-emerald-400 border border-emerald-500/20 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600/20 flex items-center gap-2 transition-all shadow-inner"
        >
          <Upload size={14} /> Upload Artifact
        </button>
      </div>

      <div className="p-6">
        {isLoading ? (
          <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-emerald-500" /></div>
        ) : documents.length === 0 ? (
          <div className="text-center py-12 bg-[#0A0B0E] rounded-2xl border-2 border-dashed border-slate-800/80">
            <FileText size={32} className="mx-auto text-slate-600 mb-3" />
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Registry Empty</h3>
            <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-widest">No compliance documents stored.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map((doc) => (
              <div key={doc.id} className="border border-slate-800/80 rounded-2xl p-4 flex items-start gap-4 hover:border-emerald-500/30 transition-colors bg-[#0A0B0E] group shadow-inner">
                <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl shrink-0">
                  <FileText size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-white text-sm truncate">{doc.name}</h4>
                  <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mt-1 bg-emerald-500/10 inline-block px-2 py-0.5 rounded-md border border-emerald-500/20">{doc.category}</p>
                  <p className="text-[10px] font-bold text-slate-500 mt-1.5 uppercase tracking-widest">
                    {new Date(doc.upload_date).toLocaleDateString()}
                  </p>
                </div>
                <button 
                  onClick={() => handleDeleteDocument(doc.id!)}
                  className="text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 p-2 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {isDocModalOpen && <DocumentModal onClose={() => setIsDocModalOpen(false)} />}
    </div>
  );
}

function DocumentModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    defaultValues: { category: 'Licensing', file_url: '', name: '' },
    onSubmit: async ({ value }) => {
      setIsSubmitting(true);
      try {
        await settingsService.addZLADocument(value);
        queryClient.invalidateQueries({ queryKey: ['zla_documents'] });
        onClose();
      } catch (error) {
        console.error("Failed to save document", error);
      } finally {
        setIsSubmitting(false);
      }
    }
  });

  const inputClass = "w-full bg-[#0A0B0E] border border-slate-800/80 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-emerald-500/50 transition-all shadow-inner";

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 font-sans">
      <div className="bg-[#0F1117] border border-slate-800/80 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="p-5 border-b border-slate-800/80 flex justify-between items-center bg-[#0A0B0E]">
          <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
            <Upload size={16} className="text-emerald-500" /> Upload Artifact
          </h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors"><X size={20} /></button>
        </div>
        
        <form onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); form.handleSubmit(); }} className="p-6 space-y-5">
          <form.Field name="category" children={(field) => (
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Document Category</label>
              <select value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} className={inputClass}>
                <option value="Licensing">Licensing</option>
                <option value="Insurance">Insurance</option>
                <option value="Protocols">Protocols</option>
                <option value="Audits">Audits</option>
              </select>
            </div>
          )} />
          
          <form.Field name="file_url" children={(field) => (
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">File Target</label>
              <input type="file" required onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (evt) => {
                    field.handleChange(evt.target?.result as string);
                    form.setFieldValue('name', file.name);
                  };
                  reader.readAsDataURL(file);
                }
              }} className={`text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-[10px] file:font-black file:uppercase file:tracking-widest file:bg-slate-800 file:text-white hover:file:bg-slate-700 ${inputClass}`} />
            </div>
          )} />

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full bg-emerald-600 text-white py-4 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-emerald-500 transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)] disabled:opacity-50 flex justify-center gap-2 mt-4"
          >
            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Commit to Vault
          </button>
        </form>
      </div>
    </div>
  );
}