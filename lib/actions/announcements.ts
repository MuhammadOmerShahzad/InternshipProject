'use server';

import { createServiceClient, createClient } from '@/lib/supabase/server';

export interface Announcement {
    id: string;
    title: string;
    message: string;
    target_branches: string[] | null;
    created_by: string;
    created_at: string;
    creator_name?: string;
}

/**
 * Post a new announcement
 * @param title - Announcement title
 * @param message - Announcement message
 * @param branchIds - Array of branch IDs (null or empty = all branches)
 */
export async function postAnnouncement(
    title: string,
    message: string,
    branchIds: string[] | null
) {
    const supabase = await createClient();
    const serviceClient = createServiceClient();

    // Get current user
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    if (authError || !authUser) {
        return { success: false, error: 'Not authenticated' };
    }

    // Verify user is admin
    const { data: userData } = await serviceClient
        .from('users')
        .select('role')
        .eq('id', authUser.id)
        .single();

    if (userData?.role !== 'Admin') {
        return { success: false, error: 'Only admins can post announcements' };
    }

    // Format branchIds - null or empty array means all branches
    const targetBranches = (branchIds && branchIds.length > 0) ? branchIds : null;

    // Insert announcement
    const { data, error } = await serviceClient
        .from('announcements')
        .insert({
            title,
            message,
            target_branches: targetBranches,
            created_by: authUser.id,
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating announcement:', error);
        return { success: false, error: error.message };
    }

    return { success: true, announcement: data };
}

/**
 * Get the latest announcement for a user's branch
 * @param userBranchId - User's branch ID
 */
export async function getLatestAnnouncement(userBranchId: string) {
    const serviceClient = createServiceClient();

    const { data, error } = await serviceClient
        .from('announcements')
        .select(`
            *,
            users:created_by(name)
        `)
        .or(`target_branches.is.null,target_branches.cs.{${userBranchId}}`)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (error) {
        // No announcements is not an error
        if (error.code === 'PGRST116') {
            return { announcement: null };
        }
        console.error('Error fetching announcement:', error);
        return { announcement: null, error: error.message };
    }

    // Transform data
    const announcement: Announcement = {
        ...data,
        creator_name: data.users?.name || 'Unknown',
    };

    return { announcement, error: null };
}

/**
 * Get all announcements (for admin view, optional future feature)
 */
export async function getAllAnnouncements() {
    const serviceClient = createServiceClient();

    const { data, error } = await serviceClient
        .from('announcements')
        .select(`
            *,
            users:created_by(name)
        `)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching announcements:', error);
        return { announcements: [], error: error.message };
    }

    const announcements: Announcement[] = data.map((item) => ({
        ...item,
        creator_name: item.users?.name || 'Unknown',
    }));

    return { announcements, error: null };
}
