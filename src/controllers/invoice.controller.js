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
        'Seller GSTIN',
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
            'Infinity Enterprises',
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

        // Use thin lines for borders
        doc.lineWidth(0.5);

        // --- PAGE LAYOUT DRAWING HELPER ---
        const drawInvoiceForm = (currentPageInvoice) => {
            // Draw outer border (x, y, width, height)
            doc.rect(40, 40, 515, 762).stroke('#000000');

            // Header Title Bar
            doc.moveTo(40, 65).lineTo(555, 65).stroke('#000000');
            doc.fillColor('#000000')
                .fontSize(10)
                .font('Helvetica-Bold')
                .text('Tax Invoice', 40, 48, { align: 'center', width: 515 });

            // Vertical line dividing left and right grids
            doc.moveTo(297.5, 65).lineTo(297.5, 325).stroke('#000000');

            // --- Top Left: Seller Details ---
            let sellerY = 71;
            doc.fillColor('#000000')
                .fontSize(8.5)
                .font('Helvetica-Bold')
                .text('Dabster International Private Limited', 45, sellerY, { width: 245 });
            
            sellerY = doc.y + 1;
            doc.fontSize(7.5)
                .font('Helvetica')
                .text('(Formerly Known as Deodap International Private Limited)', 45, sellerY, { width: 245 });
            
            sellerY = doc.y + 2;
            doc.text('PLOT NO. 1, RSN 112/3, NR RUDA TRANSPORT NAGAR,\nRANGOLI MASALA STREET, NAVAGRAM, RAJKOT-360003 (GUJARAT)', 45, sellerY, { width: 245 });
            
            sellerY = doc.y + 3;
            doc.font('Helvetica-Bold')
                .text('GSTIN/UIN: ', 45, sellerY, { continued: true })
                .font('Helvetica')
                .text('24AAHCD5265C1ZX', { width: 245 });
            
            sellerY = doc.y + 2;
            doc.font('Helvetica-Bold')
                .text('State Name: ', 45, sellerY, { continued: true })
                .font('Helvetica')
                .text('Gujarat, Code : 24', { width: 245 });

            // Horizontal line under seller details
            doc.moveTo(40, 150).lineTo(297.5, 150).stroke('#000000');

            // --- Middle Left Upper: Consignee (Ship to) ---
            doc.font('Helvetica-Bold').fontSize(8).text('Consignee (Ship to)', 45, 154, { width: 245 });
            if (currentPageInvoice.shippedTo?.name) {
                let shipY = 163;
                doc.font('Helvetica-Bold').fontSize(8.5).text(currentPageInvoice.shippedTo.name, 45, shipY, { width: 245 });
                
                shipY = doc.y + 1;
                const shipAddress = currentPageInvoice.shippedTo.address;
                const addressText = `${shipAddress.street || ''}\n${shipAddress.city || ''} ${shipAddress.state || ''} ${shipAddress.zip || ''}`;
                doc.font('Helvetica').fontSize(7.5).text(addressText, 45, shipY, { width: 245, maxRows: 2, ellipsis: true });
                
                shipY = doc.y + 2;
                const destStateCode = currentPageInvoice.billedTo?.address?.stateCode || '29';
                doc.font('Helvetica-Bold').fontSize(7.5)
                    .text('State Name : ', 45, shipY, { continued: true })
                    .font('Helvetica')
                    .text(`${shipAddress.state || ''}, Code : ${destStateCode}`, { width: 245 });
            } else {
                doc.font('Helvetica').fontSize(7.5).text('N/A', 45, 163, { width: 245 });
            }

            // Horizontal line under Consignee details
            doc.moveTo(40, 220).lineTo(297.5, 220).stroke('#000000');

            // --- Middle Left Lower: Buyer (Bill to) ---
            doc.font('Helvetica-Bold').fontSize(8).text('Buyer (Bill to)', 45, 224, { width: 245 });
            const billedName = currentPageInvoice.billedTo?.companyName || currentPageInvoice.resellerId?.companyName || currentPageInvoice.resellerId?.name || 'Guest Reseller';
            
            let buyerY = 233;
            doc.font('Helvetica-Bold').fontSize(8.5).text(billedName, 45, buyerY, { width: 245 });
            
            buyerY = doc.y + 1;
            if (currentPageInvoice.billedTo?.address?.street) {
                const billAddress = currentPageInvoice.billedTo.address;
                const addressText = `${billAddress.street || ''}\n${billAddress.city || ''} ${billAddress.state || ''} ${billAddress.zip || ''}`;
                doc.font('Helvetica').fontSize(7.5).text(addressText, 45, buyerY, { width: 245, maxRows: 2, ellipsis: true });
                
                buyerY = doc.y + 2;
                if (currentPageInvoice.billedTo.gstin) {
                    doc.font('Helvetica-Bold').fontSize(7.5)
                        .text('GSTIN/UIN : ', 45, buyerY, { continued: true })
                        .font('Helvetica')
                        .text(currentPageInvoice.billedTo.gstin, { width: 245 });
                    buyerY = doc.y + 2;
                }
                const destStateCode = billAddress.stateCode || '29';
                doc.font('Helvetica-Bold').fontSize(7.5)
                    .text('State Name : ', 45, buyerY, { continued: true })
                    .font('Helvetica')
                    .text(`${billAddress.state || ''}, Code : ${destStateCode}`, { width: 245 });
            } else {
                doc.font('Helvetica').fontSize(7.5).text('Address not available', 45, buyerY, { width: 245 });
            }

            // --- Top Right & Middle Right Metadata Tables ---
            const drawMetadataCell = (x, y, width, height, title, value) => {
                doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#333333').text(title, x + 5, y + 4);
                if (value) {
                    let displayValue = String(value);
                    if (height <= 30 && displayValue.length > 26) {
                        displayValue = displayValue.substring(0, 23) + '...';
                    }
                    doc.font('Helvetica').fontSize(8).fillColor('#000000').text(displayValue, x + 5, y + 14, { width: width - 10 });
                }
            };

            // Grid of lines on the right side
            // Horizontal lines
            doc.moveTo(297.5, 93).lineTo(555, 93).stroke('#000000');
            doc.moveTo(297.5, 121).lineTo(555, 121).stroke('#000000');
            doc.moveTo(297.5, 149).lineTo(555, 149).stroke('#000000');
            doc.moveTo(297.5, 177).lineTo(555, 177).stroke('#000000');
            doc.moveTo(297.5, 205).lineTo(555, 205).stroke('#000000');
            doc.moveTo(297.5, 233).lineTo(555, 233).stroke('#000000');
            doc.moveTo(297.5, 261).lineTo(555, 261).stroke('#000000');

            // Inner vertical dividing line for metadata
            doc.moveTo(426.25, 65).lineTo(426.25, 261).stroke('#000000');

            // Fill Metadata
            drawMetadataCell(297.5, 65, 128.75, 28, 'Invoice No.', currentPageInvoice.invoiceNumber);
            drawMetadataCell(426.25, 65, 128.75, 28, 'Invoice Date', new Date(currentPageInvoice.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' }).replace(/ /g, '-'));

            drawMetadataCell(297.5, 93, 128.75, 28, 'Delivery Note', '');
            drawMetadataCell(426.25, 93, 128.75, 28, 'Mode/Terms of Payment', currentPageInvoice.paymentTerms || 'PREPAID');

            drawMetadataCell(297.5, 121, 128.75, 28, 'Reference No. & Date', '');
            drawMetadataCell(426.25, 121, 128.75, 28, 'Other References', '');

            drawMetadataCell(297.5, 149, 128.75, 28, "Buyer's Order No.", currentPageInvoice.orderId?.orderId || '');
            drawMetadataCell(426.25, 149, 128.75, 28, 'Dated', new Date(currentPageInvoice.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' }).replace(/ /g, '-'));

            drawMetadataCell(297.5, 177, 128.75, 28, 'Dispatch Doc No.', '');
            drawMetadataCell(426.25, 177, 128.75, 28, 'Delivery Note Date', '');

            drawMetadataCell(297.5, 205, 128.75, 28, 'Dispatched through', '');
            drawMetadataCell(426.25, 205, 128.75, 28, 'Destination', currentPageInvoice.shippedTo?.address?.city || '');

            // Terms of Delivery cell (spans both columns)
            drawMetadataCell(297.5, 233, 257.5, 28, 'Terms of Delivery', '');

            // Dispatch Info (bottom right box above table)
            drawMetadataCell(297.5, 261, 257.5, 64, 'Dispatch Details', currentPageInvoice.orderId?.ewayBillNumber ? `E-Way Bill: ${currentPageInvoice.orderId.ewayBillNumber}` : 'Standard Courier Dispatch');

            // Line above product table header
            doc.moveTo(40, 325).lineTo(555, 325).stroke('#000000');
        };

        // Table column coordinates (X positions)
        const colSI = 40;
        const colDesc = 60;
        const colHSN = 250;
        const colGST = 300;
        const colQty = 345;
        const colRate = 385;
        const colPer = 435;
        const colAmount = 475;
        const endTable = 555;

        const drawTableHeader = (y) => {
            doc.font('Helvetica-Bold').fontSize(8).fillColor('#000000');
            doc.text('SI', colSI + 2, y + 4, { width: 18, align: 'center' });
            doc.text('No.', colSI + 2, y + 13, { width: 18, align: 'center' });

            doc.text('Description of Goods', colDesc + 5, y + 8);
            doc.text('HSN/SAC', colHSN + 2, y + 8, { width: 46, align: 'center' });
            doc.text('GST Rate', colGST + 2, y + 8, { width: 41, align: 'center' });

            doc.text('Quantity', colQty + 2, y + 8, { width: 36, align: 'center' });
            doc.text('Rate', colRate + 2, y + 8, { width: 46, align: 'right' });
            doc.text('per', colPer + 2, y + 8, { width: 36, align: 'center' });
            doc.text('Amount', colAmount + 2, y + 8, { width: 75, align: 'right' });

            // Table header bottom line
            doc.moveTo(40, y + 25).lineTo(555, y + 25).stroke('#000000');
        };

        const drawTableVerticalLines = (startY, endY) => {
            doc.moveTo(colDesc, startY).lineTo(colDesc, endY).stroke('#000000');
            doc.moveTo(colHSN, startY).lineTo(colHSN, endY).stroke('#000000');
            doc.moveTo(colGST, startY).lineTo(colGST, endY).stroke('#000000');
            doc.moveTo(colQty, startY).lineTo(colQty, endY).stroke('#000000');
            doc.moveTo(colRate, startY).lineTo(colRate, endY).stroke('#000000');
            doc.moveTo(colPer, startY).lineTo(colPer, endY).stroke('#000000');
            doc.moveTo(colAmount, startY).lineTo(colAmount, endY).stroke('#000000');
        };

        // Render Invoice
        drawInvoiceForm(invoice);
        let tableTopY = 325;
        drawTableHeader(tableTopY);

        let currentY = tableTopY + 25;
        const pageLimitY = 660; // Leave room for totals and GST breakdowns at the bottom

        // Add items to product table
        const items = invoice.items || [];
        items.forEach((item, index) => {
            if (currentY > pageLimitY) {
                // Draw vertical lines for current page
                drawTableVerticalLines(tableTopY + 25, currentY);
                // End current page border
                doc.addPage();
                drawInvoiceForm(invoice);
                tableTopY = 325;
                drawTableHeader(tableTopY);
                currentY = tableTopY + 25;
            }

            doc.font('Helvetica').fontSize(8).fillColor('#000000');
            
            // SI No
            doc.text((index + 1).toString(), colSI, currentY + 4, { width: 20, align: 'center' });
            
            // Description (wrap nicely)
            const titleStr = item.title || '';
            const displayTitle = titleStr.length > 52 ? titleStr.substring(0, 49) + '...' : titleStr;
            doc.text(displayTitle, colDesc + 5, currentY + 4, { width: colHSN - colDesc - 10 });

            // HSN/SAC
            doc.text(item.hsnCode || '0000', colHSN, currentY + 4, { width: colGST - colHSN, align: 'center' });

            // GST Rate
            doc.text(`${item.gstSlab}%`, colGST, currentY + 4, { width: colQty - colGST, align: 'center' });

            // Qty
            doc.text(`${item.qty} No`, colQty, currentY + 4, { width: colRate - colQty, align: 'center' });

            // Rate
            doc.text(item.unitBasePrice.toFixed(2), colRate, currentY + 4, { width: colPer - colRate - 2, align: 'right' });

            // per
            doc.text('No', colPer, currentY + 4, { width: colAmount - colPer, align: 'center' });

            // Amount
            const baseAmount = item.totalBaseAmount || (item.unitBasePrice * item.qty);
            doc.text(baseAmount.toFixed(2), colAmount, currentY + 4, { width: endTable - colAmount - 5, align: 'right' });

            currentY += 20;
        });

        // Fill remaining table space down to Y = 525 to match typical tax invoice layout
        const targetTableEndY = 525;
        if (currentY < targetTableEndY) {
            currentY = targetTableEndY;
        }
        drawTableVerticalLines(tableTopY + 25, currentY);

        // Line under table items
        doc.moveTo(40, currentY).lineTo(555, currentY).stroke('#000000');

        // Draw subtotal row
        doc.font('Helvetica-Bold').fontSize(8.5);
        doc.text('Total', colDesc + 5, currentY + 4);
        
        // Sum total quantities
        const totalQty = items.reduce((sum, item) => sum + item.qty, 0);
        doc.text(`${totalQty} No`, colQty, currentY + 4, { width: colRate - colQty, align: 'center' });

        // Base Amount Subtotal
        doc.text(invoice.totalTaxableValue.toFixed(2), colAmount, currentY + 4, { width: endTable - colAmount - 5, align: 'right' });

        currentY += 16;
        doc.moveTo(40, currentY).lineTo(555, currentY).stroke('#000000');

        // GST Tax lines & Round Off
        const gstLines = [];
        if (invoice.isInterState) {
            gstLines.push({ name: 'IGST', amt: invoice.totalIgst });
        } else {
            gstLines.push({ name: 'CGST', amt: invoice.totalCgst });
            gstLines.push({ name: 'SGST', amt: invoice.totalSgst });
        }

        // Calculate Round Off
        const exactTotal = invoice.totalTaxableValue + (invoice.isInterState ? invoice.totalIgst : (invoice.totalCgst + invoice.totalSgst));
        const roundOffVal = Number((invoice.grandTotal - exactTotal).toFixed(2));
        gstLines.push({ name: 'Round Off', amt: roundOffVal });

        gstLines.forEach((g) => {
            doc.moveTo(colAmount, currentY).lineTo(colAmount, currentY + 16).stroke('#000000');
            doc.font('Helvetica-Bold').fontSize(8);
            doc.text(g.name, colPer + 5, currentY + 4);
            doc.font('Helvetica').text(g.amt.toFixed(2), colAmount, currentY + 4, { width: endTable - colAmount - 5, align: 'right' });
            currentY += 16;
            doc.moveTo(40, currentY).lineTo(555, currentY).stroke('#000000');
        });

        // Grand Total row
        doc.moveTo(colAmount, currentY).lineTo(colAmount, currentY + 16).stroke('#000000');
        doc.font('Helvetica-Bold').fontSize(9.5);
        doc.text('Total', colPer + 5, currentY + 3);
        doc.text(`${totalQty} No`, colQty, currentY + 3, { width: colRate - colQty, align: 'center' });
        doc.text(`Rs. ${invoice.grandTotal.toFixed(2)}`, colAmount, currentY + 3, { width: endTable - colAmount - 5, align: 'right' });

        currentY += 16;
        doc.moveTo(40, currentY).lineTo(555, currentY).stroke('#000000');

        // Amount chargeable in words
        doc.font('Helvetica').fontSize(8).fillColor('#333333');
        doc.text('Amount Chargeable (in words):', 45, currentY + 4);
        doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#000000');
        doc.text(`INR ${amountToWords(invoice.grandTotal)}`, 45, currentY + 14);

        currentY += 28;
        doc.moveTo(40, currentY).lineTo(555, currentY).stroke('#000000');

        // --- Tax Breakdown Table Grid ---
        const breakY = currentY;
        const breakRowHeight = 15;

        // Sub-table columns
        const bxTaxable = 40; // width = 110
        const bxCgstR = 150; // width = 50
        const bxCgstA = 200; // width = 60
        const bxSgstR = 260; // width = 50
        const bxSgstA = 310; // width = 60
        const bxIgstR = 370; // width = 50
        const bxIgstA = 420; // width = 60
        const bxTotalTax = 480; // width = 75

        // Draw sub-table header
        doc.font('Helvetica-Bold').fontSize(7.5);
        doc.text('Taxable', bxTaxable, breakY + 3, { width: 110, align: 'center' });
        doc.text('Value', bxTaxable, breakY + 11, { width: 110, align: 'center' });

        if (invoice.isInterState) {
            doc.text('Integrated Tax', bxIgstR, breakY + 3, { width: 110, align: 'center' });
            doc.moveTo(bxIgstR, breakY + 13).lineTo(bxTotalTax, breakY + 13).stroke('#000000');
            doc.text('Rate', bxIgstR, breakY + 15, { width: 50, align: 'center' });
            doc.text('Amount', bxIgstA, breakY + 15, { width: 60, align: 'center' });
        } else {
            doc.text('Central Tax', bxCgstR, breakY + 3, { width: 110, align: 'center' });
            doc.moveTo(bxCgstR, breakY + 13).lineTo(bxSgstR, breakY + 13).stroke('#000000');
            doc.text('Rate', bxCgstR, breakY + 15, { width: 50, align: 'center' });
            doc.text('Amount', bxCgstA, breakY + 15, { width: 60, align: 'center' });

            doc.text('State Tax', bxSgstR, breakY + 3, { width: 110, align: 'center' });
            doc.moveTo(bxSgstR, breakY + 13).lineTo(bxIgstR, breakY + 13).stroke('#000000');
            doc.text('Rate', bxSgstR, breakY + 15, { width: 50, align: 'center' });
            doc.text('Amount', bxSgstA, breakY + 15, { width: 60, align: 'center' });
        }

        doc.text('Total', bxTotalTax, breakY + 3, { width: 75, align: 'center' });
        doc.text('Tax Amount', bxTotalTax, breakY + 11, { width: 75, align: 'center' });

        // Vertical lines for sub-table
        doc.moveTo(bxCgstR, breakY).lineTo(bxCgstR, breakY + 45).stroke('#000000');
        if (!invoice.isInterState) {
            doc.moveTo(bxCgstA, breakY + 13).lineTo(bxCgstA, breakY + 45).stroke('#000000');
            doc.moveTo(bxSgstR, breakY).lineTo(bxSgstR, breakY + 45).stroke('#000000');
            doc.moveTo(bxSgstA, breakY + 13).lineTo(bxSgstA, breakY + 45).stroke('#000000');
            doc.moveTo(bxIgstR, breakY).lineTo(bxIgstR, breakY + 45).stroke('#000000');
        } else {
            doc.moveTo(bxIgstR, breakY).lineTo(bxIgstR, breakY + 45).stroke('#000000');
            doc.moveTo(bxIgstA, breakY + 13).lineTo(bxIgstA, breakY + 45).stroke('#000000');
        }
        doc.moveTo(bxTotalTax, breakY).lineTo(bxTotalTax, breakY + 45).stroke('#000000');

        doc.moveTo(40, breakY + 25).lineTo(555, breakY + 25).stroke('#000000');

        // Fill sub-table row
        const valY = breakY + 28;
        doc.font('Helvetica').fontSize(8);
        doc.text(invoice.totalTaxableValue.toFixed(2), bxTaxable, valY, { width: 110, align: 'right' });

        const totalTaxAmt = invoice.isInterState ? invoice.totalIgst : (invoice.totalCgst + invoice.totalSgst);

        if (invoice.isInterState) {
            // Assume 18% slab for shipping charges and averaged for simplicity
            const rateStr = items.length > 0 ? `${items[0].gstSlab}%` : '18%';
            doc.text(rateStr, bxIgstR, valY, { width: 50, align: 'center' });
            doc.text(invoice.totalIgst.toFixed(2), bxIgstA, valY, { width: 60, align: 'right' });
        } else {
            const firstSlab = items.length > 0 ? items[0].gstSlab : 18;
            const halfSlab = (firstSlab / 2).toString() + '%';
            doc.text(halfSlab, bxCgstR, valY, { width: 50, align: 'center' });
            doc.text(invoice.totalCgst.toFixed(2), bxCgstA, valY, { width: 60, align: 'right' });

            doc.text(halfSlab, bxSgstR, valY, { width: 50, align: 'center' });
            doc.text(invoice.totalSgst.toFixed(2), bxSgstA, valY, { width: 60, align: 'right' });
        }
        doc.text(totalTaxAmt.toFixed(2), bxTotalTax, valY, { width: 75, align: 'right' });

        doc.moveTo(40, breakY + 45).lineTo(555, breakY + 45).stroke('#000000');

        // Total Row of sub-table
        doc.font('Helvetica-Bold');
        doc.text('Total', bxTaxable + 5, breakY + 49);
        doc.text(invoice.totalTaxableValue.toFixed(2), bxTaxable, breakY + 49, { width: 110, align: 'right' });
        if (invoice.isInterState) {
            doc.text(invoice.totalIgst.toFixed(2), bxIgstA, breakY + 49, { width: 60, align: 'right' });
        } else {
            doc.text(invoice.totalCgst.toFixed(2), bxCgstA, breakY + 49, { width: 60, align: 'right' });
            doc.text(invoice.totalSgst.toFixed(2), bxSgstA, breakY + 49, { width: 60, align: 'right' });
        }
        doc.text(totalTaxAmt.toFixed(2), bxTotalTax, breakY + 49, { width: 75, align: 'right' });

        currentY = breakY + 60;
        doc.moveTo(40, currentY).lineTo(555, currentY).stroke('#000000');

        // Tax Amount (in words)
        doc.font('Helvetica').fontSize(7.5).fillColor('#333333');
        doc.text('Tax Amount (in words) : ', 45, currentY + 4, { continued: true });
        doc.font('Helvetica-Bold').fontSize(8).fillColor('#000000');
        doc.text(`INR ${amountToWords(totalTaxAmt)}`);

        currentY += 14;
        doc.moveTo(40, currentY).lineTo(555, currentY).stroke('#000000');

        // Remarks, PAN, and declaration split screen
        const footerInfoY = currentY;
        doc.moveTo(340, footerInfoY).lineTo(340, 802).stroke('#000000');

        doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#000000')
            .text(`Remarks: Order Ref No: #${invoice.orderId?.orderId || 'N/A'}`, 45, footerInfoY + 5)
            .text(`Company's PAN : AAHCD5265C`, 45, footerInfoY + 22)
            .text('Declaration', 45, footerInfoY + 36);

        doc.font('Helvetica').fontSize(7).fillColor('#444444')
            .text('We declare that this invoice shows the actual price of the goods described and that all particulars are true and accurate.', 45, footerInfoY + 46, { width: 285 });

        // Signatory box on the right
        doc.font('Helvetica').fontSize(8.5).fillColor('#000000')
            .text('for Dabster International Private Limited', 345, footerInfoY + 5, { width: 205, align: 'right' })
            .font('Helvetica-Bold')
            .text('Authorised Signatory', 345, footerInfoY + 65, { width: 205, align: 'right' });

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

            doc.fontSize(24)
                .font('Helvetica-Bold')
                .fillColor('#0f172a')
                .text('INFINITY ENTERPRISES', 40, 35);
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
