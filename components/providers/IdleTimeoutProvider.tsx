'use client';

import { useIdleTimeout } from '@/lib/hooks/useIdleTimeout';
import { useUser } from '@/lib/context/UserContext';

interface IdleTimeoutProviderProps {
    children: React.ReactNode;
}

/**
 * Component that wraps the application to provide idle timeout functionality.
 * Only activates when user is authenticated.
 */
export function IdleTimeoutProvider({ children }: IdleTimeoutProviderProps) {
    const { user } = useUser();

    // Only enable idle timeout when user is logged in
    useIdleTimeout({
        enabled: !!user,
        timeout: 15 * 60 * 1000, // 15 minutes
        warningTime: 60 * 1000, // 1 minute warning
    });

    return <>{children}</>;
}
