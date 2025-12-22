'use server';

import { createServiceClient, createClient } from '@/lib/supabase/server';

export interface Task {
    id: string;
    title: string;
    description: string | null;
    target_branches: string[] | null;
    completed: boolean;
    created_by: string;
    created_at: string;
}

/**
 * Create multiple tasks (max 5)
 * @param tasks - Array of task objects with title and optional description
 * @param branchIds - Array of branch IDs (null or empty = all branches)
 */
export async function createTasks(
    tasks: { title: string; description?: string }[],
    branchIds: string[] | null
) {
    const supabase = await createClient();
    const serviceClient = createServiceClient();

    // Validate max 5 tasks
    if (tasks.length > 5) {
        return { success: false, error: 'Maximum 5 tasks allowed' };
    }

    // Validate tasks
    if (tasks.length === 0 || tasks.some(t => !t.title.trim())) {
        return { success: false, error: 'All tasks must have a title' };
    }

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
        return { success: false, error: 'Only admins can create tasks' };
    }

    // Format branchIds - null or empty array means all branches
    const targetBranches = (branchIds && branchIds.length > 0) ? branchIds : null;

    // Insert tasks
    const tasksToInsert = tasks.map(task => ({
        title: task.title.trim(),
        description: task.description?.trim() || null,
        target_branches: targetBranches,
        created_by: authUser.id,
        completed: false,
    }));

    const { data, error } = await serviceClient
        .from('tasks')
        .insert(tasksToInsert)
        .select();

    if (error) {
        console.error('Error creating tasks:', error);
        return { success: false, error: error.message };
    }

    return { success: true, tasks: data };
}

/**
 * Get tasks for a user's branch
 * @param userBranchId - User's branch ID
 */
export async function getUserTasks(userBranchId: string) {
    const serviceClient = createServiceClient();

    const { data, error } = await serviceClient
        .from('tasks')
        .select('*')
        .or(`target_branches.is.null,target_branches.cs.{${userBranchId}}`)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching tasks:', error);
        return { tasks: [], error: error.message };
    }

    return { tasks: data as Task[], error: null };
}

/**
 * Toggle task completion status
 * @param taskId - Task ID
 * @param completed - New completion status
 */
export async function toggleTaskCompletion(taskId: string, completed: boolean) {
    const supabase = await createClient();
    const serviceClient = createServiceClient();

    // Get current user
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    if (authError || !authUser) {
        return { success: false, error: 'Not authenticated' };
    }

    // Update task
    const { error } = await serviceClient
        .from('tasks')
        .update({ completed })
        .eq('id', taskId);

    if (error) {
        console.error('Error updating task:', error);
        return { success: false, error: error.message };
    }

    return { success: true };
}

/**
 * Delete a task (admin only)
 * @param taskId - Task ID
 */
export async function deleteTask(taskId: string) {
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
        return { success: false, error: 'Only admins can delete tasks' };
    }

    // Delete task
    const { error } = await serviceClient
        .from('tasks')
        .delete()
        .eq('id', taskId);

    if (error) {
        console.error('Error deleting task:', error);
        return { success: false, error: error.message };
    }

    return { success: true };
}
