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
import { Counter } from '../models/Counter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const getInvoice = asyncHandler(async (req, res) => {
    const query = { _id: req.params.id };
    if (req.user.role !== 'ADMIN') {
        query.resellerId = req.user._id;
    }

    const invoice = await Invoice.findOne(query).populate('orderId');

    if (!invoice) throw new ApiError(404, 'Invoice not found or unauthorized');

    return res.status(200).json(new ApiResponse(200, invoice, 'Invoice details fetched'));
});

export const listMyInvoices = asyncHandler(async (req, res) => {
    const invoices = await Invoice.find({ resellerId: req.user._id })
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

    const startDate = req.query.startDate;
    const endDate = req.query.endDate;

    const query = {};

    if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) {
            query.createdAt.$gte = new Date(startDate);
        }
        if (endDate) {
            const end = new Date(endDate);

            end.setHours(23, 59, 59, 999);
            query.createdAt.$lte = end;
        }
    }

    if (status !== 'ALL') {
        if (status === 'OVERDUE') {
            query.paymentStatus = 'UNPAID';
            query.dueDate = { $lt: new Date() };
        } else {
            query.paymentStatus = status;
        }
    }

    if (search) {
        query['$or'] = [
            { invoiceNumber: { $regex: search, $options: 'i' } },
            { 'billedTo.companyName': { $regex: search, $options: 'i' } },
            { 'billedTo.gstin': { $regex: search, $options: 'i' } },
        ];
    }

    const total = await Invoice.countDocuments(query);
    const invoices = await Invoice.find(query)
        .populate('orderId')
        .populate('resellerId', 'name companyName gstin')
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

export const getMyInvoices = asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;

    const query = { resellerId: req.user._id };

    if (startDate && endDate) {
        const start = new Date(startDate);
        start.setUTCHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setUTCHours(23, 59, 59, 999);

        query.createdAt = {
            $gte: start,
            $lte: end,
        };
    }

    const invoices = await Invoice.find(query)
        .sort({ createdAt: -1 })
        .populate('orderId', 'orderId');

    const formattedInvoices = invoices.map((inv) => {
        const totalGst = (inv.totalCgst || 0) + (inv.totalSgst || 0) + (inv.totalIgst || 0);

        return {
            _id: inv._id,
            invoiceNumber: inv.invoiceNumber,
            orderId: inv.orderId?.orderId || 'WALLET-TOPUP',
            date: inv.createdAt,
            taxableAmount: inv.totalTaxableValue || 0,
            gstAmount: totalGst,
            totalAmount: inv.grandTotal || 0,
            status: inv.paymentStatus || 'PAID',
            invoiceType: inv.invoiceType,

            isItcEligible:
                req.user.isVerifiedB2B && !!req.user.gstin && inv.invoiceType !== 'WALLET_TOPUP',
        };
    });

    return res
        .status(200)
        .json(new ApiResponse(200, formattedInvoices, 'Invoices fetched successfully'));
});

