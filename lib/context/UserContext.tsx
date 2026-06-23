'use client';

import { createContext, useContext, useEffect, useState, useRef, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
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
    loading: boolean;
    refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType>({
    user: null,
    loading: true,
    refreshUser: async () => { },
});

export function UserProvider({ children }: { children: ReactNode }) {
    const router = useRouter();
    const [user, setUser] = useState<AppUser | null>(null);
    const [loading, setLoading] = useState(true);
    const isRefreshing = useRef(false);

    const fetchUser = useCallback(async (): Promise<void> => {
        if (isRefreshing.current) return;
        isRefreshing.current = true;

        try {
            // Add timeout to prevent hanging
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('User fetch timeout')), 5000)
            );

            const userPromise = getCurrentUser();
            const { user: userData, error } = await Promise.race([
                userPromise,
                timeoutPromise,
            ]) as Awaited<ReturnType<typeof getCurrentUser>>;

            console.log('[UserContext] User fetch result:', userData ? 'User found' : 'No user');

            if (error || !userData) {
                console.log('[UserContext] No user data, setting user to null');
                setUser(null);
                return;
            }

            console.log('[UserContext] Setting user:', userData.id);
            setUser({
                id: userData.id,
                email: userData.email || '',
                name: (userData as { name?: string }).name ||
                    (userData.lastName
                        ? `${userData.firstName} ${userData.lastName}`
                        : userData.firstName) ||
                    'User',
                role: userData.role || 'Admin',
                branch: (userData as { branch_name?: string }).branch_name || 'Default Branch',
                zone: (userData as { zone_name?: string }).zone_name || 'Default Zone',
                branch_id: userData.branchId,
                zone_id: userData.zoneId,
                registeredModules: userData.registeredModules || undefined,
            });
        } catch (err) {
            console.error('[UserContext] Error fetching user:', err);
            setUser(null);
        } finally {
            isRefreshing.current = false;
            setLoading(false);
        }
    }, []);

    const refreshUser = useCallback(async () => {
        setLoading(true);
        await fetchUser();
    }, [fetchUser]);

    useEffect(() => {
        fetchUser();
    }, [fetchUser]);

    return (
        <UserContext.Provider value={{ user, loading, refreshUser }}>
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
