import { Resend } from 'resend';

class EmailService {
    constructor() {
        this.apiKey = process.env.RESEND_API_KEY;
        this.resend = this.apiKey ? new Resend(this.apiKey) : null;
    }

    async sendInvoiceEmail(user, order, invoice, pdfBuffer) {
        if (!this.resend) {
            console.log(
                `📧 [MOCK EMAIL] Triggered Invoice Email to: ${user.email} for Order: ${order.orderId}`
            );
            return;
        }

        try {
            await this.resend.emails.send({
                from: 'Sovely B2B <onboarding@resend.dev>',
                to: user.email,
                subject: `Your Tax Invoice for Order ${order.orderId}`,
                html: `
                    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
                        <h2 style="color: #0f172a; margin-top: 0;">Procurement Confirmed</h2>
                        <p style="color: #475569; font-size: 16px;">Hi <strong>${user.name}</strong>,</p>
                        <p style="color: #475569; font-size: 16px; line-height: 1.5;">
                            Thank you for your order (<strong>${order.orderId}</strong>). We have successfully received your payment from your corporate wallet, and your items are currently being processed for dispatch.
                        </p>
                        <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
                            <p style="margin: 0; color: #0f172a; font-weight: bold;">Order Total: ₹${invoice.grandTotal.toLocaleString('en-IN')}</p>
                            <p style="margin: 4px 0 0 0; color: #64748b; font-size: 14px;">Status: PENDING (Awaiting Logistics Checks)</p>
                        </div>
                        <p style="color: #475569; font-size: 16px; line-height: 1.5;">
                            Please find your legally compliant GST Tax Invoice attached to this email. You can also track your shipments live from your dashboard.
                        </p>
                        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
                        <p style="color: #94a3b8; font-size: 12px; text-align: center;">
                            This is an automated message from the Sovely B2B Network.<br/>
                            Infinity Enterprises, Bengaluru, KA 560038
                        </p>
                    </div>
                `,
                attachments: [
                    {
                        filename: `Tax_Invoice_${invoice.invoiceNumber}.pdf`,
                        content: pdfBuffer,
                    },
                ],
            });
            console.log(`✅ Invoice Email successfully sent to ${user.email}`);
        } catch (error) {
            console.error('❌ Failed to send invoice email via Resend:', error);
        }
    }

    async sendNdrAlertEmail(user, order, reason) {
        if (!this.resend) {
            console.log(`📧 [MOCK EMAIL] NDR Alert to: ${user.email} for Order: ${order.orderId}`);
            return;
        }

        try {
            await this.resend.emails.send({
                from: 'Sovely Operations <onboarding@resend.dev>',
                to: user.email,
                subject: `URGENT ACTION REQUIRED: Delivery Failed for Order ${order.orderId}`,
                html: `
                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #fcd34d; border-radius: 12px; background-color: #fffbeb;">
                        <h2 style="color: #b45309; margin-top: 0;">Delivery Attempt Failed</h2>
                        <p style="color: #78350f; font-size: 16px;">Hi <strong>${user.name}</strong>,</p>
                        <p style="color: #78350f; font-size: 16px; line-height: 1.5;">
                            Our logistics partner attempted to deliver order <strong>${order.orderId}</strong> to <strong>${order.endCustomerDetails?.name || 'your customer'}</strong>, but it failed.
                        </p>
                        <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #fde68a;">
                            <p style="margin: 0; color: #92400e; font-weight: bold;">Courier Reason: ${reason || 'Customer Unavailable'}</p>
                        </div>
                        <p style="color: #b45309; font-size: 16px; font-weight: bold;">
                            ⚠️ You have exactly 24 hours to request a reattempt with updated contact details. If no action is taken, the package will automatically be Returned to Origin (RTO) and shipping fees will be forfeited.
                        </p>
                        <p style="color: #78350f; font-size: 14px;">Log into your Operations Hub immediately to resolve this.</p>
                    </div>
                `,
            });
            console.log(`✅ NDR Email successfully sent to ${user.email}`);
        } catch (error) {
            console.error('❌ Failed to send NDR email via Resend:', error);
        }
    }

