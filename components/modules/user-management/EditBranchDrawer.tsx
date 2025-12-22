'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { getAllBranches, updateBranch, Branch } from '@/lib/actions/zones';

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
    const [selectedBranchId, setSelectedBranchId] = useState('');
    const [newBranchName, setNewBranchName] = useState('');
    const [error, setError] = useState('');

    // Fetch all branches
    useEffect(() => {
        if (open) {
            fetchBranches();
        }
    }, [open]);

    const fetchBranches = async () => {
        const { branches: fetchedBranches } = await getAllBranches();
        setBranches(fetchedBranches as BranchWithZone[]);
    };

    // Update new branch name when selection changes
    useEffect(() => {
        const selectedBranch = branches.find(b => b.id === selectedBranchId);
        if (selectedBranch) {
            setNewBranchName(selectedBranch.name);
        } else {
            setNewBranchName('');
        }
    }, [selectedBranchId, branches]);

    const handleSave = async () => {
        if (!selectedBranchId || !newBranchName.trim()) {
            setError('Please select a branch and enter a new name');
            return;
        }

        setLoading(true);
        setError('');

        const { error: updateError } = await updateBranch(selectedBranchId, newBranchName);

        setLoading(false);

        if (updateError) {
            setError(updateError);
        } else {
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

    const selectedBranch = branches.find(b => b.id === selectedBranchId);

    if (!open) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
                onClick={handleClose}
            />

            {/* Drawer */}
            <div className="fixed right-0 top-0 bottom-0 w-full md:w-[400px] bg-white z-50 shadow-2xl flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-xl font-bold text-[#f15a22]">Edit Branch</h2>
                    <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-lg">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 p-6 overflow-y-auto">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1 text-[#f15a22]">Select Branch</label>
                            <select
                                value={selectedBranchId}
                                onChange={(e) => setSelectedBranchId(e.target.value)}
                                className="w-full px-3 py-2 border border-[#f15a22] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f15a22]"
                            >
                                <option value="">Select a branch</option>
                                {branches.map((branch) => (
                                    <option key={branch.id} value={branch.id}>
                                        {branch.name} ({branch.zones?.name || 'Unknown Zone'})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {selectedBranch && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-[#f15a22]">Zone</label>
                                    <input
                                        type="text"
                                        value={selectedBranch.zones?.name || 'Unknown'}
                                        disabled
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1 text-[#f15a22]">New Branch Name</label>
                                    <input
                                        type="text"
                                        value={newBranchName}
                                        onChange={(e) => setNewBranchName(e.target.value)}
                                        className="w-full px-3 py-2 border border-[#f15a22] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f15a22]"
                                    />
                                </div>
                            </>
                        )}

                        {error && (
                            <p className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{error}</p>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-2 p-4 border-t">
                    <button
                        onClick={handleClose}
                        className="px-4 py-2 text-[#f15a22] hover:bg-orange-50 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading || !selectedBranchId}
                        className="px-6 py-2 bg-[#f15a22] text-white rounded-lg hover:bg-[#d4501e] disabled:opacity-50"
                    >
                        {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </>
    );
}
