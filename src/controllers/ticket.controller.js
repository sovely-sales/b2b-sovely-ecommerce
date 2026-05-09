import { Ticket } from '../models/Ticket.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const createTicket = asyncHandler(async (req, res) => {
    const { category, subject, description } = req.body;

    if (!subject || !description) {
        throw new ApiError(400, 'Subject and description are required');
    }

    let attachmentUrl = '';
    if (req.file) {
        attachmentUrl = `${req.protocol}://${req.get('host')}/temp/${req.file.filename}`;
    }

    const ticketId = `TKT-${Math.floor(100000 + Math.random() * 900000)}`;

    const ticket = await Ticket.create({
        user: req.user._id,
        ticketId,
        category: category || 'General',
        subject,
        description,
        attachment: attachmentUrl,
        status: 'OPEN',
    });

    return res.status(201).json(new ApiResponse(201, ticket, 'Support ticket created successfully'));
});

export const getMyTickets = asyncHandler(async (req, res) => {
    const tickets = await Ticket.find({ user: req.user._id }).sort({ createdAt: -1 });

    return res.status(200).json(new ApiResponse(200, tickets, 'Tickets fetched successfully'));
});

export const getAllTickets = asyncHandler(async (req, res) => {
    const { status } = req.query;
    const query = {};
    if (status && status !== 'ALL') {
        query.status = status;
    }

    const tickets = await Ticket.find(query)
        .populate('user', 'name email companyName')
        .sort({ createdAt: -1 });

    return res.status(200).json(new ApiResponse(200, tickets, 'All tickets fetched successfully'));
});

export const resolveTicket = asyncHandler(async (req, res) => {
    const { adminNote, status } = req.body;
    const { id } = req.params;

    const ticket = await Ticket.findById(id);

    if (!ticket) {
        throw new ApiError(404, 'Ticket not found');
    }

    if (status) {
        ticket.status = status;
    } else {
        ticket.status = 'RESOLVED';
    }

    if (adminNote !== undefined) {
        ticket.adminNote = adminNote;
    }

    if (req.file) {
        ticket.adminAttachment = `${req.protocol}://${req.get('host')}/temp/${req.file.filename}`;
    }

    await ticket.save();

    return res.status(200).json(new ApiResponse(200, ticket, 'Ticket updated successfully'));
});

export const editTicket = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { category, subject, description } = req.body;

    const ticket = await Ticket.findOne({ _id: id, user: req.user._id });

    if (!ticket) {
        throw new ApiError(404, 'Ticket not found');
    }

    if (ticket.status !== 'OPEN') {
        throw new ApiError(400, 'Cannot edit a resolved ticket');
    }

    if (category) ticket.category = category;
    if (subject) ticket.subject = subject;
    if (description) ticket.description = description;

    await ticket.save();

    return res.status(200).json(new ApiResponse(200, ticket, 'Ticket updated successfully'));
});

export const deleteTicket = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const ticket = await Ticket.findOneAndDelete({ _id: id, user: req.user._id });

    if (!ticket) {
        throw new ApiError(404, 'Ticket not found');
    }

    return res.status(200).json(new ApiResponse(200, {}, 'Ticket deleted successfully'));
});

export const deleteTicketAdmin = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const ticket = await Ticket.findByIdAndDelete(id);

    if (!ticket) {
        throw new ApiError(404, 'Ticket not found');
    }

    return res.status(200).json(new ApiResponse(200, {}, 'Ticket deleted successfully'));
});
