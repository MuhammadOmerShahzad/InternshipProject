'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { SubModule } from '@/lib/config/moduleConfig';

interface User {
    registeredModules?: string[];
}

interface SubModulesGridProps {
    subModules: SubModule[];
    basePath: string; // e.g., '/licenses' or '/licenses/trade-licenses'
    user: User | null;
    moduleName: string; // e.g., 'Licenses' - the parent module name for access checking
}

// Default modules for users without explicit permissions (matches Drawer.tsx)
const DEFAULT_MODULES = [
    'Licenses',
    'Approvals',
    'Vehicles',
    'Health Safety Environment',
    'Taxation',
    'Certificates',
    'Security',
    'Admin Policies and SOPs',
    'Rental Agreements',
    'User Management',
];

export default function SubModulesGrid({ subModules, basePath, user, moduleName }: SubModulesGridProps) {
    const router = useRouter();
    const [expandedTile, setExpandedTile] = useState<number | null>(null);

    // Get user's modules or use defaults
    const registeredModules = user?.registeredModules?.length
        ? user.registeredModules
        : DEFAULT_MODULES;

    // Check if user has access to a submodule
    // Format: "ModuleName_SubModuleName" or just "ModuleName" for full access
    const hasAccess = (subModuleName: string) => {
        return registeredModules.some((module) => {
            // Full module access (e.g., "Licenses" gives access to all Licenses submodules)
            if (module === moduleName) return true;
            // Specific submodule access (e.g., "Licenses_Trade Licenses")
            return module === `${moduleName}_${subModuleName}`;
        });
    };

    // Filter submodules based on user access
    const filteredSubModules = useMemo(() => {
        return subModules.filter((subModule) => hasAccess(subModule.name));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [subModules, registeredModules, moduleName]);

    const handleTileClick = (index: number, subModule: SubModule) => {
        const hasChildren = subModule.children && subModule.children.length > 0;

        if (hasChildren) {
            // Toggle expansion for tiles with children
            setExpandedTile(index === expandedTile ? null : index);
        } else {
            // Navigate directly to file page
            router.push(`${basePath}/${subModule.slug}`);
        }
    };

    const handleChildClick = (e: React.MouseEvent, subModule: SubModule, child: SubModule) => {
        e.stopPropagation();
        router.push(`${basePath}/${subModule.slug}/${child.slug}`);
    };

    if (filteredSubModules.length === 0) {
        return (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                No modules available
            </div>
        );
    }

    return (
        <div className="p-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredSubModules.map((subModule, index) => {
                    const hasChildren = subModule.children && subModule.children.length > 0;
                    const isExpanded = expandedTile === index && hasChildren;

                    return (
                        <div
                            key={subModule.slug}
                            onClick={() => handleTileClick(index, subModule)}
                            className={`
                bg-white dark:bg-[#333] rounded-xl shadow-lg cursor-pointer
                transition-all duration-300 ease-in-out overflow-hidden
                flex flex-col items-center p-4
                ${isExpanded ? 'scale-[1.02] shadow-xl' : 'hover:shadow-xl hover:-translate-y-1'}
              `}
                            style={{
                                maxHeight: isExpanded ? '400px' : '120px',
                            }}
                        >
                            {/* Module Header */}
                            <div className="flex flex-col items-center w-full text-center mb-2">
                                <div className="relative w-10 h-10 mb-2 flex items-center justify-center">
                                    <Image
                                        src="/images/icons/folder.webp"
                                        alt="folder"
                                        width={32}
                                        height={32}
                                        className="object-contain"
                                    />
                                </div>
                                <span
                                    className="text-base font-bold text-black dark:text-white text-center"
                                    style={{ fontFamily: 'var(--font-body)' }}
                                >
                                    {subModule.name}
                                </span>
                                {hasChildren && (
                                    <ChevronDown
                                        className={`w-5 h-5 mt-1 text-gray-500 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                                    />
                                )}
                            </div>

                            {/* Children - always mounted, animated via opacity */}
                            {hasChildren && (
                                <div
                                    className={`
                                        mt-2 flex flex-col items-center w-full
                                        transition-all duration-300 ease-in-out
                                        ${isExpanded ? 'opacity-100 max-h-[250px]' : 'opacity-0 max-h-0 overflow-hidden'}
                                        ${(subModule.children?.length || 0) > 5 ? 'overflow-y-auto' : ''}
                                    `}
                                >
                                    {subModule.children?.map((child) => (
                                        <button
                                            key={child.slug}
                                            onClick={(e) => handleChildClick(e, subModule, child)}
                                            className="
                                                w-full py-2 px-3 text-left text-sm
                                                text-gray-700 dark:text-gray-200
                                                hover:bg-gray-100 dark:hover:bg-gray-700
                                                transition-colors rounded-lg
                                                flex items-center gap-2
                                            "
                                        >
                                            <ChevronRight className="w-4 h-4 text-[#f15a22]" />
                                            {child.name}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
