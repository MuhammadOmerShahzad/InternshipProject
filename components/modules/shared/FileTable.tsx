'use client';

import { memo, useCallback } from 'react';
import { Trash2, Eye, Loader2 } from 'lucide-react';

interface FileData {
    fileId?: string;
    filename: string;
    filetype?: string;
    lastModified: string;
    fileNumber: string;
    isOptimistic?: boolean;
}

interface User {
    role?: string;
}

interface FileTableProps {
    files: FileData[];
    onDelete: (filename: string) => void;
    onView: (filename: string) => void;
    user: User | null;
    filePathPrefix?: string;
}

// Helper functions
const formatFilePath = (path: string) => path.replace(/\s+/g, '_');

const getCleanFileName = (filename: string) => {
    const nameWithoutUnderscores = filename.replace(/_/g, ' ');
    return nameWithoutUnderscores.replace(/\.[^/.]+$/, '');
};

const getFileExtension = (filename: string) => {
    if (!filename) return 'N/A';
    const parts = filename.split('.');
    if (parts.length > 1 && parts[parts.length - 1] !== '') {
        return parts.pop()?.toUpperCase() || 'N/A';
    }
    return 'N/A';
};

const TABLE_HEADERS = ['File Path', 'File Name', 'File Type', 'Uploaded Date', 'Manage'];

// File Row Component
const FileRow = memo(function FileRow({
    file,
    index,
    onDelete,
    onView,
    user,
    filePathPrefix
}: {
    file: FileData;
    index: number;
    onDelete: (filename: string) => void;
    onView: (filename: string) => void;
    user: User | null;
    filePathPrefix: string;
}) {
    const handleDelete = useCallback(() => {
        onDelete(file.filename);
    }, [onDelete, file.filename]);

    const handleView = useCallback(() => {
        onView(file.filename);
    }, [onView, file.filename]);

    return (
        <tr className={index % 2 === 0 ? 'bg-gray-50 dark:bg-[#333]' : 'bg-white dark:bg-[#2E2E2E]'}>
            <td className="px-3 py-3 text-center text-sm">
                <span className="underline break-words">
                    {`${filePathPrefix}/${formatFilePath(getCleanFileName(file.filename))}/${file.fileNumber}`}
                </span>
            </td>
            <td className="px-3 py-3 text-center text-sm">
                <div className="flex items-center justify-center gap-2">
                    {file.isOptimistic && (
                        <Loader2 className="w-4 h-4 animate-spin text-[#f15a22]" />
                    )}
                    {getCleanFileName(file.filename)}
                </div>
            </td>
            <td className="px-3 py-3 text-center text-sm">
                {getFileExtension(file.filename)}
            </td>
            <td className="px-3 py-3 text-center text-sm">
                {new Date(file.lastModified).toLocaleString()}
            </td>
            <td className="px-3 py-3 text-center">
                <div className="flex items-center justify-center gap-2">
                    {user?.role === 'Admin' && (
                        <button
                            onClick={handleDelete}
                            className="p-2 text-[#f15a22] hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            aria-label="Delete file"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                    )}
                    <button
                        onClick={handleView}
                        className="p-2 text-[#f15a22] hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors"
                        aria-label="View file"
                    >
                        <Eye className="w-5 h-5" />
                    </button>
                </div>
            </td>
        </tr>
    );
});

// Main FileTable Component
export default function FileTable({
    files,
    onDelete,
    onView,
    user,
    filePathPrefix = 'FILES'
}: FileTableProps) {
    return (
        <div className="w-full overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="w-full min-w-[600px] border-collapse">
                <thead>
                    <tr className="bg-gray-100 dark:bg-[#424242]">
                        {TABLE_HEADERS.map((header) => (
                            <th
                                key={header}
                                className="px-3 py-3 text-center text-sm font-bold text-gray-900 dark:text-white"
                            >
                                {header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="text-gray-900 dark:text-gray-100">
                    {files.map((file, index) => (
                        <FileRow
                            key={file.fileId || file.filename}
                            file={file}
                            index={index}
                            onDelete={onDelete}
                            onView={onView}
                            user={user}
                            filePathPrefix={filePathPrefix}
                        />
                    ))}
                </tbody>
            </table>
        </div>
    );
}
