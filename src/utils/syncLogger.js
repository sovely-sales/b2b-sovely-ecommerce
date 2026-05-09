import { SyncHistory } from '../models/SyncHistory.js';

/**
 * Logs a sync/import/export operation to the database.
 */
export const logSync = async ({
    adminId,
    type,
    purpose,
    filename,
    fileSize,
    status = 'SUCCESS',
    details = {}
}) => {
    try {
        await SyncHistory.create({
            admin: adminId,
            type,
            purpose,
            filename,
            fileSize,
            status,
            details
        });
    } catch (error) {
        console.error('Failed to log sync history:', error);
    }
};
