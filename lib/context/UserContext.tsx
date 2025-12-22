'use client';

import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
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

export function UserProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AppUser | null>(null);
    const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();
    const isRefreshing = useRef(false);
    const hasInitialized = useRef(false);

    const refreshUser = async () => {
        // Prevent concurrent refreshes
        if (isRefreshing.current) {
            console.log('⏳ [UserContext] Already refreshing, skipping...');
            return;
        }

        isRefreshing.current = true;
        console.log('🔄 [UserContext] Refreshing user via server action...');

        try {
            // Get auth user from client
            const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

            if (authError || !authUser) {
                console.log('⚠️ [UserContext] No auth user found');
                setUser(null);
                setSupabaseUser(null);
                return;
            }

            console.log('✅ [UserContext] Auth user found:', authUser.id, authUser.email);
            setSupabaseUser(authUser);

            // Use server action to get full user profile (bypasses RLS)
            const { user: userData, error: userError } = await getCurrentUser();

            if (userError || !userData) {
                console.error('❌ [UserContext] Error from getCurrentUser:', userError);
                // Set basic user data from auth
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

            console.log('✅ [UserContext] User data fetched:', userData.name, userData.role);

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

            console.log('👤 [UserContext] App user constructed:', user); // Note: 'user' here refers to the state variable, not the 'appUser' local variable which is now removed.

        } catch (err) {
            console.error('❌ [UserContext] Exception in refreshUser:', err);
            setUser(null);
            setSupabaseUser(null);
        } finally {
            isRefreshing.current = false;
        }
    };

    useEffect(() => {
        // Only initialize once
        if (hasInitialized.current) return;
        hasInitialized.current = true;

        const initializeUser = async () => {
            console.log('🚀 [UserContext] Initializing user context...');
            setLoading(true);
            try {
                await refreshUser();
            } finally {
                setLoading(false);
                console.log('✅ [UserContext] Initialization complete');
            }
        };

        initializeUser();

        // Listen for auth changes - but only for sign in/out events
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                console.log('🔔 [UserContext] Auth state changed:', event);

                // Only handle explicit sign in/out events
                if (event === 'SIGNED_IN' && session?.user && !user) {
                    console.log('✅ [UserContext] User signed in:', session.user.email);
                    setSupabaseUser(session.user);
                    await refreshUser();
                } else if (event === 'SIGNED_OUT') {
                    console.log('👋 [UserContext] User signed out');
                    setUser(null);
                    setSupabaseUser(null);
                }
                // Ignore INITIAL_SESSION and TOKEN_REFRESHED events
            }
        );

        return () => {
            subscription.unsubscribe();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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
