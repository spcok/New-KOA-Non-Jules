import { supabase } from '../lib/supabase';
import { useOutboxStore } from '../store/outboxStore';
import { Incident, IncidentSchema } from '../types/schema';
import { queryClient } from '../lib/db';

const generateUUID = () => crypto.randomUUID();

export const incidentService = {
  getIncidents: async (): Promise<Incident[]> => {
    const { data, error } = await supabase
      .from('incidents')
      .select('*')
      .eq('is_deleted', false)
      .order('incident_date', { ascending: false })
      .limit(100);

    if (error) {
      console.error("Error fetching incidents:", error);
      throw error;
    }
    
    return data as Incident[];
  },

  saveIncident: async (data: Partial<Incident>): Promise<void> => {
    // 1. NULL LAW: Sanitize payload to replace empty strings with nulls
    const sanitizedData = Object.fromEntries(
      Object.entries(data).map(([key, value]) => [
        key,
        value === '' ? null : value
      ])
    );

    const payload = IncidentSchema.parse({
      ...sanitizedData,
      id: sanitizedData.id || generateUUID(),
      animal_involved: sanitizedData.animal_involved ?? false,
      first_aid_required: sanitizedData.first_aid_required ?? false,
      investigation_status: sanitizedData.investigation_status || 'OPEN',
      modified_at: new Date().toISOString(),
      created_at: sanitizedData.id ? sanitizedData.created_at : new Date().toISOString(),
      is_deleted: false,
    });

    try {
      const { error } = await supabase.from('incidents').upsert(payload);
      if (error) throw error;
    } catch (error) {
      console.warn("Network offline. Queueing Incident Log to outbox.", error);
      useOutboxStore.getState().addMutation({
        id: generateUUID(),
        table: 'incidents',
        action: 'upsert',
        payload
      });
    }
    
    queryClient.invalidateQueries({ queryKey: ['incidents'] });
  }
};