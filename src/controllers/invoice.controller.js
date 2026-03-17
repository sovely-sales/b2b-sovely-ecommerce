import { Invoice } from '../models/Invoice.js';
import { Order } from '../models/Order.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const getInvoice = asyncHandler(async (req, res) => {
    const invoice = await Invoice.findOne({
        _id: req.params.id,
        userId: req.user._id,
    }).populate('orderId');

    if (!invoice) throw new ApiError(404, 'Invoice not found');

    return res.status(200).json(new ApiResponse(200, invoice, 'Invoice details fetched'));
});

export const listMyInvoices = asyncHandler(async (req, res) => {
    const invoices = await Invoice.find({ userId: req.user._id })
        .populate('orderId')
        .sort({ createdAt: -1 });

    return res.status(200).json(new ApiResponse(200, invoices, 'Invoices fetched successfully'));
});

export const getAllInvoices = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const search = req.query.search || '';
    const status = req.query.status || 'ALL';

    const query = {};

    if (status !== 'ALL') {
        if (status === 'OVERDUE') {
            query.status = 'UNPAID';
            query.dueDate = { $lt: new Date() };
        } else {
            query.status = status;
        }
    }

    if (search) {
        query['$or'] = [
            { invoiceNumber: { $regex: search, $options: 'i' } },
            { 'buyerDetails.companyName': { $regex: search, $options: 'i' } },
            { 'buyerDetails.gstin': { $regex: search, $options: 'i' } },
        ];
    }

    const total = await Invoice.countDocuments(query);
    const invoices = await Invoice.find(query)
        .populate('orderId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                data: invoices,
                pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
            },
            'All invoices fetched'
        )
    );
});

export const markAsPaidManual = asyncHandler(async (req, res) => {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) throw new ApiError(404, 'Invoice not found');

    if (invoice.status === 'PAID') {
        throw new ApiError(400, 'Invoice is already paid');
    }

    invoice.status = 'PAID';
    await invoice.save();

    if (invoice.invoiceType === 'ORDER_BILL' && invoice.orderId) {
        await Order.findByIdAndUpdate(invoice.orderId, { status: 'COMPLETED' });
    }

    return res.status(200).json(new ApiResponse(200, invoice, 'Invoice marked as paid manually'));
});

const amountToWords = (amount) => {
    return `Rupees ${Math.floor(amount).toLocaleString('en-IN')} Only`;
};

const generateTableRow = (doc, y, c1, c2, c3, c4, c5, c6, c7, c8) => {
    doc.fontSize(8)
        .text(c1, 40, y)
        .text(c2, 70, y, { width: 140 })
        .text(c3, 220, y, { width: 40, align: 'center' })
        .text(c4, 260, y, { width: 30, align: 'center' })
        .text(c5, 290, y, { width: 60, align: 'right' })
        .text(c6, 350, y, { width: 40, align: 'center' })
        .text(c7, 390, y, { width: 60, align: 'right' })
        .text(c8, 450, y, { width: 100, align: 'right' });
};

