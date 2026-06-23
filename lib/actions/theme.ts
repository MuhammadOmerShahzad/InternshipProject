'use server';

import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { cookies } from 'next/headers';

export type ThemePreference = 'light' | 'dark' | 'system';

/** Update user's theme preference */
export async function updateThemePreference(theme: ThemePreference): Promise<{ success: boolean; error?: string }> {
    try {
        const cookieStore = await cookies();
        const userId = cookieStore.get('userId')?.value;
        if (!userId) return { success: false, error: 'Not authenticated' };

        await db
            .update(users)
            .set({ themePreference: theme })
            .where(eq(users.id, userId));

        return { success: true };
    } catch (err) {
        console.error('Error updating theme preference:', err);
        return { success: false, error: 'An unexpected error occurred' };
    }
}

/** Get user's theme preference */
export async function getThemePreference(): Promise<{ theme: ThemePreference | null; error?: string }> {
    try {
        const cookieStore = await cookies();
        const userId = cookieStore.get('userId')?.value;
        if (!userId) return { theme: null, error: 'Not authenticated' };

        const [user] = await db
            .select({ themePreference: users.themePreference })
            .from(users)
            .where(eq(users.id, userId))
            .limit(1);

        return { theme: (user?.themePreference as ThemePreference) || 'light' };
    } catch (err) {
        console.error('Error fetching theme preference:', err);
        return { theme: null, error: 'An unexpected error occurred' };
    }
}
