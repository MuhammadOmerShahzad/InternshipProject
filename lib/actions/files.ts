'use server';

import { db } from '@/lib/db';
import { files, zones } from '@/lib/db/schema';
import { eq, and, asc, desc } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

// Allowed file extensions
const ALLOWED_EXTENSIONS = ['docx', 'pdf', 'jpeg', 'jpg', 'png', 'xlsx', 'xls', 'csv'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Files are stored in public/uploads/ so Next.js serves them as static assets
const UPLOADS_DIR = join(process.cwd(), 'public', 'uploads');

export interface FileRecord {
    id: string;
    filename: string;
    original_filename: string;
    file_type: string;
    file_size: number;
    storage_path: string;
    module_slug: string;
    submodule_slug: string;
    zone_id: string;
    branch_id: string;
    uploaded_by: string;
    created_at: string;
    zone_name?: string;
    branch_name?: string;
    uploader_name?: string;
}

/**
 * Get file extension from filename
 */
function getFileExtension(filename: string): string {
    const parts = filename.split('.');
    return parts.length > 1 ? parts.pop()?.toLowerCase() || '' : '';
}

/**
 * Sanitize filename for storage
 */
function sanitizeFilename(filename: string): string {
    return filename
        .toLowerCase()
        .replace(/[^a-z0-9.-]/g, '_')
        .replace(/_+/g, '_');
}

/**
 * Get authenticated user ID from session cookie
 */
async function getAuthUserId(): Promise<string | null> {
    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value;
    const session = cookieStore.get('session')?.value;
    if (!userId || !session) return null;
    return userId;
}

/**
 * Upload a file to a specific module/submodule for a zone/branch
 */
export async function uploadFile(formData: FormData) {
    const userId = await getAuthUserId();
    if (!userId) return { success: false, error: 'Not authenticated' };

    const file = formData.get('file') as File;
    const moduleSlug = formData.get('moduleSlug') as string;
    const submoduleSlug = formData.get('submoduleSlug') as string;
    const zoneId = formData.get('zoneId') as string;
    const branchId = formData.get('branchId') as string;

    if (!file || !moduleSlug || !submoduleSlug || !zoneId || !branchId) {
        return { success: false, error: 'Missing required fields' };
    }

    // Validate file extension
    const extension = getFileExtension(file.name);
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
        return {
            success: false,
            error: `Invalid file type. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`
        };
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
        return { success: false, error: 'File size exceeds 10MB limit' };
    }

    try {
        // Get zone code for path
        const [zoneData] = await db
            .select({ code: zones.code })
            .from(zones)
            .where(eq(zones.id, zoneId))
            .limit(1);

        const zoneCode = zoneData?.code || 'UNKNOWN';

        // Build storage path and ensure directory exists
        const timestamp = Date.now();
        const sanitizedFilename = sanitizeFilename(file.name);
        const relativePath = `${moduleSlug}/${submoduleSlug}/${zoneCode}/${branchId}`;
        const storagePath = `${relativePath}/${timestamp}_${sanitizedFilename}`;
        const fullDir = join(UPLOADS_DIR, relativePath);

        if (!existsSync(fullDir)) {
            await mkdir(fullDir, { recursive: true });
        }

        // Write file to disk
        const buffer = Buffer.from(await file.arrayBuffer());
        await writeFile(join(UPLOADS_DIR, storagePath), buffer);

        // Insert record into DB
        const [fileRecord] = await db
            .insert(files)
            .values({
                filename: sanitizedFilename,
                originalFilename: file.name,
                fileType: extension,
                fileSize: file.size,
                storagePath,
                moduleSlug,
                submoduleSlug,
                zoneId,
                branchId,
                uploadedBy: userId,
            })
            .returning();

        return { success: true, file: fileRecord };
    } catch (err) {
        console.error('Upload error:', err);
        const msg = err instanceof Error ? err.message : 'Upload failed';
        return { success: false, error: msg };
    }
}

/**
 * Get files for a specific module/submodule/zone/branch
 */
export async function getFiles(
    moduleSlug: string,
    submoduleSlug: string,
    zoneId: string,
    branchId: string
) {
    try {
        const result = await db.query.files.findMany({
            where: and(
                eq(files.moduleSlug, moduleSlug),
                eq(files.submoduleSlug, submoduleSlug),
                eq(files.zoneId, zoneId),
                eq(files.branchId, branchId)
            ),
            orderBy: [asc(files.createdAt)],
            with: {
                zone: true,
                branch: true,
                uploader: true,
            },
        });

        const mapped: FileRecord[] = result.map((f) => ({
            id: f.id,
            filename: f.filename,
            original_filename: f.originalFilename,
            file_type: f.fileType,
            file_size: f.fileSize,
            storage_path: f.storagePath,
            module_slug: f.moduleSlug,
            submodule_slug: f.submoduleSlug,
            zone_id: f.zoneId,
            branch_id: f.branchId,
            uploaded_by: f.uploadedBy,
            created_at: f.createdAt?.toISOString() ?? '',
            zone_name: f.zone?.name || 'N/A',
            branch_name: f.branch?.name || 'N/A',
            uploader_name: f.uploader
                ? `${f.uploader.firstName}${f.uploader.lastName ? ' ' + f.uploader.lastName : ''}`
                : 'Unknown',
        }));

        return { files: mapped, error: null };
    } catch (err) {
        console.error('Error fetching files:', err);
        return { files: [], error: 'Failed to fetch files' };
    }
}

/**
 * Delete a file (admin only)
 */
export async function deleteFile(fileId: string) {
    const userId = await getAuthUserId();
    if (!userId) return { success: false, error: 'Not authenticated' };

    try {
        // Verify admin role
        const { users: usersTable } = await import('@/lib/db/schema');
        const [userData] = await db
            .select({ role: usersTable.role })
            .from(usersTable)
            .where(eq(usersTable.id, userId))
            .limit(1);

        if (userData?.role !== 'Admin') {
            return { success: false, error: 'Only admins can delete files' };
        }

        // Get file record
        const [fileRecord] = await db
            .select({ storagePath: files.storagePath })
            .from(files)
            .where(eq(files.id, fileId))
            .limit(1);

        if (!fileRecord) return { success: false, error: 'File not found' };

        // Delete from disk (best effort)
        try {
            await unlink(join(UPLOADS_DIR, fileRecord.storagePath));
        } catch {
            console.warn('File not found on disk, removing DB record anyway');
        }

        // Delete from DB
        await db.delete(files).where(eq(files.id, fileId));

        return { success: true };
    } catch (err) {
        console.error('Delete error:', err);
        return { success: false, error: 'Delete failed' };
    }
}

/**
 * Get a download URL for a file
 * Files stored in public/uploads/ are served as static assets at /uploads/...
 */
export async function getFileDownloadUrl(fileId: string) {
    const userId = await getAuthUserId();
    if (!userId) return { url: null, error: 'Not authenticated' };

    try {
        const [fileRecord] = await db
            .select({ storagePath: files.storagePath, originalFilename: files.originalFilename })
            .from(files)
            .where(eq(files.id, fileId))
            .limit(1);

        if (!fileRecord) return { url: null, error: 'File not found' };

        // Files in public/uploads/ are served at /uploads/
        const url = `/uploads/${fileRecord.storagePath}`;
        return { url, error: null };
    } catch (err) {
        console.error('Download URL error:', err);
        return { url: null, error: 'Could not generate download link' };
    }
}
