'use server';

import { db } from '@/lib/db';
import { users, zones, branches } from '@/lib/db/schema';
import { eq, desc, inArray } from 'drizzle-orm';
import { cookies } from 'next/headers';
import crypto from 'crypto';

export interface User {
    id: string;
    email: string;
    name: string;
    first_name: string;
    last_name: string | null;
    role: string;
    zone_id: string;
    branch_id: string;
    zone_name?: string;
    branch_name?: string;
    registered_modules: string[] | null;
    created_at: Date | null;
    plain_password?: string;
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
    role?: string;
    zoneId?: string;
    branchId?: string;
}

/** Get current authenticated user with profile data */
export async function getCurrentUser() {
    try {
        const cookieStore = await cookies();
        const userId = cookieStore.get('userId')?.value;
        const session = cookieStore.get('session')?.value;

        console.log('[getCurrentUser] Cookie check - userId:', userId ? 'exists' : 'missing', 'session:', session ? 'exists' : 'missing');

        if (!userId || !session) {
            console.log('[getCurrentUser] Not authenticated - returning null');
            return { user: null, error: 'Not authenticated' };
        }

        const result = await db.query.users.findFirst({
            where: eq(users.id, userId),
            with: {
                zone: true,
                branch: true,
            },
        });

        if (!result) return { user: null, error: 'User not found' };

        return {
            user: {
                ...result,
                name: result.lastName
                    ? `${result.firstName} ${result.lastName}`
                    : result.firstName,
                first_name: result.firstName,
                last_name: result.lastName,
                zone_id: result.zoneId,
                branch_id: result.branchId,
                zone_name: result.zone?.name || 'N/A',
                branch_name: result.branch?.name || 'N/A',
                registered_modules: result.registeredModules,
                created_at: result.createdAt,
            },
            error: null,
        };
    } catch (err) {
        console.error('[getCurrentUser] Error:', err);
        return { user: null, error: 'Failed to fetch user' };
    }
}

/** Get all users with zone and branch info */
export async function getUsers() {
    try {
        const data = await db.query.users.findMany({
            orderBy: desc(users.createdAt),
            with: { zone: true, branch: true },
        });

        const result = data.map(u => ({
            ...u,
            name: u.lastName ? `${u.firstName} ${u.lastName}` : u.firstName,
            first_name: u.firstName,
            last_name: u.lastName,
            zone_id: u.zoneId,
            branch_id: u.branchId,
            zone_name: u.zone?.name || 'N/A',
            branch_name: u.branch?.name || 'N/A',
            registered_modules: u.registeredModules,
            created_at: u.createdAt,
        }));

        return { users: result, error: null };
    } catch (err) {
        console.error('Error fetching users:', err);
        return { users: [], error: 'Failed to fetch users' };
    }
}

/** Create a new user */
export async function createUser(input: CreateUserInput) {
    try {
        // Store password as plain text (upgrade to bcrypt in production)
        const passwordHash = input.password;

        const [user] = await db
            .insert(users)
            .values({
                email: input.email.toLowerCase().trim(),
                firstName: input.firstName,
                lastName: input.lastName,
                role: input.role,
                zoneId: input.zoneId,
                branchId: input.branchId,
                registeredModules: input.registeredModules,
                passwordHash,
            })
            .returning();

        return { user, error: null };
    } catch (err: unknown) {
        console.error('Error creating user:', err);
        const msg = err instanceof Error ? err.message : 'Failed to create user';
        if (msg.includes('unique')) return { user: null, error: 'Email already exists' };
        return { user: null, error: msg };
    }
}

/** Update user profile */
export async function updateUser(userId: string, input: UpdateUserInput) {
    try {
        const updateData: Partial<typeof users.$inferInsert> & { updatedAt?: Date } = {
            updatedAt: new Date(),
        };

        if (input.firstName !== undefined) updateData.firstName = input.firstName;
        if (input.lastName !== undefined) updateData.lastName = input.lastName;
        if (input.role !== undefined) updateData.role = input.role;
        if (input.zoneId !== undefined) updateData.zoneId = input.zoneId;
        if (input.branchId !== undefined) updateData.branchId = input.branchId;

        const [user] = await db
            .update(users)
            .set(updateData)
            .where(eq(users.id, userId))
            .returning();

        return { user, error: null };
    } catch (err) {
        console.error('Error updating user:', err);
        return { user: null, error: 'Failed to update user' };
    }
}

/** Update user's assigned modules */
export async function updateUserModules(userId: string, modules: string[]) {
    try {
        const [user] = await db
            .update(users)
            .set({ registeredModules: modules, updatedAt: new Date() })
            .where(eq(users.id, userId))
            .returning();

        return { user, error: null };
    } catch (err) {
        console.error('Error updating user modules:', err);
        return { user: null, error: 'Failed to update modules' };
    }
}

/** Delete users */
export async function deleteUsers(userIds: string[]) {
    try {
        await db.delete(users).where(inArray(users.id, userIds));
        return { success: true, error: null };
    } catch (err) {
        console.error('Error deleting users:', err);
        return { success: false, error: 'Failed to delete users' };
    }
}

/** Reset user password */
export async function resetUserPassword(userId: string) {
    try {
        const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        const newPassword = Array.from(
            { length: 8 },
            () => charset[Math.floor(Math.random() * charset.length)]
        ).join('');

        await db
            .update(users)
            .set({ passwordHash: newPassword, updatedAt: new Date() })
            .where(eq(users.id, userId));

        return { password: newPassword, error: null };
    } catch (err) {
        console.error('Error resetting password:', err);
        return { password: null, error: 'Failed to reset password' };
    }
}
