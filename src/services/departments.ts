import { supabase } from '../lib/supabase';
import { Department } from '../types';

export interface DepartmentWithLeader extends Department {
    leader?: {
        id: string;
        full_name: string | null;
        email: string;
        avatar_url: string | null;
    } | null;
}

export const departmentService = {
    async getDepartments(): Promise<DepartmentWithLeader[]> {
        const { data, error } = await supabase
            .from('departments')
            .select(`
                *,
                leader:profiles!departments_leader_id_fkey (
                    id,
                    full_name,
                    email,
                    avatar_url
                )
            `)
            .order('name', { ascending: true });

        if (error) {
            console.error('Error fetching departments:', error);
            // Fallback: fetch without join
            const { data: fallbackData, error: fallbackError } = await supabase
                .from('departments')
                .select('*')
                .order('name', { ascending: true });
            if (fallbackError) throw fallbackError;
            return (fallbackData || []) as DepartmentWithLeader[];
        }

        return (data || []) as DepartmentWithLeader[];
    },

    async createDepartment(dept: { name: string; description?: string; leader_id?: string | null }) {
        const { data, error } = await supabase
            .from('departments')
            .insert(dept)
            .select()
            .single();

        if (error) throw error;

        // Auto-assign leader as member of this department
        if (dept.leader_id && data) {
            await supabase.from('profiles').update({ department_id: data.id }).eq('id', dept.leader_id);
        }

        return data;
    },

    async updateDepartment(id: string, updates: { name?: string; description?: string; leader_id?: string | null }) {
        const { error } = await supabase
            .from('departments')
            .update(updates)
            .eq('id', id);

        if (error) throw error;

        // Auto-assign leader as member of this department
        if (updates.leader_id) {
            await supabase.from('profiles').update({ department_id: id }).eq('id', updates.leader_id);
        }
    },

    async deleteDepartment(id: string) {
        const { error } = await supabase
            .from('departments')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },
};
