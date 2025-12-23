'use server';

import { createServiceClient, createClient } from '@/lib/supabase/server';

// Allowed file extensions
const ALLOWED_EXTENSIONS = ['docx', 'pdf', 'jpeg', 'jpg', 'png', 'xlsx', 'xls', 'csv'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export interface FileRecord {
    id: string;
    filename: string;
    original_filename: string;
    file_type: string;
    file_size: number;
    storage_path: string;
    module_slug: string;
    submodule_slug: string;
    serial_number: number;
    zone_id: string;
    branch_id: string;
    uploaded_by: string;
    created_at: string;
    zone_name?: string;
    branch_name?: string;
    uploader_name?: string;
}

export interface UploadFileInput {
    file: File;
    moduleSlug: string;
    submoduleSlug: string;
    zoneId: string;
    branchId: string;
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
 * Upload a file to a specific module/submodule for a zone/branch
 */
export async function uploadFile(formData: FormData) {
    const supabase = await createClient();
    const serviceClient = createServiceClient();

    // Get current user
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    if (authError || !authUser) {
        return { success: false, error: 'Not authenticated' };
    }

    // Extract form data
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
        return { success: false, error: 'File size exceeds 50MB limit' };
    }

    // Get zone code for path
    const { data: zoneData } = await serviceClient
        .from('zones')
        .select('code')
        .eq('id', zoneId)
        .single();

    const zoneCode = zoneData?.code || 'UNKNOWN';

    // Get the next serial number for this module/submodule
    const { data: maxSerialData } = await serviceClient
        .from('files')
        .select('serial_number')
        .eq('module_slug', moduleSlug)
        .eq('submodule_slug', submoduleSlug)
        .order('serial_number', { ascending: false })
        .limit(1)
        .maybeSingle();

    const nextSerialNumber = (maxSerialData?.serial_number || 0) + 1;

    // Generate unique storage path
    const timestamp = Date.now();
    const sanitizedFilename = sanitizeFilename(file.name);
    const storagePath = `${moduleSlug}/${submoduleSlug}/${zoneCode}/${branchId}/${timestamp}_${sanitizedFilename}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await serviceClient.storage
        .from('module-files')
        .upload(storagePath, file, {
            contentType: file.type,
            upsert: false,
        });

    if (uploadError) {
        console.error('Storage upload error:', uploadError);
        return { success: false, error: `Upload failed: ${uploadError.message}` };
    }

    // Insert record into database
    const { data: fileRecord, error: dbError } = await serviceClient
        .from('files')
        .insert({
            filename: sanitizedFilename,
            original_filename: file.name,
            file_type: extension,
            file_size: file.size,
            storage_path: storagePath,
            module_slug: moduleSlug,
            submodule_slug: submoduleSlug,
            serial_number: nextSerialNumber,
            zone_id: zoneId,
            branch_id: branchId,
            uploaded_by: authUser.id,
        })
        .select()
        .single();

    if (dbError) {
        console.error('Database insert error:', dbError);
        // Try to clean up the uploaded file
        await serviceClient.storage.from('module-files').remove([storagePath]);
        return { success: false, error: `Database error: ${dbError.message}` };
    }

    return { success: true, file: fileRecord };
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
    const serviceClient = createServiceClient();

    const { data, error } = await serviceClient
        .from('files')
        .select(`
            *,
            zones:zone_id(name),
            branches:branch_id(name),
            users:uploaded_by(name)
        `)
        .eq('module_slug', moduleSlug)
        .eq('submodule_slug', submoduleSlug)
        .eq('zone_id', zoneId)
        .eq('branch_id', branchId)
        .order('serial_number', { ascending: true });

    if (error) {
        console.error('Error fetching files:', error);
        return { files: [], error: error.message };
    }

    // Transform data to include names
    const files: FileRecord[] = (data || []).map((file) => ({
        ...file,
        zone_name: file.zones?.name || 'N/A',
        branch_name: file.branches?.name || 'N/A',
        uploader_name: file.users?.name || 'Unknown',
    }));

    return { files, error: null };
}

/**
 * Delete a file (admin only)
 */
export async function deleteFile(fileId: string) {
    const supabase = await createClient();
    const serviceClient = createServiceClient();

    // Check if user is admin
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
        return { success: false, error: 'Not authenticated' };
    }

    const { data: userData } = await serviceClient
        .from('users')
        .select('role')
        .eq('id', authUser.id)
        .single();

    if (userData?.role !== 'Admin') {
        return { success: false, error: 'Only admins can delete files' };
    }

    // Get file record first
    const { data: fileRecord, error: fetchError } = await serviceClient
        .from('files')
        .select('storage_path')
        .eq('id', fileId)
        .single();

    if (fetchError || !fileRecord) {
        return { success: false, error: 'File not found' };
    }

    // Delete from storage
    const { error: storageError } = await serviceClient.storage
        .from('module-files')
        .remove([fileRecord.storage_path]);

    if (storageError) {
        console.error('Storage delete error:', storageError);
        // Continue to delete DB record anyway
    }

    // Delete from database
    const { error: dbError } = await serviceClient
        .from('files')
        .delete()
        .eq('id', fileId);

    if (dbError) {
        console.error('Database delete error:', dbError);
        return { success: false, error: `Delete failed: ${dbError.message}` };
    }

    return { success: true };
}

/**
 * Get a signed download URL for a file (valid for 1 hour)
 */
export async function getFileDownloadUrl(fileId: string) {
    const supabase = await createClient();
    const serviceClient = createServiceClient();

    // Verify user is authenticated
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
        return { url: null, error: 'Not authenticated' };
    }

    // Get file record
    const { data: fileRecord, error: fetchError } = await serviceClient
        .from('files')
        .select('storage_path, original_filename')
        .eq('id', fileId)
        .single();

    if (fetchError || !fileRecord) {
        return { url: null, error: 'File not found' };
    }

    // Generate signed URL (valid for 1 hour)
    const { data: signedUrl, error: urlError } = await serviceClient.storage
        .from('module-files')
        .createSignedUrl(fileRecord.storage_path, 3600, {
            download: fileRecord.original_filename,
        });

    if (urlError) {
        console.error('Signed URL error:', urlError);
        return { url: null, error: 'Could not generate download link' };
    }

    return { url: signedUrl.signedUrl, error: null };
}
