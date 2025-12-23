'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface User {
    name: string;
    email: string;
    role: string;
    branch: string;
    registeredModules?: string[];
}

interface DrawerProps {
    user: User | null;
    mobileOpen: boolean;
    setMobileOpen: (open: boolean) => void;
    desktopOpen: boolean;
    setDesktopOpen: (open: boolean) => void;
}

interface MenuItem {
    text: string;
    icon: string;
    path: string;
    submenu?: { text: string; path: string }[];
}

const DRAWER_WIDTH = 300;
const MINI_DRAWER_WIDTH = 65;

// Default modules for users without explicit permissions
const DEFAULT_MODULES = [
    'Licenses',
    'Approvals',
    'Vehicles',
    'Health Safety Environment',
    'Taxation',
    'Certificates',
    'Security',
    'Admin Policies and SOPs',
    'Rental Agreements',
    'User Management',
];

export default function DrawerComponent({
    user,
    mobileOpen,
    setMobileOpen,
    desktopOpen,
    setDesktopOpen,
}: DrawerProps) {
    const router = useRouter();
    const [isMobile, setIsMobile] = useState(false);
    const [openMenu, setOpenMenu] = useState<Record<string, boolean>>({});

    // Get user's modules or use defaults
    const registeredModules = user?.registeredModules?.length
        ? user.registeredModules
        : DEFAULT_MODULES;

    // Detect mobile
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 640);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Handle backdrop click
    const handleBackdropClick = () => {
        if (desktopOpen && !isMobile) {
            setDesktopOpen(false);
        }
    };

    // Handle escape key
    useEffect(() => {
        const handleEscapeKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && desktopOpen && !isMobile) {
                setDesktopOpen(false);
            }
        };

        document.addEventListener('keydown', handleEscapeKey);
        return () => document.removeEventListener('keydown', handleEscapeKey);
    }, [desktopOpen, isMobile, setDesktopOpen]);

    // Check if user has access to a module
    const hasAccess = (moduleName: string, submoduleName = '') => {
        return registeredModules.some((module) => {
            if (submoduleName) {
                return module === `${moduleName}_${submoduleName}`;
            }
            return module.startsWith(`${moduleName}_`) || module === moduleName;
        });
    };

    // Menu items
    const items: MenuItem[] = [
        {
            text: 'Licenses',
            icon: '/images/licenses.webp',
            path: '/licenses',
            submenu: [
                { text: 'Trade Licenses', path: '/licenses' },
                { text: 'Staff Medicals', path: '/licenses' },
                { text: 'Tourism Licenses', path: '/licenses' },
                { text: 'Labour Licenses', path: '/licenses' },
            ],
        },
        {
            text: 'Approvals',
            icon: '/images/approved.webp',
            path: '/approvals',
            submenu: [{ text: 'Outer Spaces', path: '/approvals' }],
        },
        {
            text: 'Vehicles',
            icon: '/images/vehicle.webp',
            path: '/vehicles',
            submenu: [
                { text: 'Maintenance', path: '/vehicles' },
                { text: 'Token Taxes', path: '/vehicles' },
                { text: 'Route Permits', path: '/vehicles' },
            ],
        },
        {
            text: 'Health Safety Environment',
            icon: '/images/hse.webp',
            path: '/hse',
            submenu: [
                { text: 'Monthly Inspection', path: '/hse/monthly-inspection' },
                { text: 'Quarterly Audit', path: '/hse/quarterly-audit' },
                { text: 'Expiry of Cylinders', path: '/hse/cylinders' },
                { text: 'Training Status', path: '/hse/training' },
                { text: 'Incidents', path: '/hse/incidents' },
            ],
        },
        {
            text: 'Taxation',
            icon: '/images/taxation.webp',
            path: '/taxation',
            submenu: [
                { text: 'Marketing / Bill Boards Taxes', path: '/taxation' },
                { text: 'Profession Tax', path: '/taxation' },
            ],
        },
        {
            text: 'Certificates',
            icon: '/images/certificate.webp',
            path: '/certificates',
            submenu: [{ text: 'Electric Fitness Test', path: '/certificates/electric-fitness' }],
        },
        {
            text: 'Security',
            icon: '/images/security.webp',
            path: '/security',
        },
        {
            text: 'Admin Policies and SOPs',
            icon: '/images/admin_icon.webp',
            path: '/admin-policies',
        },
        {
            text: 'Rental Agreements',
            icon: '/images/rental_agreements.webp',
            path: '/rental-agreements',
        },
        {
            text: 'User Management',
            icon: '/images/user_management.webp',
            path: '/user-management',
        },
        {
            text: 'User Tickets',
            icon: '/images/user_icon.webp',
            path: '/user-tickets',
        },
    ];

    // Filter items based on user permissions
    const filteredItems = items.filter((item) => hasAccess(item.text));

    const handleMenuClick = (itemText: string) => {
        setOpenMenu((prev) => ({
            ...prev,
            [itemText]: !prev[itemText],
        }));
    };

    const handleNavigate = (path: string) => {
        router.push(path);
        if (isMobile) {
            setMobileOpen(false);
        }
    };

    const drawerContent = (
        <div className="h-full overflow-y-auto bg-white dark:bg-[#1a1a1a]">
            {/* Toolbar spacer */}
            <div className="h-16" />
            <div className="border-b border-gray-200 dark:border-gray-700" />

            {/* Menu items */}
            <nav className="py-2">
                {filteredItems.map((item) => {
                    const hasSubmenu = !!item.submenu;
                    const isOpen = openMenu[item.text];

                    return (
                        <div key={item.text}>
                            {/* Main menu item */}
                            <button
                                onClick={() => {
                                    if (isMobile) {
                                        if (hasSubmenu) {
                                            handleMenuClick(item.text);
                                        } else {
                                            handleNavigate(item.path);
                                        }
                                    } else {
                                        if (!desktopOpen) {
                                            handleNavigate(item.path);
                                        } else {
                                            if (hasSubmenu) {
                                                handleMenuClick(item.text);
                                            } else {
                                                handleNavigate(item.path);
                                            }
                                        }
                                    }
                                }}
                                className="w-full flex items-center py-3 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                                style={{
                                    paddingLeft: '20px', // Centers icon in 65px (20 + 24 icon + ~20 = 65)
                                    paddingRight: '16px',
                                }}
                                title={!desktopOpen && !isMobile ? item.text : ''}
                            >
                                <div className="flex-shrink-0 w-6 h-6 relative">
                                    <Image
                                        src={item.icon}
                                        alt={item.text}
                                        fill
                                        className="object-contain"
                                    />
                                </div>

                                {/* Text - show/hide based on drawer state */}
                                <span
                                    className={`
                                        ml-3 flex-1 text-left text-sm font-medium whitespace-nowrap
                                        ${(isMobile || desktopOpen) ? '' : 'hidden'}
                                    `}
                                >
                                    {item.text}
                                </span>
                                {hasSubmenu && (isMobile || desktopOpen) && (
                                    <svg
                                        className={`w-5 h-5 ${isOpen ? 'rotate-180' : ''}`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                )}
                            </button>

                            {/* Submenu */}
                            {hasSubmenu && (desktopOpen || isMobile) && isOpen && (
                                <div className="bg-gray-50 dark:bg-[#111]">
                                    {item.submenu
                                        ?.filter((sub) => hasAccess(item.text, sub.text))
                                        .map((sub) => (
                                            <button
                                                key={sub.text}
                                                onClick={() => handleNavigate(sub.path)}
                                                className="w-full text-left pl-12 pr-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                            >
                                                {sub.text}
                                            </button>
                                        ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </nav>
        </div>
    );

    // Mobile drawer
    if (isMobile) {
        return (
            <>
                {/* Backdrop with smooth fade */}
                <div
                    className={`
                        fixed inset-0 z-40 bg-black/50
                        transition-opacity duration-300
                        ${mobileOpen ? 'opacity-100 ease-out' : 'opacity-0 pointer-events-none ease-in'}
                    `}
                    onClick={() => setMobileOpen(false)}
                />

                <div
                    className={`
                        fixed top-0 left-0 bottom-0 z-50 bg-white dark:bg-[#1a1a1a]
                        shadow-2xl
                        transform transition-transform duration-300
                        ${mobileOpen ? 'translate-x-0 ease-out' : '-translate-x-full ease-in'}
                    `}
                    style={{ width: DRAWER_WIDTH }}
                >
                    {drawerContent}
                </div>
            </>
        );
    }

    // Desktop drawer - single drawer, always mounted, animate width
    return (
        <>
            {/* Single drawer - content always mounted for performance */}
            <div
                className="fixed top-0 left-0 bottom-0 bg-white dark:bg-[#1a1a1a] border-r border-gray-200 dark:border-gray-700 shadow-xl z-30 overflow-hidden"
                style={{
                    width: desktopOpen ? DRAWER_WIDTH : MINI_DRAWER_WIDTH,
                    transition: 'width 150ms ease-out',
                    contain: 'layout style',
                }}
            >
                {/* Inner content wrapper - fixed width to prevent reflow */}
                <div style={{ width: DRAWER_WIDTH, minWidth: DRAWER_WIDTH }}>
                    {drawerContent}
                </div>
            </div>

            {/* Backdrop with smooth fade */}
            <div
                className={`
                    fixed inset-0 z-20 bg-black/30
                    transition-opacity duration-200
                    ${desktopOpen ? 'opacity-100 ease-out' : 'opacity-0 pointer-events-none ease-in'}
                `}
                onClick={handleBackdropClick}
            />
        </>
    );
}
