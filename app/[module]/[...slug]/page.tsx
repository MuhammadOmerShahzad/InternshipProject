'use client';

import { useState, useEffect } from 'react';
import { useRouter, notFound } from 'next/navigation';
import AppBar from '@/components/layout/AppBar';
import Drawer from '@/components/layout/Drawer';
import Banner from '@/components/dashboard/Banner';
import SubModulesGrid from '@/components/modules/SubModulesGrid';
import FilePageTemplate from '@/components/modules/FilePageTemplate';
import {
    getModuleBySlug,
    getSubModulesForPath,
    findSubModuleByPath,
    isFilePage,
    generatePageTitle
} from '@/lib/config/moduleConfig';

// Mock user data - replace with actual authentication
const mockUser = {
    _id: '1',
    name: 'Admin User',
    email: 'admin@muawin.com',
    role: 'Admin',
    branch: 'Islamabad Branch',
    zone: 'North Zone',
    registeredModules: [
        'Licenses_Trade Licenses',
        'Licenses_Staff Medicals',
        'Approvals_Outer Spaces',
        'Vehicles_Maintenance',
        'Vehicles_Token Taxes',
        'Vehicles_Route Permits',
        'Taxation_Marketing',
        'Certificates_Electric Fitness Test',
        'Security_Guard Training',
        'HSE_Monthly Inspection',
        'HSE_Training Status',
        'HSE_Incidents',
    ],
};

interface ModulePageProps {
    params: Promise<{
        module: string;
        slug?: string[];
    }>;
}

export default function ModuleCatchAllPage({ params }: ModulePageProps) {
    const router = useRouter();
    const [resolvedParams, setResolvedParams] = useState<{ module: string; slug?: string[] } | null>(null);
    const [darkMode, setDarkMode] = useState(false);
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

    // Wait for params to resolve
    if (!resolvedParams) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin w-8 h-8 border-4 border-[#f15a22] border-t-transparent rounded-full" />
            </div>
        );
    }

    const { module: moduleSlug, slug = [] } = resolvedParams;
    const moduleConfig = getModuleBySlug(moduleSlug);

    // If module doesn't exist, show 404
    if (!moduleConfig) {
        notFound();
    }

    // Check if this path leads to a file page
    const showFilePage = isFilePage(moduleConfig, slug);

    if (showFilePage) {
        const subModule = findSubModuleByPath(moduleConfig, slug);
        if (!subModule) {
            notFound();
        }

        const title = generatePageTitle(moduleSlug, slug);
        return <FilePageTemplate title={title} subModule={subModule} user={mockUser} />;
    }

    // Otherwise, show the submodules grid
    const subModules = getSubModulesForPath(moduleConfig, slug);
    const basePath = slug.length > 0
        ? `/${moduleSlug}/${slug.join('/')}`
        : `/${moduleSlug}`;

    // Generate heading
    const heading = slug.length > 0
        ? generatePageTitle(moduleSlug, slug)
        : moduleConfig.displayName.toUpperCase();

    return (
        <>
            <AppBar
                darkMode={darkMode}
                handleDarkModeToggle={() => setDarkMode(!darkMode)}
                searchQuery={searchQuery}
                onSearch={setSearchQuery}
                searchResults={[]}
                user={mockUser}
                mobileOpen={mobileOpen}
                setMobileOpen={setMobileOpen}
                desktopOpen={desktopOpen}
                setDesktopOpen={setDesktopOpen}
            />

            <Drawer
                user={mockUser}
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
                {/* Banner Section - only on main module page */}
                {slug.length === 0 && <Banner />}

                {/* Heading */}
                <h1
                    className="text-black dark:text-[#f15a22] mb-4 text-left ml-2 sm:ml-6 text-2xl sm:text-3xl"
                    style={{ fontFamily: 'var(--font-heading)' }}
                >
                    {heading}
                </h1>

                {/* SubModules Grid */}
                <div className="ml-0 sm:ml-4 -mt-2">
                    <SubModulesGrid
                        subModules={subModules}
                        basePath={basePath}
                        user={mockUser}
                    />
                </div>
            </main>
        </>
    );
}
