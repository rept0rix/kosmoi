import { supabase } from '@/api/supabaseClient';

export const VisualEditService = {
    /**
     * Save a visual edit (text, style, etc.)
     * @param {Object} edit - { page_path, selector_id, edit_type, value }
     */
    async saveEdit(edit) {
        const { page_path, selector_id, edit_type, value } = edit;

        // We use upsert to overwrite existing edits for the same element/type
        const { data, error } = await supabase
            .from('page_edits')
            .upsert({
                page_path,
                selector_id,
                edit_type,
                value,
                status: 'published',
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'page_path, selector_id, edit_type'
            })
            .select()
            .single();

        if (error) {
            console.error('Error saving visual edit:', error);
            throw error;
        }

        return data;
    },

    /**
     * Fetch all edits for a specific page
     * @param {string} pagePath 
     */
    async fetchEditsForPage(pagePath) {
        const { data, error } = await supabase
            .from('page_edits')
            .select('*')
            .eq('page_path', pagePath)
            .eq('status', 'published');

        if (error) {
            console.error('Error fetching visual edits:', error);
            return [];
        }

        return data;
    },

    /**
     * Delete/Revert an edit
     */
    async deleteEdit(pagePath, selectorId, editType) {
        const { error } = await supabase
            .from('page_edits')
            .delete()
            .match({
                page_path: pagePath,
                selector_id: selectorId,
                edit_type: editType
            });

        if (error) {
            console.error('Error deleting visual edit:', error);
            throw error;
        }
    }
};
