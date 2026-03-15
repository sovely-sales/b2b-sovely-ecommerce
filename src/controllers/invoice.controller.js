import { Invoice } from '../models/Invoice.js';
import { Order } from '../models/Order.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode'; // Newly added for the B2C dynamic QR

export const getInvoice = asyncHandler(async (req, res) => {
    const invoice = await Invoice.findOne({
        _id: req.params.id,
        userId: req.user._id
    }).populate('orderId');

    if (!invoice) throw new ApiError(404, "Invoice not found");

    return res.status(200).json(new ApiResponse(200, invoice, "Invoice details fetched"));
});

export const listMyInvoices = asyncHandler(async (req, res) => {
    const invoices = await Invoice.find({ userId: req.user._id })
        .populate('orderId')
        .sort({ createdAt: -1 });

    return res.status(200).json(new ApiResponse(200, invoices, "Invoices fetched successfully"));
});

export const markAsPaidManual = asyncHandler(async (req, res) => {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) throw new ApiError(404, "Invoice not found");

    if (invoice.status === 'PAID') {
        throw new ApiError(400, "Invoice is already paid");
    }

    invoice.status = 'PAID';
    await invoice.save();

    if (invoice.invoiceType === 'ORDER_BILL' && invoice.orderId) {
        await Order.findByIdAndUpdate(invoice.orderId, { status: 'COMPLETED' });
    }

    return res.status(200).json(new ApiResponse(200, invoice, "Invoice marked as paid manually"));
});

// Helper for Amount in Words (Basic Indian Numbering System)
const amountToWords = (amount) => {
    return `Rupees ${Math.floor(amount)} Only`; // Keep it simple for now, can expand later
};

