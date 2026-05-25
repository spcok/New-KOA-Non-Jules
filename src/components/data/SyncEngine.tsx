// src/components/data/SyncEngine.tsx
import { useEffect } from 'react';
import { useShape } from '@electric-sql/react';
import { useQueryClient } from '@tanstack/react-query';
import { useOutboxStore } from '../../store/outboxStore';
import { supabase } from '../../lib/supabase';

const ELECTRIC_URL = import.meta.env.VITE_ELECTRIC_URL || 'http://localhost:3000';
const BASE_SHAPE_URL = `${ELECTRIC_URL}/v1/shape`;

export function SyncEngine() {
  const queryClient = useQueryClient();

  // 1. DOWNLINK SHAPES
  const { data: animals } = useShape({ url: BASE_SHAPE_URL, params: { table: 'animals' } });
  const { data: clinicalAttachments } = useShape({ url: BASE_SHAPE_URL, params: { table: 'clinical_attachments' } });
  const { data: clinicalRecords } = useShape({ url: BASE_SHAPE_URL, params: { table: 'clinical_records' } });
  const { data: clinicalSchedule } = useShape({ url: BASE_SHAPE_URL, params: { table: 'clinical_schedule' } });
  const { data: dailyLogs } = useShape({ url: BASE_SHAPE_URL, params: { table: 'daily_logs' } });
  const { data: dailyRounds } = useShape({ url: BASE_SHAPE_URL, params: { table: 'daily_rounds' } });
  const { data: feedingSchedules } = useShape({ url: BASE_SHAPE_URL, params: { table: 'feeding_schedules' } });
  const { data: firstAidLogs } = useShape({ url: BASE_SHAPE_URL, params: { table: 'first_aid_logs' } });
  const { data: incidents } = useShape({ url: BASE_SHAPE_URL, params: { table: 'incidents' } });
  const { data: isolationLogs } = useShape({ url: BASE_SHAPE_URL, params: { table: 'isolation_logs' } });
  const { data: leaveRequests } = useShape({ url: BASE_SHAPE_URL, params: { table: 'leave_requests' } });
  const { data: maintenanceTickets } = useShape({ url: BASE_SHAPE_URL, params: { table: 'maintenance_tickets' } });
  const { data: medicationLogs } = useShape({ url: BASE_SHAPE_URL, params: { table: 'medication_logs' } });
  const { data: operationalLists } = useShape({ url: BASE_SHAPE_URL, params: { table: 'operational_lists' } });
  const { data: organisations } = useShape({ url: BASE_SHAPE_URL, params: { table: 'organisations' } });
  const { data: rolePermissions } = useShape({ url: BASE_SHAPE_URL, params: { table: 'role_permissions' } });
  const { data: safetyDrills } = useShape({ url: BASE_SHAPE_URL, params: { table: 'safety_drills' } });
  const { data: shifts } = useShape({ url: BASE_SHAPE_URL, params: { table: 'shifts' } });
  const { data: shiftPatterns } = useShape({ url: BASE_SHAPE_URL, params: { table: 'shift_patterns' } });
  const { data: tasks } = useShape({ url: BASE_SHAPE_URL, params: { table: 'tasks' } });
  const { data: timesheets } = useShape({ url: BASE_SHAPE_URL, params: { table: 'timesheets' } });
  const { data: users } = useShape({ url: BASE_SHAPE_URL, params: { table: 'users' } });
  const { data: zlaDocuments } = useShape({ url: BASE_SHAPE_URL, params: { table: 'zla_documents' } });

  // 2. CACHE INJECTION
  useEffect(() => { if (animals) queryClient.setQueryData(['animals'], animals); }, [animals, queryClient]);
  useEffect(() => { if (clinicalAttachments) queryClient.setQueryData(['clinical_attachments'], clinicalAttachments); }, [clinicalAttachments, queryClient]);
  useEffect(() => { if (clinicalRecords) queryClient.setQueryData(['clinical_records'], clinicalRecords); }, [clinicalRecords, queryClient]);
  useEffect(() => { if (clinicalSchedule) queryClient.setQueryData(['clinical_schedule'], clinicalSchedule); }, [clinicalSchedule, queryClient]);
  useEffect(() => { if (dailyLogs) queryClient.setQueryData(['daily_logs'], dailyLogs); }, [dailyLogs, queryClient]);
  useEffect(() => { if (dailyRounds) queryClient.setQueryData(['daily_rounds'], dailyRounds); }, [dailyRounds, queryClient]);
  useEffect(() => { if (feedingSchedules) queryClient.setQueryData(['feeding_schedules'], feedingSchedules); }, [feedingSchedules, queryClient]);
  useEffect(() => { if (firstAidLogs) queryClient.setQueryData(['first_aid_logs'], firstAidLogs); }, [firstAidLogs, queryClient]);
  useEffect(() => { if (incidents) queryClient.setQueryData(['incidents'], incidents); }, [incidents, queryClient]);
  useEffect(() => { if (isolationLogs) queryClient.setQueryData(['isolation_logs'], isolationLogs); }, [isolationLogs, queryClient]);
  useEffect(() => { if (leaveRequests) queryClient.setQueryData(['leave_requests'], leaveRequests); }, [leaveRequests, queryClient]);
  useEffect(() => { if (maintenanceTickets) queryClient.setQueryData(['maintenance_tickets'], maintenanceTickets); }, [maintenanceTickets, queryClient]);
  useEffect(() => { if (medicationLogs) queryClient.setQueryData(['medication_logs'], medicationLogs); }, [medicationLogs, queryClient]);
  useEffect(() => { if (operationalLists) queryClient.setQueryData(['operational_lists'], operationalLists); }, [operationalLists, queryClient]);
  useEffect(() => { if (organisations) queryClient.setQueryData(['organisations'], organisations); }, [organisations, queryClient]);
  useEffect(() => { if (rolePermissions) queryClient.setQueryData(['role_permissions'], rolePermissions); }, [rolePermissions, queryClient]);
  useEffect(() => { if (safetyDrills) queryClient.setQueryData(['safety_drills'], safetyDrills); }, [safetyDrills, queryClient]);
  useEffect(() => { if (shifts) queryClient.setQueryData(['shifts'], shifts); }, [shifts, queryClient]);
  useEffect(() => { if (shiftPatterns) queryClient.setQueryData(['shift_patterns'], shiftPatterns); }, [shiftPatterns, queryClient]);
  useEffect(() => { if (tasks) queryClient.setQueryData(['tasks'], tasks); }, [tasks, queryClient]);
  useEffect(() => { if (timesheets) queryClient.setQueryData(['timesheets'], timesheets); }, [timesheets, queryClient]);
  useEffect(() => { if (users) queryClient.setQueryData(['users'], users); }, [users, queryClient]);
  useEffect(() => { if (zlaDocuments) queryClient.setQueryData(['zla_documents'], zlaDocuments); }, [zlaDocuments, queryClient]);

  // 3. OUTBOX DRAINER
  useEffect(() => {
    const drainOutbox = async () => {
      if (!navigator.onLine) return;
      
      const mutations = useOutboxStore.getState().mutations;
      if (mutations.length === 0) return;

      console.log(`Attempting to drain ${mutations.length} items from Outbox...`);
      for (const mutation of mutations) {
        try {
          if (mutation.action === 'update' || mutation.action === 'upsert') {
            const { error } = await supabase.from(mutation.table).upsert(mutation.payload);
            if (!error) {
              useOutboxStore.getState().removeMutation(mutation.id);
              console.log(`Successfully synced offline update: ${mutation.id}`);
            } else {
              console.error("Drain error upserting:", error);
            }
          } else if (mutation.action === 'insert') {
             const { error } = await supabase.from(mutation.table).insert(mutation.payload);
             if (!error) {
                useOutboxStore.getState().removeMutation(mutation.id);
                console.log(`Successfully synced offline insert: ${mutation.id}`);
             } else {
                console.error("Drain error inserting:", error);
             }
          }
        } catch (err) {
           console.error("Network error during outbox drain", err);
        }
      }
    };

    window.addEventListener('online', drainOutbox);
    const interval = setInterval(drainOutbox, 10000); 
    
    return () => {
      window.removeEventListener('online', drainOutbox);
      clearInterval(interval);
    };
  }, []);

  return null;
}