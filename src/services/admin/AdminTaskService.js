
import { supabase } from '@/api/supabaseClient';

export const AdminTaskService = {
    async list() {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data, error } = await supabase
            .from('admin_personal_tasks')
            .select('*')
            .eq('user_id', user.id)
            .order('priority', { ascending: false }) // High priority first
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    async create(task) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data, error } = await supabase
            .from('admin_personal_tasks')
            .insert({ ...task, user_id: user.id })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async update(id, updates) {
        const { data, error } = await supabase
            .from('admin_personal_tasks')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async delete(id) {
        const { error } = await supabase
            .from('admin_personal_tasks')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};
