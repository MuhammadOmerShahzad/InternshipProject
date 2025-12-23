'use client';

import { useState, useEffect } from 'react';
import { notFound } from 'next/navigation';
import AppBar from '@/components/layout/AppBar';
import Drawer from '@/components/layout/Drawer';
import Banner from '@/components/dashboard/Banner';
import SubModulesGrid from '@/components/modules/SubModulesGrid';
import { getModuleBySlug } from '@/lib/config/moduleConfig';
import { useUser } from '@/lib/context/UserContext';

interface ModulePageProps {
    params: Promise<{
        module: string;
    }>;
}

export default function ModuleMainPage({ params }: ModulePageProps) {
    const { user, loading: _userLoading } = useUser();
    const [resolvedParams, setResolvedParams] = useState<{ module: string } | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [mobileOpen, setMobileOpen] = useState(false);
    const [desktopOpen, setDesktopOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // Resolve params
    useEffect(() => {
        params.then(setResolvedParams);
    }, [params]);

    // Detect mobile
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 640);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    if (!resolvedParams) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin w-8 h-8 border-4 border-[#f15a22] border-t-transparent rounded-full" />
            </div>
        );
    }

    const { module: moduleSlug } = resolvedParams;
    const moduleConfig = getModuleBySlug(moduleSlug);

    if (!moduleConfig) {
        notFound();
    }

    // For modules with no submodules (like Rental Agreements), show file page directly
    // For now, we'll just show the grid

    return (
        <>
            <AppBar
                searchQuery={searchQuery}
                onSearch={setSearchQuery}
                searchResults={[]}
                user={user}
                mobileOpen={mobileOpen}
                setMobileOpen={setMobileOpen}
                desktopOpen={desktopOpen}
                setDesktopOpen={setDesktopOpen}
            />

            <Drawer
                user={user}
                mobileOpen={mobileOpen}
                setMobileOpen={setMobileOpen}
                desktopOpen={desktopOpen}
                setDesktopOpen={setDesktopOpen}
            />

            <main
                className="flex-grow p-4 sm:p-4 mt-16 overflow-y-auto min-h-screen bg-gray-50 dark:bg-black"
                style={{
                    marginLeft: !isMobile ? '65px' : '0px',
                    paddingLeft: !isMobile ? '1rem' : '0',
                }}
            >
                {/* Banner */}
                <Banner />

                {/* Heading */}
                <h1
                    className="text-black dark:text-[#f15a22] mb-4 text-left ml-2 sm:ml-6 text-2xl sm:text-3xl"
                    style={{ fontFamily: 'var(--font-heading)' }}
                >
                    {moduleConfig.displayName.toUpperCase()}
                </h1>

                {/* SubModules Grid */}
                {moduleConfig.subModules.length > 0 ? (
                    <div className="ml-0 sm:ml-4 -mt-2">
                        <SubModulesGrid
                            subModules={moduleConfig.subModules}
                            basePath={`/${moduleSlug}`}
                            user={user}
                        />
                    </div>
                ) : (
                    <div className="ml-0 sm:ml-6 text-gray-600 dark:text-gray-400">
                        This module has no sub-categories. Content coming soon.
                    </div>
                )}
            </main>
        </>
    );
}
