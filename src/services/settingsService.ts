import { supabase } from '../lib/supabase';
import { useOutboxStore } from '../store/outboxStore';
import { 
  Organisation, 
  OrganisationSchema, 
  ZLADocument, 
  ZLADocumentSchema, 
  OperationalList, 
  OperationalListSchema 
} from '../types/schema';

const generateUUID = () => crypto.randomUUID();

export const settingsService = {
  // ==========================================
  // ORGANISATION CAPABILITIES
  // ==========================================
  getOrganisation: async (): Promise<Organisation | null> => {
    const { data, error } = await supabase
      .from('organisations')
      .select('*')
      .eq('is_deleted', false)
      .limit(1)
      .single();
      
    if (error && error.code !== 'PGRST116') { // Ignore 'no rows returned' error on fresh setup
      console.error("Error fetching organisation:", error);
      throw error;
    }
    return data as Organisation | null;
  },

  updateOrganisation: async (payload: Partial<Organisation>): Promise<void> => {
    // NULL LAW: Ensure empty strings become null
    const sanitizedPayload = Object.fromEntries(
      Object.entries(payload).map(([key, value]) => [key, value === '' ? null : value])
    );

    const isNew = !sanitizedPayload.id;
    const finalPayload = OrganisationSchema.parse({
      ...sanitizedPayload,
      id: sanitizedPayload.id || generateUUID(),
      updated_at: new Date().toISOString(),
      created_at: isNew ? new Date().toISOString() : sanitizedPayload.created_at,
    });

    try {
      const { error } = await supabase.from('organisations').upsert(finalPayload);
      if (error) throw error;
    } catch (error) {
      console.warn("Network offline. Queueing Organisation update to outbox.", error);
      useOutboxStore.getState().addMutation({
        id: generateUUID(),
        table: 'organisations',
        action: 'upsert',
        payload: finalPayload as Record<string, unknown>
      });
    }
  },

  // ==========================================
  // ZLA DOCUMENT CAPABILITIES
  // ==========================================
  getZLADocuments: async (): Promise<ZLADocument[]> => {
    const { data, error } = await supabase
      .from('zla_documents')
      .select('*')
      .eq('is_deleted', false)
      .order('upload_date', { ascending: false });

    if (error) throw error;
    return data as ZLADocument[];
  },

  addZLADocument: async (payload: Partial<ZLADocument>): Promise<void> => {
    const finalPayload = ZLADocumentSchema.parse({
      ...payload,
      id: generateUUID(),
      upload_date: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      _modified: new Date().toISOString(),
    });

    try {
      const { error } = await supabase.from('zla_documents').insert(finalPayload);
      if (error) throw error;
    } catch (error) {
      console.warn("Network offline. Queueing ZLA Document to outbox.", error);
      useOutboxStore.getState().addMutation({
        id: generateUUID(),
        table: 'zla_documents',
        action: 'insert',
        payload: finalPayload as Record<string, unknown>
      });
    }
  },

  deleteZLADocument: async (id: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('zla_documents')
        .update({ is_deleted: true, updated_at: new Date().toISOString(), _modified: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    } catch (error) {
      console.warn("Network offline. Queueing ZLA Document deletion to outbox.", error);
      useOutboxStore.getState().addMutation({
        id: generateUUID(),
        table: 'zla_documents',
        action: 'update',
        payload: { id, is_deleted: true, updated_at: new Date().toISOString(), _modified: new Date().toISOString() }
      });
    }
  },

  // ==========================================
  // OPERATIONAL LIST CAPABILITIES
  // ==========================================
  getOperationalLists: async (): Promise<OperationalList[]> => {
    const { data, error } = await supabase
      .from('operational_lists')
      .select('*')
      .eq('is_deleted', false);

    if (error) throw error;
    return data as OperationalList[];
  },

  addOperationalListItem: async (payload: Partial<OperationalList>, userId?: string): Promise<void> => {
    // NULL LAW: Convert empty strings to null for global categories
    const finalPayload = OperationalListSchema.parse({
      ...payload,
      id: generateUUID(),
      description: payload.description === '' ? null : payload.description,
      category: payload.category === '' ? null : payload.category,
      created_by: userId || null,
      modified_by: userId || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    try {
      const { error } = await supabase.from('operational_lists').insert(finalPayload);
      if (error) throw error;
    } catch (error) {
      console.warn("Network offline. Queueing List Item to outbox.", error);
      useOutboxStore.getState().addMutation({
        id: generateUUID(),
        table: 'operational_lists',
        action: 'insert',
        payload: finalPayload as Record<string, unknown>
      });
    }
  },

  deleteOperationalListItem: async (id: string, userId?: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('operational_lists')
        .update({ 
          is_deleted: true, 
          updated_at: new Date().toISOString(),
          modified_by: userId || null 
        })
        .eq('id', id);
      if (error) throw error;
    } catch (error) {
      console.warn("Network offline. Queueing List Item deletion to outbox.", error);
      useOutboxStore.getState().addMutation({
        id: generateUUID(),
        table: 'operational_lists',
        action: 'update',
        payload: { id, is_deleted: true, updated_at: new Date().toISOString(), modified_by: userId || null }
      });
    }
  },

  // ==========================================
  // STORAGE CAPABILITIES
  // ==========================================
  uploadPublicFile: async (file: File, bucket: string, folder: string): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${generateUUID()}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    // Note: Storage uploads require network connectivity. 
    // They bypass the outbox because blob sync requires dedicated offline-first file handling.
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      console.error("Storage upload failed:", uploadError);
      throw uploadError;
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
    return data.publicUrl;
  }
};