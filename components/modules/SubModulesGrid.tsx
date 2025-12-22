'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, ChevronRight, Folder, FileText } from 'lucide-react';
import { SubModule } from '@/lib/config/moduleConfig';

interface User {
    registeredModules?: string[];
}

interface SubModulesGridProps {
    subModules: SubModule[];
    basePath: string; // e.g., '/licenses' or '/licenses/trade-licenses'
    user: User | null;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function SubModulesGrid({ subModules, basePath, user }: SubModulesGridProps) {
    const router = useRouter();
    const [expandedTile, setExpandedTile] = useState<number | null>(null);

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

    if (subModules.length === 0) {
        return (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                No modules available
            </div>
        );
    }

    return (
        <div className="p-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {subModules.map((subModule, index) => {
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
                                    {hasChildren ? (
                                        <Folder className="w-8 h-8 text-[#f15a22]" />
                                    ) : (
                                        <FileText className="w-8 h-8 text-[#f15a22]" />
                                    )}
                                </div>
                                <span
                                    className="text-sm font-bold text-black dark:text-white text-center"
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

                            {/* Children */}
                            {isExpanded && hasChildren && (
                                <div
                                    className={`
                    mt-2 flex flex-col items-center w-full
                    ${(subModule.children?.length || 0) > 5 ? 'max-h-[200px] overflow-y-auto' : ''}
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
