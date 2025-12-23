'use client';

import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { createUser, CreateUserInput } from '@/lib/actions/users';
import { getZones, getBranchesByZone, Zone, Branch } from '@/lib/actions/zones';
import { MODULES } from '@/lib/config/moduleConfig';

interface AddUserDrawerProps {
    open: boolean;
    onClose: () => void;
    onUserCreated: () => void;
}

const STEPS = ['Basics', 'Manage Roles', 'Manage Modules', 'Finish'];

const HEADQUARTER_ROLES = [
    'IT', 'Admin', 'HR', 'Operations', 'Training and Development',
    'Maintenance', 'Warehouse - Humik', 'Warehouse - Construction',
    'Purchase', 'Surveillance', 'Finance'
];

const BRANCH_ROLES = ['Restaurant Manager'];

export default function AddUserDrawer({ open, onClose, onUserCreated }: AddUserDrawerProps) {
    const [activeStep, setActiveStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [zones, setZones] = useState<Zone[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);

    // Form state
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        displayName: '',
        username: '',
        generatePassword: false,
        generatedPassword: '',
        roleType: 'Headquarter Roles',
        role: '',
        customRole: '',
        zoneId: '',
        branchId: '',
    });

    const [checkedModules, setCheckedModules] = useState<Record<string, boolean>>({});
    const [errors, setErrors] = useState<Record<string, string>>({});

    const fetchZones = async () => {
        const { zones: fetchedZones } = await getZones();
        setZones(fetchedZones);
    };

    const fetchBranches = async (zoneId: string) => {
        const { branches: fetchedBranches } = await getBranchesByZone(zoneId);
        setBranches(fetchedBranches);
    };

    // Fetch zones on mount
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

    // Generate random password
    const generateRandomPassword = () => {
        const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let password = '';
        for (let i = 0; i < 8; i++) {
            password += charset.charAt(Math.floor(Math.random() * charset.length));
        }
        return password;
    };

    // Handle input changes
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;

        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            if (name === 'generatePassword') {
                setFormData((prev) => ({
                    ...prev,
                    generatePassword: checked,
                    generatedPassword: checked ? generateRandomPassword() : '',
                }));
            }
        } else {
            setFormData((prev) => {
                const newData = { ...prev, [name]: value };

                // Auto-update display name
                if (name === 'firstName' || name === 'lastName') {
                    newData.displayName = `${newData.firstName} ${newData.lastName}`.trim();
                }

                // Reset role when role type changes
                if (name === 'roleType') {
                    newData.role = '';
                    newData.customRole = '';
                }

                // Reset branch when zone changes
                if (name === 'zoneId') {
                    newData.branchId = '';
                }

                return newData;
            });

            // Clear error
            if (errors[name]) {
                setErrors((prev) => ({ ...prev, [name]: '' }));
            }
        }
    };

    // Handle module selection
    const handleModuleChange = (moduleKey: string, checked: boolean) => {
        setCheckedModules((prev) => ({
            ...prev,
            [moduleKey]: checked,
        }));
    };

    // Handle select all submodules
    const handleSelectAllSubmodules = (moduleName: string, checked: boolean) => {
        const moduleItem = MODULES.find((m) => m.name === moduleName);
        if (!moduleItem) return;

        const updates: Record<string, boolean> = {};
        if (moduleItem.subModules.length > 0) {
            moduleItem.subModules.forEach((sub) => {
                updates[`${moduleName}_${sub.name}`] = checked;
            });
        } else {
            updates[`${moduleName}_`] = checked;
        }

        setCheckedModules((prev) => ({ ...prev, ...updates }));
    };

    // Validate form
    const validateStep = (step: number) => {
        const newErrors: Record<string, string> = {};

        if (step === 0) {
            if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
            if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
            if (!formData.username.trim()) newErrors.username = 'Username/Email is required';
            if (!formData.generatePassword) newErrors.generatePassword = 'You must generate a password';
        }

        if (step === 1) {
            const role = formData.roleType === 'Custom Role' ? formData.customRole : formData.role;
            if (!role.trim()) newErrors.role = 'Role is required';
            if (!formData.zoneId) newErrors.zoneId = 'Zone is required';
            if (!formData.branchId) newErrors.branchId = 'Branch is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Navigation
    const handleNext = () => {
        if (validateStep(activeStep)) {
            setActiveStep((prev) => prev + 1);
        }
    };

    const handleBack = () => {
        setActiveStep((prev) => prev - 1);
    };

    // Get formatted modules
    const getFormattedModules = () => {
        return Object.entries(checkedModules)
            .filter(([, checked]) => checked)
            .map(([key]) => key);
    };

    // Handle finish
    const handleFinish = async () => {
        setLoading(true);

        const input: CreateUserInput = {
            firstName: formData.firstName,
            lastName: formData.lastName,
            displayName: formData.displayName,
            email: formData.username,
            password: formData.generatedPassword,
            role: formData.roleType === 'Custom Role' ? formData.customRole : formData.role,
            zoneId: formData.zoneId,
            branchId: formData.branchId,
            registeredModules: getFormattedModules(),
        };

        const { user, error } = await createUser(input);

        setLoading(false);

        if (error) {
            setErrors({ submit: error });
        } else if (user) {
            resetForm();
            onUserCreated();
            onClose();
        }
    };

    // Reset form
    const resetForm = () => {
        setActiveStep(0);
        setFormData({
            firstName: '',
            lastName: '',
            displayName: '',
            username: '',
            generatePassword: false,
            generatedPassword: '',
            roleType: 'Headquarter Roles',
            role: '',
            customRole: '',
            zoneId: '',
            branchId: '',
        });
        setCheckedModules({});
        setErrors({});
    };

    // Handle close
    const handleClose = () => {
        resetForm();
        onClose();
    };

    if (!open) return null;

    const roles = formData.roleType === 'Headquarter Roles' ? HEADQUARTER_ROLES : BRANCH_ROLES;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
                onClick={handleClose}
            />

            {/* Drawer */}
            <div className="fixed right-0 top-0 bottom-0 w-full md:w-[600px] bg-white z-50 shadow-2xl flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-xl font-bold">Add New User</h2>
                    <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-lg">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Stepper Sidebar */}
                    <div className="hidden md:block w-1/4 bg-gray-50 p-4 border-r">
                        {STEPS.map((step, index) => (
                            <div key={step} className="flex items-center gap-2 mb-4">
                                <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${index <= activeStep
                                        ? 'bg-[#f15a22] text-white'
                                        : 'bg-gray-300 text-gray-600'
                                        }`}
                                >
                                    {index < activeStep ? <Check size={16} /> : index + 1}
                                </div>
                                <span className={index <= activeStep ? 'font-semibold' : 'text-gray-500'}>
                                    {step}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-6 overflow-y-auto">
                        {/* Step 0: Basics */}
                        {activeStep === 0 && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold mb-4">Set up the basics</h3>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">First Name *</label>
                                        <input
                                            type="text"
                                            name="firstName"
                                            value={formData.firstName}
                                            onChange={handleInputChange}
                                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-[#f15a22] ${errors.firstName ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                        />
                                        {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Last Name *</label>
                                        <input
                                            type="text"
                                            name="lastName"
                                            value={formData.lastName}
                                            onChange={handleInputChange}
                                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-[#f15a22] ${errors.lastName ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                        />
                                        {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>}
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
                                    <label className="block text-sm font-medium mb-1">Username (Email) *</label>
                                    <input
                                        type="email"
                                        name="username"
                                        value={formData.username}
                                        onChange={handleInputChange}
                                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-[#f15a22] ${errors.username ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                    />
                                    {errors.username && <p className="text-red-500 text-sm mt-1">{errors.username}</p>}
                                </div>

                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        name="generatePassword"
                                        checked={formData.generatePassword}
                                        onChange={handleInputChange}
                                        className="w-4 h-4 accent-[#f15a22]"
                                    />
                                    <label className="text-sm">Generate New Password</label>
                                </div>
                                {formData.generatedPassword && (
                                    <p className="text-sm text-gray-600">Generated: <span className="font-mono font-bold">{formData.generatedPassword}</span></p>
                                )}
                                {errors.generatePassword && <p className="text-red-500 text-sm">{errors.generatePassword}</p>}
                            </div>
                        )}

                        {/* Step 1: Manage Roles */}
                        {activeStep === 1 && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold mb-4">Manage Roles</h3>

                                <div className="space-y-2">
                                    <label className="block text-sm font-medium">Role Type</label>
                                    <div className="space-y-2">
                                        {['Headquarter Roles', 'Branch Roles', 'Custom Role'].map((type) => (
                                            <label key={type} className="flex items-center gap-2">
                                                <input
                                                    type="radio"
                                                    name="roleType"
                                                    value={type}
                                                    checked={formData.roleType === type}
                                                    onChange={handleInputChange}
                                                    className="accent-[#f15a22]"
                                                />
                                                {type}
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {formData.roleType !== 'Custom Role' ? (
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Select Role *</label>
                                        <select
                                            name="role"
                                            value={formData.role}
                                            onChange={handleInputChange}
                                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-[#f15a22] ${errors.role ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                        >
                                            <option value="">Select a role</option>
                                            {roles.map((role) => (
                                                <option key={role} value={role}>{role}</option>
                                            ))}
                                        </select>
                                        {errors.role && <p className="text-red-500 text-sm mt-1">{errors.role}</p>}
                                    </div>
                                ) : (
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Custom Role *</label>
                                        <input
                                            type="text"
                                            name="customRole"
                                            value={formData.customRole}
                                            onChange={handleInputChange}
                                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-[#f15a22] ${errors.role ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                        />
                                        {errors.role && <p className="text-red-500 text-sm mt-1">{errors.role}</p>}
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium mb-1">Zone *</label>
                                    <select
                                        name="zoneId"
                                        value={formData.zoneId}
                                        onChange={handleInputChange}
                                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-[#f15a22] ${errors.zoneId ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                    >
                                        <option value="">Select a zone</option>
                                        {zones.map((zone) => (
                                            <option key={zone.id} value={zone.id}>{zone.name}</option>
                                        ))}
                                    </select>
                                    {errors.zoneId && <p className="text-red-500 text-sm mt-1">{errors.zoneId}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">Branch *</label>
                                    <select
                                        name="branchId"
                                        value={formData.branchId}
                                        onChange={handleInputChange}
                                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-[#f15a22] ${errors.branchId ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        disabled={!formData.zoneId}
                                    >
                                        <option value="">{branches.length === 0 ? 'No branches available' : 'Select a branch'}</option>
                                        {branches.map((branch) => (
                                            <option key={branch.id} value={branch.id}>{branch.name}</option>
                                        ))}
                                    </select>
                                    {errors.branchId && <p className="text-red-500 text-sm mt-1">{errors.branchId}</p>}
                                </div>
                            </div>
                        )}

                        {/* Step 2: Manage Modules */}
                        {activeStep === 2 && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold mb-4">Manage Modules</h3>

                                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                                    {MODULES.map((module) => {
                                        const hasSubModules = module.subModules.length > 0;
                                        const allChecked = hasSubModules
                                            ? module.subModules.every((sub) => checkedModules[`${module.name}_${sub.name}`])
                                            : checkedModules[`${module.name}_`];
                                        const someChecked = hasSubModules
                                            ? module.subModules.some((sub) => checkedModules[`${module.name}_${sub.name}`])
                                            : false;

                                        return (
                                            <div key={module.name} className="border rounded-lg overflow-hidden">
                                                <div className="flex items-center gap-2 p-3 bg-gray-50">
                                                    <input
                                                        type="checkbox"
                                                        checked={allChecked}
                                                        ref={(el) => {
                                                            if (el) el.indeterminate = !allChecked && someChecked;
                                                        }}
                                                        onChange={(e) => handleSelectAllSubmodules(module.name, e.target.checked)}
                                                        className="w-4 h-4 accent-[#f15a22]"
                                                    />
                                                    <span className="font-semibold">{module.name}</span>
                                                </div>
                                                {hasSubModules && (
                                                    <div className="p-3 pl-8 space-y-2">
                                                        {module.subModules.map((sub) => (
                                                            <label key={sub.name} className="flex items-center gap-2">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={!!checkedModules[`${module.name}_${sub.name}`]}
                                                                    onChange={(e) => handleModuleChange(`${module.name}_${sub.name}`, e.target.checked)}
                                                                    className="w-4 h-4 accent-[#f15a22]"
                                                                />
                                                                {sub.name}
                                                            </label>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Step 3: Finish */}
                        {activeStep === 3 && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold mb-4">Review Details</h3>

                                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                                    <div className="grid grid-cols-2 gap-2">
                                        <div><span className="font-medium">Name:</span> {formData.displayName}</div>
                                        <div><span className="font-medium">Email:</span> {formData.username}</div>
                                        <div><span className="font-medium">Role:</span> {formData.roleType === 'Custom Role' ? formData.customRole : formData.role}</div>
                                        <div><span className="font-medium">Zone:</span> {zones.find(z => z.id === formData.zoneId)?.name || 'N/A'}</div>
                                        <div><span className="font-medium">Branch:</span> {branches.find(b => b.id === formData.branchId)?.name || 'N/A'}</div>
                                        <div><span className="font-medium">Password:</span> <span className="font-mono">{formData.generatedPassword}</span></div>
                                    </div>

                                    <div>
                                        <span className="font-medium">Assigned Modules:</span>
                                        <ul className="list-disc list-inside mt-1 text-sm">
                                            {getFormattedModules().map((mod) => (
                                                <li key={mod}>{mod.replace('_', ' → ')}</li>
                                            ))}
                                            {getFormattedModules().length === 0 && <li className="text-gray-500">No modules assigned</li>}
                                        </ul>
                                    </div>
                                </div>

                                {errors.submit && (
                                    <p className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{errors.submit}</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-4 border-t">
                    <button
                        onClick={handleBack}
                        disabled={activeStep === 0}
                        className="flex items-center gap-1 px-4 py-2 text-gray-600 disabled:opacity-50"
                    >
                        <ChevronLeft size={18} />
                        Back
                    </button>

                    {activeStep < STEPS.length - 1 ? (
                        <button
                            onClick={handleNext}
                            className="flex items-center gap-1 px-6 py-2 bg-[#f15a22] text-white rounded-lg hover:bg-[#d4501e]"
                        >
                            Next
                            <ChevronRight size={18} />
                        </button>
                    ) : (
                        <button
                            onClick={handleFinish}
                            disabled={loading}
                            className="flex items-center gap-1 px-6 py-2 bg-[#f15a22] text-white rounded-lg hover:bg-[#d4501e] disabled:opacity-50"
                        >
                            {loading ? 'Creating...' : 'Create User'}
                        </button>
                    )}
                </div>
            </div>
        </>
    );
}