export const markAsPaidManual = asyncHandler(async (req, res) => {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) throw new ApiError(404, 'Invoice not found');

    if (invoice.paymentStatus === 'PAID') {
        throw new ApiError(400, 'Invoice is already paid');
    }

    invoice.paymentStatus = 'PAID';
    await invoice.save();

    if (invoice.invoiceType === 'B2B_WHOLESALE' && invoice.orderId) {
        await Order.findByIdAndUpdate(invoice.orderId, { status: 'PROCESSING' });
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

export const exportAdminInvoicesToCsv = asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;

    const query = {};
    if (startDate && endDate) {
        const start = new Date(startDate);
        start.setUTCHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setUTCHours(23, 59, 59, 999);

        query.createdAt = {
            $gte: start,
            $lte: end,
        };
    }

    const invoices = await Invoice.find(query)
        .sort({ createdAt: -1 })
        .populate('orderId', 'orderId')
        .populate('resellerId', 'name companyName email phoneNumber');

    const escapeCsv = (val) => {
        if (val === null || val === undefined) return '';
        let str = String(val).replace(/"/g, '""');
        return `"${str}"`;
    };

    const headers = [
        'Invoice Number',
        'Date',
        'Order Ref',
        'Billed To Company',
        'GSTIN',
        'Invoice Type',
        'Taxable Amount',
        'CGST',
        'SGST',
        'IGST',
        'Grand Total',
        'Payment Options',
        'Status',
    ];

    let csvContent = '\uFEFF' + headers.map(escapeCsv).join(',') + '\n';

    invoices.forEach((inv) => {
        const row = [
            inv.invoiceNumber,
            new Date(inv.createdAt).toISOString().split('T')[0],
            inv.orderId?.orderId || 'WALLET-TOPUP',
            inv.billedTo?.companyName || inv.resellerId?.companyName || inv.resellerId?.name || '',
            inv.billedTo?.gstin || '',
            inv.invoiceType,
            inv.totalTaxableValue,
            inv.totalCgst,
            inv.totalSgst,
            inv.totalIgst,
            inv.grandTotal,
            inv.paymentTerms,
            inv.paymentStatus,
        ];
        csvContent += row.map(escapeCsv).join(',') + '\n';
    });

    res.setHeader('Content-Type', 'text/csv');
    const filename =
        startDate && endDate
            ? `invoices_export_${startDate}_to_${endDate}.csv`
            : 'invoices_export.csv';
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send(csvContent);
});

export const exportMyInvoicesToCsv = asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;

    const query = { resellerId: req.user._id };
    if (startDate && endDate) {
        const start = new Date(startDate);
        start.setUTCHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setUTCHours(23, 59, 59, 999);

        query.createdAt = {
            $gte: start,
            $lte: end,
        };
    }

    const invoices = await Invoice.find(query)
        .sort({ createdAt: -1 })
        .populate('orderId', 'orderId')
        .populate('resellerId', 'name companyName email phoneNumber');

    const escapeCsv = (val) => {
        if (val === null || val === undefined) return '';
        let str = String(val).replace(/"/g, '""');
        return `"${str}"`;
    };

    const headers = [
        'Invoice Number',
        'Date',
        'Order Ref',
        'Billed To Company',
        'GSTIN',
        'Invoice Type',
        'Taxable Amount',
        'CGST',
        'SGST',
        'IGST',
        'Grand Total',
        'Payment Options',
        'Status',
        'Sovely GSTIN',
        'Seller Name',
    ];

    let csvContent = '\uFEFF' + headers.map(escapeCsv).join(',') + '\n';

    invoices.forEach((inv) => {
        const row = [
            inv.invoiceNumber,
            new Date(inv.createdAt).toISOString().split('T')[0],
            inv.orderId?.orderId || 'WALLET-TOPUP',
            inv.billedTo?.companyName || inv.resellerId?.companyName || inv.resellerId?.name || '',
            inv.billedTo?.gstin || '',
            inv.invoiceType,
            inv.totalTaxableValue,
            inv.totalCgst,
            inv.totalSgst,
            inv.totalIgst,
            inv.grandTotal,
            inv.paymentTerms,
            inv.paymentStatus,
            '29DTGPS4598H2ZR',
            'Sovely',
        ];
        csvContent += row.map(escapeCsv).join(',') + '\n';
    });

    res.setHeader('Content-Type', 'text/csv');
    const filename =
        startDate && endDate
            ? `my_invoices_export_${startDate}_to_${endDate}.csv`
            : 'my_invoices_export.csv';
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send(csvContent);
});

