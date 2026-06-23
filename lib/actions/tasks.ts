'use server';

import { db } from '@/lib/db';
import { tasks, users } from '@/lib/db/schema';
import { eq, desc, or, isNull, sql } from 'drizzle-orm';
import { cookies } from 'next/headers';

export interface Task {
    id: string;
    title: string;
    description: string | null;
    target_branches: string[] | null;
    completed: boolean | null;
    created_by: string;
    created_at: Date | null;
}

/** Create multiple tasks (max 5) */
export async function createTasks(
    taskList: { title: string; description?: string }[],
    branchIds: string[] | null
) {
    try {
        if (taskList.length > 5) return { success: false, error: 'Maximum 5 tasks allowed' };
        if (taskList.length === 0 || taskList.some(t => !t.title.trim())) {
            return { success: false, error: 'All tasks must have a title' };
        }

        const cookieStore = await cookies();
        const userId = cookieStore.get('userId')?.value;
        if (!userId) return { success: false, error: 'Not authenticated' };

        // Verify admin
        const user = await db.query.users.findFirst({
            where: (u, { eq }) => eq(u.id, userId),
            columns: { role: true },
        });
        if (user?.role !== 'Admin') {
            return { success: false, error: 'Only admins can create tasks' };
        }

        const targetBranches = branchIds && branchIds.length > 0 ? branchIds : null;

        const data = await db
            .insert(tasks)
            .values(
                taskList.map(task => ({
                    title: task.title.trim(),
                    description: task.description?.trim() || null,
                    targetBranches,
                    createdBy: userId,
                    completed: false,
                }))
            )
            .returning();

        return { success: true, tasks: data };
    } catch (err) {
        console.error('Error creating tasks:', err);
        return { success: false, error: 'Failed to create tasks' };
    }
}

/** Get tasks for a user's branch */
export async function getUserTasks(userBranchId: string) {
    try {
        const data = await db
            .select()
            .from(tasks)
            .where(
                or(
                    isNull(tasks.targetBranches),
                    sql`${tasks.targetBranches} @> ARRAY[${userBranchId}]::uuid[]`
                )
            )
            .orderBy(desc(tasks.createdAt));

        const result = data.map(task => ({
            id: task.id,
            title: task.title,
            description: task.description,
            target_branches: task.targetBranches,
            completed: task.completed,
            created_by: task.createdBy,
            created_at: task.createdAt,
        }));

        return { tasks: result, error: null };
    } catch (err) {
        console.error('Error fetching tasks:', err);
        return { tasks: [], error: 'Failed to fetch tasks' };
    }
}

/** Toggle task completion status */
export async function toggleTaskCompletion(taskId: string, completed: boolean) {
    try {
        await db.update(tasks).set({ completed }).where(eq(tasks.id, taskId));
        return { success: true };
    } catch (err) {
        console.error('Error updating task:', err);
        return { success: false, error: 'Failed to update task' };
    }
}

/** Delete a task (admin only) */
export async function deleteTask(taskId: string) {
    try {
        const cookieStore = await cookies();
        const userId = cookieStore.get('userId')?.value;
        if (!userId) return { success: false, error: 'Not authenticated' };

        const user = await db.query.users.findFirst({
            where: (u, { eq }) => eq(u.id, userId),
            columns: { role: true },
        });
        if (user?.role !== 'Admin') {
            return { success: false, error: 'Only admins can delete tasks' };
        }

        await db.delete(tasks).where(eq(tasks.id, taskId));
        return { success: true };
    } catch (err) {
        console.error('Error deleting task:', err);
        return { success: false, error: 'Failed to delete task' };
    }
}
