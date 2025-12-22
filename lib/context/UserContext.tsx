'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User as SupabaseUser } from '@supabase/supabase-js';

export interface AppUser {
    id: string;
    email: string;
    name: string;
    role: string;
    branch: string;
    zone: string;
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

    const fetchUserData = async (authUser: SupabaseUser) => {
        // Default user data - return this if the query times out or fails
        const defaultUser = {
            id: authUser.id,
            email: authUser.email || '',
            name: authUser.email?.split('@')[0] || 'User',
            role: 'Admin',
            branch: 'Default Branch',
            zone: 'Default Zone',
            registeredModules: [],
        };

        try {
            // Add a timeout to prevent hanging
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Query timeout')), 5000)
            );

            // Query users table with zone and branch joins
            const queryPromise = supabase
                .from('users')
                .select(`
                    *,
                    zones:zone_id(name, code),
                    branches:branch_id(name)
                `)
                .eq('id', authUser.id)
                .single();

            const result = await Promise.race([queryPromise, timeoutPromise]) as { data: any; error: any };
            const { data: userData, error } = result;

            if (error) {
                return defaultUser;
            }

            // Build full name from first_name and last_name if 'name' is not set
            const fullName = userData?.name ||
                (userData?.first_name && userData?.last_name
                    ? `${userData.first_name} ${userData.last_name}`
                    : authUser.email?.split('@')[0] || 'User');

            return {
                id: authUser.id,
                email: userData?.email || authUser.email || '',
                name: fullName,
                role: userData?.role || 'Admin',
                branch: userData?.branches?.name || 'Default Branch',
                zone: userData?.zones?.name || 'Default Zone',
                registeredModules: userData?.registered_modules || [],
            };
        } catch {
            return defaultUser;
        }
    };

    const refreshUser = async () => {
        try {
            const { data: { user: authUser }, error } = await supabase.auth.getUser();

            if (error) {
                setUser(null);
                setSupabaseUser(null);
                return;
            }

            if (authUser) {
                setSupabaseUser(authUser);
                const appUser = await fetchUserData(authUser);
                setUser(appUser);
            } else {
                setUser(null);
                setSupabaseUser(null);
            }
        } catch {
            setUser(null);
            setSupabaseUser(null);
        }
    };

    useEffect(() => {
        const initializeUser = async () => {
            setLoading(true);
            try {
                await refreshUser();
            } finally {
                setLoading(false);
            }
        };

        initializeUser();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (event === 'SIGNED_IN' && session?.user) {
                    setSupabaseUser(session.user);
                    const appUser = await fetchUserData(session.user);
                    setUser(appUser);
                } else if (event === 'SIGNED_OUT') {
                    setUser(null);
                    setSupabaseUser(null);
                }
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
