import { supabase } from '../lib/supabase';
import { Shift, LeaveRequest, ShiftPattern } from '../types/schema';
import { useOutboxStore } from '../store/outboxStore';

export const rotaService = {
  async saveShiftPattern(pattern: Partial<ShiftPattern>, userId: string): Promise<ShiftPattern> {
    const payload = {
      ...pattern,
      modified_by: userId,
      ...(pattern.id ? {} : { created_by: userId })
    };

    try {
      if (pattern.id) {
        const { data, error } = await supabase.from('shift_patterns').update(payload).eq('id', pattern.id).select().single();
        if (error) throw error;
        return data as ShiftPattern;
      } else {
        const { data, error } = await supabase.from('shift_patterns').insert(payload).select().single();
        if (error) throw error;
        return data as ShiftPattern;
      }
    } catch (error) {
      console.error("Shift pattern mutation failed, queueing to outbox:", error);
      useOutboxStore.getState().addMutation({
        id: crypto.randomUUID(),
        table: 'shift_patterns',
        action: pattern.id ? 'update' : 'insert',
        payload: payload as any
      });
      throw error;
    }
  },

  async saveShift(shift: Partial<Shift>, userId: string): Promise<Shift> {
    const payload = {
      ...shift,
      modified_by: userId,
      ...(shift.id ? {} : { created_by: userId })
    };

    try {
      if (shift.id) {
        const { data, error } = await supabase.from('shifts').update(payload).eq('id', shift.id).select().single();
        if (error) throw error;
        return data as Shift;
      } else {
        const { data, error } = await supabase.from('shifts').insert(payload).select().single();
        if (error) throw error;
        return data as Shift;
      }
    } catch (error) {
      console.error("Shift mutation failed, queueing to outbox:", error);
      useOutboxStore.getState().addMutation({
        id: crypto.randomUUID(),
        table: 'shifts',
        action: shift.id ? 'update' : 'insert',
        payload: payload
      });
      throw error; // Let the UI handle the optimistic close
    }
  },

  async saveLeaveRequest(request: Partial<LeaveRequest>, userId: string): Promise<LeaveRequest> {
    const payload = {
      ...request,
      modified_by: userId,
      ...(request.id ? {} : { created_by: userId })
    };

    try {
      if (request.id) {
        const { data, error } = await supabase.from('leave_requests').update(payload).eq('id', request.id).select().single();
        if (error) throw error;
        return data as LeaveRequest;
      } else {
        const { data, error } = await supabase.from('leave_requests').insert(payload).select().single();
        if (error) throw error;
        return data as LeaveRequest;
      }
    } catch (error) {
      console.error("Leave request mutation failed, queueing to outbox:", error);
      useOutboxStore.getState().addMutation({
        id: crypto.randomUUID(),
        table: 'leave_requests',
        action: request.id ? 'update' : 'insert',
        payload: payload
      });
      throw error;
    }
  }
};