import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useOutboxStore } from '../../store/outboxStore';
import { CloudOff, CloudUpload, CheckCircle2, Loader2 } from 'lucide-react';

export function SyncEngine() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Zustand specific selectors
  const mutations = useOutboxStore((s) => s.mutations);
  const removeMutation = useOutboxStore((s) => s.removeMutation);

  const processOutbox = useCallback(async () => {
    // Prevent overlapping sync loops or syncing while offline/empty
    if (isSyncing || mutations.length === 0 || !navigator.onLine) return;
    
    setIsSyncing(true);

    // Ensure FIFO (First In, First Out) execution order based on creation time
    const queue = [...mutations].sort((a, b) => 
      new Date(a.payload.created_at || 0).getTime() - new Date(b.payload.created_at || 0).getTime()
    );

    for (const item of queue) {
      try {
        // Drainer Payload Execution
        const { error } = await supabase.from(item.table).upsert(item.payload);
        
        if (error) {
          // If it's a hard schema rejection (e.g. 400), we might want to flag it in a real production app.
          // For now, if it fails, we throw to break the loop and try again later.
          throw error;
        }

        // Successfully synced to cloud -> Remove from local outbox queue
        removeMutation(item.id);
        
      } catch (error) {
        console.warn(`[SyncEngine] Drain halted at ${item.table}. Connection unstable.`, error);
        break; // Stop the queue entirely. Wait for the next 'online' event to resume.
      }
    }

    setIsSyncing(false);
  }, [isSyncing, mutations, removeMutation]);

  // Network Event Listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      processOutbox(); // Trigger flush immediately when Wi-Fi connects
    };
    
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial mount check (In case they booted the app while already online with a pending queue)
    if (navigator.onLine && mutations.length > 0 && !isSyncing) {
      processOutbox();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [mutations.length, processOutbox]);


  // --- TELEMETRY UI RENDERING ---
  // Only show the widget if we are offline, or if we have things in the queue
  if (isOnline && mutations.length === 0 && !isSyncing) {
    return null; // Totally clean state, hide the UI
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2 animate-in slide-in-from-bottom-4 fade-in duration-300">
      
      {/* Offline Warning */}
      {!isOnline && (
        <div className="flex items-center gap-3 bg-rose-500/10 border border-rose-500/20 backdrop-blur-md px-4 py-2.5 rounded-full shadow-2xl">
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
          </div>
          <CloudOff size={14} className="text-rose-400" />
          <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest">
            Offline Mode
          </span>
        </div>
      )}

      {/* Syncing Queue Status */}
      {mutations.length > 0 && (
        <div className="flex items-center gap-3 bg-[#0A0B0E]/90 border border-slate-800/80 backdrop-blur-md px-4 py-2.5 rounded-full shadow-2xl">
          {isSyncing ? (
            <Loader2 size={14} className="text-blue-500 animate-spin" />
          ) : isOnline ? (
             <CloudUpload size={14} className="text-amber-500 animate-pulse" />
          ) : (
            <CloudUpload size={14} className="text-slate-600" />
          )}
          
          <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
            {isSyncing ? 'Syncing...' : 'Pending Sync'}
            <span className="ml-2 text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded text-[9px]">
              {mutations.length}
            </span>
          </span>
        </div>
      )}

    </div>
  );
}