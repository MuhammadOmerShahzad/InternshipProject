'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { RefreshCw, Loader2 } from 'lucide-react';
import AppBar from '@/components/layout/AppBar';
import Drawer from '@/components/layout/Drawer';
import { SubModule } from '@/lib/config/moduleConfig';
import { toast } from '@/lib/utils/toast';
import { validateFiles } from '@/lib/utils/fileValidation';
import { compressFiles } from '@/lib/utils/fileCompression';

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
            toast.error(`Error loading files: ${error}`);
        } else {
            // Transform FileRecord to FileData format
            const transformedFiles: FileData[] = fileData.map((file: FileRecord) => ({
                fileId: file.id,
                filename: file.original_filename,
                filetype: file.file_type,
                lastModified: file.created_at,
                fileNumber: String(file.serial_number).padStart(5, '0'),
            }));
            setFiles(transformedFiles);
        }
        setLoading(false);
    }, [selectedZoneId, selectedBranchId, moduleSlug, submoduleSlug]);

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
            toast.error('Please select a zone and branch first');
            return;
        }

        const filesArray = Array.isArray(selectedFiles) ? selectedFiles : [selectedFiles];

        // Client-side validation
        const { valid: validFiles, invalid: invalidFiles } = validateFiles(filesArray);

        // Show validation errors immediately
        if (invalidFiles.length > 0) {
            invalidFiles.forEach(({ error: _validationError }) => {
                toast.error(_validationError);
            });

            // If no valid files, return early
            if (validFiles.length === 0) {
                return;
            }
        }

        setUploading(true);

        // Compress files silently in background (images and PDFs only)
        const compressionResults = await compressFiles(validFiles);
        const processedFiles = compressionResults.map(result => result.compressedFile);

        // Add optimistic files only for processed files
        const optimisticFiles: FileData[] = processedFiles.map((file, index) => ({
            filename: file.name,
            lastModified: new Date().toISOString(),
            fileNumber: '00000', // Placeholder, will be replaced after upload
            fileId: `temp-${Date.now()}-${index}`,
            isOptimistic: true,
        }));
        setFiles(prev => [...optimisticFiles, ...prev]);

        // Upload files in parallel (batches of 3)
        const BATCH_SIZE = 3;
        const uploadResults: { success: boolean; error?: string; filename: string }[] = [];

        for (let i = 0; i < processedFiles.length; i += BATCH_SIZE) {
            const batch = processedFiles.slice(i, i + BATCH_SIZE);

            const batchPromises = batch.map(async (file: File) => {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('moduleSlug', moduleSlug);
                formData.append('submoduleSlug', submoduleSlug);
                formData.append('zoneId', selectedZoneId);
                formData.append('branchId', selectedBranchId);

                const result = await uploadFile(formData);
                return {
                    success: result.success,
                    error: result.error,
                    filename: file.name
                };
            });

            const batchResults = await Promise.all(batchPromises);
            uploadResults.push(...batchResults);
        }

        // Refresh files after upload
        await fetchFiles();
        setUploading(false);

        // Count results
        const successCount = uploadResults.filter(r => r.success).length;
        const failedUploads = uploadResults.filter(r => !r.success);

        // Show detailed success/error messages
        if (successCount > 0) {
            toast.success(`Successfully uploaded ${successCount} file(s)`);
        }

        if (failedUploads.length > 0) {
            // Show first error with details
            const firstError = failedUploads[0];
            toast.error(`Failed to upload "${firstError.filename}": ${firstError.error}`);

            // If multiple failures, show count
            if (failedUploads.length > 1) {
                toast.error(`${failedUploads.length - 1} more file(s) failed to upload`);
            }
        }
    }, [selectedZoneId, selectedBranchId, moduleSlug, submoduleSlug, fetchFiles]);

    // Handle file view/download
    const handleViewFile = useCallback(async (filename: string) => {
        const file = files.find(f => f.filename === filename);
        if (!file?.fileId || file.fileId.startsWith('temp-')) {
            toast.info('File is still uploading...');
            return;
        }

        const { url, error } = await getFileDownloadUrl(file.fileId);
        if (error) {
            toast.error(`Error: ${error}`);
            return;
        }
        if (url) {
            window.open(url, '_blank');
        }
    }, [files]);

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
            toast.success('File deleted successfully');
        } else {
            toast.error(`Delete failed: ${result.error}`);
        }
        setFileToDelete(null);
    }, [fileToDelete]);

    const handleDeleteCancel = useCallback(() => {
        setConfirmDeleteOpen(false);
        setFileToDelete(null);
    }, []);

    const handleRefresh = useCallback(() => {
        if (selectedZoneId && selectedBranchId) {
            toast.info('Refreshing files...');
            fetchFiles();
        } else {
            toast.error('Please select a zone and branch first');
        }
    }, [selectedZoneId, selectedBranchId, fetchFiles]);

    return (
        <>
            <AppBar
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
                <div className="bg-white dark:bg-[#2E2E2E] rounded-xl p-4 sm:p-6 shadow-lg">
                    {/* Admin Controls */}
                    {user?.role === 'Admin' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                            {/* Zone Select */}
                            <select
                                value={selectedZoneId}
                                onChange={(e) => setSelectedZoneId(e.target.value)}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#333] text-gray-900 dark:text-white focus:ring-2 focus:ring-[#f15a22] focus:outline-none"
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
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#333] text-gray-900 dark:text-white focus:ring-2 focus:ring-[#f15a22] focus:outline-none disabled:opacity-50"
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
                    <div className="bg-gray-50 dark:bg-[#1a1a1a] rounded-lg p-4 max-h-[500px] overflow-y-auto">
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
            </main>
        </>
    );
}
