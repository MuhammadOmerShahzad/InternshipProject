import imageCompression from 'browser-image-compression';
import { PDFDocument } from 'pdf-lib';

export interface CompressionResult {
    compressedFile: File;
    originalSize: number;
    compressedSize: number;
    compressionRatio: number; // percentage saved
}

/**
 * Compress an image file (JPEG, PNG)
 * Target: Reduce to ~1MB while maintaining HD quality (1920px max dimension)
 */
export async function compressImage(file: File): Promise<CompressionResult> {
    const options = {
        maxSizeMB: 1,              // Target max 1MB per image
        maxWidthOrHeight: 1920,    // Max dimension (HD quality)
        useWebWorker: true,        // Non-blocking compression
        fileType: file.type,       // Preserve original format
    };

    const originalSize = file.size;

    try {
        const compressedBlob = await imageCompression(file, options);

        // Create new File object with original name
        const compressedFile = new File([compressedBlob], file.name, {
            type: file.type,
            lastModified: Date.now(),
        });

        const compressedSize = compressedFile.size;
        const compressionRatio = ((originalSize - compressedSize) / originalSize) * 100;

        return {
            compressedFile,
            originalSize,
            compressedSize,
            compressionRatio: Math.max(0, compressionRatio), // Ensure non-negative
        };
    } catch (error) {
        console.error('Image compression error:', error);
        // If compression fails, return original file
        return {
            compressedFile: file,
            originalSize,
            compressedSize: originalSize,
            compressionRatio: 0,
        };
    }
}

/**
 * Compress a PDF file
 * Optimizes PDF structure and compresses embedded resources
 */
export async function compressPDF(file: File): Promise<CompressionResult> {
    const originalSize = file.size;

    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);

        // Save with compression options
        const compressedBytes = await pdfDoc.save({
            useObjectStreams: true,  // Use object streams for better compression
            addDefaultPage: false,   // Don't add empty pages
        });

        // pdf-lib returns a Uint8Array which is compatible with Blob/File constructor
        // TypeScript strict mode requires explicit type handling
        const compressedFile = new File([compressedBytes as unknown as BlobPart], file.name, {
            type: 'application/pdf',
            lastModified: Date.now(),
        });

        const compressedSize = compressedFile.size;
        const compressionRatio = ((originalSize - compressedSize) / originalSize) * 100;

        return {
            compressedFile,
            originalSize,
            compressedSize,
            compressionRatio: Math.max(0, compressionRatio),
        };
    } catch (error) {
        console.error('PDF compression error:', error);
        // If compression fails, return original file
        return {
            compressedFile: file,
            originalSize,
            compressedSize: originalSize,
            compressionRatio: 0,
        };
    }
}

/**
 * Determine if a file should be compressed based on its type
 */
export function shouldCompressFile(filename: string): boolean {
    const ext = filename.split('.').pop()?.toLowerCase();

    // Compress images and PDFs only
    // Don't compress: CSV, XLS, XLSX, DOCX (already compressed or risk corruption)
    const compressibleExtensions = ['jpeg', 'jpg', 'png', 'pdf'];

    return ext ? compressibleExtensions.includes(ext) : false;
}

/**
 * Get file extension from filename
 */
function getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || '';
}

/**
 * Compress a file based on its type
 * Returns original file if no compression is needed or if compression fails
 */
export async function compressFile(file: File): Promise<CompressionResult> {
    const ext = getFileExtension(file.name);

    // Check if file should be compressed
    if (!shouldCompressFile(file.name)) {
        // Return original file without compression
        return {
            compressedFile: file,
            originalSize: file.size,
            compressedSize: file.size,
            compressionRatio: 0,
        };
    }

    // Compress based on file type
    if (['jpeg', 'jpg', 'png'].includes(ext)) {
        return await compressImage(file);
    } else if (ext === 'pdf') {
        return await compressPDF(file);
    }

    // Fallback: return original file
    return {
        compressedFile: file,
        originalSize: file.size,
        compressedSize: file.size,
        compressionRatio: 0,
    };
}

/**
 * Compress multiple files in parallel
 */
export async function compressFiles(files: File[]): Promise<CompressionResult[]> {
    return Promise.all(files.map(file => compressFile(file)));
}
