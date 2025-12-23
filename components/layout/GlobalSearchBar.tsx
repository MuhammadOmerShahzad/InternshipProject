'use client';

import { useState, useEffect, useRef, KeyboardEvent, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/context/UserContext';
import { searchModuleConfig } from '@/lib/utils/searchUtils';

interface SearchBarProps {
    fullWidth?: boolean;
}

export interface SearchResult {
    name: string;
    category: string;
    path: string;
    type: 'module';
}

export default function GlobalSearchBar({
    fullWidth = false,
}: SearchBarProps) {
    const router = useRouter();
    const { user } = useUser();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const searchRef = useRef<HTMLDivElement>(null);
    const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Debounced search effect
    useEffect(() => {
        // Clear previous timer
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        // If query is empty, clear results
        if (!searchQuery || searchQuery.trim().length === 0) {
            setSearchResults([]);
            setIsLoading(false);
            return;
        }


        // Get user's registered modules, or use all modules as fallback
        // Note: The database might have corrupted format like 'Licenses_Trade Licenses'
        // We need to extract just the module slug (the part before the first underscore)
        let userModules: string[];

        if (user?.registeredModules && user.registeredModules.length > 0) {
            // Extract module slugs from potentially corrupted format
            const uniqueModules = new Set<string>();
            user.registeredModules.forEach(item => {
                // If format is 'ModuleName_SubModuleName', extract 'ModuleName' and convert to slug
                const moduleName = item.split('_')[0];
                const slug = moduleName.toLowerCase().replace(/\s+/g, '-');
                uniqueModules.add(slug);
            });
            userModules = Array.from(uniqueModules);
        } else {
            // Fallback to all modules
            userModules = ['licenses', 'approvals', 'vehicles', 'taxation', 'certificates', 'security', 'hse', 'rental-agreements', 'user-management'];
        }

        // Set loading state
        setIsLoading(true);

        // Set new timer
        debounceTimerRef.current = setTimeout(() => {
            try {
                console.log('[GlobalSearch] Searching for:', searchQuery);
                console.log('[GlobalSearch] Using modules:', userModules);

                // Search modules using the utility function
                const moduleResults = searchModuleConfig(searchQuery, userModules);

                console.log('[GlobalSearch] Found results:', moduleResults.length, moduleResults);

                // Convert to SearchResult format
                const results: SearchResult[] = moduleResults.slice(0, 20).map(moduleResult => ({
                    name: moduleResult.name,
                    category: moduleResult.breadcrumb,
                    path: moduleResult.navigationPath,
                    type: 'module' as const,
                }));

                console.log('[GlobalSearch] Converted results:', results);
                setSearchResults(results);
            } catch (error) {
                console.error('Search error:', error);
                setSearchResults([]);
            } finally {
                setIsLoading(false);
            }
        }, 300);

        // Cleanup
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, [searchQuery, user]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setSearchQuery('');
                setSearchResults([]);
            }
        };

        if (searchResults.length > 0) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [searchResults]);

    useEffect(() => {
        setHighlightedIndex(-1);
    }, [searchResults]);

    useEffect(() => {
        if (highlightedIndex >= 0 && itemRefs.current[highlightedIndex]) {
            itemRefs.current[highlightedIndex]?.scrollIntoView({
                block: 'nearest',
                inline: 'nearest',
            });
        }
    }, [highlightedIndex]);

    const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(event.target.value);
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (searchResults.length > 0) {
            if (event.key === 'ArrowDown') {
                event.preventDefault();
                setHighlightedIndex((prev) => (prev < searchResults.length - 1 ? prev + 1 : 0));
            } else if (event.key === 'ArrowUp') {
                event.preventDefault();
                setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : searchResults.length - 1));
            } else if (event.key === 'Enter') {
                if (highlightedIndex >= 0) {
                    handleSelect(searchResults[highlightedIndex].path);
                }
            } else if (event.key === 'Escape') {
                setSearchQuery('');
                setSearchResults([]);
            }
        }
    };

    const handleSelect = (path: string) => {
        router.push(path);
        setSearchQuery('');
        setSearchResults([]);
    };

    const showDropdown = searchResults.length > 0 || (isLoading && searchQuery.length > 0);

    return (
        <div
            ref={searchRef}
            className={`relative ${fullWidth ? 'w-full' : 'w-1/2 max-w-[700px]'} mx-auto`}
        >
            <div className="relative rounded-full bg-[rgba(124,64,46,0.75)] hover:bg-[rgba(124,64,46,0.85)] transition-colors flex flex-col">
                {/* Search Icon */}
                <div className="absolute left-0 h-full flex items-center justify-center px-4 pointer-events-none">
                    {isLoading ? (
                        <svg className="w-5 h-5 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    ) : (
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    )}
                </div>

                {/* Input */}
                <input
                    type="text"
                    placeholder="Search modules..."
                    value={searchQuery}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    className="w-full py-2 pl-12 pr-4 bg-transparent text-white placeholder-white/70 focus:outline-none"
                    aria-label="search"
                />

                {/* Search Results Dropdown */}
                {showDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg max-h-[400px] overflow-y-auto z-50">
                        {isLoading && searchResults.length === 0 ? (
                            <div className="px-4 py-3 text-center text-gray-500 dark:text-gray-400">
                                Searching...
                            </div>
                        ) : searchResults.length === 0 ? (
                            <div className="px-4 py-3 text-center text-gray-500 dark:text-gray-400">
                                No results found
                            </div>
                        ) : (
                            searchResults.map((result, index) => (
                                <div
                                    key={`${result.type}-${index}`}
                                    ref={(el) => {
                                        itemRefs.current[index] = el;
                                    }}
                                    onClick={() => handleSelect(result.path)}
                                    className={`px-4 py-3 cursor-pointer flex items-start gap-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0 ${index === highlightedIndex
                                        ? 'bg-gray-200 dark:bg-gray-700'
                                        : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    {/* Icon */}
                                    <div className="flex-shrink-0 mt-1">
                                        {result.type === 'module' ? (
                                            <svg className="w-5 h-5" style={{ color: '#f15a22' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                            </svg>
                                        ) : (
                                            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium text-gray-900 dark:text-white truncate">
                                            {result.name}
                                        </div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                            {result.category}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
