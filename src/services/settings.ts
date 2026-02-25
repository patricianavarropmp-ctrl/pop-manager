import { supabase } from '../lib/supabase';

export const settingsService = {
    async getGeminiApiKey(): Promise<string | null> {
        const { data, error } = await supabase
            .from('app_settings')
            .select('value')
            .eq('key', 'gemini_api_key')
            .single();

        if (error) {
            console.error('Error fetching Gemini API Key:', error);
            return null;
        }
        return data?.value || null;
    },

    async updateGeminiApiKey(apiKey: string): Promise<boolean> {
        try {
            // Delete-then-Insert approach to bypass hanging upsert/update
            await supabase.from('app_settings').delete().eq('key', 'gemini_api_key');

            const { error } = await supabase
                .from('app_settings')
                .insert([{
                    key: 'gemini_api_key',
                    value: apiKey,
                    updated_at: new Date().toISOString()
                }]);

            if (error) {
                console.error('Error saving API Key:', error);
                return false;
            }
            return true;
        } catch (err) {
            console.error('Catastrophic error in updateGeminiApiKey:', err);
            return false;
        }
    },

    async getCompanySetting(key: string): Promise<string | null> {
        const { data, error } = await supabase
            .from('app_settings')
            .select('value')
            .eq('key', key)
            .single();

        if (error) return null;
        return data?.value || null;
    },

    async updateCompanySetting(key: string, value: string): Promise<boolean> {
        try {
            await supabase.from('app_settings').delete().eq('key', key);
            const { error } = await supabase
                .from('app_settings')
                .insert([{ key, value, updated_at: new Date().toISOString() }]);
            if (error) {
                console.error(`Error saving ${key}:`, error);
                return false;
            }
            return true;
        } catch (err) {
            console.error(`Error in updateCompanySetting(${key}):`, err);
            return false;
        }
    },

    async uploadCompanyLogo(file: File): Promise<string | null> {
        try {
            const ext = file.name.split('.').pop();
            const path = `company/logo-${Date.now()}.${ext}`;
            const { error: uploadError } = await supabase.storage
                .from('pop-images')
                .upload(path, file, { upsert: true });

            if (uploadError) {
                console.error('Logo upload error:', uploadError);
                return null;
            }

            const { data: { publicUrl } } = supabase.storage
                .from('pop-images')
                .getPublicUrl(path);

            // Save URL to settings
            await settingsService.updateCompanySetting('company_logo_url', publicUrl);
            return publicUrl;
        } catch (err) {
            console.error('Error uploading logo:', err);
            return null;
        }
    },
};
