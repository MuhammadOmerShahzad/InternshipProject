// File validation utilities
export const ALLOWED_EXTENSIONS = ['docx', 'pdf', 'jpeg', 'jpg', 'png', 'xlsx', 'xls', 'csv'];
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export interface FileValidationResult {
    valid: boolean;
    error?: string;
}

/**
 * Validate a file on the client side before upload
 */
export function validateFile(file: File): FileValidationResult {
    // Check file extension
    const ext = file.name.split('.').pop()?.toLowerCase();

    if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
        return {
            valid: false,
            error: `Invalid file type "${ext}". Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`
        };
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
        const maxSizeMB = (MAX_FILE_SIZE / (1024 * 1024)).toFixed(0);
        return {
            valid: false,
            error: `File "${file.name}" is too large (${sizeMB}MB). Maximum: ${maxSizeMB}MB`
        };
    }

    // Check for empty files
    if (file.size === 0) {
        return {
            valid: false,
            error: `File "${file.name}" is empty`
        };
    }

    return { valid: true };
}

/**
 * Validate multiple files and return separate valid/invalid lists
 */
export function validateFiles(files: File[]): {
    valid: File[];
    invalid: { file: File; error: string }[];
} {
    const valid: File[] = [];
    const invalid: { file: File; error: string }[] = [];

    for (const file of files) {
        const result = validateFile(file);
        if (result.valid) {
            valid.push(file);
        } else {
            invalid.push({ file, error: result.error || 'Unknown error' });
        }
    }

    return { valid, invalid };
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
