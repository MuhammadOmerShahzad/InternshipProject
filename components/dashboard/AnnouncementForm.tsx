'use client';

import { useState } from 'react';

interface AnnouncementFormProps {
    onClose: () => void;
    user: {
        name: string;
    };
    onAnnouncementAdded?: (announcement: any) => void;
}

export default function AnnouncementForm({ onClose, user, onAnnouncementAdded }: AnnouncementFormProps) {
    const [announcement, setAnnouncement] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!announcement.trim()) {
            alert('Announcement cannot be empty.');
            return;
        }

        setLoading(true);
        try {
            // TODO: Replace with actual API endpoint
            // const response = await fetch('/api/announcements', {
            //   method: 'POST',
            //   headers: { 'Content-Type': 'application/json' },
            //   body: JSON.stringify({ announcement, createdBy: user.name }),
            // });
            // const data = await response.json();

            // Mock success for now
            const mockData = {
                _id: Date.now().toString(),
                announcement,
                announcementDetails: '',
                createdBy: user.name,
                createdAt: new Date().toISOString(),
            };

            if (onAnnouncementAdded) {
                onAnnouncementAdded(mockData);
            }
            onClose();
        } catch (error) {
            console.error('Error saving announcement:', error);
            alert('There was an error saving the announcement.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="fixed inset-0 w-full h-screen bg-black/50 backdrop-blur-sm flex items-center justify-center z-[1200] p-4 sm:p-0"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div className="bg-white dark:bg-gray-800 p-4 w-full sm:w-[500px] max-w-[90%] rounded-xl shadow-2xl animate-fadeIn">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-0 sm:mb-4">
                    <h2 className="text-xl font-semibold mb-2 sm:mb-0">Add Announcement</h2>
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 sm:relative sm:top-0 sm:right-0 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                        aria-label="Close"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <textarea
                    className="w-full mt-6 p-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#f15a22] focus:border-transparent dark:bg-gray-700 dark:text-white"
                    rows={4}
                    placeholder="Enter announcement..."
                    value={announcement}
                    onChange={(e) => setAnnouncement(e.target.value)}
                />

                <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="w-full mt-2 bg-[#f15a22] hover:bg-[#d14e1f] text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'Adding...' : 'Add Announcement'}
                </button>
            </div>
        </div>
    );
}
