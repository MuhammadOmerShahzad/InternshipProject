'use server';

import { db } from '@/lib/db';
import { announcements, users } from '@/lib/db/schema';
import { desc, or, isNull, sql } from 'drizzle-orm';
import { cookies } from 'next/headers';

export interface Announcement {
    id: string;
    title: string;
    message: string;
    target_branches: string[] | null;
    created_by: string;
    created_at: Date | null;
    creator_name?: string;
}

/** Post a new announcement */
export async function postAnnouncement(
    title: string,
    message: string,
    branchIds: string[] | null
) {
    try {
        const cookieStore = await cookies();
        const userId = cookieStore.get('userId')?.value;
        if (!userId) return { success: false, error: 'Not authenticated' };

        // Verify user is admin
        const user = await db.query.users.findFirst({
            where: (u, { eq }) => eq(u.id, userId),
            columns: { role: true },
        });
        if (user?.role !== 'Admin') {
            return { success: false, error: 'Only admins can post announcements' };
        }

        const targetBranches = branchIds && branchIds.length > 0 ? branchIds : null;

        const [data] = await db
            .insert(announcements)
            .values({ title, message, targetBranches, createdBy: userId })
            .returning();

        const announcement: Announcement = {
            ...data,
            target_branches: data.targetBranches as string[] | null,
            created_by: data.createdBy,
            created_at: data.createdAt,
        };

        return { success: true, announcement };
    } catch (err) {
        console.error('Error creating announcement:', err);
        return { success: false, error: 'Failed to post announcement' };
    }
}

/** Get the latest announcement for a user's branch */
export async function getLatestAnnouncement(userBranchId: string) {
    try {
        const data = await db
            .select()
            .from(announcements)
            .where(
                or(
                    isNull(announcements.targetBranches),
                    sql`${announcements.targetBranches} @> ARRAY[${userBranchId}]::uuid[]`
                )
            )
            .orderBy(desc(announcements.createdAt))
            .limit(1);

        if (!data.length) return { announcement: null };

        const announcement: Announcement = {
            ...data[0],
            target_branches: data[0].targetBranches as string[] | null,
            created_by: data[0].createdBy,
            created_at: data[0].createdAt,
        };

        return { announcement, error: null };
    } catch (err) {
        console.error('Error fetching announcement:', err);
        return { announcement: null, error: 'Failed to fetch announcement' };
    }
}

/** Get all announcements */
export async function getAllAnnouncements() {
    try {
        const data = await db.query.announcements.findMany({
            orderBy: desc(announcements.createdAt),
            with: { creator: { columns: { firstName: true, lastName: true } } },
        });

        const result: Announcement[] = data.map(item => ({
            ...item,
            target_branches: item.targetBranches as string[] | null,
            created_by: item.createdBy,
            created_at: item.createdAt,
            creator_name: item.creator
                ? item.creator.lastName
                    ? `${item.creator.firstName} ${item.creator.lastName}`
                    : item.creator.firstName
                : 'Unknown',
        }));

        return { announcements: result, error: null };
    } catch (err) {
        console.error('Error fetching announcements:', err);
        return { announcements: [], error: 'Failed to fetch announcements' };
    }
}
