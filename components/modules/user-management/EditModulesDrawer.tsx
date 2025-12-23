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
                    <h2 className="text-xl font-bold">Edit Assigned Modules</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 p-6 overflow-y-auto">
                    {user && (
                        <p className="text-sm text-gray-600 mb-4">
                            Editing modules for: <span className="font-semibold">{user.name}</span>
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
                                        <span className="font-semibold text-[#f15a22]">{module.name}</span>
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
