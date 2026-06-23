'use server'

import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { randomBytes } from 'crypto'

export interface LoginResult {
    success: boolean
    error?: string
    userId?: string
}

// Simple password check — compares plain text (upgrade to bcrypt when ready)
function checkPassword(plain: string, stored: string | null): boolean {
    if (!stored) return false
    // If stored as bcrypt hash, use bcrypt.compare here
    // For now: plain text comparison (replace with bcrypt in production)
    return plain === stored
}

export async function login(email: string, password: string): Promise<LoginResult> {
    try {
        console.log('[AUTH] Login attempt for email:', email);
        const [user] = await db
            .select()
            .from(users)
            .where(eq(users.email, email.toLowerCase().trim()))
            .limit(1)

        console.log('[AUTH] Query result:', user ? 'User found' : 'User not found');
        if (!user) {
            return { success: false, error: 'Invalid email or password' }
        }

        console.log('[AUTH] Password hash from DB:', user.passwordHash ? 'exists' : 'missing');
        const valid = checkPassword(password, user.passwordHash)
        console.log('[AUTH] Password check result:', valid);
        if (!valid) {
            return { success: false, error: 'Invalid email or password' }
        }

        // Create a simple session token
        const sessionToken = randomBytes(32).toString('hex')
        console.log('[AUTH] Session token created');

        // Store session in cookie
        const cookieStore = await cookies()

        cookieStore.set('session', sessionToken, {
            httpOnly: true,
            path: '/',
            maxAge: 60 * 60 * 24 * 7, // 7 days
        })

        // Store userId in a separate readable cookie for client reference
        cookieStore.set('userId', user.id, {
            httpOnly: true,
            path: '/',
            maxAge: 60 * 60 * 24 * 7,
        })

        console.log('[AUTH] Cookies set - session and userId');

        console.log('[AUTH] Login successful for user:', user.id);
        return { success: true, userId: user.id }
    } catch (err) {
        console.error('Login error:', err)
        const message = err instanceof Error ? err.message : String(err)
        return { success: false, error: `Login failed: ${message}` }
    }
}

export async function logout() {
    const cookieStore = await cookies()
    cookieStore.delete('session')
    cookieStore.delete('userId')
    redirect('/login')
}

export async function getCurrentUser() {
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const session = cookieStore.get('session')?.value

        if (!userId || !session) return null

        const [user] = await db
            .select({
                id: users.id,
                firstName: users.firstName,
                lastName: users.lastName,
                email: users.email,
                role: users.role,
                zoneId: users.zoneId,
                branchId: users.branchId,
                registeredModules: users.registeredModules,
                themePreference: users.themePreference,
                createdAt: users.createdAt,
            })
            .from(users)
            .where(eq(users.id, userId))
            .limit(1)

        return user ?? null
    } catch {
        return null
    }
}
