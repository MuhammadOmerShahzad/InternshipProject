'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { updateThemePreference, getThemePreference, ThemePreference } from '@/lib/actions/theme';

type Theme = 'light' | 'dark';

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
    setTheme: (theme: Theme) => void;
    isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'muawin-theme';

function getSystemTheme(): Theme {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getStoredTheme(): Theme | null {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
    return null;
}

function applyThemeToDocument(theme: Theme) {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;
    if (theme === 'dark') {
        root.classList.add('dark');
    } else {
        root.classList.remove('dark');
    }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<Theme>(() => {
        // Initialize from localStorage on first render
        const storedTheme = getStoredTheme();
        if (storedTheme) {
            applyThemeToDocument(storedTheme);
            return storedTheme;
        }
        return 'light';
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Mark as loaded after initial render
    useEffect(() => {
        setIsLoading(false);
    }, []);

    // Fetch theme from database when user is authenticated
    useEffect(() => {
        const fetchDbTheme = async () => {
            try {
                const result = await getThemePreference();
                if (result.theme) {
                    const resolvedTheme: Theme = result.theme === 'system' ? getSystemTheme() : result.theme;
                    setThemeState(resolvedTheme);
                    applyThemeToDocument(resolvedTheme);
                    localStorage.setItem(THEME_STORAGE_KEY, resolvedTheme);
                    setIsAuthenticated(true);
                }
            } catch {
                // User not authenticated, use localStorage theme
                setIsAuthenticated(false);
            }
        };

        fetchDbTheme();
    }, []);

    // Apply theme to document whenever it changes
    useEffect(() => {
        applyThemeToDocument(theme);
    }, [theme]);

    const setTheme = useCallback(async (newTheme: Theme) => {
        setThemeState(newTheme);
        applyThemeToDocument(newTheme);
        localStorage.setItem(THEME_STORAGE_KEY, newTheme);

        // Save to database if authenticated
        if (isAuthenticated) {
            try {
                await updateThemePreference(newTheme as ThemePreference);
            } catch (error) {
                console.error('Failed to save theme preference to database:', error);
            }
        }
    }, [isAuthenticated]);

    const toggleTheme = useCallback(() => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
    }, [theme, setTheme]);

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, isLoading }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
