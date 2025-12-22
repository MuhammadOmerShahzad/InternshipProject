'use client';

import { useState, useEffect } from 'react';
import TodoList from './TodoList';
import { getLatestAnnouncement } from '@/lib/actions/announcements';

interface Announcement {
    id: string;
    title: string;
    message: string;
    created_at: string;
    created_by: string;
    creator_name?: string;
}

interface TabComponentProps {
    latestAnnouncement?: Announcement | null;
    userId?: string;
    userZone?: string;
    userBranch?: string;
    userBranchId?: string;
    userEmail?: string;
    refreshTrigger?: number;
}

export default function TabComponent({
    latestAnnouncement,
    userId,
    userZone,
    userBranch,
    userBranchId,
    userEmail,
    refreshTrigger,
}: TabComponentProps) {
    const [activeTab, setActiveTab] = useState(0);
    const [announcement, setAnnouncement] = useState<Announcement | null>(null);
    const [isHovered, setIsHovered] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (latestAnnouncement) {
            setAnnouncement(latestAnnouncement);
        } else if (userBranchId) {
            // Fetch latest announcement for user's branch
            const fetchAnnouncement = async () => {
                setLoading(true);
                const { announcement: fetchedAnnouncement } = await getLatestAnnouncement(userBranchId);
                setAnnouncement(fetchedAnnouncement);
                setLoading(false);
            };
            fetchAnnouncement();
        }
    }, [latestAnnouncement, userBranchId, refreshTrigger]);

    return (
        <div
            className={`
        relative bg-white dark:bg-[#1a1a1a] rounded-[20px] overflow-hidden
        w-full max-w-[400px] mx-auto
        transition-all duration-[400ms] cubic-bezier-[0.4,0,0.2,1]
        animate-slideIn
        ${isHovered
                    ? 'shadow-[0_12px_40px_rgba(241,90,34,0.15),0_0_0_2px_rgba(241,90,34,0.1)] -translate-y-0.5'
                    : 'shadow-[0_8px_25px_rgba(0,0,0,0.1)]'
                }
        before:content-[''] before:absolute before:top-0 before:left-[-100%] 
        before:w-full before:h-full before:bg-gradient-to-r before:from-transparent 
        before:via-[rgba(241,90,34,0.05)] before:to-transparent before:transition-[left] before:duration-600
        hover:before:left-[100%] before:z-0
      `}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Tabs Header */}
            <div className="bg-[#f8f9fa] dark:bg-[#2a2a2a] border-b border-[#e0e0e0] dark:border-[#333]">
                <div className="flex w-full">
                    <button
                        onClick={() => setActiveTab(0)}
                        className={`
              flex-1 min-h-[60px] text-sm sm:text-base font-semibold
              flex items-center justify-center gap-2
              transition-all duration-300 relative
              hover:bg-[rgba(241,90,34,0.05)] dark:hover:bg-[rgba(241,90,34,0.1)]
              ${activeTab === 0 ? 'text-[#f15a22] font-bold' : ''}
            `}
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1-11v6h2v-6h-2zm0-4v2h2V7h-2z" />
                        </svg>
                        <span>Announcements</span>
                        {activeTab === 0 && (
                            <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#f15a22] rounded-t-[2px]" />
                        )}
                    </button>

                    <button
                        onClick={() => setActiveTab(1)}
                        className={`
              flex-1 min-h-[60px] text-sm sm:text-base font-semibold
              flex items-center justify-center gap-2
              transition-all duration-300 relative
              hover:bg-[rgba(241,90,34,0.05)] dark:hover:bg-[rgba(241,90,34,0.1)]
              ${activeTab === 1 ? 'text-[#f15a22] font-bold' : ''}
            `}
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M19 22H5a3 3 0 0 1-3-3V3a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v12h4v4a3 3 0 0 1-3 3zm-1-5v2a1 1 0 0 0 2 0v-2h-2zm-2 3V2H4v17a1 1 0 0 0 1 1h11zM6 7h8v2H6V7zm0 4h8v2H6v-2zm0 4h5v2H6v-2z" />
                        </svg>
                        <span>Tasks</span>
                        {activeTab === 1 && (
                            <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#f15a22] rounded-t-[2px]" />
                        )}
                    </button>
                </div>
            </div>

            {/* Tab Content */}
            <div className="p-3 pt-2 h-[280px] overflow-y-auto bg-white dark:bg-[#1a1a1a] relative z-10 scrollbar-thin scrollbar-thumb-[#f15a22] scrollbar-track-[#f1f1f1] dark:scrollbar-track-[#333]">
                {activeTab === 0 && (
                    <div className="p-3 text-left bg-[#f8f9fa] dark:bg-[#2a2a2a] rounded-2xl h-full w-full border border-[#e0e0e0] dark:border-[#333] transition-all duration-300 hover:shadow-md">
                        {loading ? (
                            <div className="flex items-center justify-center h-full">
                                <div className="animate-spin w-8 h-8 border-4 border-[#f15a22] border-t-transparent rounded-full" />
                            </div>
                        ) : announcement ? (
                            <>
                                <h2 className="font-bold text-[#f15a22] mb-2 text-lg sm:text-xl">
                                    📢 {announcement.title}
                                </h2>
                                <p className="mt-1 leading-relaxed text-[#333] dark:text-[#e0e0e0] text-sm sm:text-base">
                                    {announcement.message}
                                </p>
                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center w-full px-4">
                                    <p className="text-[#666] text-xs mb-0.5">
                                        📅 {new Date(announcement.created_at).toLocaleDateString()}
                                    </p>
                                    <p className="text-[#666] text-xs">
                                        👤 Posted by {announcement.creator_name || 'Admin'}
                                    </p>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-[#666]">
                                <svg className="w-12 h-12 mb-2 opacity-50" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1-11v6h2v-6h-2zm0-4v2h2V7h-2z" />
                                </svg>
                                <h3 className="font-bold text-base">No Announcements</h3>
                                <p className="mt-1 text-sm text-center">Check back later for updates</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 1 && (
                    <TodoList
                        userId={userId}
                        userZone={userZone}
                        userBranch={userBranch}
                        userBranchId={userBranchId}
                        userEmail={userEmail}
                        refreshTrigger={refreshTrigger}
                    />
                )}
            </div>
        </div>
    );
}
