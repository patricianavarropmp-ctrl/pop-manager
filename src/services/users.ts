import { supabase } from '../lib/supabase';
import { Profile } from '../types';

export const userService = {
    async getProfiles(): Promise<Profile[]> {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching profiles:', error);
            throw error;
        }

        return data || [];
    },

    async updateProfile(userId: string, updates: Partial<Pick<Profile, 'full_name' | 'role' | 'status' | 'department_id'>>) {
        const { error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', userId);

        if (error) {
            console.error('Error updating profile:', error);
            throw error;
        }
    },

    async createUser(data: { email: string; password: string; full_name: string; role: string }) {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('Not authenticated');

        const res = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-users`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({
                    action: 'create',
                    ...data,
                }),
            }
        );

        const result = await res.json();
        if (!res.ok) throw new Error(result.error || 'Failed to create user');
        return result.user;
    },

    async deleteUser(userId: string) {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('Not authenticated');

        const res = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-users`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({
                    action: 'delete',
                    userId,
                }),
            }
        );

        const result = await res.json();
        if (!res.ok) throw new Error(result.error || 'Failed to delete user');
        return result;
    },
};
