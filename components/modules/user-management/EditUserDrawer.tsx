'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { updateUser, User, UpdateUserInput } from '@/lib/actions/users';
import { getZones, getBranchesByZone, Zone, Branch } from '@/lib/actions/zones';

interface EditUserDrawerProps {
    open: boolean;
    onClose: () => void;
    user: User | null;
    onUserUpdated: () => void;
}

const ALL_ROLES = [
    'IT', 'Admin', 'HR', 'Operations', 'Training and Development',
    'Maintenance', 'Warehouse - Humik', 'Warehouse - Construction',
    'Purchase', 'Surveillance', 'Finance', 'Restaurant Manager'
];

export default function EditUserDrawer({ open, onClose, user, onUserUpdated }: EditUserDrawerProps) {
    const [loading, setLoading] = useState(false);
    const [zones, setZones] = useState<Zone[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [isVisible, setIsVisible] = useState(false);
    const [shouldAnimate, setShouldAnimate] = useState(false);

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        displayName: '',
        email: '',
        role: '',
        zoneId: '',
        branchId: '',
    });

    // Initialize form data when user changes
    useEffect(() => {
        if (user) {
            const [firstName, lastName] = (user.name || '').split(' ');
            setFormData({
                firstName: user.first_name || firstName || '',
                lastName: user.last_name || lastName || '',
                displayName: user.name || '',
                email: user.email || '',
                role: user.role || '',
                zoneId: user.zone_id || '',
                branchId: user.branch_id || '',
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id]);

    const fetchZones = async () => {
        const { zones: fetchedZones } = await getZones();
        setZones(fetchedZones);
    };

    const fetchBranches = async (zoneId: string) => {
        const { branches: fetchedBranches } = await getBranchesByZone(zoneId);
        setBranches(fetchedBranches);
    };

    // Handle animations and fetch zones
    useEffect(() => {
        if (open) {
            setIsVisible(true);
            fetchZones();
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

    // Fetch branches when zone changes
    useEffect(() => {
        if (formData.zoneId) {
            fetchBranches(formData.zoneId);
        } else {
            setBranches([]);
        }
    }, [formData.zoneId]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        setFormData((prev) => {
            const newData = { ...prev, [name]: value };

            // Auto-update display name
            if (name === 'firstName' || name === 'lastName') {
                newData.displayName = `${newData.firstName} ${newData.lastName}`.trim();
            }

            // Reset branch when zone changes
            if (name === 'zoneId') {
                newData.branchId = '';
            }

            return newData;
        });
    };

    const handleSave = async () => {
        if (!user) return;

        setLoading(true);

        const input: UpdateUserInput = {
            firstName: formData.firstName,
            lastName: formData.lastName,
            name: formData.displayName,
            role: formData.role,
            zoneId: formData.zoneId,
            branchId: formData.branchId,
        };

        const { error } = await updateUser(user.id, input);

        setLoading(false);

        if (!error) {
            onUserUpdated();
            onClose();
        }
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
                onClick={onClose}
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
                <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
                    <h2 className="text-xl font-bold dark:text-white">Edit User Details</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg dark:text-gray-400">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 p-6 overflow-y-auto">
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1 dark:text-gray-300">First Name</label>
                                <input
                                    type="text"
                                    name="firstName"
                                    value={formData.firstName}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-[#f15a22] bg-white dark:bg-gray-800 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Last Name</label>
                                <input
                                    type="text"
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-[#f15a22] bg-white dark:bg-gray-800 dark:text-white"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Display Name</label>
                            <input
                                type="text"
                                name="displayName"
                                value={formData.displayName}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-[#f15a22] bg-white dark:bg-gray-800 dark:text-white"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Email</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                disabled
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Role</label>
                            <select
                                name="role"
                                value={formData.role}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-[#f15a22] bg-white dark:bg-gray-800 dark:text-white"
                            >
                                <option value="">Select a role</option>
                                {ALL_ROLES.map((role) => (
                                    <option key={role} value={role}>{role}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Zone</label>
                            <select
                                name="zoneId"
                                value={formData.zoneId}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-[#f15a22] bg-white dark:bg-gray-800 dark:text-white"
                            >
                                <option value="">Select a zone</option>
                                {zones.map((zone) => (
                                    <option key={zone.id} value={zone.id}>{zone.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Branch</label>
                            <select
                                name="branchId"
                                value={formData.branchId}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-[#f15a22] bg-white dark:bg-gray-800 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-700"
                                disabled={!formData.zoneId}
                            >
                                <option value="">{branches.length === 0 ? 'No branches available' : 'Select a branch'}</option>
                                {branches.map((branch) => (
                                    <option key={branch.id} value={branch.id}>{branch.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-2 p-4 border-t dark:border-gray-700 dark:bg-gray-800/50">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-[#f15a22] hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="px-6 py-2 bg-[#f15a22] text-white rounded-lg hover:bg-[#d4501e] disabled:opacity-50"
                    >
                        {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
}
