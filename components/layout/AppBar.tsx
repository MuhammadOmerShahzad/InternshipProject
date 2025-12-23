'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X, Search, Sun, Moon, Bell, User as UserIcon } from 'lucide-react';
import GlobalSearchBar from './GlobalSearchBar';
import ProfileMenu from './ProfileMenu';
import NotificationMenu from './NotificationMenu';
import { notificationService, Notification } from '@/lib/services/notificationService';
import { useTheme } from '@/lib/context/ThemeContext';

interface User {
    name: string;
    email: string;
    role: string;
    branch: string;
}

interface AppBarProps {
    user: User | null;
    mobileOpen?: boolean;
    setMobileOpen?: (open: boolean) => void;
    desktopOpen?: boolean;
    setDesktopOpen?: (open: boolean) => void;
}

export default function AppBar({
    user,
    mobileOpen = false,
    setMobileOpen = () => { },
    desktopOpen = false,
    setDesktopOpen = () => { },
}: AppBarProps) {
    const { theme, toggleTheme } = useTheme();
    const darkMode = theme === 'dark';
    const [jumping, setJumping] = useState(false);
    const [rotating, setRotating] = useState(false);
    const [highlightedIcon, setHighlightedIcon] = useState<string | null>(null);

    const _unusedHighlightedIcon = highlightedIcon; // Keep for future use
    const [profileAnchorEl, setProfileAnchorEl] = useState<HTMLElement | null>(null);
    const [notificationAnchorEl, setNotificationAnchorEl] = useState<HTMLElement | null>(null);
    const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [notificationError, setNotificationError] = useState<string | null>(null);
    const [isMobile, setIsMobile] = useState(false);

    // Detect mobile
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 640);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Fetch notifications
    const fetchNotifications = async () => {
        try {
            setLoading(true);
            setNotificationError(null);
            const response = await notificationService.getNotifications();
            setNotifications(response.notifications);
            setUnreadCount(response.unread);
        } catch {
            setNotificationError('Failed to fetch notifications');
        } finally {
            setLoading(false);
        }
    };

    // Mark notifications as read
    const handleMarkAsRead = async (notificationIds: string[]) => {
        try {
            await notificationService.markAsRead(notificationIds);
            setNotifications((prev) =>
                prev.map((notification) =>
                    notificationIds.includes(notification._id)
                        ? { ...notification, read: true }
                        : notification
                )
            );
            setUnreadCount((prev) => Math.max(0, prev - notificationIds.length));
        } catch {
            console.error('Error marking notifications as read');
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, []);

    const handleDrawerToggle = () => {
        if (isMobile) {
            setMobileOpen(!mobileOpen);
        } else {
            setDesktopOpen(!desktopOpen);
        }
    };

    const triggerAnimation = (setter: (val: boolean) => void) => {
        setter(true);
        setTimeout(() => setter(false), 500);
    };

    const handleDarkModeClick = () => {
        triggerAnimation(setRotating);
        toggleTheme();
    };

    const handleNotificationClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setNotificationAnchorEl(event.currentTarget);
        triggerAnimation(setJumping);

        const unreadIds = notifications.filter((n) => !n.read).map((n) => n._id);
        if (unreadIds.length > 0) {
            handleMarkAsRead(unreadIds);
        }
    };

    const handleProfileMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
        setProfileAnchorEl(event.currentTarget);
    };

    return (
        <>
            <header className="fixed top-0 left-0 right-0 z-50 bg-[#f15a22] shadow-[0_4px_15px_rgba(0,0,0,0.5)]">
                <div className="flex items-center px-2 sm:px-4 h-16">
                    {/* Menu Icon */}
                    <button
                        onClick={handleDrawerToggle}
                        className="p-2 mr-2 text-white hover:bg-white/20 rounded-full transition-all duration-300 hover:scale-110 active:scale-95"
                        aria-label={mobileOpen ? 'Close Menu' : 'Open Menu'}
                    >
                        {isMobile && mobileOpen ? (
                            <X className="w-6 h-6" />
                        ) : (
                            <Menu className="w-6 h-6" />
                        )}
                    </button>

                    {/* Logo */}
                    <Link href="/" className="flex items-center">
                        <div className="relative w-24 sm:w-32 h-10">
                            <Image
                                src='/images/logos/muawin_logo_white.svg'
                                alt="Muawin Logo"
                                fill
                                className="object-contain cursor-pointer"
                                priority
                            />
                        </div>
                    </Link>

                    {/* Desktop Search Bar */}
                    {!isMobile && (
                        <div className="flex-1 mx-4">
                            <GlobalSearchBar />
                        </div>
                    )}

                    {/* Right side icons */}
                    <div className="flex items-center gap-2 ml-auto">
                        {/* Mobile Search Icon */}
                        {isMobile && (
                            <button
                                onClick={() => {
                                    setMobileSearchOpen(!mobileSearchOpen);
                                    setHighlightedIcon('search');
                                }}
                                className="p-2 text-white hover:bg-white/20 rounded-full transition-all duration-300 hover:scale-110 active:scale-95"
                                aria-label="Search"
                            >
                                {mobileSearchOpen ? (
                                    <X className="w-6 h-6" />
                                ) : (
                                    <Search className="w-6 h-6" />
                                )}
                            </button>
                        )}

                        {/* Dark Mode Toggle */}
                        <button
                            onClick={handleDarkModeClick}
                            className={`p-2 text-white hover:bg-white/20 rounded-full transition-all duration-500 hover:rotate-12 active:scale-95 ${rotating ? 'animate-spin' : ''
                                }`}
                            aria-label="Toggle Dark Mode"
                        >
                            {darkMode ? (
                                <Sun className="w-6 h-6" />
                            ) : (
                                <Moon className="w-6 h-6" />
                            )}
                        </button>

                        {/* Notifications */}
                        <button
                            onClick={handleNotificationClick}
                            className={`p-2 text-white hover:bg-white/20 rounded-full transition-all duration-300 hover:scale-110 active:scale-95 relative ${jumping ? 'animate-bounce' : ''
                                }`}
                            aria-label="Notifications"
                        >
                            <Bell className="w-6 h-6" />
                            {unreadCount > 0 && (
                                <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold border-2 border-[#f15a22]">
                                    {unreadCount}
                                </span>
                            )}
                        </button>

                        {/* Profile */}
                        <button
                            onClick={handleProfileMenuOpen}
                            className="p-2 text-white hover:bg-white/20 rounded-full transition-all duration-300 hover:scale-110 active:scale-95"
                            aria-label="Account"
                        >
                            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center overflow-hidden border border-white/30 backdrop-blur-sm">
                                <UserIcon className="w-5 h-5" />
                            </div>
                        </button>
                    </div>
                </div>

                {/* Mobile Search Bar */}
                {isMobile && mobileSearchOpen && (
                    <div className="bg-[#f15a22] px-4 pb-4">
                        <GlobalSearchBar fullWidth />
                    </div>
                )}
            </header>

            {/* Notification Menu */}
            <NotificationMenu
                _anchorEl={notificationAnchorEl}
                open={Boolean(notificationAnchorEl)}
                onClose={() => setNotificationAnchorEl(null)}
                notifications={notifications}
                loading={loading}
                error={notificationError}
            />

            {/* Profile Menu */}
            <ProfileMenu
                _anchorEl={profileAnchorEl}
                isOpen={Boolean(profileAnchorEl)}
                onClose={() => setProfileAnchorEl(null)}
                user={user}
                darkMode={darkMode}
            />
        </>
    );
}
