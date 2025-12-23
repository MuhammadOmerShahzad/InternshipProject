'use server';

import { createClient, createServiceClient } from '@/lib/supabase/server';

export type ThemePreference = 'light' | 'dark' | 'system';

/**
 * Update user's theme preference in the database
 * Uses service client to bypass RLS
 */
export async function updateThemePreference(theme: ThemePreference): Promise<{ success: boolean; error?: string }> {
    try {
        const supabase = await createClient();

        // Get the current authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return { success: false, error: 'Not authenticated' };
        }

        // Use service client to bypass RLS
        const serviceClient = createServiceClient();

        // Update the user's theme preference
        const { error: updateError } = await serviceClient
            .from('users')
            .update({ theme_preference: theme })
            .eq('id', user.id);

        if (updateError) {
            console.error('Error updating theme preference:', updateError);
            return { success: false, error: updateError.message };
        }

        return { success: true };
    } catch (error) {
        console.error('Error in updateThemePreference:', error);
        return { success: false, error: 'An unexpected error occurred' };
    }
}

/**
 * Get user's theme preference from the database
 * Uses service client to bypass RLS
 */
export async function getThemePreference(): Promise<{ theme: ThemePreference | null; error?: string }> {
    try {
        const supabase = await createClient();

        // Get the current authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return { theme: null, error: 'Not authenticated' };
        }

        // Use service client to bypass RLS
        const serviceClient = createServiceClient();

        // Fetch the user's theme preference
        const { data, error: fetchError } = await serviceClient
            .from('users')
            .select('theme_preference')
            .eq('id', user.id)
            .single();

        if (fetchError) {
            console.error('Error fetching theme preference:', fetchError);
            return { theme: null, error: fetchError.message };
        }

        return { theme: (data?.theme_preference as ThemePreference) || 'light' };
    } catch (error) {
        console.error('Error in getThemePreference:', error);
        return { theme: null, error: 'An unexpected error occurred' };
    }
}
