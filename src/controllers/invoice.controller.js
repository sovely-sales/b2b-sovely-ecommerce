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
    // FIX: Changed userId to resellerId
    const invoice = await Invoice.findOne({
        _id: req.params.id,
        resellerId: req.user._id,
    }).populate('orderId');

    if (!invoice) throw new ApiError(404, 'Invoice not found');

    return res.status(200).json(new ApiResponse(200, invoice, 'Invoice details fetched'));
});

export const listMyInvoices = asyncHandler(async (req, res) => {
    // FIX: Changed userId to resellerId
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

    const query = {};

    if (status !== 'ALL') {
        if (status === 'OVERDUE') {
            query.paymentStatus = 'UNPAID'; // FIX: Changed status to paymentStatus
            query.dueDate = { $lt: new Date() };
        } else {
            query.paymentStatus = status; // FIX: Changed status to paymentStatus
        }
    }

    if (search) {
        query['$or'] = [
            { invoiceNumber: { $regex: search, $options: 'i' } },
            // FIX: Changed buyerDetails to billedTo
            { 'billedTo.companyName': { $regex: search, $options: 'i' } },
            { 'billedTo.gstin': { $regex: search, $options: 'i' } },
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

export const getMyInvoices = asyncHandler(async (req, res) => {
    // Fetch all invoices belonging to the logged-in user
    const invoices = await Invoice.find({ userId: req.user._id }) // Or resellerId, depending on your schema
        .sort({ createdAt: -1 })
        .populate('orderId', 'orderId'); // Pull in the readable order number if it's referenced

    // Format the response for the frontend table
    const formattedInvoices = invoices.map((inv) => ({
        _id: inv._id,
        invoiceNumber: inv.invoiceNumber,
        orderId: inv.orderId?.orderId || 'N/A', // Adjust based on your population
        date: inv.createdAt,
        taxableAmount: inv.taxableAmount || 0,
        gstAmount: inv.taxAmount || 0,
        totalAmount: inv.totalAmount || 0,
        status: inv.status || 'PAID',
        // If the user has an approved KYC with a GSTIN, it's ITC eligible!
        isItcEligible: req.user.kycStatus === 'APPROVED' && !!req.user.gstin,
    }));

    return res
        .status(200)
        .json(new ApiResponse(200, formattedInvoices, 'Invoices fetched successfully'));
});

export const markAsPaidManual = asyncHandler(async (req, res) => {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) throw new ApiError(404, 'Invoice not found');

    // FIX: Changed status to paymentStatus
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
    // Note: In production, consider a robust library like 'number-to-words' for Indian Rupee format
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
        // Support finding by Invoice ID or Order ID
        const query = {};
        if (req.params.orderId) {
            query.orderId = req.params.orderId;
        } else {
            query._id = req.params.id;
        }

        if (req.user.role !== 'ADMIN') query.resellerId = req.user._id;

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
                doc.fontSize(24).font('Helvetica-Bold').fillColor('#0f172a').text('SOVELY', 40, 35);
            }
        } else {
            doc.fontSize(24).font('Helvetica-Bold').fillColor('#0f172a').text('SOVELY', 40, 35);
        }

        // Title changes based on type
        const docTitle = invoice.invoiceType === 'WALLET_TOPUP' ? 'RECEIPT' : 'TAX INVOICE';

        doc.fillColor('#0f172a')
            .fontSize(18)
            .font('Helvetica-Bold')
            .text(docTitle, 0, 35, { align: 'right', width: 555 });
        doc.fontSize(9)
            .font('Helvetica')
            .fillColor('#64748b')
            .text('(Original for Recipient)', 0, 55, { align: 'right', width: 555 });

        const topY = 160;

        doc.fillColor('#0f172a');
        doc.fontSize(10).font('Helvetica-Bold').text('Issued By:', 40, topY);
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
        // FIX: Replaced buyerDetails with billedTo
        doc.font('Helvetica-Bold')
            .fontSize(11)
            .text(invoice.billedTo?.companyName || req.user.name, 300, topY + 15);

        let addressString = invoice.billedTo?.address?.street
            ? `${invoice.billedTo.address.street}, ${invoice.billedTo.address.city}, ${invoice.billedTo.address.zip}`
            : 'Address not provided';

        doc.font('Helvetica')
            .fontSize(9)
            .text(addressString, 300, topY + 30, { width: 250 })
            .text(`State Code: ${invoice.billedTo?.address?.stateCode || 'N/A'}`, 300, doc.y + 2);

        if (invoice.billedTo?.gstin) {
            doc.font('Helvetica-Bold')
                .text('GSTIN: ', 300, doc.y + 4, { continued: true })
                .font('Helvetica')
                .text(invoice.billedTo.gstin);
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

        // TABLE LOGIC
        if (invoice.invoiceType !== 'WALLET_TOPUP' && invoice.items && invoice.items.length > 0) {
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

            // FIX: Loop through invoice.items, not invoice.orderId.items
            for (const item of invoice.items) {
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
                const taxAmount = invoice.isInterState
                    ? item.igstAmount
                    : item.cgstAmount + item.sgstAmount;

                if (index % 2 === 0) doc.rect(40, y, 515, 20).fill('#f8fafc');
                doc.fillColor('#0f172a');

                generateTableRow(
                    doc,
                    y + 6,
                    index.toString(),
                    displayTitle,
                    item.hsnCode || '0000',
                    item.qty.toString(),
                    item.unitBasePrice.toLocaleString('en-IN', { minimumFractionDigits: 2 }),
                    `${item.gstSlab}%`,
                    taxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 }),
                    item.totalItemAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })
                );

                y += 20;
                index++;
            }
            doc.moveTo(40, y).lineTo(555, y).stroke('#cbd5e1');
            y += 15;
        } else if (invoice.invoiceType === 'WALLET_TOPUP') {
            // Render a simple single line for Wallet Topup
            doc.rect(40, y, 515, 20).fillAndStroke('#f8fafc', '#cbd5e1');
            doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(10);
            doc.text('Description: Wallet Top-Up (Prepaid Balance)', 50, y + 6);
            y += 35;
        }

        // TOTALS SECTION
        doc.font('Helvetica-Bold').fontSize(9);

        if (invoice.invoiceType !== 'WALLET_TOPUP') {
            doc.text('Subtotal (Taxable):', 360, y);
            doc.text(
                `₹ ${invoice.totalTaxableValue?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '0.00'}`,
                450,
                y,
                { align: 'right', width: 100 }
            );
            y += 15;

            // FIX: Using direct totals from the invoice document
            if (invoice.isInterState) {
                doc.text('IGST Amount:', 360, y);
                doc.text(
                    `₹ ${invoice.totalIgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
                    450,
                    y,
                    { align: 'right', width: 100 }
                );
                y += 15;
            } else {
                doc.text('CGST Amount:', 360, y);
                doc.text(
                    `₹ ${(invoice.totalCgst || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
                    450,
                    y,
                    { align: 'right', width: 100 }
                );
                y += 15;
                doc.text('SGST Amount:', 360, y);
                doc.text(
                    `₹ ${(invoice.totalSgst || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
                    450,
                    y,
                    { align: 'right', width: 100 }
                );
                y += 15;
            }
        }

        doc.rect(350, y, 205, 25).fillAndStroke('#f1f5f9', '#cbd5e1');
        doc.fillColor('#0f172a')
            .fontSize(11)
            .font('Helvetica-Bold')
            .text('Grand Total:', 360, y + 7);
        doc.text(
            `₹ ${invoice.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
            450,
            y + 7,
            { align: 'right', width: 100 }
        );

        doc.moveDown(3);
        doc.fontSize(9).font('Helvetica-Bold').text('Amount in Words:');
        doc.font('Helvetica').text(amountToWords(invoice.grandTotal));

        // FOOTER
        if (doc.y > 650) doc.addPage();
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

        if (invoice.paymentStatus !== 'PAID') {
            try {
                const upiString = `upi://pay?pa=sovely@upi&pn=Sovely+ECommerce&tr=${invoice.invoiceNumber}&am=${invoice.grandTotal.toFixed(2)}&cu=INR`;
                const qrImage = await QRCode.toDataURL(upiString);
                doc.image(qrImage, 275, footerY - 5, { width: 80 });
                doc.fontSize(7).text('Scan to Pay via UPI', 280, footerY + 75);
            } catch (err) {
                console.error('QR Code generation failed', err);
            }
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

export const createInvoiceFromOrder = async (orderDoc, resellerDoc, session) => {
    // 1. Determine Interstate Tax
    // Assuming platform HQ is in Karnataka (State Code 29)
    const hqStateCode = '29';
    const resellerStateCode = resellerDoc.stateCode || '29'; // Default to intra-state if missing
    const isInterState = hqStateCode !== resellerStateCode;

    // 2. Map Order Items to Invoice Items strictly using the Order Snapshot
    const invoiceItems = orderDoc.items.map((item) => {
        // Platform Invoice ALWAYS reflects what the reseller pays us (Platform Cost)
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
            gstSlab: item.gstSlab, // Uses exact snapshot!
            cgstAmount: isInterState ? 0 : taxAmount / 2,
            sgstAmount: isInterState ? 0 : taxAmount / 2,
            igstAmount: isInterState ? taxAmount : 0,
            totalItemAmount: baseAmount + taxAmount,
        };
    });

    // 3. Add Shipping & COD as separate line items
    if (orderDoc.shippingTotal > 0) {
        invoiceItems.push({
            sku: 'FRGT-PKG-001',
            title: 'Freight & Packaging Services',
            hsnCode: '996813', // Standard Indian HSN for local freight/delivery
            qty: 1,
            unitBasePrice: orderDoc.shippingTotal,
            totalBaseAmount: orderDoc.shippingTotal,
            gstSlab: 0,
            cgstAmount: 0,
            sgstAmount: 0,
            igstAmount: 0,
            totalItemAmount: orderDoc.shippingTotal,
        });
    }

    if (orderDoc.codCharge > 0) {
        invoiceItems.push({
            sku: 'FEE-COD-001',
            title: 'Courier Cash on Delivery (COD) Fee',
            hsnCode: '999799', // Other services
            qty: 1,
            unitBasePrice: orderDoc.codCharge,
            totalBaseAmount: orderDoc.codCharge,
            gstSlab: 0,
            cgstAmount: 0,
            sgstAmount: 0,
            igstAmount: 0,
            totalItemAmount: orderDoc.codCharge,
        });
    }

    // 4. Calculate Totals directly from the invoice items array
    const totalTaxableValue = invoiceItems.reduce((acc, item) => acc + item.totalBaseAmount, 0);
    const totalCgst = invoiceItems.reduce((acc, item) => acc + item.cgstAmount, 0);
    const totalSgst = invoiceItems.reduce((acc, item) => acc + item.sgstAmount, 0);
    const totalIgst = invoiceItems.reduce((acc, item) => acc + item.igstAmount, 0);
    const grandTotal = totalTaxableValue + totalCgst + totalSgst + totalIgst;

    // 5. Build the Invoice Document
    const invoiceType = orderDoc.orderId.includes('WH') ? 'B2B_WHOLESALE' : 'DROPSHIP_PLATFORM_FEE';

    const invoice = new Invoice({
        invoiceNumber: `INV-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`,
        orderId: orderDoc._id,
        resellerId: resellerDoc._id,
        invoiceType: invoiceType,
        isInterState: isInterState,

        billedTo: {
            companyName: resellerDoc.companyName || resellerDoc.name,
            gstin: resellerDoc.gstin || '',
            address: {
                street: resellerDoc.companyAddress || resellerDoc.address || '',
                city: resellerDoc.city || 'N/A',
                state: resellerDoc.state || 'N/A',
                zip: resellerDoc.zip || 'N/A',
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

        paymentStatus: 'PAID', // Since your pipeline deducts wallet instantly
        paymentTerms: 'PREPAID',
        status: 'GENERATED',
    });

    await invoice.save({ session });
    return invoice;
};
