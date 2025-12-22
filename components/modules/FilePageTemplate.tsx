'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { RefreshCw, Loader2 } from 'lucide-react';
import AppBar from '@/components/layout/AppBar';
import Drawer from '@/components/layout/Drawer';
import { SubModule } from '@/lib/config/moduleConfig';

// Import shared components
import { FileTable, AddFileButton, SearchBar, DeleteDialog } from '@/components/modules/shared';

interface User {
    _id: string;
    name: string;
    email: string;
    role: string;
    branch: string;
    zone: string;
    registeredModules?: string[];
}

interface Zone {
    zoneName: string;
}

interface FileData {
    fileId?: string;
    filename: string;
    filetype?: string;
    lastModified: string;
    fileNumber: string;
    isOptimistic?: boolean;
}

interface FilePageTemplateProps {
    title: string;
    subModule: SubModule;
    user: User;
}

// Mock data
const MOCK_ZONES: Zone[] = [
    { zoneName: 'North Zone' },
    { zoneName: 'South Zone' },
    { zoneName: 'East Zone' },
    { zoneName: 'West Zone' },
];

const MOCK_BRANCHES: Record<string, string[]> = {
    'North Zone': ['Islamabad Branch', 'Rawalpindi Branch', 'Peshawar Branch'],
    'South Zone': ['Karachi Branch', 'Hyderabad Branch'],
    'East Zone': ['Lahore Branch', 'Faisalabad Branch', 'Multan Branch'],
    'West Zone': ['Quetta Branch', 'Gwadar Branch'],
};

const MOCK_FILES: FileData[] = [
    { fileId: '1', filename: 'Document_2024_001.pdf', lastModified: new Date().toISOString(), fileNumber: '00001' },
    { fileId: '2', filename: 'Certificate_Renewal.pdf', lastModified: new Date().toISOString(), fileNumber: '00002' },
    { fileId: '3', filename: 'Permit_Application.docx', lastModified: new Date().toISOString(), fileNumber: '00003' },
];

