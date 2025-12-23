'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { updateUserModules, User } from '@/lib/actions/users';
import { MODULES } from '@/lib/config/moduleConfig';

interface EditModulesDrawerProps {
    open: boolean;
    onClose: () => void;
    user: User | null;
    onModulesUpdated: () => void;
}

export default function EditModulesDrawer({ open, onClose, user, onModulesUpdated }: EditModulesDrawerProps) {
    const [loading, setLoading] = useState(false);
    const [checkedModules, setCheckedModules] = useState<Record<string, boolean>>({});
    const [isVisible, setIsVisible] = useState(false);
    const [shouldAnimate, setShouldAnimate] = useState(false);

    // Initialize checked modules and handle animations
    useEffect(() => {
        if (open) {
            setIsVisible(true);
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

    // Initialize checked modules from user data
    useEffect(() => {
        if (user?.registered_modules) {
            const initial: Record<string, boolean> = {};
            user.registered_modules.forEach((moduleName) => {
                initial[moduleName] = true;
            });
            setCheckedModules(initial);
        } else {
            setCheckedModules({});
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id, user?.registered_modules?.join(',')]);

    // Handle module change
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

    // Get selected modules array
    const getSelectedModules = () => {
        return Object.entries(checkedModules)
            .filter(([, checked]) => checked)
            .map(([key]) => key);
    };

    // Handle save
    const handleSave = async () => {
        if (!user) return;

        setLoading(true);

        const { error } = await updateUserModules(user.id, getSelectedModules());

        setLoading(false);

        if (!error) {
            onModulesUpdated();
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
                    <h2 className="text-xl font-bold dark:text-white">Edit Assigned Modules</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg dark:text-gray-400">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 p-6 overflow-y-auto">
                    {user && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            Editing modules for: <span className="font-semibold dark:text-white">{user.name}</span>
                        </p>
                    )}

                    <div className="space-y-2">
                        {MODULES.map((module) => {
                            const hasSubModules = module.subModules.length > 0;
                            const allChecked = hasSubModules
                                ? module.subModules.every((sub) => checkedModules[`${module.name}_${sub.name}`])
                                : checkedModules[`${module.name}_`];
                            const someChecked = hasSubModules
                                ? module.subModules.some((sub) => checkedModules[`${module.name}_${sub.name}`])
                                : false;

                            return (
                                <div key={module.name} className="border dark:border-gray-700 rounded-lg overflow-hidden">
                                    <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800">
                                        <input
                                            type="checkbox"
                                            checked={!!allChecked}
                                            ref={(el) => {
                                                if (el) el.indeterminate = !allChecked && someChecked;
                                            }}
                                            onChange={(e) => handleSelectAllSubmodules(module.name, e.target.checked)}
                                            className="w-4 h-4 accent-[#f15a22]"
                                        />
                                        <span className="font-semibold text-[#f15a22]">{module.name}</span>
                                    </div>
                                    {hasSubModules && (
                                        <div className="p-3 pl-8 space-y-2 dark:bg-[#1a1a1a]">
                                            {module.subModules.map((sub) => (
                                                <label key={sub.name} className="flex items-center gap-2 dark:text-gray-300">
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