export const generateInvoicePDF = asyncHandler(async (req, res) => {
    const invoice = await Invoice.findOne({
        _id: req.params.id,
        userId: req.user._id
    }).populate('orderId');

    if (!invoice) throw new ApiError(404, "Invoice not found");

    const doc = new PDFDocument({ margin: 40, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Tax_Invoice_${invoice.invoiceNumber}.pdf`);
    doc.pipe(res);

    // --- 1. HEADER & TITLE ---
    doc.fontSize(16).font('Helvetica-Bold').text('TAX INVOICE', { align: 'center' });
    doc.moveDown(1.5);

    // --- 2. SUPPLIER & BUYER DETAILS ---
    const topY = doc.y;

    // Supplier (Left)
    doc.fontSize(10).font('Helvetica-Bold').text('Sold By:', 40, topY);
    doc.font('Helvetica').text('Sovely E-Commerce Pvt. Ltd.');
    doc.text('123 Commerce St., Indiranagar');
    doc.text('Bengaluru, Karnataka, 560038');
    doc.font('Helvetica-Bold').text('GSTIN: ', { continued: true }).font('Helvetica').text('29ABCDE1234F1Z5');
    doc.font('Helvetica-Bold').text('PAN: ', { continued: true }).font('Helvetica').text('ABCDE1234F');
    doc.text('State Code: 29 (Karnataka)');

    // Buyer (Right)
    doc.font('Helvetica-Bold').text('Billed To:', 320, topY);
    doc.font('Helvetica').text(req.user.name || 'Valued Customer');
    doc.text(req.user.email);
    doc.text('Bengaluru, Karnataka'); // Mocked until address schema exists
    doc.text('State Code: 29 (Karnataka)');
    doc.text('Place of Supply: Karnataka');

    doc.moveDown(2);

    // --- 3. INVOICE META DATA ---
    const metaY = doc.y;
    doc.rect(40, metaY - 5, 515, 45).stroke('#cccccc'); // Light border box
    
    doc.font('Helvetica-Bold').fontSize(9).text('Invoice Number: ', 50, metaY).font('Helvetica').text(invoice.invoiceNumber, 130, metaY);
    doc.font('Helvetica-Bold').text('Invoice Date: ', 50, metaY + 15).font('Helvetica').text(new Date(invoice.createdAt).toLocaleDateString('en-IN'), 130, metaY + 15);
    
    if (invoice.orderId) {
        doc.font('Helvetica-Bold').text('Order Ref: ', 320, metaY).font('Helvetica').text(invoice.orderId.orderId || 'N/A', 380, metaY);
        doc.font('Helvetica-Bold').text('Order Date: ', 320, metaY + 15).font('Helvetica').text(new Date(invoice.orderId.orderDate || invoice.createdAt).toLocaleDateString('en-IN'), 380, metaY + 15);
    }

    doc.moveDown(3);

    // --- 4. PRODUCT TABLE ---
    if (invoice.invoiceType === 'ORDER_BILL' && invoice.orderId) {
        let y = doc.y;
        
        // Table Header
        doc.font('Helvetica-Bold').fontSize(8);
        doc.rect(40, y - 5, 515, 20).fillAndStroke('#f0f0f0', '#cccccc');
        doc.fillColor('#000000');
        doc.text('S.No', 45, y);
        doc.text('Product / SKU', 75, y);
        doc.text('HSN', 230, y);
        doc.text('Qty', 270, y);
        doc.text('Base (Rs)', 300, y);
        doc.text('CGST 9%', 360, y);
        doc.text('SGST 9%', 420, y);
        doc.text('Total (Rs)', 480, y);

        y += 20;
        doc.font('Helvetica').fontSize(8);

        let totalBase = 0;
        let totalTax = 0;
        let index = 1;

        // Table Rows
        for (const item of invoice.orderId.items) {
            // Reverse calculate 18% GST (inclusive)
            const qty = item.qty;
            const finalTotal = item.price * qty;
            const baseTotal = finalTotal / 1.18;
            const taxAmount = finalTotal - baseTotal;
            const cgst = taxAmount / 2;
            const sgst = taxAmount / 2;

            totalBase += baseTotal;
            totalTax += taxAmount;

            // Handle long SKUs gracefully
            const displaySku = item.sku.length > 30 ? item.sku.substring(0, 27) + '...' : item.sku;

            doc.text(index.toString(), 45, y);
            doc.text(displaySku, 75, y);
            doc.text('39269099', 230, y); // Mock HSN code for physical goods
            doc.text(qty.toString(), 270, y);
            doc.text(baseTotal.toFixed(2), 300, y);
            doc.text(cgst.toFixed(2), 360, y);
            doc.text(sgst.toFixed(2), 420, y);
            doc.text(finalTotal.toFixed(2), 480, y);

            y += 20;
            index++;
        }

        // Table Bottom Border
        doc.moveTo(40, y - 5).lineTo(555, y - 5).stroke('#cccccc');
        y += 5;

        // --- 5. TOTALS SUMMARY ---
        doc.font('Helvetica-Bold').fontSize(9);
        doc.text('Total Taxable Value:', 360, y);
        doc.text(`Rs. ${totalBase.toFixed(2)}`, 480, y);
        y += 15;
        doc.text('Total Tax Amount:', 360, y);
        doc.text(`Rs. ${totalTax.toFixed(2)}`, 480, y);
        y += 15;
        doc.fontSize(11).text('Grand Total:', 360, y);
        doc.text(`Rs. ${invoice.totalAmount.toFixed(2)}`, 480, y);

        doc.moveDown(2);
        
        // Amount in Words
        doc.fontSize(9).font('Helvetica-Bold').text('Amount in Words:');
        doc.font('Helvetica').text(amountToWords(invoice.totalAmount));
    }

    doc.moveDown(2);

    // --- 6. UPI QR CODE & FOOTER ---
    const footerY = doc.y;

    try {
        // Generate UPI URI - Formatted for standard Indian B2C payments
        const upiString = `upi://pay?pa=sovely@upi&pn=Sovely+ECommerce&tr=${invoice.invoiceNumber}&am=${invoice.totalAmount.toFixed(2)}&cu=INR`;
        const qrImage = await QRCode.toDataURL(upiString);
        
        doc.image(qrImage, 40, footerY, { width: 70 });
        doc.fontSize(8).font('Helvetica').text('Scan to Pay via UPI', 40, footerY + 75);
    } catch (err) {
        console.error("QR Code generation failed", err);
    }

    // Authorized Signatory
    doc.font('Helvetica-Bold').fontSize(10).text('For Sovely E-Commerce Pvt. Ltd.', 350, footerY, { align: 'right' });
    doc.moveDown(3);
    doc.font('Helvetica').fontSize(8).text('Authorized Signatory', 350, doc.y, { align: 'right' });

    // Declaration
    doc.moveDown(3);
    doc.fontSize(7).fillColor('#666666').text('Declaration: We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct. This is a computer-generated invoice and does not require a physical signature.', 40, doc.y, { width: 515, align: 'justify' });

    doc.end();
});