'use client';

import { useState, useEffect } from 'react';
import { X, ChevronRight, Check, Info } from 'lucide-react';
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

    // Fetch zones on mount and auto-generate password
    useEffect(() => {
        if (open) {
            fetchZones();
            // Auto-generate password when drawer opens
            setFormData(prev => ({
                ...prev,
                generatePassword: true,
                generatedPassword: generateRandomPassword()
            }));
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
                let processedValue = value;

                // Remove @ symbol from username field
                if (name === 'username') {
                    processedValue = value.replace(/@/g, '');
                }

                const newData = { ...prev, [name]: processedValue };

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
            email: `${formData.username}@loop.com`,
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

    const [isVisible, setIsVisible] = useState(false);
    const [shouldAnimate, setShouldAnimate] = useState(false);

    useEffect(() => {
        if (open) {
            setIsVisible(true);
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

    if (!isVisible) return null;

    const roles = formData.roleType === 'Headquarter Roles' ? HEADQUARTER_ROLES : BRANCH_ROLES;

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
                relative w-full max-w-[50vw] min-w-[600px] h-[96vh] mr-4 
                bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-2xl pointer-events-auto
                flex flex-col overflow-hidden
                transform transition-all duration-300 cubic-bezier(0.4, 0, 0.2, 1)
                ${shouldAnimate ? 'translate-x-0 opacity-100' : 'translate-x-[110%] opacity-0'}
            `}>
                {/* Header */}
                <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 dark:border-gray-700">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Add New User</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Create a new user profile and assign permissions</p>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-all"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Modern Stepper Sidebar */}
                    <div className="w-1/4 min-w-[200px] bg-gray-50/50 dark:bg-gray-800/50 border-r border-gray-100 dark:border-gray-700 p-6 flex flex-col gap-6">
                        {STEPS.map((step, index) => (
                            <div key={step} className="relative group">
                                {index !== STEPS.length - 1 && (
                                    <div
                                        className={`absolute left-[15px] top-8 w-0.5 h-10 -mb-4 transition-colors duration-300 ${index < activeStep ? 'bg-[#f15a22]/30' : 'bg-gray-200 dark:bg-gray-600'
                                            }`}
                                    />
                                )}
                                <div className="flex items-center gap-4 relative z-10">
                                    <div
                                        className={`
                                            w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 shadow-sm
                                            ${index === activeStep
                                                ? 'bg-[#f15a22] text-white ring-4 ring-[#f15a22]/10 scale-110'
                                                : index < activeStep
                                                    ? 'bg-green-500 text-white'
                                                    : 'bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-400 dark:text-gray-500'
                                            }
                                        `}
                                    >
                                        {index < activeStep ? <Check size={16} strokeWidth={3} /> : index + 1}
                                    </div>
                                    <span className={`text-sm font-medium transition-colors duration-300 ${index === activeStep ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'
                                        }`}>
                                        {step}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-y-auto px-8 py-8 w-full">
                        <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300" key={activeStep}>

                            {/* Step 0: Basics */}
                            {activeStep === 0 && (
                                <div className="space-y-6">
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white border-b dark:border-gray-700 pb-4 mb-6">User Details</h3>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">First Name <span className="text-red-500">*</span></label>
                                            <input
                                                type="text"
                                                name="firstName"
                                                value={formData.firstName}
                                                onChange={handleInputChange}
                                                placeholder="e.g. John"
                                                className={`w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border rounded-xl focus:bg-white dark:focus:bg-gray-700 focus:ring-2 focus:ring-[#f15a22]/20 focus:border-[#f15a22] transition-all outline-none dark:text-white dark:placeholder-gray-500 ${errors.firstName ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : 'border-gray-200 dark:border-gray-600'}`}
                                            />
                                            {errors.firstName && <p className="text-xs text-red-500 font-medium ml-1">{errors.firstName}</p>}
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Last Name <span className="text-red-500">*</span></label>
                                            <input
                                                type="text"
                                                name="lastName"
                                                value={formData.lastName}
                                                onChange={handleInputChange}
                                                placeholder="e.g. Doe"
                                                className={`w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border rounded-xl focus:bg-white dark:focus:bg-gray-700 focus:ring-2 focus:ring-[#f15a22]/20 focus:border-[#f15a22] transition-all outline-none dark:text-white dark:placeholder-gray-500 ${errors.lastName ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : 'border-gray-200 dark:border-gray-600'}`}
                                            />
                                            {errors.lastName && <p className="text-xs text-red-500 font-medium ml-1">{errors.lastName}</p>}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Display Name</label>
                                        <input
                                            type="text"
                                            name="displayName"
                                            value={formData.displayName}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl focus:bg-white dark:focus:bg-gray-700 focus:ring-2 focus:ring-[#f15a22]/20 focus:border-[#f15a22] transition-all outline-none dark:text-white"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Email Address <span className="text-red-500">*</span></label>
                                            <div className="group relative">
                                                <Info size={16} className="text-gray-400 cursor-help" />
                                                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block z-10">
                                                    <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap shadow-lg">
                                                        No need to type &quot;@&quot; - it&apos;s added automatically
                                                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
                                                            <div className="border-4 border-transparent border-t-gray-900"></div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className={`flex items-center bg-gray-50 dark:bg-gray-800 border rounded-xl overflow-hidden transition-all focus-within:bg-white dark:focus-within:bg-gray-700 focus-within:ring-2 focus-within:ring-[#f15a22]/20 focus-within:border-[#f15a22] ${errors.username ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : 'border-gray-200 dark:border-gray-600'}`}>
                                            <input
                                                type="text"
                                                name="username"
                                                value={formData.username}
                                                onChange={handleInputChange}
                                                placeholder="john.doe"
                                                className="flex-1 px-4 py-3 bg-transparent outline-none dark:text-white dark:placeholder-gray-500"
                                            />
                                            <span className="px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 font-medium border-l border-gray-200 dark:border-gray-600 select-none">
                                                @loop.com
                                            </span>
                                        </div>
                                        {errors.username && <p className="text-xs text-red-500 font-medium ml-1">{errors.username}</p>}
                                    </div>
                                </div>
                            )}

                            {/* Step 1: Manage Roles */}
                            {activeStep === 1 && (
                                <div className="space-y-6">
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white border-b dark:border-gray-700 pb-4 mb-6">Role & Location</h3>

                                    <div className="space-y-3">
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Role Category</label>
                                        <div className="grid grid-cols-3 gap-3">
                                            {['Headquarter Roles', 'Branch Roles', 'Custom Role'].map((type) => (
                                                <label
                                                    key={type}
                                                    className={`
                                                        relative flex flex-col items-center justify-center p-4 border rounded-xl cursor-pointer transition-all
                                                        ${formData.roleType === type
                                                            ? 'border-[#f15a22] bg-orange-50 dark:bg-orange-900/20 text-[#f15a22] ring-1 ring-[#f15a22]'
                                                            : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'
                                                        }
                                                    `}
                                                >
                                                    <input
                                                        type="radio"
                                                        name="roleType"
                                                        value={type}
                                                        checked={formData.roleType === type}
                                                        onChange={handleInputChange}
                                                        className="absolute opacity-0 w-full h-full cursor-pointer"
                                                    />
                                                    <span className="text-sm font-semibold text-center dark:text-gray-200">{type}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    {formData.roleType !== 'Custom Role' ? (
                                        <div className="space-y-2">
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Select Role <span className="text-red-500">*</span></label>
                                            <div className="relative">
                                                <select
                                                    name="role"
                                                    value={formData.role}
                                                    onChange={handleInputChange}
                                                    className={`w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border rounded-xl focus:bg-white dark:focus:bg-gray-700 focus:ring-2 focus:ring-[#f15a22]/20 focus:border-[#f15a22] transition-all outline-none appearance-none dark:text-white ${errors.role ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'}`}
                                                >
                                                    <option value="">Select a role...</option>
                                                    {roles.map((role) => (
                                                        <option key={role} value={role}>{role}</option>
                                                    ))}
                                                </select>
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                                                    <ChevronRight size={16} className="rotate-90" />
                                                </div>
                                            </div>
                                            {errors.role && <p className="text-xs text-red-500 font-medium ml-1">{errors.role}</p>}
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Custom Role Name <span className="text-red-500">*</span></label>
                                            <input
                                                type="text"
                                                name="customRole"
                                                value={formData.customRole}
                                                onChange={handleInputChange}
                                                placeholder="e.g. Regional Manager"
                                                className={`w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border rounded-xl focus:bg-white dark:focus:bg-gray-700 focus:ring-2 focus:ring-[#f15a22]/20 focus:border-[#f15a22] transition-all outline-none dark:text-white dark:placeholder-gray-500 ${errors.role ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'}`}
                                            />
                                            {errors.role && <p className="text-xs text-red-500 font-medium ml-1">{errors.role}</p>}
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-6 pt-4 border-t border-dashed dark:border-gray-700">
                                        <div className="space-y-2">
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Zone <span className="text-red-500">*</span></label>
                                            <div className="relative">
                                                <select
                                                    name="zoneId"
                                                    value={formData.zoneId}
                                                    onChange={handleInputChange}
                                                    className={`w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border rounded-xl focus:bg-white dark:focus:bg-gray-700 focus:ring-2 focus:ring-[#f15a22]/20 focus:border-[#f15a22] transition-all outline-none appearance-none dark:text-white ${errors.zoneId ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'}`}
                                                >
                                                    <option value="">Select Area</option>
                                                    {zones.map((zone) => (
                                                        <option key={zone.id} value={zone.id}>{zone.name}</option>
                                                    ))}
                                                </select>
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                                                    <ChevronRight size={16} className="rotate-90" />
                                                </div>
                                            </div>
                                            {errors.zoneId && <p className="text-xs text-red-500 font-medium ml-1">{errors.zoneId}</p>}
                                        </div>

                                        <div className="space-y-2">
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Branch <span className="text-red-500">*</span></label>
                                            <div className="relative">
                                                <select
                                                    name="branchId"
                                                    value={formData.branchId}
                                                    onChange={handleInputChange}
                                                    disabled={!formData.zoneId}
                                                    className={`w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border rounded-xl focus:bg-white dark:focus:bg-gray-700 focus:ring-2 focus:ring-[#f15a22]/20 focus:border-[#f15a22] transition-all outline-none appearance-none disabled:opacity-50 disabled:cursor-not-allowed dark:text-white ${errors.branchId ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'}`}
                                                >
                                                    <option value="">{branches.length === 0 ? 'No branches' : 'Select Branch'}</option>
                                                    {branches.map((branch) => (
                                                        <option key={branch.id} value={branch.id}>{branch.name}</option>
                                                    ))}
                                                </select>
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                                                    <ChevronRight size={16} className="rotate-90" />
                                                </div>
                                            </div>
                                            {errors.branchId && <p className="text-xs text-red-500 font-medium ml-1">{errors.branchId}</p>}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Step 2: Manage Modules */}
                            {activeStep === 2 && (
                                <div className="space-y-6">
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white border-b dark:border-gray-700 pb-4 mb-2">Assign Modules access</h3>

                                    <div className="grid grid-cols-1 gap-4 max-h-[60vh] overflow-y-auto pr-2 pb-20">
                                        {MODULES.map((module) => {
                                            const hasSubModules = module.subModules.length > 0;
                                            const allChecked = hasSubModules
                                                ? module.subModules.every((sub) => checkedModules[`${module.name}_${sub.name}`])
                                                : checkedModules[`${module.name}_`];
                                            const someChecked = hasSubModules
                                                ? module.subModules.some((sub) => checkedModules[`${module.name}_${sub.name}`])
                                                : false;

                                            return (
                                                <div
                                                    key={module.name}
                                                    className={`
                                                        border rounded-xl overflow-hidden transition-all duration-200
                                                        ${allChecked
                                                            ? 'border-[#f15a22] bg-orange-50/30 dark:bg-orange-900/20'
                                                            : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-500'
                                                        }
                                                    `}
                                                >
                                                    <div className="flex items-center gap-3 p-4">
                                                        <input
                                                            type="checkbox"
                                                            checked={!!allChecked}
                                                            ref={(el) => {
                                                                if (el) el.indeterminate = !allChecked && someChecked;
                                                            }}
                                                            onChange={(e) => handleSelectAllSubmodules(module.name, e.target.checked)}
                                                            className="w-5 h-5 accent-[#f15a22] rounded cursor-pointer"
                                                        />
                                                        <span className={`font-bold text-base ${allChecked ? 'text-[#f15a22]' : 'text-gray-700 dark:text-gray-300'}`}>
                                                            {module.name}
                                                        </span>
                                                    </div>

                                                    {hasSubModules && (
                                                        <div className="p-4 pt-0 pl-12 grid grid-cols-2 gap-3">
                                                            {module.subModules.map((sub) => (
                                                                <label
                                                                    key={sub.name}
                                                                    className={`
                                                                        flex items-center gap-2 p-2 rounded-lg text-sm cursor-pointer transition-colors
                                                                        hover:bg-white dark:hover:bg-gray-700
                                                                        ${checkedModules[`${module.name}_${sub.name}`] ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-500 dark:text-gray-400'}
                                                                    `}
                                                                >
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={!!checkedModules[`${module.name}_${sub.name}`]}
                                                                        onChange={(e) => handleModuleChange(`${module.name}_${sub.name}`, e.target.checked)}
                                                                        className="w-4 h-4 accent-[#f15a22] rounded"
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
                                <div className="space-y-6">
                                    <div className="flex items-center gap-4 bg-green-50 dark:bg-green-900/20 p-6 rounded-2xl border border-green-100 dark:border-green-800">
                                        <div className="w-12 h-12 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center text-green-600 dark:text-green-400">
                                            <Check size={24} strokeWidth={3} />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-green-800 dark:text-green-300">Ready to create user</h3>
                                            <p className="text-green-600 dark:text-green-400 text-sm">Review the details below before finalizing.</p>
                                        </div>
                                    </div>

                                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6 space-y-6">
                                        <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
                                            <div className="space-y-1">
                                                <span className="text-gray-500 dark:text-gray-400 text-xs uppercase font-semibold tracking-wider">Full Name</span>
                                                <p className="font-medium text-gray-900 dark:text-white text-base">{formData.displayName}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-gray-500 dark:text-gray-400 text-xs uppercase font-semibold tracking-wider">Email Address</span>
                                                <p className="font-medium text-gray-900 dark:text-white text-base">{formData.username}@loop.com</p>
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-gray-500 dark:text-gray-400 text-xs uppercase font-semibold tracking-wider">Role</span>
                                                <p className="font-medium text-gray-900 dark:text-white text-base">{formData.roleType === 'Custom Role' ? formData.customRole : formData.role}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-gray-500 dark:text-gray-400 text-xs uppercase font-semibold tracking-wider">Location</span>
                                                <p className="font-medium text-gray-900 dark:text-white text-base">
                                                    {branches.find(b => b.id === formData.branchId)?.name}, {zones.find(z => z.id === formData.zoneId)?.name}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="pt-4 border-t border-dashed dark:border-gray-600">
                                            <span className="text-gray-500 dark:text-gray-400 text-xs uppercase font-semibold tracking-wider block mb-2">Password</span>
                                            <div className="bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-lg inline-block font-mono text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                                                {formData.generatedPassword}
                                            </div>
                                        </div>

                                        <div className="pt-4 border-t border-dashed dark:border-gray-600">
                                            <span className="text-gray-500 dark:text-gray-400 text-xs uppercase font-semibold tracking-wider block mb-3">Module Access</span>
                                            {(() => {
                                                const grouped = getFormattedModules().reduce((acc, mod) => {
                                                    const [parent, child] = mod.split('_');
                                                    if (!acc[parent]) acc[parent] = [];
                                                    if (child) acc[parent].push(child);
                                                    return acc;
                                                }, {} as Record<string, string[]>);

                                                if (Object.keys(grouped).length === 0) {
                                                    return <span className="text-gray-400 dark:text-gray-500 italic text-sm">No modules assigned</span>;
                                                }

                                                return (
                                                    <div className="space-y-4">
                                                        {Object.entries(grouped).map(([parent, children]) => (
                                                            <div key={parent} className="flex flex-col gap-2">
                                                                <span className="text-xs font-bold text-gray-800 dark:text-gray-300 uppercase tracking-wide flex items-center gap-2">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-[#f15a22]"></div>
                                                                    {parent}
                                                                </span>
                                                                {children.length > 0 ? (
                                                                    <div className="flex flex-wrap gap-2 pl-3.5">
                                                                        {children.map(child => (
                                                                            <span key={child} className="px-2.5 py-1 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md text-xs font-medium border border-gray-200 dark:border-gray-600">
                                                                                {child}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                ) : (
                                                                    <div className="pl-3.5">
                                                                        <span className="px-2.5 py-1 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-md text-xs font-semibold border border-green-100 dark:border-green-800">
                                                                            Full Access
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    </div>

                                    {errors.submit && (
                                        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xl text-sm font-medium flex items-center gap-2">
                                            <X size={16} />
                                            {errors.submit}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex items-center justify-between">
                    <button
                        onClick={handleBack}
                        disabled={activeStep === 0}
                        className="px-6 py-2.5 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 hover:shadow-sm hover:text-gray-900 dark:hover:text-white transition-all font-medium disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:shadow-none"
                    >
                        Back
                    </button>

                    {activeStep < STEPS.length - 1 ? (
                        <button
                            onClick={handleNext}
                            className="flex items-center gap-2 px-8 py-2.5 bg-[#f15a22] text-white rounded-xl hover:bg-[#d14e1f] transition-all shadow-lg shadow-orange-500/20 font-medium active:scale-95"
                        >
                            Next Step
                            <ChevronRight size={18} />
                        </button>
                    ) : (
                        <button
                            onClick={handleFinish}
                            disabled={loading}
                            className="flex items-center gap-2 px-8 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all shadow-lg shadow-green-500/20 font-medium active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Creating User...
                                </>
                            ) : (
                                <>
                                    <Check size={18} />
                                    Create User
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
