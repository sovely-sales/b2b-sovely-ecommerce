import cron from 'node-cron';
import { qikinkService } from './qikink.service.js';
import { Order } from '../models/Order.js';

cron.schedule('0 */2 * * *', async () => {
    console.log('🔄 [CRON] Polling Qikink for Order Status Updates...');

    try {
        const response = await qikinkService.request('/api/order');

        if (!Array.isArray(response)) {
            console.warn('⚠️ [CRON] Qikink polling returned invalid data format.');
            return;
        }

        for (const qikinkOrder of response) {
            if (!qikinkOrder.shipping || !qikinkOrder.shipping.awb) continue;

            const localOrder = await Order.findOne({ qikinkOrderId: String(qikinkOrder.order_id) });

            if (
                localOrder &&
                localOrder.status !== 'SHIPPED' &&
                localOrder.status !== 'DELIVERED'
            ) {
                localOrder.status = 'SHIPPED';

                localOrder.tracking = {
                    ...localOrder.tracking,
                    awbNumber: qikinkOrder.shipping.awb,
                    trackingUrl: qikinkOrder.shipping.tracking_link || '',
                };

                localOrder.statusHistory.push({
                    status: 'SHIPPED',
                    comment: `Order dispatched by Qikink. AWB: ${qikinkOrder.shipping.awb}`,
                    date: new Date(),
                });

                await localOrder.save();
                console.log(`✅ [CRON] Order ${localOrder.orderId} updated to SHIPPED.`);
            }
        }
    } catch (error) {
        console.error('❌ [CRON] Failed to poll Qikink statuses:', error.message);
    }
});

console.log('⏱️  Order polling cron service initialized.');
