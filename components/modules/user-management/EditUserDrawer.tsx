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

    //Fetch zones
    useEffect(() => {
        if (open) {
            fetchZones();
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

    if (!open) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
                onClick={onClose}
            />

            {/* Drawer */}
            <div className="fixed right-0 top-0 bottom-0 w-full md:w-[500px] bg-white z-50 shadow-2xl flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-xl font-bold">Edit User Details</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 p-6 overflow-y-auto">
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">First Name</label>
                                <input
                                    type="text"
                                    name="firstName"
                                    value={formData.firstName}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#f15a22]"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Last Name</label>
                                <input
                                    type="text"
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#f15a22]"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Display Name</label>
                            <input
                                type="text"
                                name="displayName"
                                value={formData.displayName}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#f15a22]"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Email</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                disabled
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Role</label>
                            <select
                                name="role"
                                value={formData.role}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#f15a22]"
                            >
                                <option value="">Select a role</option>
                                {ALL_ROLES.map((role) => (
                                    <option key={role} value={role}>{role}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Zone</label>
                            <select
                                name="zoneId"
                                value={formData.zoneId}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#f15a22]"
                            >
                                <option value="">Select a zone</option>
                                {zones.map((zone) => (
                                    <option key={zone.id} value={zone.id}>{zone.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Branch</label>
                            <select
                                name="branchId"
                                value={formData.branchId}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#f15a22]"
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
                <div className="flex items-center justify-end gap-2 p-4 border-t">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-[#f15a22] hover:bg-orange-50 rounded-lg transition-colors"
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
        </>
    );
}
