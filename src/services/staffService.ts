// Add this inside the staffService object
  createStaffMemberOnline: async (payload: Partial<User>): Promise<{ tempPassword: string, email: string }> => {
    // This action requires network. It bypasses the outbox.
    const { data, error } = await supabase.functions.invoke('create-staff', {
      body: payload
    });

    if (error) throw new Error(error.message);
    if (data.error) throw new Error(data.error);

    return { tempPassword: data.tempPassword, email: data.email };
  },