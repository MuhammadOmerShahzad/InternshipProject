'use client';

import { useState, useEffect } from 'react';
import { X, Send, Loader2, Megaphone, Building2, CheckCircle2 } from 'lucide-react';
import { getAllBranches } from '@/lib/actions/zones';
import { postAnnouncement } from '@/lib/actions/announcements';

interface AnnouncementFormProps {
    onClose: () => void;
    onAnnouncementAdded?: (announcement: { id: string; title: string; message: string; created_at: string; created_by: string; creator_name?: string }) => void;
}

interface Branch {
    id: string;
    name: string;
}

export default function AnnouncementForm({ onClose, onAnnouncementAdded }: AnnouncementFormProps) {
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [branches, setBranches] = useState<Branch[]>([]);
    const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
    const [allBranchesSelected, setAllBranchesSelected] = useState(true);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [isClosing, setIsClosing] = useState(false);

    // Fetch branches
    useEffect(() => {
        async function loadBranches() {
            setLoading(true);
            const { branches: branchData } = await getAllBranches();
            setBranches(branchData);
            setLoading(false);
        }
        loadBranches();
    }, []);

    // Handle all branches toggle
    const handleAllBranchesToggle = () => {
        setAllBranchesSelected(!allBranchesSelected);
        if (!allBranchesSelected) {
            setSelectedBranches([]);
        }
    };

    // Handle individual branch selection
    const handleBranchToggle = (branchId: string) => {
        if (selectedBranches.includes(branchId)) {
            setSelectedBranches(selectedBranches.filter(id => id !== branchId));
        } else {
            setSelectedBranches([...selectedBranches, branchId]);
            setAllBranchesSelected(false);
        }
    };

    // Handle close with animation
    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            onClose();
        }, 200); // Match animation duration
    };

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim() || !message.trim()) {
            alert('Please fill in both title and message');
            return;
        }

        setSubmitting(true);

        const targetBranches = allBranchesSelected ? null : selectedBranches;
        const result = await postAnnouncement(title, message, targetBranches);

        if (result.success) {
            if (onAnnouncementAdded && result.announcement) {
                onAnnouncementAdded(result.announcement);
            }
            handleClose();
        } else {
            alert(`Failed to post announcement: ${result.error}`);
        }

        setSubmitting(false);
    };

    return (
        <div
            className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md ${isClosing ? 'animate-fadeOut' : 'animate-fadeIn'}`}
            onClick={handleClose}
        >
            <div
                className={`bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-100 dark:border-[#333] ${isClosing ? 'animate-scaleOut' : 'animate-scaleIn'}`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-[#f15a22] to-[#ff6b35] px-6 py-5 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16 blur-2xl pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full translate-y-12 -translate-x-8 blur-xl pointer-events-none" />

                    <div className="flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-sm">
                                <Megaphone className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold font-heading tracking-wide">New Announcement</h2>
                                <p className="text-white/80 text-xs font-medium">Broadcast message to branches</p>
                            </div>
                        </div>
                        <button
                            onClick={handleClose}
                            className="p-2 hover:bg-white/20 rounded-lg transition-all duration-200 hover:rotate-90 active:scale-95"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6 max-h-[80vh] overflow-y-auto scrollbar-thin">
                    <div className="space-y-5">
                        {/* Title Input */}
                        <div className="group">
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 ml-1 group-focus-within:text-[#f15a22] transition-colors">
                                Announcement Title
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="E.g., Updated Holiday Schedule"
                                className="w-full px-4 py-3.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-[#f15a22] focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:bg-white dark:focus:bg-gray-700 focus:border-transparent outline-none transition-all duration-200 ease-out font-medium"
                                required
                            />
                        </div>

                        {/* Message Textarea */}
                        <div className="group">
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 ml-1 group-focus-within:text-[#f15a22] transition-colors">
                                Message Details
                            </label>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Type your announcement details here..."
                                rows={5}
                                className="w-full px-4 py-3.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-[#f15a22] focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:bg-white dark:focus:bg-gray-700 focus:border-transparent outline-none transition-all duration-200 ease-out font-medium resize-none shadow-sm"
                                required
                            />
                        </div>

                        {/* Branch Selection */}
                        <div>
                            <div className="flex items-center justify-between mb-3 ml-1">
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                                    Target Branches
                                </label>
                                {!allBranchesSelected && selectedBranches.length > 0 && (
                                    <span className="text-xs font-semibold px-2.5 py-1 bg-[#f15a22]/10 text-[#f15a22] rounded-full">
                                        {selectedBranches.length} Selected
                                    </span>
                                )}
                            </div>

                            {/* All Branches Toggle Card */}
                            <label
                                className={`
                                    flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 group
                                    ${allBranchesSelected
                                        ? 'border-[#f15a22] bg-orange-50/50 dark:bg-orange-900/10 shadow-[0_4px_12px_rgba(241,90,34,0.1)]'
                                        : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700/30 hover:border-gray-300 dark:hover:border-gray-500'
                                    }
                                `}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg transition-colors ${allBranchesSelected ? 'bg-[#f15a22] text-white' : 'bg-gray-100 dark:bg-gray-600 text-gray-500'}`}>
                                        <Building2 className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <span className={`font-bold block ${allBranchesSelected ? 'text-[#f15a22]' : 'text-gray-700 dark:text-gray-300'}`}>
                                            All Branches
                                        </span>
                                        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Broadcast to entire network</span>
                                    </div>
                                </div>
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${allBranchesSelected ? 'border-[#f15a22] bg-[#f15a22]' : 'border-gray-300 dark:border-gray-500 bg-transparent'}`}>
                                    {allBranchesSelected && <CheckCircle2 className="w-4 h-4 text-white" />}
                                </div>
                                <input
                                    type="checkbox"
                                    checked={allBranchesSelected}
                                    onChange={handleAllBranchesToggle}
                                    className="hidden"
                                />
                            </label>

                            {/* Individual Branches Grid */}
                            <div className={`
                                mt-3 transition-all duration-500 ease-in-out overflow-hidden
                                ${!allBranchesSelected ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0'}
                            `}>
                                <div className="border border-gray-200 dark:border-gray-600 rounded-xl p-3 bg-gray-50/50 dark:bg-gray-800/50 max-h-60 overflow-y-auto scrollbar-thin">
                                    {loading ? (
                                        <div className="flex flex-col items-center justify-center py-8 text-[#f15a22]">
                                            <Loader2 className="w-8 h-8 animate-spin mb-2" />
                                            <span className="text-sm font-medium">Loading branches...</span>
                                        </div>
                                    ) : branches.length === 0 ? (
                                        <p className="text-gray-500 text-center py-6 text-sm">No branches available</p>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            {branches.map((branch) => {
                                                const isSelected = selectedBranches.includes(branch.id);
                                                return (
                                                    <label
                                                        key={branch.id}
                                                        className={`
                                                            flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200
                                                            border
                                                            ${isSelected
                                                                ? 'bg-white dark:bg-gray-700 border-[#f15a22] shadow-sm text-[#f15a22]'
                                                                : 'bg-transparent border-transparent hover:bg-white dark:hover:bg-gray-700 hover:border-gray-200 dark:hover:border-gray-600'
                                                            }
                                                        `}
                                                    >
                                                        <div className={`
                                                            w-5 h-5 rounded border flex items-center justify-center transition-all duration-200
                                                            ${isSelected ? 'bg-[#f15a22] border-[#f15a22]' : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-500'}
                                                        `}>
                                                            {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                                                        </div>
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={() => handleBranchToggle(branch.id)}
                                                            className="hidden"
                                                        />
                                                        <span className={`text-sm font-medium ${isSelected ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                                                            {branch.name}
                                                        </span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-4 pt-4 border-t border-gray-100 dark:border-gray-700 mt-2">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="flex-1 px-6 py-3.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all font-semibold hover:shadow-sm active:scale-[0.98]"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting || (!allBranchesSelected && selectedBranches.length === 0)}
                            className={`
                                flex-1 px-6 py-3.5 rounded-xl text-white font-bold tracking-wide shadow-lg transition-all duration-300
                                flex items-center justify-center gap-2.5
                                ${submitting || (!allBranchesSelected && selectedBranches.length === 0)
                                    ? 'bg-gray-300 dark:bg-gray-600 opacity-70 cursor-not-allowed shadow-none'
                                    : 'bg-gradient-to-r from-[#f15a22] to-[#ff6b35] hover:shadow-[#f15a22]/25 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]'
                                }
                            `}
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>Posting...</span>
                                </>
                            ) : (
                                <>
                                    <Send className="w-5 h-5" />
                                    <span>Post Now</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
