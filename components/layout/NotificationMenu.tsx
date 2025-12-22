'use client';

import { MouseEvent } from 'react';
import { Notification } from '@/lib/services/notificationService';

interface NotificationMenuProps {
    anchorEl: HTMLElement | null;
    open: boolean;
    onClose: () => void;
    notifications?: Notification[];
    loading?: boolean;
    error?: string | null;
}

export default function NotificationMenu({
    anchorEl,
    open,
    onClose,
    notifications = [],
    loading = false,
    error = null,
}: NotificationMenuProps) {
    if (!open) return null;

    const unreadCount = notifications.filter((n) => !n.read).length;

    const getNotificationIcon = (type?: string) => {
        switch (type) {
            case 'success':
                return (
                    <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1-11v6h2v-6h-2zm0-4v2h2V7h-2z" />
                    </svg>
                );
            case 'error':
                return (
                    <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1-11v6h2v-6h-2zm0-4v2h2V7h-2z" />
                    </svg>
                );
            default:
                return (
                    <svg className="w-6 h-6 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1-11v6h2v-6h-2zm0-4v2h2V7h-2z" />
                    </svg>
                );
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
        });
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-40"
                onClick={onClose}
            />

            {/* Notification Popover */}
            <div
                className="fixed right-4 top-16 w-[360px] max-h-[480px] bg-white dark:bg-gray-800 rounded-lg shadow-2xl z-50 overflow-hidden"
            >
                {/* Header */}
                <div className="p-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-semibold">Notifications</h2>
                    <div className="relative">
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1-11v6h2v-6h-2zm0-4v2h2V7h-2z" />
                        </svg>
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                {unreadCount}
                            </span>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="overflow-y-auto max-h-[400px]">
                    {loading ? (
                        <div className="flex justify-center items-center p-6">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#f15a22]" />
                        </div>
                    ) : error ? (
                        <div className="p-4 m-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-600 dark:text-red-400">
                            {error}
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="p-6 text-center text-gray-500">
                            <p>No notifications</p>
                        </div>
                    ) : (
                        <div>
                            {notifications.map((notification, index) => (
                                <div key={notification._id}>
                                    <div
                                        className={`p-4 flex gap-3 transition-colors ${notification.read
                                                ? 'bg-white dark:bg-gray-800'
                                                : 'bg-gray-50 dark:bg-gray-700/50'
                                            } hover:bg-gray-100 dark:hover:bg-gray-700`}
                                    >
                                        <div className="flex-shrink-0 mt-1">
                                            {getNotificationIcon(notification.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-gray-900 dark:text-white">
                                                {notification.title}
                                            </p>
                                            <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                                                {notification.message}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                {formatDate(notification.createdAt)}
                                            </p>
                                        </div>
                                    </div>
                                    {index < notifications.length - 1 && (
                                        <div className="border-b border-gray-200 dark:border-gray-700" />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
