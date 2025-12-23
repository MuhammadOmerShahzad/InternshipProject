// Search utility functions for global search functionality

import { MODULES, type ModuleConfig, type SubModule } from '@/lib/config/moduleConfig';

export interface FlattenedSubModule {
    name: string;
    fullPath: string[];
    breadcrumb: string;
    navigationPath: string;
    moduleSlug: string;
}

/**
 * Builds a searchable index of all sub-modules from the module configuration
 * @param allowedModules - Array of module slugs the user has access to
 * @returns Flattened array of all sub-modules with their metadata
 */
export function buildModuleSearchIndex(allowedModules: string[]): FlattenedSubModule[] {
    const results: FlattenedSubModule[] = [];

    // Filter modules based on user's allowed modules
    const filteredModules = MODULES.filter(moduleConfig => allowedModules.includes(moduleConfig.slug));

    for (const moduleConfig of filteredModules) {
        // Process each sub-module recursively
        processSubModules(moduleConfig, moduleConfig.subModules, [moduleConfig.slug], [moduleConfig.displayName], results);
    }

    return results;
}

/**
 * Recursively processes sub-modules and their children
 */
function processSubModules(
    module: ModuleConfig,
    subModules: SubModule[],
    pathSlugs: string[],
    pathNames: string[],
    results: FlattenedSubModule[]
) {
    for (const subModule of subModules) {
        const currentPathSlugs = [...pathSlugs, subModule.slug];
        const currentPathNames = [...pathNames, subModule.name];

        // Add this sub-module to results
        results.push({
            name: subModule.name,
            fullPath: currentPathSlugs,
            breadcrumb: currentPathNames.join(' > '),
            navigationPath: `/${currentPathSlugs.join('/')}`,
            moduleSlug: module.slug,
        });

        // Process children if they exist
        if (subModule.children && subModule.children.length > 0) {
            processSubModules(module, subModule.children, currentPathSlugs, currentPathNames, results);
        }
    }
}

/**
 * Searches through the module configuration for matching sub-modules
 * @param query - Search query string
 * @param allowedModules - Array of module slugs the user has access to
 * @returns Array of matching sub-modules
 */
export function searchModuleConfig(query: string, allowedModules: string[]): FlattenedSubModule[] {
    if (!query || query.trim().length === 0) {
        return [];
    }

    const searchIndex = buildModuleSearchIndex(allowedModules);
    const lowerQuery = query.toLowerCase().trim();

    // Search and sort by relevance
    const matches = searchIndex.filter(item =>
        item.name.toLowerCase().includes(lowerQuery)
    );

    // Sort: exact matches first, then starts with, then contains
    return matches.sort((a, b) => {
        const aLower = a.name.toLowerCase();
        const bLower = b.name.toLowerCase();

        // Exact match
        if (aLower === lowerQuery) return -1;
        if (bLower === lowerQuery) return 1;

        // Starts with
        if (aLower.startsWith(lowerQuery) && !bLower.startsWith(lowerQuery)) return -1;
        if (bLower.startsWith(lowerQuery) && !aLower.startsWith(lowerQuery)) return 1;

        // Alphabetical for same relevance
        return a.name.localeCompare(b.name);
    });
}

/**
 * Builds a breadcrumb string from module and file information
 */
export function buildFileBreadcrumb(
    moduleSlug: string,
    submoduleSlug: string,
    branchName?: string
): string {
    const moduleConfig = MODULES.find(m => m.slug === moduleSlug);
    if (!moduleConfig) return '';

    const breadcrumbParts = [moduleConfig.displayName];

    // Find the submodule in the hierarchy
    const findSubModule = (subModules: SubModule[], targetSlug: string): SubModule | null => {
        for (const sub of subModules) {
            if (sub.slug === targetSlug) return sub;
            if (sub.children) {
                const found = findSubModule(sub.children, targetSlug);
                if (found) return found;
            }
        }
        return null;
    };

    const subModule = findSubModule(moduleConfig.subModules, submoduleSlug);
    if (subModule) {
        breadcrumbParts.push(subModule.name);
    }

    if (branchName) {
        breadcrumbParts.push(branchName);
    }

    return breadcrumbParts.join(' > ');
}

/**
 * Generates the navigation path for a file
 */
export function generateFileNavigationPath(
    moduleSlug: string,
    submoduleSlug: string
): string {
    // For now, navigate to the sub-module page
    // In the future, this could navigate to a specific file detail page
    return `/${moduleSlug}/${submoduleSlug}`;
}

/**
 * Highlights the search term in text (returns plain text with markers for UI to style)
 */
export function getHighlightedText(text: string, query: string): { text: string; isHighlight: boolean }[] {
    if (!query || query.trim().length === 0) {
        return [{ text, isHighlight: false }];
    }

    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase().trim();
    const index = lowerText.indexOf(lowerQuery);

    if (index === -1) {
        return [{ text, isHighlight: false }];
    }

    const parts: { text: string; isHighlight: boolean }[] = [];

    if (index > 0) {
        parts.push({ text: text.substring(0, index), isHighlight: false });
    }

    parts.push({
        text: text.substring(index, index + query.length),
        isHighlight: true,
    });

    if (index + query.length < text.length) {
        parts.push({
            text: text.substring(index + query.length),
            isHighlight: false,
        });
    }

    return parts;
}
