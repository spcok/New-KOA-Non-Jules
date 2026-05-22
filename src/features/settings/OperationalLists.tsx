import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Utensils, Ticket, Plus, Trash2, Activity, MapPin, ChevronRight, Loader2 } from 'lucide-react';
import { settingsService } from '../../services/settingsService';
import { OperationalList } from '../../types/schema';
import { useAuthStore } from '../../store/authStore';

type ListCategory = 'OWLS' | 'RAPTORS' | 'MAMMALS' | 'EXOTICS';

export default function OperationalLists() {
  const queryClient = useQueryClient();
  const session = useAuthStore(s => s.session);
  const [activeCategory, setActiveCategory] = useState<ListCategory>('OWLS');
  const [newValues, setNewValues] = useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const categories: ListCategory[] = ['OWLS', 'RAPTORS', 'MAMMALS', 'EXOTICS'];

  const { data: allLists = [], isLoading } = useQuery({
    queryKey: ['operational_lists'],
    queryFn: () => settingsService.getOperationalLists(),
  });

  const handleAdd = async (listType: OperationalList['category']) => {
    const value = newValues[listType || ''];
    if (!value?.trim() || !listType) return;

    setIsProcessing(listType);
    try {
      await settingsService.addOperationalListItem({
        category: listType,
        name: value.trim(),
        description: activeCategory 
      }, session?.user?.id);
      setNewValues(prev => ({ ...prev, [listType]: '' }));
      queryClient.invalidateQueries({ queryKey: ['operational_lists'] });
    } finally {
      setIsProcessing(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this operational parameter?')) return;
    await settingsService.deleteOperationalListItem(id, session?.user?.id);
    queryClient.invalidateQueries({ queryKey: ['operational_lists'] });
  };

  const renderListBlock = (
    listType: string, 
    title: string, 
    icon: React.ReactNode, 
    scoped: boolean = true
  ) => {
    const items = allLists.filter(item => 
      item.category === listType && 
      (!scoped || item.description === activeCategory)
    );

    return (
      <div className="bg-[#0F1117] border border-slate-800/80 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
        <div className="bg-[#0A0B0E] border-b border-slate-800/80 p-4 flex items-center gap-2">
          <div className="text-indigo-500">{icon}</div>
          <h3 className="font-black text-white text-sm uppercase tracking-tight">{title}</h3>
          {!scoped && <span className="ml-auto text-[9px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-md">Global</span>}
        </div>
        
        <div className="flex-1 p-4 space-y-2 min-h-[150px]">
          {items.length === 0 ? (
            <p className="text-[10px] font-bold text-slate-500 text-center py-6 uppercase tracking-widest">No parameters defined</p>
          ) : (
            items.map(item => (
              <div key={item.id} className="flex justify-between items-center group p-2.5 bg-[#0A0B0E] rounded-xl border border-transparent hover:border-slate-700 transition-colors shadow-inner">
                <span className="text-sm font-bold text-slate-300">{item.name}</span>
                <button 
                  onClick={() => handleDelete(item.id!)}
                  className="text-slate-600 hover:text-rose-400 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-slate-800/80 bg-[#0A0B0E]">
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder={`Add ${title.toLowerCase()}...`}
              value={newValues[listType] || ''}
              onChange={(e) => setNewValues(prev => ({ ...prev, [listType]: e.target.value }))}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd(listType)}
              className="flex-1 bg-[#0F1117] border border-slate-700 rounded-xl px-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-indigo-500/50 transition-colors shadow-inner"
            />
            <button 
              onClick={() => handleAdd(listType)}
              disabled={isProcessing === listType || !newValues[listType]?.trim()}
              className="bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 p-2.5 rounded-xl hover:bg-indigo-600 hover:text-white disabled:opacity-50 transition-all flex items-center justify-center min-w-[44px]"
            >
              {isProcessing === listType ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-indigo-500" size={32} /></div>;
  }

  return (
    <div className="space-y-6 max-w-6xl font-sans">
      
      <div className="bg-[#0F1117] p-1.5 rounded-2xl border border-slate-800/80 shadow-inner overflow-x-auto">
        <div className="flex min-w-max">
          {categories.map(cat => (
            <button 
              key={cat} 
              onClick={() => setActiveCategory(cat)}
              className={`flex-1 px-6 py-3.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${
                activeCategory === cat 
                  ? 'bg-indigo-600/10 text-indigo-400 shadow-sm border border-indigo-500/20' 
                  : 'text-slate-500 hover:text-slate-300 hover:bg-[#0A0B0E] border border-transparent'
              }`}
            >
              {cat} Parameters
            </button>
          ))}
        </div>
      </div>

      <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 flex gap-3 shadow-inner">
        <div className="p-2 bg-[#0A0B0E] rounded-xl border border-amber-500/20 text-amber-500 h-fit">
          <ChevronRight size={18} />
        </div>
        <div>
          <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-1">Data Consistency Architecture</h4>
          <p className="text-xs font-bold text-slate-400 leading-relaxed">
            Food types and Feed methods are <strong className="font-black text-slate-300">scoped</strong> directly to the selected Animal Category above. Event Types and Locations operate as <strong className="font-black text-slate-300">global</strong> parameters across the entire facility.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {renderListBlock('food_type', 'Dietary Components', <Utensils size={18} />, true)}
        {renderListBlock('feed_method', 'Delivery Mechanics', <Activity size={18} />, true)}
        {renderListBlock('event', 'Commercial Events', <Ticket size={18} />, false)}
        {renderListBlock('location', 'Facility Zones', <MapPin size={18} />, false)}
      </div>

    </div>
  );
}