export default function FilePageTemplate({ title, subModule, user }: FilePageTemplateProps) {
    // Layout state
    const [darkMode, setDarkMode] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [mobileOpen, setMobileOpen] = useState(false);
    const [desktopOpen, setDesktopOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // Data state
    const [zones, setZones] = useState<Zone[]>([]);
    const [branches, setBranches] = useState<string[]>([]);
    const [selectedZone, setSelectedZone] = useState('');
    const [selectedBranch, setSelectedBranch] = useState('');
    const [files, setFiles] = useState<FileData[]>([]);
    const [loading, setLoading] = useState(false);
    const [fileSearchQuery, setFileSearchQuery] = useState('');

    // Dialog state
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
    const [fileToDelete, setFileToDelete] = useState<string | null>(null);

    // Snackbar state
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; type: 'success' | 'error' | 'info' }>({
        open: false,
        message: '',
        type: 'success',
    });

    // Detect mobile
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 640);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Initialize zones
    useEffect(() => {
        setZones(MOCK_ZONES);
    }, []);

    // Snackbar helper - must be defined before hooks that use it
    const showSnackbar = useCallback((message: string, type: 'success' | 'error' | 'info') => {
        setSnackbar({ open: true, message, type });
        setTimeout(() => setSnackbar(prev => ({ ...prev, open: false })), 3000);
    }, []);

    // Fetch files (mock implementation) - must be defined before hooks that use it
    const fetchFiles = useCallback(async () => {
        setLoading(true);
        await new Promise(resolve => setTimeout(resolve, 500));
        // In production: fetch(`/api/files/${subModule.apiEndpoint}/${zone}/${branch}`)
        setFiles(MOCK_FILES);
        setLoading(false);
    }, []);

    // Fetch branches when zone changes
    useEffect(() => {
        if (selectedZone) {
            setBranches(MOCK_BRANCHES[selectedZone] || []);
            setSelectedBranch('');
        }
    }, [selectedZone]);

    // Fetch files when zone and branch are selected
    useEffect(() => {
        if (selectedZone && selectedBranch) {
            fetchFiles();
        }
    }, [selectedZone, selectedBranch, fetchFiles]);

    // For non-admin users, auto-select their zone and branch
    useEffect(() => {
        if (user.role !== 'Admin') {
            setSelectedZone(user.zone);
            setSelectedBranch(user.branch);
        }
    }, [user]);

    // Filtered files based on search
    const filteredFiles = useMemo(() => {
        return files.filter(file =>
            file.filename.toLowerCase().includes(fileSearchQuery.toLowerCase()) ||
            file.fileNumber.toLowerCase().includes(fileSearchQuery.toLowerCase())
        );
    }, [files, fileSearchQuery]);

    // Handle file upload
    const handleFileSelect = useCallback(async (selectedFiles: File[] | File) => {
        const filesArray = Array.isArray(selectedFiles) ? selectedFiles : [selectedFiles];

        const optimisticFiles: FileData[] = filesArray.map((file, index) => ({
            filename: file.name.replace(/\s+/g, '_'),
            lastModified: new Date().toISOString(),
            fileNumber: String(files.length + index + 1).padStart(5, '0'),
            fileId: `temp-${Date.now()}-${index}`,
            isOptimistic: true,
        }));

        setFiles(prev => [...prev, ...optimisticFiles]);
        await new Promise(resolve => setTimeout(resolve, 1000));
        setFiles(prev => prev.map(f => f.isOptimistic ? { ...f, isOptimistic: false } : f));
        showSnackbar(`Successfully uploaded ${filesArray.length} file(s)`, 'success');
    }, [files.length, showSnackbar]);

    // Handle file view
    const handleViewFile = useCallback((filename: string) => {
        showSnackbar(`Downloading ${filename}...`, 'info');
    }, [showSnackbar]);

    // Handle delete
    const openDeleteDialog = useCallback((filename: string) => {
        setFileToDelete(filename);
        setConfirmDeleteOpen(true);
    }, []);

    const handleDeleteConfirm = useCallback(async () => {
        if (!fileToDelete) return;
        setConfirmDeleteOpen(false);
        setFiles(prev => prev.filter(f => f.filename !== fileToDelete));
        await new Promise(resolve => setTimeout(resolve, 500));
        showSnackbar(`File deleted successfully`, 'success');
        setFileToDelete(null);
    }, [fileToDelete, showSnackbar]);

    const handleDeleteCancel = useCallback(() => {
        setConfirmDeleteOpen(false);
        setFileToDelete(null);
    }, []);

    const handleRefresh = useCallback(() => {
        if (selectedZone && selectedBranch) {
            showSnackbar('Refreshing files...', 'info');
            fetchFiles();
        } else {
            showSnackbar('Please select a zone and branch first', 'error');
        }
    }, [selectedZone, selectedBranch, fetchFiles, showSnackbar]);

    return (
        <>
            <AppBar
                darkMode={darkMode}
                handleDarkModeToggle={() => setDarkMode(!darkMode)}
                searchQuery={searchQuery}
                onSearch={setSearchQuery}
                searchResults={[]}
                user={user}
                mobileOpen={mobileOpen}
                setMobileOpen={setMobileOpen}
                desktopOpen={desktopOpen}
                setDesktopOpen={setDesktopOpen}
            />

            <Drawer
                user={user}
                mobileOpen={mobileOpen}
                setMobileOpen={setMobileOpen}
                desktopOpen={desktopOpen}
                setDesktopOpen={setDesktopOpen}
            />

            <main
                className="flex-grow p-4 sm:p-6 mt-16 overflow-y-auto min-h-screen bg-gray-50 dark:bg-black"
                style={{
                    marginLeft: !isMobile ? '65px' : '0px',
                    paddingLeft: !isMobile ? '1rem' : '0',
                }}
            >
                {/* Page Title */}
                <h1
                    className="text-gray-900 dark:text-gray-100 mb-2 text-center text-lg sm:text-xl lg:text-2xl border-b-2 border-gray-300 pb-3"
                    style={{ fontFamily: 'var(--font-heading)' }}
                >
                    {title}
                </h1>

                {/* User Branch Info */}
                <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
                    Your Branch: <span className="font-medium">{user.branch}</span>
                </p>

                {/* Controls Container */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-lg">
                    {/* Admin Controls */}
                    {user.role === 'Admin' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                            {/* Zone Select */}
                            <select
                                value={selectedZone}
                                onChange={(e) => setSelectedZone(e.target.value)}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#f15a22] focus:outline-none"
                            >
                                <option value="" disabled>Select Zone</option>
                                {zones.map((zone) => (
                                    <option key={zone.zoneName} value={zone.zoneName}>
                                        {zone.zoneName}
                                    </option>
                                ))}
                            </select>

                            {/* Branch Select */}
                            <select
                                value={selectedBranch}
                                onChange={(e) => setSelectedBranch(e.target.value)}
                                disabled={!selectedZone}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#f15a22] focus:outline-none disabled:opacity-50"
                            >
                                <option value="" disabled>Select Branch</option>
                                {branches.map((branch) => (
                                    <option key={branch} value={branch}>
                                        {branch}
                                    </option>
                                ))}
                            </select>

                            {/* Search */}
                            <SearchBar
                                searchQuery={fileSearchQuery}
                                setSearchQuery={setFileSearchQuery}
                            />

                            {/* Action Buttons */}
                            <div className="flex items-center gap-2 justify-end">
                                <AddFileButton onFileSelect={handleFileSelect} multiple disabled={!selectedBranch} />
                                <button
                                    onClick={handleRefresh}
                                    disabled={loading}
                                    className="p-2 rounded-lg text-[#f15a22] hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors disabled:opacity-50"
                                >
                                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <RefreshCw className="w-6 h-6" />}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Non-Admin Controls */}
                    {user.role !== 'Admin' && (
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
                            <div className="sm:col-span-3">
                                <SearchBar searchQuery={fileSearchQuery} setSearchQuery={setFileSearchQuery} />
                            </div>
                            <div className="flex justify-end">
                                <button
                                    onClick={handleRefresh}
                                    disabled={loading}
                                    className="p-2 rounded-lg text-[#f15a22] hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors disabled:opacity-50"
                                >
                                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <RefreshCw className="w-6 h-6" />}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* File Table */}
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 max-h-[500px] overflow-y-auto">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-8 h-8 animate-spin text-[#f15a22]" />
                                <span className="ml-3 text-gray-600 dark:text-gray-400">Loading files...</span>
                            </div>
                        ) : files.length === 0 ? (
                            <p className="text-center text-gray-500 dark:text-gray-400 py-12">
                                {selectedZone && selectedBranch ? 'No files stored' : 'Select a zone and branch to view files'}
                            </p>
                        ) : (
                            <FileTable
                                files={filteredFiles}
                                onDelete={openDeleteDialog}
                                onView={handleViewFile}
                                user={user}
                                filePathPrefix={subModule.filePathPrefix}
                            />
                        )}
                    </div>
                </div>

                {/* Delete Dialog */}
                <DeleteDialog
                    isOpen={confirmDeleteOpen}
                    filename={fileToDelete}
                    onConfirm={handleDeleteConfirm}
                    onCancel={handleDeleteCancel}
                />

                {/* Snackbar */}
                {snackbar.open && (
                    <div
                        className={`
              fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50
              ${snackbar.type === 'success' ? 'bg-green-600' : snackbar.type === 'error' ? 'bg-red-600' : 'bg-blue-600'}
              text-white font-medium animate-slideIn
            `}
                    >
                        {snackbar.message}
                    </div>
                )}
            </main>
        </>
    );
}
