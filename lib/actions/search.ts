'use server';

import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { cookies } from 'next/headers';
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

    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value;
    if (!userId) {
        console.log('[searchGlobal] No authenticated user found');
        return [];
    }

    // Get user's registered modules
    const [userData] = await db
        .select({ registeredModules: users.registeredModules })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

    if (!userData) {
        console.log('[searchGlobal] No user data found in database');
        return [];
    }

    const allowedModules = userData.registeredModules || [];
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
