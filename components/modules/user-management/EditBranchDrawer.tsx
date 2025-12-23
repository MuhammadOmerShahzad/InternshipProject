'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { getAllBranches, updateBranch, deleteBranch, getZones, Branch, Zone } from '@/lib/actions/zones';

interface EditBranchDrawerProps {
    open: boolean;
    onClose: () => void;
    onBranchUpdated: () => void;
}

interface BranchWithZone extends Branch {
    zones?: { id: string; name: string; code: string };
}

export default function EditBranchDrawer({ open, onClose, onBranchUpdated }: EditBranchDrawerProps) {
    const [loading, setLoading] = useState(false);
    const [branches, setBranches] = useState<BranchWithZone[]>([]);
    const [zones, setZones] = useState<Zone[]>([]);
    const [selectedBranchId, setSelectedBranchId] = useState('');
    const [newBranchName, setNewBranchName] = useState('');
    const [newZoneId, setNewZoneId] = useState('');
    const [error, setError] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const [isVisible, setIsVisible] = useState(false);
    const [shouldAnimate, setShouldAnimate] = useState(false);

    const fetchBranches = async () => {
        const { branches: fetchedBranches } = await getAllBranches();
        setBranches(fetchedBranches as BranchWithZone[]);
    };

    const fetchZones = async () => {
        const { zones: fetchedZones } = await getZones();
        setZones(fetchedZones);
    };

    // Handle animations
    useEffect(() => {
        if (open) {
            setIsVisible(true);
            fetchBranches();
            fetchZones();
            // Wait for next frame to allow the component to mount before animating
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    setShouldAnimate(true);
                });
            });
        } else {
            setShouldAnimate(false);
            const timer = setTimeout(() => setIsVisible(false), 300);
            return () => clearTimeout(timer);
        }
    }, [open]);

    // Update new branch name and zone when selection changes
    const selectedBranch = branches.find(b => b.id === selectedBranchId);
    useEffect(() => {
        if (selectedBranch) {
            setNewBranchName(selectedBranch.name);
            setNewZoneId(selectedBranch.zone_id);
        } else {
            setNewBranchName('');
            setNewZoneId('');
        }

    }, [selectedBranch]);

    const handleDelete = async () => {
        console.log('[EditBranchDrawer] handleDelete called');
        console.log('[EditBranchDrawer] selectedBranchId:', selectedBranchId);

        setLoading(true);
        setShowDeleteConfirm(false);
        setError('');

        const result = await deleteBranch(selectedBranchId);
        console.log('[EditBranchDrawer] deleteBranch result:', result);

        setLoading(false);

        if (result.error) {
            console.error('[EditBranchDrawer] Error from deleteBranch:', result.error);
            setError(`Failed to delete branch: ${result.error}`);
        } else {
            console.log('[EditBranchDrawer] Branch deleted successfully!');
            resetForm();
            onBranchUpdated();
            onClose();
        }
    };

    const handleSave = async () => {
        console.log('[EditBranchDrawer] handleSave called');
        console.log('[EditBranchDrawer] selectedBranchId:', selectedBranchId);
        console.log('[EditBranchDrawer] newBranchName:', newBranchName);
        console.log('[EditBranchDrawer] newZoneId:', newZoneId);

        if (!selectedBranchId || !newBranchName.trim() || !newZoneId) {
            const errorMsg = 'Please select a branch, enter a name, and select a zone';
            console.log('[EditBranchDrawer] Validation failed:', errorMsg);
            setError(errorMsg);
            return;
        }

        console.log('[EditBranchDrawer] Validation passed, updating branch');
        setLoading(true);
        setError('');

        // Only pass zoneId if it changed
        const zoneChanged = selectedBranch?.zone_id !== newZoneId;
        const result = await updateBranch(
            selectedBranchId,
            newBranchName,
            zoneChanged ? newZoneId : undefined
        );
        console.log('[EditBranchDrawer] updateBranch result:', result);

        setLoading(false);

        if (result.error) {
            console.error('[EditBranchDrawer] Error from updateBranch:', result.error);
            setError(`Failed to update branch: ${result.error}`);
        } else {
            console.log('[EditBranchDrawer] Branch updated successfully!');
            resetForm();
            onBranchUpdated();
            onClose();
        }
    };

    const resetForm = () => {
        setSelectedBranchId('');
        setNewBranchName('');
        setError('');
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    if (!isVisible) return null;

    return (
        <div className={`fixed inset-0 z-50 flex justify-end items-center pointer-events-none transition-all duration-300 ${shouldAnimate ? 'visible' : 'invisible'}`}>
            {/* Backdrop */}
            <div
                className={`
                    absolute inset-0 bg-black/30 backdrop-blur-sm pointer-events-auto 
                    transition-opacity duration-300 ease-in-out
                    ${shouldAnimate ? 'opacity-100' : 'opacity-0'}
                `}
                onClick={handleClose}
            />

            {/* Floating Drawer Modal */}
            <div className={`
                relative w-full max-w-[40vw] min-w-[500px] h-[96vh] mr-4 
                bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-2xl pointer-events-auto
                flex flex-col overflow-hidden
                transform transition-all duration-300 cubic-bezier(0.4, 0, 0.2, 1)
                ${shouldAnimate ? 'translate-x-0 opacity-100' : 'translate-x-[110%] opacity-0'}
            `}>
                {/* Header */}
                <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 dark:border-gray-700">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Branch</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Update branch details</p>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-all"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-8 py-8 w-full">
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Select Branch</label>
                            <select
                                value={selectedBranchId}
                                onChange={(e) => setSelectedBranchId(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl focus:bg-white dark:focus:bg-gray-700 focus:ring-2 focus:ring-[#f15a22]/20 focus:border-[#f15a22] transition-all outline-none appearance-none dark:text-white"
                            >
                                <option value="">Select a branch</option>
                                {branches.map((branch) => (
                                    <option key={branch.id} value={branch.id}>
                                        {branch.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {selectedBranch && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Zone</label>
                                    <select
                                        value={newZoneId}
                                        onChange={(e) => setNewZoneId(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl focus:bg-white dark:focus:bg-gray-700 focus:ring-2 focus:ring-[#f15a22]/20 focus:border-[#f15a22] transition-all outline-none appearance-none dark:text-white"
                                    >
                                        <option value="">Select Zone</option>
                                        {zones.map((zone) => (
                                            <option key={zone.id} value={zone.id}>
                                                {zone.name} ({zone.code})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Branch Name</label>
                                    <input
                                        type="text"
                                        value={newBranchName}
                                        onChange={(e) => setNewBranchName(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl focus:bg-white dark:focus:bg-gray-700 focus:ring-2 focus:ring-[#f15a22]/20 focus:border-[#f15a22] transition-all outline-none dark:text-white dark:placeholder-gray-500"
                                        placeholder="Enter new name"
                                    />
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xl text-sm font-medium">
                                {error}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-8 py-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex items-center justify-between gap-3">
                    {/* Delete button on the left */}
                    {selectedBranchId && (
                        <button
                            onClick={() => {
                                console.log('[EditBranchDrawer] Delete button clicked');
                                setShowDeleteConfirm(true);
                            }}
                            disabled={loading}
                            className="px-6 py-2.5 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all border border-red-200 dark:border-red-800 disabled:opacity-50"
                        >
                            Delete Branch
                        </button>
                    )}

                    {/* Cancel and Save on the right */}
                    <div className="flex items-center gap-3 ml-auto">
                        <button
                            onClick={handleClose}
                            className="px-6 py-2.5 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={loading || !selectedBranchId}
                            className="px-8 py-2.5 bg-[#f15a22] hover:bg-[#d4501e] text-white font-semibold rounded-xl shadow-lg shadow-orange-500/20 transition-all transform active:scale-95 disabled:opacity-50 disabled:shadow-none disabled:transform-none"
                        >
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-auto">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto" onClick={() => {
                        console.log('[EditBranchDrawer] Delete backdrop clicked, closing dialog');
                        setShowDeleteConfirm(false);
                    }} />
                    <div className="relative bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-xl max-w-md w-full p-8 animate-in zoom-in-95 duration-200 pointer-events-auto">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Confirm Delete Branch</h3>
                        <p className="text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                            Are you sure you want to delete <span className="font-bold text-red-600 dark:text-red-400">{selectedBranch?.name}</span>?
                            <br />
                            <span className="text-sm text-red-600 dark:text-red-400 font-medium">This action cannot be undone.</span>
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    console.log('[EditBranchDrawer] Cancel delete button clicked');
                                    setShowDeleteConfirm(false);
                                }}
                                className="px-5 py-2.5 text-gray-600 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    console.log('[EditBranchDrawer] Confirm delete button clicked!');
                                    handleDelete();
                                }}
                                disabled={loading}
                                className="px-6 py-2.5 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 disabled:opacity-50 shadow-lg shadow-red-500/20"
                            >
                                {loading ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