export const generateInvoicePDF = async (req, res, next) => {
    try {
        const query = { _id: req.params.id };
        if (req.user.role !== 'ADMIN') query.userId = req.user._id;

        const invoice = await Invoice.findOne(query).populate('orderId');

        if (!invoice) throw new ApiError(404, 'Invoice not found');

        const doc = new PDFDocument({ margin: 40, size: 'A4' });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename=Tax_Invoice_${invoice.invoiceNumber}.pdf`
        );

        doc.pipe(res);
        doc.on('error', (err) => {
            console.error('PDF Generation Error:', err);
            if (!res.headersSent) {
                next(new ApiError(500, 'Failed to generate PDF'));
            }
        });

        const logoPath = path.join(__dirname, '../../public/images/sovely-image.png');
        if (fs.existsSync(logoPath)) {
            try {
                doc.image(logoPath, 40, 30, { width: 100 });
            } catch (imgError) {
                console.warn(
                    '⚠️ PDFKit rejected the logo image. Falling back to text logo.',
                    imgError.message
                );
                doc.fontSize(24).font('Helvetica-Bold').fillColor('#0f172a').text('SOVELY', 40, 35);
            }
        } else {
            doc.fontSize(24).font('Helvetica-Bold').fillColor('#0f172a').text('SOVELY', 40, 35);
        }

        doc.fillColor('#0f172a')
            .fontSize(18)
            .font('Helvetica-Bold')
            .text('TAX INVOICE', 0, 35, { align: 'right', width: 555 });
        doc.fontSize(9)
            .font('Helvetica')
            .fillColor('#64748b')
            .text('(Original for Recipient)', 0, 55, { align: 'right', width: 555 });

        const topY = 160;

        doc.fillColor('#0f172a');

        doc.fontSize(10).font('Helvetica-Bold').text('Sold By:', 40, topY);
        doc.font('Helvetica-Bold')
            .fontSize(11)
            .text('Sovely E-Commerce Pvt. Ltd.', 40, topY + 15);
        doc.font('Helvetica')
            .fontSize(9)
            .text('123 Commerce St., Indiranagar', 40, topY + 30)
            .text('Bengaluru, Karnataka, 560038', 40, topY + 42)
            .text('State Code: 29', 40, topY + 54);

        doc.font('Helvetica-Bold')
            .text('GSTIN: ', 40, topY + 68, { continued: true })
            .font('Helvetica')
            .text('29ABCDE1234F1Z5');
        doc.font('Helvetica-Bold')
            .text('PAN: ', 40, topY + 80, { continued: true })
            .font('Helvetica')
            .text('ABCDE1234F');

        doc.fontSize(10).font('Helvetica-Bold').text('Billed To:', 300, topY);
        doc.font('Helvetica-Bold')
            .fontSize(11)
            .text(invoice.buyerDetails?.companyName || req.user.name, 300, topY + 15);
        doc.font('Helvetica')
            .fontSize(9)
            .text(invoice.buyerDetails?.billingAddress || 'Address not provided', 300, topY + 30, {
                width: 250,
            })
            .text(`State: ${invoice.buyerDetails?.state || 'N/A'}`, 300, doc.y + 2);

        if (invoice.buyerDetails?.gstin && invoice.buyerDetails?.gstin !== 'UNREGISTERED') {
            doc.font('Helvetica-Bold')
                .text('GSTIN: ', 300, doc.y + 4, { continued: true })
                .font('Helvetica')
                .text(invoice.buyerDetails.gstin);
        }

        const metaY = Math.max(topY + 110, doc.y + 15);
        doc.rect(40, metaY, 515, 40).fillAndStroke('#f8fafc', '#cbd5e1');
        doc.fillColor('#0f172a');

        doc.font('Helvetica-Bold')
            .fontSize(9)
            .text('Invoice No:', 50, metaY + 8);
        doc.font('Helvetica').text(invoice.invoiceNumber, 120, metaY + 8);

        doc.font('Helvetica-Bold').text('Invoice Date:', 50, metaY + 22);
        doc.font('Helvetica').text(
            new Date(invoice.createdAt).toLocaleDateString('en-IN'),
            120,
            metaY + 22
        );

        if (invoice.orderId) {
            doc.font('Helvetica-Bold').text('Order Ref:', 300, metaY + 8);
            doc.font('Helvetica').text(invoice.orderId.orderId || 'N/A', 370, metaY + 8);

            doc.font('Helvetica-Bold').text('Payment Terms:', 300, metaY + 22);
            doc.font('Helvetica').text(
                (invoice.paymentTerms || 'DUE_ON_RECEIPT').replace(/_/g, ' '),
                370,
                metaY + 22
            );
        }

        let y = metaY + 60;

        if (invoice.invoiceType === 'ORDER_BILL' && invoice.orderId) {
            doc.rect(40, y, 515, 20).fillAndStroke('#0f172a', '#0f172a');
            doc.fillColor('#ffffff').font('Helvetica-Bold');
            generateTableRow(
                doc,
                y + 6,
                'S.No',
                'Description',
                'HSN',
                'Qty',
                'Base Rate',
                'Tax %',
                'Tax Amt',
                'Total (INR)'
            );

            y += 20;
            let index = 1;
            doc.fillColor('#0f172a').font('Helvetica');

            for (const item of invoice.orderId.items) {
                if (y > 700) {
                    doc.addPage();
                    y = 50;
                    doc.rect(40, y, 515, 20).fillAndStroke('#0f172a', '#0f172a');
                    doc.fillColor('#ffffff').font('Helvetica-Bold');
                    generateTableRow(
                        doc,
                        y + 6,
                        'S.No',
                        'Description',
                        'HSN',
                        'Qty',
                        'Base Rate',
                        'Tax %',
                        'Tax Amt',
                        'Total (INR)'
                    );
                    y += 20;
                    doc.fillColor('#0f172a').font('Helvetica');
                }

                const displayTitle =
                    item.title.length > 35 ? item.title.substring(0, 32) + '...' : item.title;
                const baseTotal = item.basePrice * item.qty;
                const taxTotal = item.taxAmountPerUnit * item.qty;
                const finalTotal = item.totalItemPrice;

                if (index % 2 === 0) doc.rect(40, y, 515, 20).fill('#f8fafc');
                doc.fillColor('#0f172a');

                generateTableRow(
                    doc,
                    y + 6,
                    index.toString(),
                    displayTitle,
                    item.hsnCode || '0000',
                    item.qty.toString(),
                    baseTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 }),
                    `${item.taxSlab || 18}%`,
                    taxTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 }),
                    finalTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })
                );

                y += 20;
                index++;
            }

            doc.moveTo(40, y).lineTo(555, y).stroke('#cbd5e1');
            y += 15;

            doc.font('Helvetica-Bold').fontSize(9);
            doc.text('Subtotal (Base):', 360, y);
            doc.text(
                `₹ ${invoice.subTotal?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '0.00'}`,
                450,
                y,
                { align: 'right', width: 100 }
            );
            y += 15;

            if (invoice.taxBreakdown?.igstTotal > 0) {
                doc.text('IGST Amount:', 360, y);
                doc.text(
                    `₹ ${invoice.taxBreakdown.igstTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
                    450,
                    y,
                    { align: 'right', width: 100 }
                );
                y += 15;
            } else {
                doc.text('CGST Amount:', 360, y);
                doc.text(
                    `₹ ${(invoice.taxBreakdown?.cgstTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
                    450,
                    y,
                    { align: 'right', width: 100 }
                );
                y += 15;
                doc.text('SGST Amount:', 360, y);
                doc.text(
                    `₹ ${(invoice.taxBreakdown?.sgstTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
                    450,
                    y,
                    { align: 'right', width: 100 }
                );
                y += 15;
            }

            doc.rect(350, y, 205, 25).fillAndStroke('#f1f5f9', '#cbd5e1');
            doc.fillColor('#0f172a')
                .fontSize(11)
                .font('Helvetica-Bold')
                .text('Grand Total:', 360, y + 7);
            doc.text(
                `₹ ${(invoice.grandTotal || invoice.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
                450,
                y + 7,
                { align: 'right', width: 100 }
            );

            doc.moveDown(3);

            doc.fontSize(9).font('Helvetica-Bold').text('Amount in Words:');
            doc.font('Helvetica').text(amountToWords(invoice.grandTotal || invoice.totalAmount));
        }

        if (doc.y > 650) {
            doc.addPage();
        }

        const footerY = doc.y + 40;

        doc.rect(40, footerY, 220, 70).stroke('#cbd5e1');
        doc.fontSize(9)
            .font('Helvetica-Bold')
            .text('Bank Details for NEFT/RTGS:', 45, footerY + 5);
        doc.font('Helvetica')
            .fontSize(8)
            .text('Bank Name: Sovely National Bank', 45, footerY + 20)
            .text('Account Name: Sovely E-Commerce Pvt Ltd', 45, footerY + 32)
            .text('Account No: 1234567890123456', 45, footerY + 44)
            .text('IFSC Code: SOVE0001234', 45, footerY + 56);

        try {
            const upiString = `upi://pay?pa=sovely@upi&pn=Sovely+ECommerce&tr=${invoice.invoiceNumber}&am=${(invoice.grandTotal || invoice.totalAmount).toFixed(2)}&cu=INR`;
            const qrImage = await QRCode.toDataURL(upiString);
            doc.image(qrImage, 275, footerY - 5, { width: 80 });
            doc.fontSize(7).text('Scan to Pay via UPI', 280, footerY + 75);
        } catch (err) {
            console.error('QR Code generation failed', err);
        }

        doc.font('Helvetica-Bold')
            .fontSize(10)
            .text('For Sovely E-Commerce Pvt. Ltd.', 350, footerY + 5, {
                align: 'right',
                width: 205,
            });
        doc.moveDown(4);
        doc.font('Helvetica')
            .fontSize(9)
            .text('Authorized Signatory', 350, doc.y, { align: 'right', width: 205 });

        doc.moveTo(40, footerY + 100)
            .lineTo(555, footerY + 100)
            .stroke('#e2e8f0');
        doc.font('Helvetica-Bold')
            .fontSize(7)
            .fillColor('#64748b')
            .text('Terms & Conditions:', 40, footerY + 105);
        doc.font('Helvetica').text(
            '1. All disputes are subject to Bengaluru jurisdiction. 2. Goods once sold will not be taken back. 3. This is a computer-generated invoice and does not require a physical signature for legal validity.',
            40,
            footerY + 115,
            { width: 515, align: 'justify' }
        );

        doc.end();
    } catch (error) {
        next(error);
    }
};
