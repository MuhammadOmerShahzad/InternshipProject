'use client';

import { useState, useEffect, useRef, KeyboardEvent, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';

interface SearchResult {
    name: string;
    category: string;
    path: string;
}

interface SearchBarProps {
    searchQuery?: string;
    onSearch?: (query: string) => void;
    searchResults?: SearchResult[];
    fullWidth?: boolean;
}

export default function GlobalSearchBar({
    searchQuery = '',
    onSearch = () => { },
    searchResults = [],
    fullWidth = false,
}: SearchBarProps) {
    const router = useRouter();
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const searchRef = useRef<HTMLDivElement>(null);
    const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                onSearch('');
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
    }, [searchResults, onSearch]);

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
        onSearch(event.target.value);
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
            }
        }
    };

    const handleSelect = (path: string) => {
        router.push(path);
        onSearch('');
    };

    return (
        <div
            ref={searchRef}
            className={`relative ${fullWidth ? 'w-full' : 'w-1/2 max-w-[700px]'} mx-auto`}
        >
            <div className="relative rounded-full bg-[rgba(124,64,46,0.75)] hover:bg-[rgba(124,64,46,0.85)] transition-colors flex flex-col">
                {/* Search Icon */}
                <div className="absolute left-0 h-full flex items-center justify-center px-4 pointer-events-none">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>

                {/* Input */}
                <input
                    type="text"
                    placeholder="Search…"
                    value={searchQuery}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    className="w-full py-2 pl-12 pr-4 bg-transparent text-white placeholder-white/70 focus:outline-none"
                    aria-label="search"
                />

                {/* Search Results Dropdown */}
                {searchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg max-h-[300px] overflow-y-auto z-50">
                        {searchResults.map((result, index) => (
                            <div
                                key={index}
                                ref={(el) => {
                                    itemRefs.current[index] = el;
                                }}
                                onClick={() => handleSelect(result.path)}
                                className={`px-4 py-3 cursor-pointer flex flex-col border-b border-gray-200 dark:border-gray-700 last:border-b-0 ${index === highlightedIndex
                                    ? 'bg-gray-200 dark:bg-gray-700'
                                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}
                            >
                                <span className="font-medium text-gray-900 dark:text-white">{result.name}</span>
                                <span className="text-sm text-gray-500 dark:text-gray-400">{result.category}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
