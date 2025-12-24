'use client';

import { createContext, useContext, useEffect, useState, useRef, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { getCurrentUser } from '@/lib/actions/users';

export interface AppUser {
    id: string;
    email: string;
    name: string;
    role: string;
    branch: string;
    zone: string;
    branch_id?: string;
    zone_id?: string;
    registeredModules?: string[];
}

interface UserContextType {
    user: AppUser | null;
    supabaseUser: SupabaseUser | null;
    loading: boolean;
    refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType>({
    user: null,
    supabaseUser: null,
    loading: true,
    refreshUser: async () => { },
});

// Timeout wrapper for promises
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), ms)
    );
    return Promise.race([promise, timeout]);
}

export function UserProvider({ children }: { children: ReactNode }) {
    const router = useRouter();
    const [user, setUser] = useState<AppUser | null>(null);
    const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
    const [loading, setLoading] = useState(true);
    // Create Supabase client synchronously using lazy initializer (avoids race conditions)
    const [supabase] = useState(() => createClient());
    const isRefreshing = useRef(false);
    const retryCount = useRef(0);
    const MAX_RETRIES = 2;
    // Track if auth listener has completed initial check
    const authListenerReady = useRef(false);

    // Fetch user profile from server action
    const fetchUserProfile = useCallback(async (authUser: SupabaseUser): Promise<void> => {
        // const startTime = Date.now();
        // console.log('📥 [UserContext] Fetching user profile...');

        try {
            // Call server action with 10 second timeout
            const { user: userData, error: userError } = await withTimeout(
                getCurrentUser(),
                10000
            );

            // const elapsed = Date.now() - startTime;
            // console.log(`⏱️ [UserContext] getCurrentUser took ${elapsed}ms`);

            if (userError || !userData) {
                console.error('❌ [UserContext] Error from getCurrentUser:', userError);
                // Set basic user data from auth as fallback
                setUser({
                    id: authUser.id,
                    email: authUser.email || '',
                    name: authUser.email?.split('@')[0] || 'User',
                    role: 'Admin',
                    branch: 'Default Branch',
                    zone: 'Default Zone',
                    registeredModules: [],
                });
                return;
            }

            // console.log('✅ [UserContext] User profile fetched:', userData.name, userData.role);

            // Map to AppUser format
            setUser({
                id: userData.id,
                email: userData.email || '',
                name: userData.name || `${userData.first_name} ${userData.last_name}` || 'User',
                role: userData.role || 'Admin',
                branch: userData.branch_name || 'Default Branch',
                zone: userData.zone_name || 'Default Zone',
                branch_id: userData.branch_id,
                zone_id: userData.zone_id,
                registeredModules: userData.registered_modules || [],
            });

        } catch (err) {
            console.error('❌ [UserContext] Exception fetching profile:', err);

            // Retry logic
            if (retryCount.current < MAX_RETRIES) {
                retryCount.current++;
                // console.log(`🔄 [UserContext] Retrying... (attempt ${retryCount.current}/${MAX_RETRIES})`);
                await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
                return fetchUserProfile(authUser);
            }

            // Fallback after retries exhausted
            setUser({
                id: authUser.id,
                email: authUser.email || '',
                name: authUser.email?.split('@')[0] || 'User',
                role: 'Admin',
                branch: 'Default Branch',
                zone: 'Default Zone',
                registeredModules: [],
            });
        }
    }, []);

    // Main refresh function - simplified
    const refreshUser = useCallback(async () => {
        if (isRefreshing.current) {
            // console.log('⏳ [UserContext] Already refreshing, skipping...');
            return;
        }

        isRefreshing.current = true;
        retryCount.current = 0;
        // console.log('🔄 [UserContext] Starting user refresh...');

        try {
            // Skip if supabase client isn't available (SSR)
            if (!supabase) {
                setLoading(false);
                return;
            }

            // Get current auth user
            const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

            if (authError || !authUser) {
                // console.log('⚠️ [UserContext] No auth user found');
                setUser(null);
                setSupabaseUser(null);
                return;
            }

            // console.log('✅ [UserContext] Auth user:', authUser.email);
            setSupabaseUser(authUser);

            // Fetch profile
            await fetchUserProfile(authUser);

        } catch (err) {
            console.error('❌ [UserContext] Exception in refreshUser:', err);

            // Check for network errors and redirect to login
            if (err instanceof Error &&
                (err.message.includes('Failed to fetch') ||
                    err.message.includes('NetworkError') ||
                    err.message.includes('network'))) {
                // console.log('🔌 [UserContext] Network error, redirecting to login...');
                setUser(null);
                setSupabaseUser(null);
                router.push('/login?reason=session_expired');
            }
        } finally {
            isRefreshing.current = false;
        }
    }, [supabase, router, fetchUserProfile]);

    // Initialize on mount and listen for auth changes
    useEffect(() => {
        // Skip during SSR or if supabase client isn't available
        if (!supabase) {
            setLoading(false);
            return;
        }

        let mounted = true;

        // Immediately check for existing session (don't wait for event)
        const initializeSession = async () => {
            // console.log('🚀 [UserContext] Initializing session...');
            try {
                const { data: { user: authUser }, error } = await supabase.auth.getUser();

                if (!mounted) return;

                if (error || !authUser) {
                    // console.log('⚠️ [UserContext] No existing session');
                    setUser(null);
                    setSupabaseUser(null);
                    setLoading(false);
                    return;
                }

                // console.log('✅ [UserContext] Found existing session:', authUser.email);
                setSupabaseUser(authUser);
                retryCount.current = 0;

                await fetchUserProfile(authUser);
            } catch (err) {
                console.error('❌ [UserContext] Error initializing session:', err);
                setUser(null);
                setSupabaseUser(null);
            } finally {
                if (mounted) {
                    setLoading(false);
                    authListenerReady.current = true;
                }
            }
        };

        // Start session check immediately
        initializeSession();

        // Set up auth listener for subsequent auth changes (login/logout/token refresh)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event: string, session: { user: SupabaseUser } | null) => {
                // console.log('🔔 [UserContext] Auth event:', event, session?.user?.email);

                if (!mounted) return;

                // Skip INITIAL_SESSION since we handle it above
                if (event === 'INITIAL_SESSION') {
                    return;
                }

                if (event === 'SIGNED_IN' && session?.user) {
                    // console.log('✅ [UserContext] Signed in, fetching profile...');
                    setSupabaseUser(session.user);
                    setLoading(true);
                    retryCount.current = 0;

                    try {
                        await fetchUserProfile(session.user);
                    } finally {
                        if (mounted) {
                            setLoading(false);
                        }
                    }

                } else if (event === 'SIGNED_OUT') {
                    // console.log('👋 [UserContext] Signed out');
                    setUser(null);
                    setSupabaseUser(null);
                    setLoading(false);

                } else if (event === 'TOKEN_REFRESHED' && session?.user) {
                    // console.log('🔄 [UserContext] Token refreshed');
                    setSupabaseUser(session.user);
                }
            }
        );

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, [supabase, fetchUserProfile]);

    return (
        <UserContext.Provider value={{ user, supabaseUser, loading, refreshUser }}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
}
