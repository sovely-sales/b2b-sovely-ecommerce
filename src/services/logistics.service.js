class LogisticsService {
    constructor() {
        this.provider = 'MANUAL_CSV_SYNC';
    }

    async createShipment() {
        throw new Error('Automated shipments are disabled. Please use the Wukusy CSV pipeline.');
    }

    async getTrackingStatus() {
        return null;
    }

    async submitNdrAction(order, action, updatedPhone, updatedAddress) {
        console.log(`[Manual NDR Logged] Action: ${action} for Order: ${order.orderId}`);
        return true;
    }
}

export const logisticsService = new LogisticsService();
