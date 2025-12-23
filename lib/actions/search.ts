'use server';

import { createClient } from '@/lib/supabase/server';
import { searchModuleConfig } from '@/lib/utils/searchUtils';

export interface SearchResult {
    name: string;
    category: string;
    path: string;
    type: 'module' | 'file';
}

/**
 * Global search across modules
 * @param query - Search query string
 * @returns Array of module search results
 */
export async function searchGlobal(query: string): Promise<SearchResult[]> {
    console.log('[searchGlobal] Starting search with query:', query);

    if (!query || query.trim().length === 0) {
        console.log('[searchGlobal] Empty query, returning empty results');
        return [];
    }

    const supabase = await createClient();

    // Get current user to check their registered modules
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        console.log('[searchGlobal] No authenticated user found');
        return [];
    }

    console.log('[searchGlobal] Authenticated user:', user.id, user.email);

    // Get user's registered modules
    const { data: userData, error: userError } = await supabase
        .from('users')
        .select('registered_modules, zone_id, branch_id')
        .eq('id', user.id)
        .single();

    console.log('[searchGlobal] User data query result:', { userData, userError });

    if (userError) {
        console.error('[searchGlobal] Error fetching user data:', userError);
        return [];
    }

    if (!userData) {
        console.log('[searchGlobal] No user data found in database');
        return [];
    }

    const allowedModules = (userData.registered_modules as string[]) || [];
    console.log('[searchGlobal] User registered modules:', allowedModules);

    if (allowedModules.length === 0) {
        console.log('[searchGlobal] User has no registered modules, returning empty results');
        return [];
    }


    // Search module configuration for sub-modules only
    console.log('[searchGlobal] Searching module config...');
    const moduleResults = searchModuleConfig(query, allowedModules);
    console.log('[searchGlobal] Found', moduleResults.length, 'module results');

    // Convert module results to SearchResult format (limit to 20 results)
    const results: SearchResult[] = moduleResults.slice(0, 20).map(moduleResult => ({
        name: moduleResult.name,
        category: moduleResult.breadcrumb,
        path: moduleResult.navigationPath,
        type: 'module',
    }));

    console.log('[searchGlobal] Total results:', results.length);
    return results;
}
