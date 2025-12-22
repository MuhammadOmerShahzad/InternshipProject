'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface User {
    name: string;
    email: string;
    role: string;
    branch: string;
}

interface ProfileMenuProps {
    anchorEl: HTMLElement | null;
    isOpen: boolean;
    onClose: () => void;
    user: User | null;
    darkMode?: boolean;
}

export default function ProfileMenu({
    anchorEl,
    isOpen,
    onClose,
    user,
    darkMode = false,
}: ProfileMenuProps) {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    if (!isOpen || !user) return null;

    const handleLogout = () => {
        setIsLoading(true);
        setTimeout(() => {
            onClose();
            // TODO: Add actual logout logic
            // logout();
            router.push('/login');
        }, 1000);
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-40"
                onClick={onClose}
            />

            {/* Profile Menu Popover */}
            <div
                className="fixed right-4 top-16 w-80 bg-white dark:bg-[#232323] rounded-2xl shadow-2xl z-50 p-7 text-center border border-gray-200 dark:border-[#333]"
            >
                {/* Avatar */}
                <div className="flex justify-center mb-4">
                    <div className="w-17 h-17 rounded-full bg-gradient-to-br from-[#6a11cb] to-[#2575fc] flex items-center justify-center text-white text-3xl font-semibold shadow-lg border-3 border-white">
                        {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                </div>

                {/* User Info */}
                <h3 className={`text-xl font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {user.name || 'User Name'}
                </h3>
                <p className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {user.email || 'email@example.com'}
                </p>

                {/* Divider */}
                <div className={`my-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`} />

                {/* Role and Branch */}
                <div className="flex flex-col gap-2 mb-4">
                    <div className="flex items-center gap-3">
                        <svg className="w-5 h-5 text-[#f15a22] flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z" />
                        </svg>
                        <p className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            Role: <span className="font-semibold">{user.role || 'N/A'}</span>
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <svg className="w-5 h-5 text-[#f15a22] flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                        </svg>
                        <p className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            Branch: <span className="font-semibold">{user.branch || 'N/A'}</span>
                        </p>
                    </div>
                </div>

                {/* Divider */}
                <div className={`my-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`} />

                {/* Logout Button */}
                <button
                    onClick={handleLogout}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-4 rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? (
                        <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                            <span>Logging out..</span>
                        </>
                    ) : (
                        <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            <span>Logout</span>
                        </>
                    )}
                </button>
            </div>
        </>
    );
}
