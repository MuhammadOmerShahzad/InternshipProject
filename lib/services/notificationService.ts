// Notification service for fetching and managing notifications

export interface Notification {
    _id: string;
    title: string;
    message: string;
    type?: 'success' | 'error' | 'info';
    read: boolean;
    createdAt: string;
}

export interface NotificationResponse {
    notifications: Notification[];
    unread: number;
}

const getNotifications = async (limit = 20, skip = 0): Promise<NotificationResponse> => {
    try {
        // TODO: Replace with actual API endpoint
        // const response = await fetch(`/api/notifications?limit=${limit}&skip=${skip}`);
        // const data = await response.json();
        // return data;

        // Mock data for now
        return {
            notifications: [],
            unread: 0,
        };
    } catch (error) {
        console.error('Error fetching notifications:', error);
        throw error;
    }
};

const markAsRead = async (notificationIds: string[]): Promise<void> => {
    try {
        // TODO: Replace with actual API endpoint
        // await fetch('/api/notifications/mark-read', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify({ notificationIds }),
        // });

        // Mock success for now
        console.log('Marked as read:', notificationIds);
    } catch (error) {
        console.error('Error marking notifications as read:', error);
        throw error;
    }
};

export const notificationService = {
    getNotifications,
    markAsRead,
};
