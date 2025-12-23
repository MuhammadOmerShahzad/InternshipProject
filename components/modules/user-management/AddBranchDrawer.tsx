'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { getZones, addBranch, Zone } from '@/lib/actions/zones';

interface AddBranchDrawerProps {
    open: boolean;
    onClose: () => void;
    onBranchAdded: () => void;
}

const BRAND_NAME = 'Cheezious';

export default function AddBranchDrawer({ open, onClose, onBranchAdded }: AddBranchDrawerProps) {
    const [loading, setLoading] = useState(false);
    const [zones, setZones] = useState<Zone[]>([]);
    const [selectedZoneId, setSelectedZoneId] = useState('');
    const [branchName, setBranchName] = useState('');
    const [showConfirm, setShowConfirm] = useState(false);
    const [error, setError] = useState('');

    const fetchZones = async () => {
        const { zones: fetchedZones } = await getZones();
        setZones(fetchedZones);
    };

    // Fetch zones
    useEffect(() => {
        if (open) {
            fetchZones();
        }
         
    }, [open]);

    const handleAddBranch = () => {
        if (!selectedZoneId || !branchName.trim()) {
            setError('Please select a zone and enter a branch name');
            return;
        }
        setError('');
        setShowConfirm(true);
    };

    const handleConfirm = async () => {
        setLoading(true);

        const fullBranchName = `${BRAND_NAME} ${branchName}`;
        const { error: addError } = await addBranch(selectedZoneId, fullBranchName);

        setLoading(false);
        setShowConfirm(false);

        if (addError) {
            setError(addError);
        } else {
            resetForm();
            onBranchAdded();
            onClose();
        }
    };

    const resetForm = () => {
        setSelectedZoneId('');
        setBranchName('');
        setError('');
    };

    const handleClose = () => {
        resetForm();
        setShowConfirm(false);
        onClose();
    };

    const selectedZone = zones.find(z => z.id === selectedZoneId);

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
                    <h2 className="text-xl font-bold text-[#f15a22]">Add a Branch</h2>
                    <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-lg">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 p-6 overflow-y-auto">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1 text-[#f15a22]">Zone</label>
                            <select
                                value={selectedZoneId}
                                onChange={(e) => setSelectedZoneId(e.target.value)}
                                className="w-full px-3 py-2 border border-[#f15a22] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f15a22]"
                            >
                                <option value="">Select Zone</option>
                                {zones.map((zone) => (
                                    <option key={zone.id} value={zone.id}>{zone.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1 text-[#f15a22]">Brand Name</label>
                            <input
                                type="text"
                                value={BRAND_NAME}
                                disabled
                                className="w-full px-3 py-2 border border-[#f15a22] rounded-lg bg-gray-100 text-gray-600"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1 text-[#f15a22]">Branch Name</label>
                            <input
                                type="text"
                                value={branchName}
                                onChange={(e) => setBranchName(e.target.value)}
                                placeholder="e.g., F-10, G-9"
                                className="w-full px-3 py-2 border border-[#f15a22] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f15a22]"
                            />
                            {branchName && (
                                <p className="mt-1 text-sm text-gray-500">
                                    Full name: <span className="font-medium">{BRAND_NAME} {branchName}</span>
                                </p>
                            )}
                        </div>

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
                        onClick={handleAddBranch}
                        className="px-6 py-2 bg-[#f15a22] text-white rounded-lg hover:bg-[#d4501e]"
                    >
                        Add Branch
                    </button>
                </div>
            </div>

            {/* Confirmation Dialog */}
            {showConfirm && (
                <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                        <h3 className="text-lg font-bold mb-4">Confirm Add Branch</h3>
                        <p className="text-gray-600 mb-6">
                            You are adding <span className="font-bold">{BRAND_NAME} {branchName}</span> in{' '}
                            <span className="font-bold">{selectedZone?.name}</span>. Are you sure?
                        </p>
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setShowConfirm(false)}
                                className="px-4 py-2 text-[#f15a22] hover:bg-orange-50 rounded-lg"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirm}
                                disabled={loading}
                                className="px-6 py-2 bg-[#f15a22] text-white rounded-lg hover:bg-[#d4501e] disabled:opacity-50"
                            >
                                {loading ? 'Adding...' : 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
