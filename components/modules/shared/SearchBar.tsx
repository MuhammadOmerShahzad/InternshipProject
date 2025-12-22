'use client';

import { Search } from 'lucide-react';

interface SearchBarProps {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    placeholder?: string;
}

export default function SearchBar({
    searchQuery,
    setSearchQuery,
    placeholder = 'Search files...'
}: SearchBarProps) {
    return (
        <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={placeholder}
                className="
          w-full pl-10 pr-4 py-2 rounded-lg
          bg-white dark:bg-gray-800
          border border-gray-300 dark:border-gray-600
          text-gray-900 dark:text-white
          placeholder-gray-400
          focus:outline-none focus:ring-2 focus:ring-[#f15a22] focus:border-transparent
          transition-all duration-200
        "
            />
        </div>
    );
}
