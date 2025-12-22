'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { RefreshCw, Loader2 } from 'lucide-react';
import AppBar from '@/components/layout/AppBar';
import Drawer from '@/components/layout/Drawer';
import { SubModule } from '@/lib/config/moduleConfig';

// Import shared components
import { FileTable, AddFileButton, SearchBar, DeleteDialog } from '@/components/modules/shared';

// Import server actions
import { getZones, getBranchesByZone, Zone, Branch } from '@/lib/actions/zones';
import { uploadFile, getFiles, deleteFile, getFileDownloadUrl, FileRecord } from '@/lib/actions/files';

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    branch: string;
    zone: string;
    branch_id?: string;
    zone_id?: string;
    registeredModules?: string[];
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
    user: User | null;
    moduleSlug: string;
    submoduleSlug: string;
}

export default function FilePageTemplate({ title, subModule, user, moduleSlug, submoduleSlug }: FilePageTemplateProps) {
    // Layout state
    const [darkMode, setDarkMode] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [mobileOpen, setMobileOpen] = useState(false);
    const [desktopOpen, setDesktopOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // Data state
    const [zones, setZones] = useState<Zone[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [selectedZoneId, setSelectedZoneId] = useState('');
    const [selectedBranchId, setSelectedBranchId] = useState('');
    const [files, setFiles] = useState<FileData[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [fileSearchQuery, setFileSearchQuery] = useState('');

    // Dialog state
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
    const [fileToDelete, setFileToDelete] = useState<{ id: string; filename: string } | null>(null);

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

    // Initialize zones from database
    useEffect(() => {
        async function loadZones() {
            const { zones: zoneData } = await getZones();
            setZones(zoneData);
        }
        loadZones();
    }, []);

    // Snackbar helper
    const showSnackbar = useCallback((message: string, type: 'success' | 'error' | 'info') => {
        setSnackbar({ open: true, message, type });
        setTimeout(() => setSnackbar(prev => ({ ...prev, open: false })), 3000);
    }, []);

    // Fetch files from database
    const fetchFiles = useCallback(async () => {
        if (!selectedZoneId || !selectedBranchId) return;

        setLoading(true);
        const { files: fileData, error } = await getFiles(
            moduleSlug,
            submoduleSlug,
            selectedZoneId,
            selectedBranchId
        );

        if (error) {
            showSnackbar(`Error loading files: ${error}`, 'error');
        } else {
            // Transform FileRecord to FileData format
            const transformedFiles: FileData[] = fileData.map((file: FileRecord, index: number) => ({
                fileId: file.id,
                filename: file.original_filename,
                filetype: file.file_type,
                lastModified: file.created_at,
                fileNumber: String(index + 1).padStart(5, '0'),
            }));
            setFiles(transformedFiles);
        }
        setLoading(false);
    }, [selectedZoneId, selectedBranchId, moduleSlug, submoduleSlug, showSnackbar]);

    // Fetch branches when zone changes
    useEffect(() => {
        async function loadBranches() {
            if (selectedZoneId) {
                const { branches: branchData } = await getBranchesByZone(selectedZoneId);
                setBranches(branchData);
                setSelectedBranchId('');
                setFiles([]);
            }
        }
        loadBranches();
    }, [selectedZoneId]);

    // Fetch files when zone and branch are selected
    useEffect(() => {
        if (selectedZoneId && selectedBranchId) {
            fetchFiles();
        }
    }, [selectedZoneId, selectedBranchId, fetchFiles]);

    // For non-admin users, auto-select their zone and branch
    useEffect(() => {
        if (user && user.role !== 'Admin' && user.zone_id && user.branch_id) {
            setSelectedZoneId(user.zone_id);
            setSelectedBranchId(user.branch_id);
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
        if (!selectedZoneId || !selectedBranchId) {
            showSnackbar('Please select a zone and branch first', 'error');
            return;
        }

        const filesArray = Array.isArray(selectedFiles) ? selectedFiles : [selectedFiles];
        setUploading(true);

        // Add optimistic files
        const optimisticFiles: FileData[] = filesArray.map((file, index) => ({
            filename: file.name,
            lastModified: new Date().toISOString(),
            fileNumber: String(files.length + index + 1).padStart(5, '0'),
            fileId: `temp-${Date.now()}-${index}`,
            isOptimistic: true,
        }));
        setFiles(prev => [...optimisticFiles, ...prev]);

        let successCount = 0;
        let errorCount = 0;

        for (const file of filesArray) {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('moduleSlug', moduleSlug);
            formData.append('submoduleSlug', submoduleSlug);
            formData.append('zoneId', selectedZoneId);
            formData.append('branchId', selectedBranchId);

            const result = await uploadFile(formData);
            if (result.success) {
                successCount++;
            } else {
                errorCount++;
                console.error('Upload error:', result.error);
            }
        }

        // Refresh files after upload
        await fetchFiles();
        setUploading(false);

        if (successCount > 0) {
            showSnackbar(`Successfully uploaded ${successCount} file(s)`, 'success');
        }
        if (errorCount > 0) {
            showSnackbar(`Failed to upload ${errorCount} file(s)`, 'error');
        }
    }, [files.length, selectedZoneId, selectedBranchId, moduleSlug, submoduleSlug, fetchFiles, showSnackbar]);

    // Handle file view/download
    const handleViewFile = useCallback(async (filename: string) => {
        const file = files.find(f => f.filename === filename);
        if (!file?.fileId || file.fileId.startsWith('temp-')) {
            showSnackbar('File is still uploading...', 'info');
            return;
        }

        const { url, error } = await getFileDownloadUrl(file.fileId);
        if (error) {
            showSnackbar(`Error: ${error}`, 'error');
            return;
        }
        if (url) {
            window.open(url, '_blank');
        }
    }, [files, showSnackbar]);

    // Handle delete
    const openDeleteDialog = useCallback((filename: string) => {
        const file = files.find(f => f.filename === filename);
        if (file?.fileId) {
            setFileToDelete({ id: file.fileId, filename });
            setConfirmDeleteOpen(true);
        }
    }, [files]);

    const handleDeleteConfirm = useCallback(async () => {
        if (!fileToDelete) return;

        setConfirmDeleteOpen(false);
        const result = await deleteFile(fileToDelete.id);

        if (result.success) {
            setFiles(prev => prev.filter(f => f.fileId !== fileToDelete.id));
            showSnackbar('File deleted successfully', 'success');
        } else {
            showSnackbar(`Delete failed: ${result.error}`, 'error');
        }
        setFileToDelete(null);
    }, [fileToDelete, showSnackbar]);

    const handleDeleteCancel = useCallback(() => {
        setConfirmDeleteOpen(false);
        setFileToDelete(null);
    }, []);

    const handleRefresh = useCallback(() => {
        if (selectedZoneId && selectedBranchId) {
            showSnackbar('Refreshing files...', 'info');
            fetchFiles();
        } else {
            showSnackbar('Please select a zone and branch first', 'error');
        }
    }, [selectedZoneId, selectedBranchId, fetchFiles, showSnackbar]);

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
                    Your Branch: <span className="font-medium">{user?.branch || 'N/A'}</span>
                </p>

                {/* Controls Container */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-lg">
                    {/* Admin Controls */}
                    {user?.role === 'Admin' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                            {/* Zone Select */}
                            <select
                                value={selectedZoneId}
                                onChange={(e) => setSelectedZoneId(e.target.value)}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#f15a22] focus:outline-none"
                            >
                                <option value="" disabled>Select Zone</option>
                                {zones.map((zone) => (
                                    <option key={zone.id} value={zone.id}>
                                        {zone.name}
                                    </option>
                                ))}
                            </select>

                            {/* Branch Select */}
                            <select
                                value={selectedBranchId}
                                onChange={(e) => setSelectedBranchId(e.target.value)}
                                disabled={!selectedZoneId}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#f15a22] focus:outline-none disabled:opacity-50"
                            >
                                <option value="" disabled>Select Branch</option>
                                {branches.map((branch) => (
                                    <option key={branch.id} value={branch.id}>
                                        {branch.name}
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
                                <AddFileButton
                                    onFileSelect={handleFileSelect}
                                    multiple
                                    disabled={!selectedBranchId || uploading}
                                />
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
                    {user?.role !== 'Admin' && (
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
                                {selectedZoneId && selectedBranchId ? 'No files stored' : 'Select a zone and branch to view files'}
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
                    filename={fileToDelete?.filename || null}
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
