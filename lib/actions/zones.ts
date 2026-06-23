'use server';

import { db } from '@/lib/db';
import { zones, branches } from '@/lib/db/schema';
import { eq, asc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export interface Zone {
    id: string;
    name: string;
    code: string;
    created_at: string | null;
}

export interface Branch {
    id: string;
    name: string;
    zone_id: string;
    created_at: string | null;
}

/** Get all zones */
export async function getZones() {
    try {
        const data = await db.select().from(zones).orderBy(asc(zones.name));
        const result = data.map(zone => ({
            id: zone.id,
            name: zone.name,
            code: zone.code,
            created_at: zone.createdAt ? new Date(zone.createdAt).toISOString() : null,
        }));
        return { zones: result, error: null };
    } catch (err) {
        console.error('Error fetching zones:', err);
        return { zones: [], error: 'Failed to fetch zones' };
    }
}

/** Get branches by zone ID */
export async function getBranchesByZone(zoneId: string) {
    try {
        const data = await db
            .select()
            .from(branches)
            .where(eq(branches.zoneId, zoneId))
            .orderBy(asc(branches.name));
        const result = data.map(branch => ({
            id: branch.id,
            name: branch.name,
            zone_id: branch.zoneId,
            created_at: branch.createdAt ? new Date(branch.createdAt).toISOString() : null,
        }));
        return { branches: result, error: null };
    } catch (err) {
        console.error('Error fetching branches:', err);
        return { branches: [], error: 'Failed to fetch branches' };
    }
}

/** Get all branches with zone info */
export async function getAllBranches() {
    try {
        const data = await db.query.branches.findMany({
            orderBy: asc(branches.name),
            with: { zone: true },
        });
        return { branches: data, error: null };
    } catch (err) {
        console.error('Error fetching all branches:', err);
        return { branches: [], error: 'Failed to fetch branches' };
    }
}

/** Add a new branch to a zone */
export async function addBranch(zoneId: string, branchName: string) {
    try {
        const [branch] = await db
            .insert(branches)
            .values({ zoneId, name: branchName })
            .returning();
        revalidatePath('/user-management');
        revalidatePath('/');
        return { branch, error: null };
    } catch (err) {
        console.error('[addBranch] Error:', err);
        return { branch: null, error: 'Failed to add branch' };
    }
}

/** Update branch name */
export async function updateBranch(branchId: string, newName: string, zoneId?: string) {
    try {
        const updateData: { name: string; zoneId?: string } = { name: newName };
        if (zoneId) updateData.zoneId = zoneId;

        const [branch] = await db
            .update(branches)
            .set(updateData)
            .where(eq(branches.id, branchId))
            .returning();
        revalidatePath('/user-management');
        revalidatePath('/');
        return { branch, error: null };
    } catch (err) {
        console.error('[updateBranch] Error:', err);
        return { branch: null, error: 'Failed to update branch' };
    }
}

/** Delete a branch */
export async function deleteBranch(branchId: string) {
    try {
        await db.delete(branches).where(eq(branches.id, branchId));
        return { success: true, error: null };
    } catch (err) {
        console.error('Error deleting branch:', err);
        return { success: false, error: 'Failed to delete branch' };
    }
}
