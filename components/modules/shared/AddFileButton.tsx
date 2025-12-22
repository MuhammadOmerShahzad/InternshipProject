'use client';

import { useRef, useCallback } from 'react';
import { Upload } from 'lucide-react';

interface AddFileButtonProps {
    onFileSelect: (files: File[] | File) => void;
    multiple?: boolean;
    disabled?: boolean;
}

export default function AddFileButton({
    onFileSelect,
    multiple = false,
    disabled = false
}: AddFileButtonProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleAddFileClick = useCallback(() => {
        if (!disabled && fileInputRef.current) {
            fileInputRef.current.click();
        }
    }, [disabled]);

    const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(event.target.files || []);

        if (selectedFiles.length > 0 && onFileSelect) {
            if (multiple) {
                onFileSelect(selectedFiles);
            } else {
                onFileSelect(selectedFiles[0]);
            }
        }

        event.target.value = '';
    }, [onFileSelect, multiple]);

    return (
        <>
            <input
                type="file"
                ref={fileInputRef}
                multiple={multiple}
                style={{ display: 'none' }}
                onChange={handleFileChange}
                accept=".pdf,.docx,.xlsx,.csv,.txt,.png,.jpg,.jpeg,.webp"
            />

            <button
                onClick={handleAddFileClick}
                disabled={disabled}
                className={`
          flex items-center gap-2 px-4 py-2 rounded-lg
          bg-[#f15a22] text-white font-medium
          transition-all duration-300
          ${disabled
                        ? 'opacity-60 cursor-not-allowed'
                        : 'hover:bg-[#d14e1d] hover:scale-105 active:scale-95'
                    }
        `}
            >
                <Upload className="w-5 h-5" />
                <span className="hidden sm:inline">{multiple ? 'Add Files' : 'Add File'}</span>
            </button>
        </>
    );
}