    async sendAdminNewOrderAlert(admin, order, reseller) {
        if (!this.resend) {
            console.log(
                `📧 [MOCK EMAIL] Admin Alert sent to: ${admin.email} for B2B Order: ${order.orderId}`
            );
            return;
        }

        const isEwayBillRequired = order.totalPlatformCost >= 50000;
        const resellerName = reseller.companyName || reseller.name;

        try {
            await this.resend.emails.send({
                from: 'Sovely Alerts <onboarding@resend.dev>',
                to: admin.email,
                subject: `[ACTION REQUIRED] New B2B Order - ${order.orderId} from ${resellerName}`,
                html: `
                    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
                        <h2 style="color: #1e40af; margin-top: 0;">New Wholesale Procurement</h2>
                        <p style="color: #475569; font-size: 16px;">Admin,</p>
                        <p style="color: #475569; font-size: 16px; line-height: 1.5;">
                            <strong>${resellerName}</strong> has just placed a new B2B wholesale order. The funds have been secured from their wallet. It requires your authorization to proceed to the warehouse packing queue.
                        </p>
                        <div style="background-color: #eff6ff; padding: 15px; border-radius: 8px; border: 1px solid #bfdbfe; margin: 20px 0;">
                            <p style="margin: 0; color: #1e3a8a; font-weight: bold;">Order ID: ${order.orderId}</p>
                            <p style="margin: 8px 0 0 0; color: #1e3a8a;">Total Value: <strong>₹${order.totalPlatformCost.toLocaleString('en-IN')}</strong></p>
                            <p style="margin: 8px 0 0 0; color: #1e3a8a;">Items: ${order.items.length}</p>
                            <p style="margin: 8px 0 0 0; color: #1e3a8a;">Billable Weight: ${order.totalBillableWeight} kg</p>
                        </div>
                        
                        ${
                            isEwayBillRequired
                                ? `
                        <div style="background-color: #fef2f2; padding: 15px; border-radius: 8px; border: 1px solid #fecaca; margin: 20px 0;">
                            <p style="margin: 0; color: #991b1b; font-weight: bold;">⚠️ E-Way Bill Required</p>
                            <p style="margin: 4px 0 0 0; color: #7f1d1d; font-size: 14px;">This order value exceeds ₹50,000. You must generate an E-Way Bill on the NIC portal and attach it to this order before dispatching.</p>
                        </div>
                        `
                                : ''
                        }
                        
                        <p style="color: #475569; font-size: 14px;">Log in to the Admin Dashboard to review and authorize.</p>
                    </div>
                `,
            });
            console.log(`✅ Admin Alert sent for ${order.orderId}`);
        } catch (error) {
            console.error('❌ Failed to send Admin Alert email:', error);
        }
    }

    async sendOrderApprovedEmail(reseller, order) {
        if (!this.resend) {
            console.log(
                `📧 [MOCK EMAIL] Approval sent to: ${reseller.email} for B2B Order: ${order.orderId}`
            );
            return;
        }

        try {
            await this.resend.emails.send({
                from: 'Sovely Operations <onboarding@resend.dev>',
                to: reseller.email,
                subject: `Order Approved & Processing: ${order.orderId}`,
                html: `
                    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
                        <h2 style="color: #065f46; margin-top: 0;">Order Authorized for Dispatch! 🎉</h2>
                        <p style="color: #475569; font-size: 16px;">Hi <strong>${reseller.name}</strong>,</p>
                        <p style="color: #475569; font-size: 16px; line-height: 1.5;">
                            Great news! Your wholesale order <strong>${order.orderId}</strong> has cleared all internal checks and has been authorized by our operations team.
                        </p>
                        
                        <div style="background-color: #ecfdf5; padding: 15px; border-radius: 8px; border: 1px solid #a7f3d0; margin: 20px 0;">
                            <p style="margin: 0; color: #065f46; font-weight: bold;">Status: PROCESSING</p>
                            <p style="margin: 4px 0 0 0; color: #047857; font-size: 14px;">Your inventory is currently being picked, packed, and assigned to a logistics partner.</p>
                        </div>
                        
                        ${
                            order.ewayBillNumber
                                ? `
                        <p style="color: #475569; font-size: 14px; line-height: 1.5; font-weight: bold;">
                            🚛 State E-Way Bill Generated: <span style="color: #0f172a;">${order.ewayBillNumber}</span>
                        </p>
                        `
                                : ''
                        }

                        <p style="color: #475569; font-size: 16px; line-height: 1.5;">
                            You will receive another notification with your tracking (AWB) number as soon as the package leaves our warehouse.
                        </p>
                    </div>
                `,
            });
            console.log(`✅ Reseller Approval Email sent for ${order.orderId}`);
        } catch (error) {
            console.error('❌ Failed to send Order Approval email:', error);
        }
    }
}

export const emailService = new EmailService();
