import { supabase } from '../lib/supabase';
import { PopDatabase, PopStepDatabase, Department } from '../types';

export const dropsService = {
    async getDepartments(): Promise<Department[]> {
        const { data, error } = await supabase.from('departments').select('*').order('name');
        if (error) throw error;
        return data || [];
    }
}

export const popService = {
    async getPops(): Promise<PopDatabase[]> {
        const { data, error } = await supabase
            .from('pops')
            .select('*, department:departments(name), author:profiles(full_name)')
            .order('updated_at', { ascending: false });

        if (error) {
            console.error('Error fetching POPs:', error);
            throw error;
        }

        return data || [];
    },

    async getPopById(id: string): Promise<{ pop: PopDatabase; steps: PopStepDatabase[] } | null> {
        const { data: pop, error: popError } = await supabase
            .from('pops')
            .select('*, department:departments(name)')
            .eq('id', id)
            .single();

        if (popError) {
            console.error('Error fetching POP:', popError);
            return null;
        }

        const { data: steps, error: stepsError } = await supabase
            .from('pop_steps')
            .select('*')
            .eq('pop_id', id)
            .order('order', { ascending: true });

        if (stepsError) {
            console.error('Error fetching POP steps:', stepsError);
            return { pop, steps: [] };
        }

        return { pop, steps: steps || [] };
    },

    async createPop(popData: Partial<PopDatabase>, stepsData: Partial<PopStepDatabase>[]) {
        // 1. Create POP
        const { data: newPop, error: popError } = await supabase
            .from('pops')
            .insert([{
                ...popData,
                updated_at: new Date().toISOString()
            }])
            .select()
            .single();

        if (popError) {
            console.error('Error creating POP:', popError);
            throw popError;
        }

        // 2. Create Steps
        if (stepsData.length > 0 && newPop) {
            const stepsToInsert = stepsData.map((step, index) => ({
                title: step.title,
                content: step.content,
                image_url: step.image_url,
                video_timestamp: step.video_timestamp,
                pop_id: newPop.id,
                order: index, // Ensure order is set
            }));

            const { error: stepsError } = await supabase
                .from('pop_steps')
                .insert(stepsToInsert);

            if (stepsError) {
                console.error('Error creating POP steps:', stepsError);
                throw stepsError;
            }
        }

        return newPop;
    },

    async updatePop(id: string, popData: Partial<PopDatabase>, stepsData: Omit<PopStepDatabase, 'id' | 'pop_id' | 'created_at'>[]) {
        console.log('updatePop started for id:', id);

        console.log('1. Updating pop table...');
        const { error: popError } = await supabase
            .from('pops')
            .update({
                title: popData.title,
                description: popData.description,
                department_id: popData.department_id,
                status: popData.status,
                video_url: popData.video_url,
                updated_at: new Date().toISOString()
            })
            .eq('id', id);

        if (popError) {
            console.error('Error updating POP:', popError);
            throw popError;
        }
        console.log('pop table updated successfully.');

        // Backup existing steps for manual rollback in case of insertion failure
        console.log('2. Fetching existing steps for backup...');
        const { data: existingSteps } = await supabase
            .from('pop_steps')
            .select('*')
            .eq('pop_id', id);
        console.log(`Backup fetched: ${existingSteps ? existingSteps.length : 0} steps.`);

        // 2. Simplest way to update steps: Delete existing and insert new ones
        console.log('3. Deleting old steps...');
        const { error: deleteError } = await supabase
            .from('pop_steps')
            .delete()
            .eq('pop_id', id);

        if (deleteError) {
            console.error('Error deleting old steps:', deleteError);
            throw deleteError;
        }
        console.log('Old steps deleted successfully.');

        if (stepsData.length > 0) {
            console.log(`4. Inserting ${stepsData.length} new steps...`);
            const stepsToInsert = stepsData.map((step, index) => ({
                title: step.title,
                content: step.content,
                image_url: step.image_url,
                video_timestamp: step.video_timestamp,
                pop_id: id,
                order: index,
            }));

            const { error: stepsError } = await supabase
                .from('pop_steps')
                .insert(stepsToInsert);

            if (stepsError) {
                console.error('Error inserting new POP steps:', stepsError);
                // Rollback: try to restore the deleted steps
                if (existingSteps && existingSteps.length > 0) {
                    console.error('Rolling back: restoring original steps');
                    await supabase.from('pop_steps').insert(existingSteps);
                }
                throw stepsError;
            }
            console.log('New steps inserted successfully.');
        } else {
            console.log('No new steps to insert.');
        }
        console.log('updatePop completed successfully.');
    },

    async updatePopStatus(id: string, status: string) {
        const { error } = await supabase
            .from('pops')
            .update({
                status,
                updated_at: new Date().toISOString()
            })
            .eq('id', id);

        if (error) {
            console.error('Error updating POP status:', error);
            throw error;
        }
    },

    async deletePop(id: string) {
        const { error } = await supabase.from('pops').delete().eq('id', id);
        if (error) {
            console.error('Error deleting POP:', error);
            throw error;
        }
    }
};
