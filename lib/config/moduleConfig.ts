// Master Module Configuration
// All modules, submodules, and their configurations are defined here

export interface SubModule {
    name: string;
    slug: string;
    apiEndpoint: string;
    filePathPrefix: string;
    children?: SubModule[];
}

export interface ModuleConfig {
    name: string;
    slug: string;
    displayName: string;
    icon: string;
    subModules: SubModule[];
}

// Helper to generate slug from name (kept for reference)
// const slugify = (name: string): string =>
//     name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

// ============================================
// MODULE CONFIGURATIONS
// ============================================

export const MODULES: ModuleConfig[] = [
    // ============================================
    // LICENSES
    // ============================================
    {
        name: 'Licenses',
        slug: 'licenses',
        displayName: 'Licenses',
        icon: '/images/licenses.webp',
        subModules: [
            {
                name: 'Trade Licenses',
                slug: 'trade-licenses',
                apiEndpoint: 'licenses-trade',
                filePathPrefix: 'LIC/TL',
                children: [
                    { name: 'Islamabad Food Authority', slug: 'islamabad-food-authority', apiEndpoint: 'licenses-trade-ifa', filePathPrefix: 'LIC/TL/IFA' },
                    { name: 'Capital Development Authority', slug: 'capital-development-authority', apiEndpoint: 'licenses-trade-cda', filePathPrefix: 'LIC/TL/CDA' },
                    { name: 'Cantonment', slug: 'cantonment', apiEndpoint: 'licenses-trade-cantonment', filePathPrefix: 'LIC/TL/CANT' },
                    { name: 'Punjab Food Authority', slug: 'punjab-food-authority', apiEndpoint: 'licenses-trade-pfa', filePathPrefix: 'LIC/TL/PFA' },
                    { name: 'Medical', slug: 'medical', apiEndpoint: 'licenses-trade-medical', filePathPrefix: 'LIC/TL/MED' },
                ],
            },
            {
                name: 'Staff Medicals',
                slug: 'staff-medicals',
                apiEndpoint: 'licenses-staff',
                filePathPrefix: 'LIC/SM',
                children: [
                    { name: 'Hiring Tests', slug: 'hiring-tests', apiEndpoint: 'licenses-staff-hiring', filePathPrefix: 'LIC/SM/HT' },
                    { name: 'Recurring Medical Tests', slug: 'recurring-medical-tests', apiEndpoint: 'licenses-staff-recurring', filePathPrefix: 'LIC/SM/RMT' },
                    { name: 'Vaccine Record', slug: 'vaccine-record', apiEndpoint: 'licenses-staff-vaccine', filePathPrefix: 'LIC/SM/VR' },
                ],
            },
            {
                name: 'Tourism Licenses',
                slug: 'tourism-licenses',
                apiEndpoint: 'licenses-tourism',
                filePathPrefix: 'LIC/TOU',
            },
            {
                name: 'Labour Licenses',
                slug: 'labour-licenses',
                apiEndpoint: 'licenses-labour',
                filePathPrefix: 'LIC/LAB',
            },
        ],
    },

    // ============================================
    // APPROVALS
    // ============================================
    {
        name: 'Approvals',
        slug: 'approvals',
        displayName: 'Approvals',
        icon: '/images/approved.webp',
        subModules: [
            {
                name: 'Outer Spaces',
                slug: 'outer-spaces',
                apiEndpoint: 'approvals-outer',
                filePathPrefix: 'APP/OS',
                children: [
                    { name: 'Dine In', slug: 'dine-in', apiEndpoint: 'approvals-outer-dinein', filePathPrefix: 'APP/OS/DI' },
                    { name: 'Generators', slug: 'generators', apiEndpoint: 'approvals-outer-generators', filePathPrefix: 'APP/OS/GEN' },
                    { name: 'Facilities', slug: 'facilities', apiEndpoint: 'approvals-outer-facilities', filePathPrefix: 'APP/OS/FAC' },
                ],
            },
        ],
    },

    // ============================================
    // VEHICLES
    // ============================================
    {
        name: 'Vehicles',
        slug: 'vehicles',
        displayName: 'Vehicles',
        icon: '/images/vehicle.webp',
        subModules: [
            {
                name: 'Maintenance',
                slug: 'maintenance',
                apiEndpoint: 'vehicles-maintenance',
                filePathPrefix: 'VEH/MNT',
                children: [
                    { name: 'Routine Maintenance', slug: 'routine-maintenance', apiEndpoint: 'vehicles-maintenance-routine', filePathPrefix: 'VEH/MNT/RM' },
                    { name: 'Major Parts/Replacements', slug: 'major-parts', apiEndpoint: 'vehicles-maintenance-parts', filePathPrefix: 'VEH/MNT/MP' },
                    { name: 'Major Repairs', slug: 'major-repairs', apiEndpoint: 'vehicles-maintenance-repairs', filePathPrefix: 'VEH/MNT/MR' },
                ],
            },
            {
                name: 'Token Taxes',
                slug: 'token-taxes',
                apiEndpoint: 'vehicles-token',
                filePathPrefix: 'VEH/TT',
                children: [
                    { name: 'Annual Token Tax', slug: 'annual-token-tax', apiEndpoint: 'vehicles-token-annual', filePathPrefix: 'VEH/TT/ATT' },
                    { name: 'M-Tag For SC Vehicles', slug: 'm-tag-sc-vehicles', apiEndpoint: 'vehicles-token-mtag', filePathPrefix: 'VEH/TT/MTAG' },
                ],
            },
            {
                name: 'Route Permits',
                slug: 'route-permits',
                apiEndpoint: 'vehicles-route',
                filePathPrefix: 'VEH/RP',
                children: [
                    { name: 'Cantt Passes', slug: 'cantt-passes', apiEndpoint: 'vehicles-route-cantt', filePathPrefix: 'VEH/RP/CP' },
                    { name: 'Islamabad Capital Territory', slug: 'islamabad-capital-territory', apiEndpoint: 'vehicles-route-ict', filePathPrefix: 'VEH/RP/ICT' },
                    { name: 'Rawalpindi', slug: 'rawalpindi', apiEndpoint: 'vehicles-route-rwp', filePathPrefix: 'VEH/RP/RWP' },
                    { name: 'Peshawar', slug: 'peshawar', apiEndpoint: 'vehicles-route-psh', filePathPrefix: 'VEH/RP/PSH' },
                    { name: 'Wah', slug: 'wah', apiEndpoint: 'vehicles-route-wah', filePathPrefix: 'VEH/RP/WAH' },
                ],
            },
        ],
    },

    // ============================================
    // TAXATION
    // ============================================
    {
        name: 'Taxation',
        slug: 'taxation',
        displayName: 'Taxation',
        icon: '/images/taxation.webp',
        subModules: [
            {
                name: 'Marketing / BillBoards Taxes',
                slug: 'billboards-taxes',
                apiEndpoint: 'taxation-billboards',
                filePathPrefix: 'TAX/BB',
            },
            {
                name: 'Profession Tax',
                slug: 'profession-tax',
                apiEndpoint: 'taxation-profession',
                filePathPrefix: 'TAX/PT',
            },
        ],
    },

    // ============================================
    // CERTIFICATES
    // ============================================
    {
        name: 'Certificates',
        slug: 'certificates',
        displayName: 'Certificates',
        icon: '/images/certificate.webp',
        subModules: [
            {
                name: 'Electric Fitness Test',
                slug: 'electric-fitness-test',
                apiEndpoint: 'certificates-electric',
                filePathPrefix: 'CERT/EFT',
            },
        ],
    },

    // ============================================
    // SECURITY
    // ============================================
    {
        name: 'Security',
        slug: 'security',
        displayName: 'Security',
        icon: '/images/security.webp',
        subModules: [
            {
                name: 'Guard Training',
                slug: 'guard-training',
                apiEndpoint: 'security-training',
                filePathPrefix: 'SEC/GT',
            },
        ],
    },

    // ============================================
    // HEALTH SAFETY ENVIRONMENT (HSE)
    // ============================================
    {
        name: 'Health Safety Environment',
        slug: 'hse',
        displayName: 'Health Safety Environment',
        icon: '/images/hse.webp',
        subModules: [
            {
                name: 'Monthly Inspection',
                slug: 'monthly-inspection',
                apiEndpoint: 'hse-monthly',
                filePathPrefix: 'HSE/MI',
            },
            {
                name: 'Quarterly Audit',
                slug: 'quarterly-audit',
                apiEndpoint: 'hse-quarterly',
                filePathPrefix: 'HSE/QA',
            },
            {
                name: 'Expiry of Cylinders',
                slug: 'expiry-of-cylinders',
                apiEndpoint: 'hse-cylinders',
                filePathPrefix: 'HSE/CYL',
            },
            {
                name: 'Training Status',
                slug: 'training-status',
                apiEndpoint: 'hse-training',
                filePathPrefix: 'HSE/TS',
                children: [
                    { name: 'First Aid', slug: 'first-aid', apiEndpoint: 'hse-training-firstaid', filePathPrefix: 'HSE/TS/FA' },
                    { name: 'Fire Safety', slug: 'fire-safety', apiEndpoint: 'hse-training-fire', filePathPrefix: 'HSE/TS/FS' },
                    { name: 'Emergency', slug: 'emergency', apiEndpoint: 'hse-training-emergency', filePathPrefix: 'HSE/TS/EM' },
                ],
            },
            {
                name: 'Incidents',
                slug: 'incidents',
                apiEndpoint: 'hse-incidents',
                filePathPrefix: 'HSE/INC',
                children: [
                    { name: 'Lost Time Injury', slug: 'lost-time-injury', apiEndpoint: 'hse-incidents-lti', filePathPrefix: 'HSE/INC/LTI' },
                    { name: 'Restricted Work Injury', slug: 'restricted-work-injury', apiEndpoint: 'hse-incidents-rwi', filePathPrefix: 'HSE/INC/RWI' },
                    { name: 'FATAL', slug: 'fatal', apiEndpoint: 'hse-incidents-fatal', filePathPrefix: 'HSE/INC/FAT' },
                ],
            },
        ],
    },

    // ============================================
    // RENTAL AGREEMENTS
    // ============================================
    {
        name: 'Rental Agreements',
        slug: 'rental-agreements',
        displayName: 'Rental Agreements',
        icon: '/images/rental_agreements.webp',
        subModules: [], // Direct page - no submodules
    },

    // ============================================
    // USER MANAGEMENT
    // ============================================
    {
        name: 'User Management',
        slug: 'user-management',
        displayName: 'User Management',
        icon: '/images/settings.webp',
        subModules: [], // Direct page - no submodules
    },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

// Get a module by slug
export function getModuleBySlug(slug: string): ModuleConfig | undefined {
    return MODULES.find(m => m.slug === slug);
}

// Get all module slugs
export function getAllModuleSlugs(): string[] {
    return MODULES.map(m => m.slug);
}

// Find a submodule by path (e.g., ['trade-licenses', 'islamabad-food-authority'])
export function findSubModuleByPath(module: ModuleConfig, slugPath: string[]): SubModule | null {
    if (slugPath.length === 0) return null;

    let current: SubModule | undefined = module.subModules.find(s => s.slug === slugPath[0]);

    for (let i = 1; i < slugPath.length && current; i++) {
        current = current.children?.find(c => c.slug === slugPath[i]);
    }

    return current || null;
}

// Get breadcrumb trail for a path
export function getBreadcrumb(moduleSlug: string, slugPath: string[]): string[] {
    const config = getModuleBySlug(moduleSlug);
    if (!config) return [];

    const breadcrumb: string[] = [config.displayName];
    let current: SubModule[] | undefined = config.subModules;

    for (const slug of slugPath) {
        const foundItem: SubModule | undefined = current?.find((s: SubModule) => s.slug === slug);
        if (foundItem) {
            breadcrumb.push(foundItem.name);
            current = foundItem.children;
        }
    }

    return breadcrumb;
}

// Generate page title from path
export function generatePageTitle(moduleSlug: string, slugPath: string[]): string {
    return getBreadcrumb(moduleSlug, slugPath).join(' / ').toUpperCase();
}

// Check if a path leads to a file page (has no children or is a leaf)
export function isFilePage(config: ModuleConfig, slugPath: string[]): boolean {
    if (slugPath.length === 0) return false;

    const subModule = findSubModuleByPath(config, slugPath);
    return subModule !== null && (!subModule.children || subModule.children.length === 0);
}

// Get submodules to display for a given path
export function getSubModulesForPath(config: ModuleConfig, slugPath: string[]): SubModule[] {
    if (slugPath.length === 0) {
        return config.subModules;
    }

    const subModule = findSubModuleByPath(config, slugPath);
    return subModule?.children || [];
}
