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

    const [isVisible, setIsVisible] = useState(false);
    const [shouldAnimate, setShouldAnimate] = useState(false);

    const fetchZones = async () => {
        const { zones: fetchedZones } = await getZones();
        setZones(fetchedZones);
    };

    // Handle animations
    useEffect(() => {
        if (open) {
            setIsVisible(true);
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

    const handleAddBranch = () => {
        console.log('[AddBranchDrawer] handleAddBranch clicked!');
        console.log('[AddBranchDrawer] selectedZoneId:', selectedZoneId);
        console.log('[AddBranchDrawer] branchName:', branchName);

        if (!selectedZoneId || !branchName.trim()) {
            const errorMsg = 'Please select a zone and enter a branch name';
            console.log('[AddBranchDrawer] Validation failed:', errorMsg);
            setError(errorMsg);
            return;
        }

        console.log('[AddBranchDrawer] Validation passed, showing confirmation dialog');
        setError('');
        setShowConfirm(true);
    };

    const handleConfirm = async () => {
        console.log('[AddBranchDrawer] handleConfirm called');
        console.log('[AddBranchDrawer] selectedZoneId:', selectedZoneId);
        console.log('[AddBranchDrawer] branchName:', branchName);
        console.log('[AddBranchDrawer] BRAND_NAME:', BRAND_NAME);

        setLoading(true);
        setError(''); // Clear previous errors

        const fullBranchName = `${BRAND_NAME} ${branchName}`;
        console.log('[AddBranchDrawer] fullBranchName:', fullBranchName);

        const result = await addBranch(selectedZoneId, fullBranchName);
        console.log('[AddBranchDrawer] addBranch result:', result);

        setLoading(false);
        setShowConfirm(false);

        if (result.error) {
            console.error('[AddBranchDrawer] Error from addBranch:', result.error);
            setError(`Failed to add branch: ${result.error}`);
        } else {
            console.log('[AddBranchDrawer] Branch added successfully!');
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
        // Triggers the exit animation via parent's open prop change if controlled there,
        // but here we just call onClose. The parent needs to set open=false.
        onClose();
    };

    const selectedZone = zones.find(z => z.id === selectedZoneId);

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
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Add New Branch</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Create a new branch location</p>
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
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Zone</label>
                            <select
                                value={selectedZoneId}
                                onChange={(e) => setSelectedZoneId(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl focus:bg-white dark:focus:bg-gray-700 focus:ring-2 focus:ring-[#f15a22]/20 focus:border-[#f15a22] transition-all outline-none appearance-none dark:text-white"
                            >
                                <option value="">Select Zone</option>
                                {zones.map((zone) => (
                                    <option key={zone.id} value={zone.id}>{zone.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Brand Name</label>
                            <input
                                type="text"
                                value={BRAND_NAME}
                                disabled
                                className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-500 dark:text-gray-400"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Branch Name</label>
                            <input
                                type="text"
                                value={branchName}
                                onChange={(e) => setBranchName(e.target.value)}
                                placeholder="e.g., F-10, G-9"
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl focus:bg-white dark:focus:bg-gray-700 focus:ring-2 focus:ring-[#f15a22]/20 focus:border-[#f15a22] transition-all outline-none dark:text-white dark:placeholder-gray-500"
                            />
                            {branchName && (
                                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#f15a22]"></span>
                                    <span>Full name: <span className="font-medium text-gray-900 dark:text-white">{BRAND_NAME} {branchName}</span></span>
                                </p>
                            )}
                        </div>

                        {error && (
                            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xl text-sm font-medium">
                                {error}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-8 py-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex items-center justify-end gap-3">
                    <button
                        onClick={handleClose}
                        className="px-6 py-2.5 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleAddBranch}
                        className="px-8 py-2.5 bg-[#f15a22] hover:bg-[#d4501e] text-white font-semibold rounded-xl shadow-lg shadow-orange-500/20 transition-all transform active:scale-95"
                    >
                        Add Branch
                    </button>
                </div>
            </div>

            {/* Confirmation Dialog - Styled to match */}
            {showConfirm && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-auto">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto" onClick={() => {
                        console.log('[AddBranchDrawer] Backdrop clicked, closing dialog');
                        setShowConfirm(false);
                    }} />
                    <div className="relative bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-xl max-w-md w-full p-8 animate-in zoom-in-95 duration-200 pointer-events-auto">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Confirm Add Branch</h3>
                        <p className="text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                            You are adding <span className="font-bold text-gray-900 dark:text-white">{BRAND_NAME} {branchName}</span> in{' '}
                            <span className="font-bold text-[#f15a22]">{selectedZone?.name}</span>.
                            <br />Are you sure you want to proceed?
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    console.log('[AddBranchDrawer] Cancel button clicked in confirmation dialog');
                                    setShowConfirm(false);
                                }}
                                className="px-5 py-2.5 text-gray-600 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    console.log('[AddBranchDrawer] Confirm button clicked!');
                                    handleConfirm();
                                }}
                                disabled={loading}
                                className="px-6 py-2.5 bg-[#f15a22] text-white font-semibold rounded-xl hover:bg-[#d4501e] disabled:opacity-50 shadow-lg shadow-orange-500/20"
                            >
                                {loading ? 'Adding...' : 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
