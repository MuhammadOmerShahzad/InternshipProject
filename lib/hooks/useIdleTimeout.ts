'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

const IDLE_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes in milliseconds
const WARNING_TIME_MS = 60 * 1000; // Show warning 1 minute before timeout
const ACTIVITY_EVENTS = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];

interface UseIdleTimeoutOptions {
    timeout?: number; // in milliseconds
    warningTime?: number; // in milliseconds before timeout to show warning
    onTimeout?: () => void;
    onWarning?: () => void;
    enabled?: boolean;
}

/**
 * Hook to track user inactivity and logout after specified timeout
 * Default timeout is 15 minutes with 1 minute warning
 */
export function useIdleTimeout(options: UseIdleTimeoutOptions = {}) {
    const {
        timeout = IDLE_TIMEOUT_MS,
        warningTime = WARNING_TIME_MS,
        onTimeout,
        onWarning,
        enabled = true,
    } = options;

    const router = useRouter();
    const supabase = createClient();
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const warningRef = useRef<NodeJS.Timeout | null>(null);
    const lastActivityRef = useRef<number>(0); // Initialize to 0, set in useEffect
    const warningToastIdRef = useRef<string | number | null>(null);

    const dismissWarning = useCallback(() => {
        if (warningToastIdRef.current) {
            toast.dismiss(warningToastIdRef.current);
            warningToastIdRef.current = null;
        }
    }, []);

    const handleLogout = useCallback(async () => {
        console.log('⏰ [IdleTimeout] Session timed out due to inactivity');

        // Dismiss any warning toast
        dismissWarning();

        try {
            await supabase.auth.signOut();
        } catch (error) {
            console.error('Error signing out:', error);
        }

        // Call custom onTimeout handler if provided
        if (onTimeout) {
            onTimeout();
        }

        // Redirect to login with timeout message
        router.push('/login?reason=timeout');
    }, [supabase, router, onTimeout, dismissWarning]);

    const showWarning = useCallback(() => {
        console.log('⚠️ [IdleTimeout] Showing 1 minute warning');

        // Call custom onWarning handler if provided
        if (onWarning) {
            onWarning();
        }

        // Show warning toast
        warningToastIdRef.current = toast.warning(
            'Session expiring soon',
            {
                description: 'You will be logged out in 1 minute due to inactivity. Move your mouse or press any key to stay logged in.',
                duration: 60000, // Keep showing for 60 seconds
                action: {
                    label: 'Stay logged in',
                    onClick: () => {
                        dismissWarning();
                    },
                },
            }
        );
    }, [onWarning, dismissWarning]);

    const resetTimer = useCallback(() => {
        lastActivityRef.current = Date.now();

        // Dismiss any existing warning toast
        dismissWarning();

        // Clear existing timers
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        if (warningRef.current) {
            clearTimeout(warningRef.current);
        }

        if (enabled) {
            // Set warning timer (timeout - warningTime)
            const warningDelay = timeout - warningTime;
            if (warningDelay > 0) {
                warningRef.current = setTimeout(() => {
                    showWarning();
                }, warningDelay);
            }

            // Set logout timer
            timeoutRef.current = setTimeout(() => {
                handleLogout();
            }, timeout);
        }
    }, [timeout, warningTime, enabled, handleLogout, showWarning, dismissWarning]);

    useEffect(() => {
        if (!enabled) {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            if (warningRef.current) {
                clearTimeout(warningRef.current);
            }
            dismissWarning();
            return;
        }

        // Set initial timer
        resetTimer();

        // Add event listeners for user activity
        const handleActivity = () => {
            resetTimer();
        };

        ACTIVITY_EVENTS.forEach(event => {
            window.addEventListener(event, handleActivity, { passive: true });
        });

        // Also check on visibility change (when user returns to tab)
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                // Check if we've been idle for too long while tab was hidden
                const idleTime = Date.now() - lastActivityRef.current;
                if (idleTime >= timeout) {
                    handleLogout();
                } else if (idleTime >= timeout - warningTime) {
                    // Show warning if within warning period
                    showWarning();
                } else {
                    resetTimer();
                }
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Cleanup
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            if (warningRef.current) {
                clearTimeout(warningRef.current);
            }
            dismissWarning();
            ACTIVITY_EVENTS.forEach(event => {
                window.removeEventListener(event, handleActivity);
            });
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [enabled, timeout, warningTime, resetTimer, handleLogout, showWarning, dismissWarning]);

    return {
        resetTimer,
    };
}
