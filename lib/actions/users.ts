'use server';

import { createServiceClient, createClient } from '@/lib/supabase/server';

export interface User {
    id: string;
    email: string;
    name: string;
    first_name: string;
    last_name: string;
    role: string;
    zone_id: string;
    branch_id: string;
    zone_name?: string;
    branch_name?: string;
    registered_modules: string[];
    plain_password?: string;
    created_at: string;
}

export interface CreateUserInput {
    firstName: string;
    lastName: string;
    displayName: string;
    email: string;
    password: string;
    role: string;
    zoneId: string;
    branchId: string;
    registeredModules: string[];
}

export interface UpdateUserInput {
    firstName?: string;
    lastName?: string;
    name?: string;
    role?: string;
    zoneId?: string;
    branchId?: string;
}

/**
 * Get current authenticated user with their profile data
 * Uses service client to bypass RLS
 */
export async function getCurrentUser() {
    // const startTime = Date.now();
    // console.log('[getCurrentUser] Starting...');

    // Use regular client to get auth session
    const supabase = await createClient();
    const _authStart = Date.now();

    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    // console.log(`[getCurrentUser] Auth check took ${Date.now() - _authStart}ms`);

    if (authError || !authUser) {
        console.log('[getCurrentUser] No authenticated user found');
        return { user: null, error: authError?.message || 'Not authenticated' };
    }

    // console.log('[getCurrentUser] Auth user found:', authUser.id, authUser.email);

    // Use service client to fetch user profile (bypasses RLS)
    const serviceClient = createServiceClient();
    const _dbStart = Date.now();

    const { data: userData, error: userError } = await serviceClient
        .from('users')
        .select(`
            *,
            zones:zone_id(id, name, code),
            branches:branch_id(id, name)
        `)
        .eq('id', authUser.id)
        .single();

    // console.log(`[getCurrentUser] DB fetch took ${Date.now() - dbStart}ms`);

    if (userError) {
        console.error('[getCurrentUser] Error fetching user profile:', userError);
        // Return basic user data from auth if profile fetch fails
        return {
            user: {
                id: authUser.id,
                email: authUser.email || '',
                name: authUser.email?.split('@')[0] || 'User',
                first_name: '',
                last_name: '',
                role: 'Admin',
                zone_id: '',
                branch_id: '',
                zone_name: 'Default Zone',
                branch_name: 'Default Branch',
                registered_modules: [],
                created_at: new Date().toISOString(),
            },
            error: null
        };
    }

    // console.log(`[getCurrentUser] Total time: ${Date.now() - startTime}ms`);
    // console.log('[getCurrentUser] User profile fetched:', userData?.name, userData?.role);

    return {
        user: {
            ...userData,
            zone_name: userData?.zones?.name || 'N/A',
            branch_name: userData?.branches?.name || 'N/A',
        },
        error: null
    };
}

/**
 * Get all users with zone and branch info
 */
export async function getUsers() {
    const supabase = createServiceClient();

    const { data, error } = await supabase
        .from('users')
        .select(`
            *,
            zones:zone_id(id, name, code),
            branches:branch_id(id, name)
        `)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching users:', error);
        return { users: [], error: error.message };
    }

    // Transform data to include zone/branch names
    const users = data?.map(user => ({
        ...user,
        zone_name: user.zones?.name || 'N/A',
        branch_name: user.branches?.name || 'N/A',
    })) || [];

    return { users, error: null };
}

/**
 * Create a new user
 */
export async function createUser(input: CreateUserInput) {
    const supabase = createServiceClient();

    // First, create the auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: input.email,
        password: input.password,
        email_confirm: true,
    });

    if (authError) {
        console.error('Error creating auth user:', authError);
        return { user: null, error: authError.message };
    }

    if (!authData.user) {
        return { user: null, error: 'Failed to create auth user' };
    }

    // Then, create the user profile
    const { data: userData, error: userError } = await supabase
        .from('users')
        .insert({
            id: authData.user.id,
            email: input.email,
            first_name: input.firstName,
            last_name: input.lastName,
            role: input.role,
            zone_id: input.zoneId || null,
            branch_id: input.branchId || null,
            registered_modules: input.registeredModules,
            plain_password: input.password,
        })
        .select()
        .single();

    if (userError) {
        console.error('Error creating user profile:', userError);
        // Try to delete the auth user if profile creation fails
        await supabase.auth.admin.deleteUser(authData.user.id);
        return { user: null, error: userError.message };
    }

    return { user: userData, error: null };
}

/**
 * Update user profile
 */
export async function updateUser(userId: string, input: UpdateUserInput) {
    const supabase = createServiceClient();

    const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
    };

    if (input.firstName !== undefined) updateData.first_name = input.firstName;
    if (input.lastName !== undefined) updateData.last_name = input.lastName;
    if (input.name !== undefined) updateData.name = input.name;
    if (input.role !== undefined) updateData.role = input.role;
    if (input.zoneId !== undefined) updateData.zone_id = input.zoneId;
    if (input.branchId !== undefined) updateData.branch_id = input.branchId;

    const { data, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userId)
        .select()
        .single();

    if (error) {
        console.error('Error updating user:', error);
        return { user: null, error: error.message };
    }

    return { user: data, error: null };
}

/**
 * Update user's assigned modules
 */
export async function updateUserModules(userId: string, modules: string[]) {
    const supabase = createServiceClient();

    const { data, error } = await supabase
        .from('users')
        .update({
            registered_modules: modules,
            updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();

    if (error) {
        console.error('Error updating user modules:', error);
        return { user: null, error: error.message };
    }

    return { user: data, error: null };
}

/**
 * Delete users
 */
export async function deleteUsers(userIds: string[]) {
    const supabase = createServiceClient();

    // Delete from users table first
    const { error: dbError } = await supabase
        .from('users')
        .delete()
        .in('id', userIds);

    if (dbError) {
        console.error('Error deleting users from database:', dbError);
        return { success: false, error: dbError.message };
    }

    // Delete from auth
    for (const userId of userIds) {
        const { error: authError } = await supabase.auth.admin.deleteUser(userId);
        if (authError) {
            console.error(`Error deleting auth user ${userId}:`, authError);
        }
    }

    return { success: true, error: null };
}

/**
 * Reset user password
 */
export async function resetUserPassword(userId: string) {
    const supabase = createServiceClient();

    // Generate new random password
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let newPassword = '';
    for (let i = 0; i < 8; i++) {
        newPassword += charset.charAt(Math.floor(Math.random() * charset.length));
    }

    // Update auth user password
    const { error: authError } = await supabase.auth.admin.updateUserById(userId, {
        password: newPassword,
    });

    if (authError) {
        console.error('Error resetting password:', authError);
        return { password: null, error: authError.message };
    }

    // Update plain_password in users table for admin reference
    await supabase
        .from('users')
        .update({ plain_password: newPassword, updated_at: new Date().toISOString() })
        .eq('id', userId);

    return { password: newPassword, error: null };
}
