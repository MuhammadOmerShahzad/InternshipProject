'use server'

import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import {
    CognitoIdentityProviderClient,
    InitiateAuthCommand,
    RespondToAuthChallengeCommand,
} from '@aws-sdk/client-cognito-identity-provider'

export interface LoginResult {
    success: boolean
    error?: string
    userId?: string
}

// Initialize Cognito Client
const cognitoClient = new CognitoIdentityProviderClient({
    region: process.env.NEXT_PUBLIC_COGNITO_REGION,
})

const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID

export async function login(email: string, password: string): Promise<LoginResult> {
    try {
        console.log('[AUTH] Login attempt for email:', email);
        
        if (!clientId) {
            throw new Error('Cognito Client ID is not configured.');
        }

        const command = new InitiateAuthCommand({
            AuthFlow: 'USER_PASSWORD_AUTH',
            ClientId: clientId,
            AuthParameters: {
                USERNAME: email,
                PASSWORD: password,
            },
        });

        let response = await cognitoClient.send(command);
        console.log('[AUTH] Cognito response:', JSON.stringify(response, null, 2));

        if (response.ChallengeName === 'NEW_PASSWORD_REQUIRED') {
            console.log('[AUTH] Automatically handling NEW_PASSWORD_REQUIRED challenge...');
            const challengeCommand = new RespondToAuthChallengeCommand({
                ChallengeName: 'NEW_PASSWORD_REQUIRED',
                ClientId: clientId,
                ChallengeResponses: {
                    USERNAME: email,
                    NEW_PASSWORD: password, // setting it to the exact same password they typed
                },
                Session: response.Session,
            });
            response = await cognitoClient.send(challengeCommand);
            console.log('[AUTH] Challenge completed:', JSON.stringify(response, null, 2));
        } else if (response.ChallengeName) {
            console.error(`[AUTH] Cognito requires challenge: ${response.ChallengeName}`);
            throw new Error(`Cognito requires you to complete a challenge: ${response.ChallengeName}`);
        }

        const sessionToken = response.AuthenticationResult?.IdToken;
        if (!sessionToken) {
            throw new Error('No IdToken returned from Cognito. See terminal logs for the full response.');
        }

        // Now lookup the user in the database by email
        const [user] = await db
            .select()
            .from(users)
            .where(eq(users.email, email.toLowerCase().trim()))
            .limit(1)

        if (!user) {
            console.warn('[AUTH] User authenticated with Cognito but not found in local DB:', email);
            return { success: false, error: 'User profile not found in system' }
        }

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
    } catch (err: any) {
        console.error('Login error:', err)
        const message = err.name === 'NotAuthorizedException' 
            ? 'Invalid email or password' 
            : err.message || String(err)
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
