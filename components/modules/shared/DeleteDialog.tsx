'use client';

import { AlertTriangle } from 'lucide-react';

interface DeleteDialogProps {
    isOpen: boolean;
    filename: string | null;
    onConfirm: () => void;
    onCancel: () => void;
}

export default function DeleteDialog({
    isOpen,
    filename,
    onConfirm,
    onCancel
}: DeleteDialogProps) {
    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 z-50 transition-opacity"
                onClick={onCancel}
            />

            {/* Dialog */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div
                    className="
            bg-white dark:bg-gray-800 rounded-xl shadow-2xl
            max-w-md w-full p-6
            transform transition-all
          "
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Icon */}
                    <div className="flex justify-center mb-4">
                        <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                            <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                        </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-semibold text-center text-gray-900 dark:text-white mb-2">
                        Delete Confirmation
                    </h3>

                    {/* Content */}
                    <p className="text-center text-gray-600 dark:text-gray-300 mb-6">
                        Are you sure you want to delete the file <br />
                        <span className="font-medium text-gray-900 dark:text-white">&ldquo;{filename}&rdquo;</span>?
                    </p>

                    {/* Actions */}
                    <div className="flex gap-3 justify-center">
                        <button
                            onClick={onCancel}
                            className="
                px-6 py-2 rounded-lg font-medium
                bg-gray-200 dark:bg-gray-700 
                text-gray-800 dark:text-gray-200
                hover:bg-gray-300 dark:hover:bg-gray-600
                transition-colors
              "
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            className="
                px-6 py-2 rounded-lg font-medium
                bg-red-600 text-white
                hover:bg-red-700
                transition-colors
              "
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
