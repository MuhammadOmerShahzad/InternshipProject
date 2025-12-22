'use server';

import { createServiceClient } from '@/lib/supabase/server';

export interface Zone {
    id: string;
    name: string;
    code: string;
    created_at: string;
}

export interface Branch {
    id: string;
    name: string;
    zone_id: string;
    created_at: string;
}

/**
 * Get all zones
 */
export async function getZones() {
    const supabase = createServiceClient();

    const { data, error } = await supabase
        .from('zones')
        .select('*')
        .order('name');

    if (error) {
        console.error('Error fetching zones:', error);
        return { zones: [], error: error.message };
    }

    return { zones: data || [], error: null };
}

/**
 * Get branches by zone ID
 */
export async function getBranchesByZone(zoneId: string) {
    const supabase = createServiceClient();

    const { data, error } = await supabase
        .from('branches')
        .select('*')
        .eq('zone_id', zoneId)
        .order('name');

    if (error) {
        console.error('Error fetching branches:', error);
        return { branches: [], error: error.message };
    }

    return { branches: data || [], error: null };
}

/**
 * Get all branches
 */
export async function getAllBranches() {
    const supabase = createServiceClient();

    const { data, error } = await supabase
        .from('branches')
        .select(`
            *,
            zones:zone_id(id, name, code)
        `)
        .order('name');

    if (error) {
        console.error('Error fetching all branches:', error);
        return { branches: [], error: error.message };
    }

    return { branches: data || [], error: null };
}

/**
 * Add a new branch to a zone
 */
export async function addBranch(zoneId: string, branchName: string) {
    const supabase = createServiceClient();

    const { data, error } = await supabase
        .from('branches')
        .insert({
            zone_id: zoneId,
            name: branchName,
        })
        .select()
        .single();

    if (error) {
        console.error('Error adding branch:', error);
        return { branch: null, error: error.message };
    }

    return { branch: data, error: null };
}

/**
 * Update branch name
 */
export async function updateBranch(branchId: string, newName: string) {
    const supabase = createServiceClient();

    const { data, error } = await supabase
        .from('branches')
        .update({ name: newName })
        .eq('id', branchId)
        .select()
        .single();

    if (error) {
        console.error('Error updating branch:', error);
        return { branch: null, error: error.message };
    }

    return { branch: data, error: null };
}

/**
 * Delete a branch
 */
export async function deleteBranch(branchId: string) {
    const supabase = createServiceClient();

    const { error } = await supabase
        .from('branches')
        .delete()
        .eq('id', branchId);

    if (error) {
        console.error('Error deleting branch:', error);
        return { success: false, error: error.message };
    }

    return { success: true, error: null };
}
