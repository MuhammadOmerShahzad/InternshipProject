import { toast as sonnerToast } from 'sonner';

/**
 * Custom toast utility with consistent styling across the application
 * Uses Sonner library with customized options for the Muawin platform
 */

export const toast = {
    success: (message: string, options?: Parameters<typeof sonnerToast.success>[1]) => {
        return sonnerToast.success(message, {
            duration: 3000,
            ...options,
        });
    },

    error: (message: string, options?: Parameters<typeof sonnerToast.error>[1]) => {
        return sonnerToast.error(message, {
            duration: 4000,
            ...options,
        });
    },

    info: (message: string, options?: Parameters<typeof sonnerToast.info>[1]) => {
        return sonnerToast.info(message, {
            duration: 3000,
            ...options,
        });
    },

    warning: (message: string, options?: Parameters<typeof sonnerToast.warning>[1]) => {
        return sonnerToast.warning(message, {
            duration: 3500,
            ...options,
        });
    },

    loading: (message: string, options?: Parameters<typeof sonnerToast.loading>[1]) => {
        return sonnerToast.loading(message, options);
    },

    promise: <T,>(
        promise: Promise<T>,
        messages: {
            loading: string;
            success: string | ((data: T) => string);
            error: string | ((error: unknown) => string);
        }
    ) => {
        return sonnerToast.promise(promise, messages);
    },

    dismiss: (toastId?: string | number) => {
        return sonnerToast.dismiss(toastId);
    },
};

// Re-export the original toast for advanced use cases
export { toast as sonner } from 'sonner';