export const generateInvoicePDF = async (req, res, next) => {
    try {
        const query = {};
        if (req.params.orderId) query.orderId = req.params.orderId;
        else query._id = req.params.id;

        if (req.user.role !== 'ADMIN') query.resellerId = req.user._id;

        const invoice = await Invoice.findOne(query).populate('orderId').populate('resellerId');
        if (!invoice) throw new ApiError(404, 'Invoice not found');

        const doc = new PDFDocument({ margin: 40, size: 'A4' });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename=Tax_Invoice_${invoice.invoiceNumber.replace(/\//g, '_')}.pdf`
        );

        doc.pipe(res);
        doc.on('error', (err) => {
            console.error('PDF Generation Error:', err);
            if (!res.headersSent) next(new ApiError(500, 'Failed to generate PDF'));
        });

        doc.rect(0, 0, 600, 4).fill('#6366f1');

        const logoPath = path.join(__dirname, '../../public/images/sovely-image.png');
        if (fs.existsSync(logoPath)) {
            try {
                doc.image(logoPath, 40, 25, { fit: [100, 60] });
            } catch (imgError) {
                doc.fillColor('#1e293b').fontSize(22).font('Helvetica-Bold').text('SOVELY', 40, 30);
            }
        } else {
            doc.fillColor('#1e293b').fontSize(22).font('Helvetica-Bold').text('SOVELY', 40, 30);
        }

        const docTitle = invoice.invoiceType === 'WALLET_TOPUP' ? 'PAYMENT RECEIPT' : 'TAX INVOICE';
        doc.fillColor('#6366f1')
            .fontSize(22)
            .font('Helvetica-Bold')
            .text(docTitle, 0, 30, { align: 'right', width: 555 });
        doc.fontSize(9)
            .font('Helvetica')
            .fillColor('#64748b')
            .text('(Original for Recipient)', 0, 56, { align: 'right', width: 555 });

        let currentY = 100;

        doc.fillColor('#334155')
            .fontSize(9)
            .font('Helvetica-Bold')
            .text('Issued By:', 40, currentY);
        doc.fillColor('#0f172a')
            .fontSize(11)
            .text('Infinity Enterprises', 40, currentY + 15);
        doc.fontSize(9)
            .font('Helvetica')
            .fillColor('#475569')
            .text(
                '123 Commerce St., Indiranagar\nBengaluru, Karnataka, 560038\nState Code: 29',
                40,
                currentY + 30
            );
        doc.fillColor('#0f172a')
            .font('Helvetica-Bold')
            .text('GSTIN: ', 40, currentY + 70, { continued: true })
            .font('Helvetica')
            .text('29DTGPS4598H2ZR');

        doc.rect(340, currentY, 215, 85).fillAndStroke('#f8fafc', '#e2e8f0');
        doc.fillColor('#334155').fontSize(9);
        doc.font('Helvetica-Bold')
            .text('Invoice No:', 350, currentY + 10)
            .fillColor('#0f172a')
            .font('Helvetica')
            .text(invoice.invoiceNumber, 420, currentY + 10);

        doc.fillColor('#334155')
            .font('Helvetica-Bold')
            .text('Date:', 350, currentY + 25)
            .fillColor('#0f172a')
            .font('Helvetica')
            .text(new Date(invoice.createdAt).toLocaleDateString('en-IN'), 420, currentY + 25);

        let statusYShift = 55;

        if (invoice.orderId) {
            doc.fillColor('#334155')
                .font('Helvetica-Bold')
                .text('Order Ref:', 350, currentY + 40)
                .fillColor('#0f172a')
                .font('Helvetica')
                .text(invoice.orderId.orderId || 'N/A', 420, currentY + 40);

            if (invoice.orderId.ewayBillNumber) {
                doc.fillColor('#334155')
                    .font('Helvetica-Bold')
                    .text('E-Way Bill:', 350, currentY + 55)
                    .fillColor('#0f172a')
                    .font('Helvetica')
                    .text(invoice.orderId.ewayBillNumber, 420, currentY + 55);

                statusYShift = 70;
            }
        }

        doc.fillColor('#334155')
            .font('Helvetica-Bold')
            .text('Status:', 350, currentY + statusYShift);
        doc.fillColor(invoice.paymentStatus === 'PAID' ? '#16a34a' : '#dc2626').text(
            invoice.paymentStatus === 'FAILED' ? 'FAILED PAYMENT' : invoice.paymentStatus,
            420,
            currentY + statusYShift
        );

        currentY = 210;
        doc.moveTo(40, currentY).lineTo(555, currentY).stroke('#e2e8f0');
        currentY += 15;

        doc.fillColor('#334155')
            .fontSize(9)
            .font('Helvetica-Bold')
            .text('Billed To:', 40, currentY);

        const billedName =
            invoice.billedTo?.companyName ||
            invoice.resellerId?.companyName ||
            invoice.resellerId?.name ||
            'Unknown Entity';

        doc.fillColor('#0f172a')
            .fontSize(10)
            .text(billedName, 40, currentY + 15);
        doc.fontSize(9)
            .font('Helvetica')
            .fillColor('#475569')
            .text(
                invoice.billedTo?.address?.street
                    ? `${invoice.billedTo.address.street}\n${invoice.billedTo.address.city}, ${invoice.billedTo.address.state} ${invoice.billedTo.address.zip}\nState Code: ${invoice.billedTo.address.stateCode || 'N/A'}`
                    : 'Address not provided',
                40,
                currentY + 30,
                { width: 220, lineGap: 2 }
            );
        if (invoice.billedTo?.gstin) {
            doc.fillColor('#0f172a')
                .font('Helvetica-Bold')
                .text('GSTIN: ', 40, doc.y + 5, { continued: true })
                .font('Helvetica')
                .text(invoice.billedTo.gstin);
        }

        let maxContactY = doc.y;

        if (invoice.shippedTo?.name) {
            doc.fillColor('#334155')
                .fontSize(9)
                .font('Helvetica-Bold')
                .text('Shipped To:', 340, currentY);
            doc.fillColor('#0f172a')
                .fontSize(10)
                .text(invoice.shippedTo.name, 340, currentY + 15);
            doc.fontSize(9)
                .font('Helvetica')
                .fillColor('#475569')
                .text(
                    `${invoice.shippedTo.address.street}\n${invoice.shippedTo.address.city}, ${invoice.shippedTo.address.state} ${invoice.shippedTo.address.zip}`,
                    340,
                    currentY + 30,
                    { width: 215, lineGap: 2 }
                );
            maxContactY = Math.max(maxContactY, doc.y);
        }

        currentY = Math.max(maxContactY + 35, 320);

        if (invoice.invoiceType !== 'WALLET_TOPUP' && invoice.items && invoice.items.length > 0) {
            doc.rect(40, currentY, 515, 24).fillAndStroke('#eef2ff', '#e2e8f0');
            doc.fillColor('#312e81').font('Helvetica-Bold').fontSize(8);
            generateTableRow(
                doc,
                currentY + 8,
                'S.No',
                'Description',
                'HSN',
                'Qty',
                'Base Rate',
                'Tax %',
                'Tax Amt',
                'Total (INR)'
            );

            currentY += 24;
            doc.font('Helvetica');

            invoice.items.forEach((item, idx) => {
                if (currentY > 700) {
                    doc.addPage();
                    currentY = 40;
                    doc.rect(40, currentY, 515, 24).fillAndStroke('#eef2ff', '#e2e8f0');
                    doc.fillColor('#312e81').font('Helvetica-Bold');
                    generateTableRow(
                        doc,
                        currentY + 8,
                        'S.No',
                        'Description',
                        'HSN',
                        'Qty',
                        'Base Rate',
                        'Tax %',
                        'Tax Amt',
                        'Total (INR)'
                    );
                    currentY += 24;
                    doc.font('Helvetica');
                }

                if (idx % 2 === 0) doc.rect(40, currentY, 515, 24).fill('#f8fafc');
                doc.fillColor('#334155');

                const taxAmount = invoice.isInterState
                    ? item.igstAmount
                    : item.cgstAmount + item.sgstAmount;
                const displayTitle =
                    item.title.length > 35 ? item.title.substring(0, 32) + '...' : item.title;

                generateTableRow(
                    doc,
                    currentY + 8,
                    (idx + 1).toString(),
                    displayTitle,
                    item.hsnCode || '0000',
                    item.qty.toString(),
                    item.unitBasePrice.toLocaleString('en-IN', { minimumFractionDigits: 2 }),
                    `${item.gstSlab}%`,
                    taxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 }),
                    item.totalItemAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })
                );
                currentY += 24;
            });
            doc.moveTo(40, currentY).lineTo(555, currentY).stroke('#e2e8f0');
            currentY += 20;
        } else if (invoice.invoiceType === 'WALLET_TOPUP') {
            doc.rect(40, currentY, 515, 24).fillAndStroke('#eef2ff', '#e2e8f0');
            doc.fillColor('#312e81').font('Helvetica-Bold').fontSize(10);
            doc.text('Description: Wallet Top-Up (Working Capital)', 50, currentY + 8);
            currentY += 40;
        }

        if (currentY > 600) {
            doc.addPage();
            currentY = 40;
        }

        doc.rect(40, currentY, 260, 90).fillAndStroke('#f8fafc', '#e2e8f0');
        doc.fontSize(9)
            .font('Helvetica-Bold')
            .fillColor('#334155')
            .text('Transaction Details:', 50, currentY + 12);

        doc.font('Helvetica').fillColor('#475569');
        doc.text(`Payment Terms: ${invoice.paymentTerms.replace(/_/g, ' ')}`, 50, currentY + 32);
        doc.text(
            `Status: ${invoice.paymentStatus === 'FAILED' ? 'FAILED PAYMENT' : invoice.paymentStatus}`,
            50,
            currentY + 47
        );
        if (invoice.razorpayOrderId) {
            doc.text(`Gateway Ref: ${invoice.razorpayOrderId}`, 50, currentY + 62);
        } else {
            doc.text(`Settlement: Corporate Wallet Deduction`, 50, currentY + 62);
        }

        doc.font('Helvetica-Bold').fillColor('#334155');

        if (invoice.invoiceType !== 'WALLET_TOPUP') {
            doc.text('Subtotal (Taxable):', 340, currentY);
            doc.fillColor('#0f172a').text(
                `Rs. ${invoice.totalTaxableValue?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '0.00'}`,
                450,
                currentY,
                { align: 'right', width: 100 }
            );
            currentY += 18;

            if (invoice.isInterState) {
                doc.fillColor('#334155').text('IGST Amount:', 340, currentY);
                doc.fillColor('#0f172a').text(
                    `Rs. ${invoice.totalIgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
                    450,
                    currentY,
                    { align: 'right', width: 100 }
                );
                currentY += 18;
            } else {
                doc.fillColor('#334155').text('CGST Amount:', 340, currentY);
                doc.fillColor('#0f172a').text(
                    `Rs. ${(invoice.totalCgst || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
                    450,
                    currentY,
                    { align: 'right', width: 100 }
                );
                currentY += 18;
                doc.fillColor('#334155').text('SGST Amount:', 340, currentY);
                doc.fillColor('#0f172a').text(
                    `Rs. ${(invoice.totalSgst || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
                    450,
                    currentY,
                    { align: 'right', width: 100 }
                );
                currentY += 18;
            }
        }

        doc.rect(340, currentY, 215, 28).fillAndStroke('#4f46e5', '#4338ca');
        doc.fillColor('#ffffff')
            .fontSize(11)
            .font('Helvetica-Bold')
            .text('Grand Total:', 350, currentY + 8);

        doc.text(
            `Rs. ${invoice.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
            450,
            currentY + 8,
            { align: 'right', width: 95 }
        );

        currentY += 40;
        doc.fontSize(9)
            .font('Helvetica-Bold')
            .fillColor('#334155')
            .text('Amount in Words:', 340, currentY);
        doc.font('Helvetica')
            .fillColor('#475569')
            .text(amountToWords(invoice.grandTotal), 340, currentY + 14, { width: 215 });

        if (currentY > 650) {
            doc.addPage();
            currentY = 40;
        }
        const footerY = doc.page.height - 120;

        doc.moveTo(40, footerY).lineTo(555, footerY).stroke('#e2e8f0');

        doc.font('Helvetica-Bold')
            .fontSize(10)
            .fillColor('#0f172a')
            .text('For Infinity Enterprises', 350, footerY + 15, { align: 'right', width: 205 });
        doc.font('Helvetica')
            .fontSize(9)
            .fillColor('#64748b')
            .text('Authorized Signatory\n(Digitally Signed)', 350, footerY + 35, {
                align: 'right',
                width: 205,
            });

        doc.font('Helvetica-Bold')
            .fontSize(8)
            .fillColor('#475569')
            .text('Terms & Conditions:', 40, footerY + 15);
        doc.font('Helvetica')
            .fontSize(7)
            .fillColor('#64748b')
            .text(
                '1. All disputes are subject to Bengaluru jurisdiction.\n2. Input Tax Credit (ITC) can only be claimed if GSTIN is provided at the time of order.\n3. This is a computer-generated document and does not require a physical signature.',
                40,
                footerY + 28,
                { width: 280, align: 'left', lineGap: 3 }
            );

        doc.end();
    } catch (error) {
        next(error);
    }
};

export const createInvoiceFromOrder = async (orderDoc, resellerDoc, session) => {
    const hqStateCode = process.env.HQ_STATE_CODE || '29';

    const billingSnapshot = orderDoc.billingDetails || {};
    const resellerStateCode = billingSnapshot.address?.stateCode || resellerDoc.stateCode || '29';
    const isInterState = hqStateCode !== resellerStateCode;

    const sequence = await Counter.getNextSequenceValue('invoices_fy2526');
    const paddedSeq = String(sequence).padStart(5, '0');
    const invoiceNumber = `INV/25-26/${paddedSeq}`;

    const invoiceItems = orderDoc.items.map((item) => {
        const baseAmount = item.platformBasePrice * item.qty;
        const taxAmount = item.taxAmountPerUnit * item.qty;

        return {
            productId: item.productId,
            sku: item.sku,
            title: item.title,
            hsnCode: item.hsnCode || '0000',
            qty: item.qty,
            unitBasePrice: item.platformBasePrice,
            totalBaseAmount: baseAmount,
            gstSlab: item.gstSlab,
            cgstAmount: isInterState ? 0 : taxAmount / 2,
            sgstAmount: isInterState ? 0 : taxAmount / 2,
            igstAmount: isInterState ? taxAmount : 0,
            totalItemAmount: baseAmount + taxAmount,
        };
    });

    if (orderDoc.shippingTotal > 0) {
        const freightTitle = orderDoc.totalBillableWeight
            ? `Freight & Packaging Services (Billable Weight: ${orderDoc.totalBillableWeight}kg)`
            : 'Freight & Packaging Services';

        const shippingTax = Number((orderDoc.shippingTotal * 0.18).toFixed(2));
        const cgst = isInterState ? 0 : shippingTax / 2;
        const sgst = isInterState ? 0 : shippingTax / 2;
        const igst = isInterState ? shippingTax : 0;

        invoiceItems.push({
            sku: 'FRGT-PKG-001',
            title: freightTitle,
            hsnCode: '996813',
            qty: 1,
            unitBasePrice: orderDoc.shippingTotal,
            totalBaseAmount: orderDoc.shippingTotal,
            gstSlab: 18,
            cgstAmount: cgst,
            sgstAmount: sgst,
            igstAmount: igst,
            totalItemAmount: orderDoc.shippingTotal + shippingTax,
        });
    }

    if (orderDoc.codCharge > 0) {
        const codTax = Number((orderDoc.codCharge * 0.18).toFixed(2));
        const cgst = isInterState ? 0 : codTax / 2;
        const sgst = isInterState ? 0 : codTax / 2;
        const igst = isInterState ? codTax : 0;

        invoiceItems.push({
            sku: 'FEE-COD-001',
            title: 'Courier Cash on Delivery (COD) Fee',
            hsnCode: '999799',
            qty: 1,
            unitBasePrice: orderDoc.codCharge,
            totalBaseAmount: orderDoc.codCharge,
            gstSlab: 18,
            cgstAmount: cgst,
            sgstAmount: sgst,
            igstAmount: igst,
            totalItemAmount: orderDoc.codCharge + codTax,
        });
    }

    const totalTaxableValue = invoiceItems.reduce((acc, item) => acc + item.totalBaseAmount, 0);
    const totalCgst = invoiceItems.reduce((acc, item) => acc + item.cgstAmount, 0);
    const totalSgst = invoiceItems.reduce((acc, item) => acc + item.sgstAmount, 0);
    const totalIgst = invoiceItems.reduce((acc, item) => acc + item.igstAmount, 0);
    const grandTotal = totalTaxableValue + totalCgst + totalSgst + totalIgst;

    const invoiceType = orderDoc.orderId.includes('WH') ? 'B2B_WHOLESALE' : 'DROPSHIP_PLATFORM_FEE';

    const invoice = new Invoice({
        invoiceNumber: invoiceNumber,
        orderId: orderDoc._id,
        resellerId: resellerDoc._id,
        invoiceType: invoiceType,
        isInterState: isInterState,

        billedTo: {
            companyName: billingSnapshot.companyName || resellerDoc.companyName || resellerDoc.name,
            gstin: billingSnapshot.gstin || resellerDoc.gstin || '',
            address: {
                street: billingSnapshot.address?.street || resellerDoc.billingAddress?.street || '',
                city: billingSnapshot.address?.city || resellerDoc.billingAddress?.city || 'N/A',
                state: billingSnapshot.address?.state || resellerDoc.billingAddress?.state || 'N/A',
                zip: billingSnapshot.address?.zip || resellerDoc.billingAddress?.zip || 'N/A',
                stateCode: resellerStateCode,
            },
        },

        shippedTo: orderDoc.endCustomerDetails
            ? {
                  name: orderDoc.endCustomerDetails.name,
                  address: orderDoc.endCustomerDetails.address,
              }
            : undefined,

        items: invoiceItems,

        totalTaxableValue: Number(totalTaxableValue.toFixed(2)),
        totalCgst: Number(totalCgst.toFixed(2)),
        totalSgst: Number(totalSgst.toFixed(2)),
        totalIgst: Number(totalIgst.toFixed(2)),
        grandTotal: Number(grandTotal.toFixed(2)),

        paymentStatus: 'PAID',
        paymentTerms: 'PREPAID',
        status: 'GENERATED',
    });

    await invoice.save({ session });
    return invoice;
};

export const generateInvoiceBuffer = async (invoice, user) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 40, size: 'A4' });
            const chunks = [];

            doc.on('data', (chunk) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', (err) => reject(err));

            doc.fontSize(24).font('Helvetica-Bold').fillColor('#0f172a').text('SOVELY', 40, 35);
            doc.fillColor('#0f172a')
                .fontSize(18)
                .font('Helvetica-Bold')
                .text('TAX INVOICE', 0, 35, { align: 'right', width: 555 });

            doc.fontSize(10).font('Helvetica-Bold').text('Issued By:', 40, 100);
            doc.font('Helvetica').text('Infinity Enterprises\nBengaluru, Karnataka', 40, 115);

            doc.font('Helvetica-Bold').text('Billed To:', 300, 100);

            const billedName =
                invoice.billedTo?.companyName ||
                invoice.resellerId?.companyName ||
                invoice.resellerId?.name ||
                user.companyName ||
                user.name;
            doc.font('Helvetica').text(`${billedName}\n${user.email}`, 300, 115);

            doc.rect(40, 170, 515, 45).fillAndStroke('#f8fafc', '#cbd5e1');
            doc.fillColor('#0f172a')
                .font('Helvetica-Bold')
                .fontSize(10)
                .text(`Invoice: ${invoice.invoiceNumber}`, 50, 180)
                .text(`Order: ${invoice.orderId?.orderId || 'N/A'}`, 300, 180);

            if (invoice.orderId?.ewayBillNumber) {
                doc.text(`E-Way Bill: ${invoice.orderId.ewayBillNumber}`, 50, 195);
            }

            doc.moveDown(4);

            doc.fontSize(14)
                .font('Helvetica-Bold')
                .text(`Grand Total: Rs. ${invoice.grandTotal.toLocaleString('en-IN')}`, {
                    align: 'right',
                });

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
};
