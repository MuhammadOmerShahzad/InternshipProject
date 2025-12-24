'use client';

import { useState, useEffect, useMemo } from 'react';
import { useUser } from '@/lib/context/UserContext';
import AppBar from '@/components/layout/AppBar';
import Drawer from '@/components/layout/Drawer';
import Banner from '@/components/dashboard/Banner';
import TileGrid from '@/components/dashboard/TileGrid';
import Tabs from '@/components/dashboard/Tabs';
import AnnouncementForm from '@/components/dashboard/AnnouncementForm';
import BranchTasksForm from '@/components/dashboard/BranchTasksForm';
import LoadingScreen from '@/components/ui/LoadingScreen';

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

export default function DashboardPage() {
    const { user, loading } = useUser();

    const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
    const [showTasksForm, setShowTasksForm] = useState(false);
    const [latestAnnouncement, setLatestAnnouncement] = useState<{ id: string; title: string; message: string; created_at: string; created_by: string; creator_name?: string } | null>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [hoveredButton, setHoveredButton] = useState<string | null>(null);

    // AppBar state
    const [mobileOpen, setMobileOpen] = useState(false);
    const [desktopOpen, setDesktopOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // Detect mobile for margin calculation
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 640);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Get user's modules or use defaults - MUST be before any early returns
    const registeredModules = user?.registeredModules?.length
        ? user.registeredModules
        : DEFAULT_MODULES;

    // useMemo MUST be called before any conditional returns (React rules of hooks)
    const tiles = useMemo(() => {
        const allTiles = [
            { name: 'Licenses', image: '/images/modules/licenses.webp' },
            { name: 'Approvals', image: '/images/modules/approved.webp' },
            { name: 'Vehicles', image: '/images/modules/vehicle.webp' },
            { name: 'User Tickets', image: '/images/icons/user_icon.webp' },
            { name: 'Health Safety Environment', image: '/images/modules/hse.webp' },
            { name: 'Taxation', image: '/images/modules/taxation.webp' },
            { name: 'Certificates', image: '/images/modules/certificate.webp' },
            { name: 'Security', image: '/images/modules/security.webp' },
            { name: 'Admin Policies and SOPs', image: '/images/icons/admin_icon.webp' },
            { name: 'Rental Agreements', image: '/images/modules/rental_agreements.webp' },
            { name: 'User Management', image: '/images/modules/user_management.webp' },
        ];

        return allTiles.filter((tile) =>
            registeredModules.some((module) => module.includes(tile.name))
        );
    }, [registeredModules]);



    const handleAnnouncementAdded = (newAnnouncement: { id: string; title: string; message: string; created_at: string; created_by: string; creator_name?: string }) => {
        setLatestAnnouncement(newAnnouncement);
        setRefreshTrigger((prev) => prev + 1);
    };

    // Show loading screen while user context is loading
    if (loading) {
        return <LoadingScreen />;
    }

    return (
        <>
            <AppBar
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
                className="flex-grow p-4 sm:p-4 mt-16 overflow-hidden"
                style={{
                    marginLeft: !isMobile ? '65px' : '0px', // Always 65px on desktop for mini drawer
                    paddingLeft: !isMobile ? '1rem' : '0',
                }}
            >
                <Banner />

                <h1
                    className="text-black dark:text-[#f15a22] mb-1 text-left ml-2 sm:ml-6 text-2xl sm:text-3xl"
                    style={{ fontFamily: 'var(--font-heading)' }}
                >
                    MODULES
                </h1>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-0 items-start">
                    {/* Left side - Tiles Grid */}
                    <div className="md:col-span-8">
                        <div className="ml-0 sm:ml-6">
                            <TileGrid tiles={tiles} />
                        </div>
                    </div>

                    {/* Right side - Admin buttons and Tabs */}
                    <div className="md:col-span-4">
                        {/* Admin Buttons */}
                        {user?.role === 'Admin' && (
                            <div className="flex flex-col sm:flex-row md:flex-row justify-between mb-3 ml-0 sm:ml-10 max-w-full gap-2 sm:gap-3 animate-slideIn">
                                {/* Add Announcement Button */}
                                <button
                                    onMouseEnter={() => setHoveredButton('announcement')}
                                    onMouseLeave={() => setHoveredButton(null)}
                                    onClick={() => setShowAnnouncementForm(true)}
                                    className={`
                    w-full sm:w-[48%] h-[60px] rounded-2xl
                    bg-gradient-to-br from-[#f15a22] to-[#ff6b35]
                    transition-all duration-300 cubic-bezier-[0.4,0,0.2,1]
                    relative overflow-hidden
                    ${hoveredButton === 'announcement'
                                            ? 'shadow-[0_8px_25px_rgba(241,90,34,0.4),0_0_0_3px_rgba(241,90,34,0.1)] -translate-y-1 scale-[1.02] bg-gradient-to-br from-[#d14e1f] to-[#e55a2b] animate-pulse-custom'
                                            : 'shadow-[0_4px_15px_rgba(241,90,34,0.3)]'
                                        }
                    before:content-[''] before:absolute before:top-0 before:left-[-100%] 
                    before:w-full before:h-full before:bg-gradient-to-r before:from-transparent 
                    before:via-white/20 before:to-transparent before:transition-[left] before:duration-500
                    hover:before:left-[100%]
                    active:translate-y-[-2px] active:scale-[0.98]
                  `}
                                >
                                    <div className="flex items-center justify-center gap-1">
                                        <svg
                                            className={`w-6 h-6 text-white ${hoveredButton === 'announcement' ? 'animate-bounce-custom' : ''}`}
                                            fill="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1-11v6h2v-6h-2zm0-4v2h2V7h-2z" />
                                        </svg>
                                        <span className="font-semibold text-sm sm:text-base text-white">
                                            Add Announcement
                                        </span>
                                    </div>
                                </button>

                                {/* Branch Tasks Button */}
                                <button
                                    onMouseEnter={() => setHoveredButton('task')}
                                    onMouseLeave={() => setHoveredButton(null)}
                                    onClick={() => setShowTasksForm(true)}
                                    className={`
                    w-full sm:w-[48%] h-[60px] rounded-2xl
                    bg-gradient-to-br from-[#f15a22] to-[#ff6b35]
                    transition-all duration-300 cubic-bezier-[0.4,0,0.2,1]
                    relative overflow-hidden
                    ${hoveredButton === 'task'
                                            ? 'shadow-[0_8px_25px_rgba(241,90,34,0.4),0_0_0_3px_rgba(241,90,34,0.1)] -translate-y-1 scale-[1.02] bg-gradient-to-br from-[#d14e1f] to-[#e55a2b] animate-pulse-custom'
                                            : 'shadow-[0_4px_15px_rgba(241,90,34,0.3)]'
                                        }
                    before:content-[''] before:absolute before:top-0 before:left-[-100%] 
                    before:w-full before:h-full before:bg-gradient-to-r before:from-transparent 
                    before:via-white/20 before:to-transparent before:transition-[left] before:duration-500
                    hover:before:left-[100%]
                    active:translate-y-[-2px] active:scale-[0.98]
                  `}
                                >
                                    <div className="flex items-center justify-center gap-1">
                                        <svg
                                            className={`w-6 h-6 text-white ${hoveredButton === 'task' ? 'animate-bounce-custom' : ''}`}
                                            fill="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path d="M19 22H5a3 3 0 0 1-3-3V3a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v12h4v4a3 3 0 0 1-3 3zm-1-5v2a1 1 0 0 0 2 0v-2h-2zm-2 3V2H4v17a1 1 0 0 0 1 1h11zM6 7h8v2H6V7zm0 4h8v2H6v-2zm0 4h5v2H6v-2z" />
                                        </svg>
                                        <span className="font-semibold text-sm sm:text-base text-white">
                                            Branch Tasks
                                        </span>
                                    </div>
                                </button>
                            </div>
                        )}

                        {/* Tabs Component */}
                        <div className="ml-0 sm:ml-10 overflow-y-auto max-h-[60vh] sm:max-h-[calc(100vh-200px)] scrollbar-thin">
                            <Tabs
                                latestAnnouncement={latestAnnouncement}
                                _userId={user?.id || ''}
                                _userZone={user?.zone || ''}
                                _userBranch={user?.branch || ''}
                                userBranchId={user?.branch_id || ''}
                                _userEmail={user?.email || ''}
                                refreshTrigger={refreshTrigger}
                            />
                        </div>
                    </div>
                </div>

                {/* Announcement Form Modal */}
                {showAnnouncementForm && (
                    <AnnouncementForm
                        onClose={() => setShowAnnouncementForm(false)}
                        onAnnouncementAdded={handleAnnouncementAdded}
                    />
                )}

                {/* Branch Tasks Form Modal */}
                {showTasksForm && (
                    <BranchTasksForm
                        onClose={() => setShowTasksForm(false)}
                        onTasksAdded={() => setRefreshTrigger(prev => prev + 1)}
                    />
                )}
            </main>
        </>
    );
}
