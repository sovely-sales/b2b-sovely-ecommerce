import { AccessRequest } from '../models/AccessRequest.js';
import { User } from '../models/User.js';

export const createAccessRequest = async (req, res, next) => {
    try {
        const { name, email, phone, company, volume, message } = req.body;

        const newRequest = await AccessRequest.create({
            name,
            email,
            phone,
            company,
            volume,
            message,
        });

        return res.status(201).json({
            success: true,
            message: 'Access request submitted successfully.',
            data: newRequest,
        });
    } catch (error) {
        next(error);
    }
};

export const getAccessRequests = async (req, res, next) => {
    try {
        const { status } = req.query;
        let query = {};

        if (status) {
            query.status = status.toUpperCase();
        }

        const requests = await AccessRequest.find(query).sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            data: requests,
        });
    } catch (error) {
        next(error);
    }
};

export const updateAccessRequestStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = ['PENDING', 'REVIEWED', 'APPROVED', 'REJECTED'];
        if (!validStatuses.includes(status)) {
            const error = new Error('Invalid status.');
            error.statusCode = 400;
            throw error;
        }

        if (status === 'REJECTED') {
            const deletedRequest = await AccessRequest.findByIdAndDelete(id);
            if (!deletedRequest) {
                const error = new Error('Access request not found.');
                error.statusCode = 404;
                throw error;
            }
            return res.status(200).json({
                success: true,
                message: 'Access request has been rejected and deleted successfully.',
            });
        }

        const requestToUpdate = await AccessRequest.findById(id);
        if (!requestToUpdate) {
            const error = new Error('Access request not found.');
            error.statusCode = 404;
            throw error;
        }

        let newUser = null;

        if (status === 'APPROVED') {
            const { password, validity } = req.body;
            if (!password || password.length < 6) {
                const error = new Error('A secure password (min 6 chars) is required to approve and create an account.');
                error.statusCode = 400;
                throw error;
            }

            // Check if user already exists
            const existingUser = await User.findOne({
                $or: [{ email: requestToUpdate.email }, { phone: requestToUpdate.phone }]
            });

            if (existingUser) {
                const error = new Error('A user with this email or phone number already exists.');
                error.statusCode = 400;
                throw error;
            }

            // Determine expiration
            let expiresAt = null;
            if (validity && validity !== 'permanent') {
                const days = parseInt(validity, 10);
                if (!isNaN(days) && days > 0) {
                    expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
                }
            }

            // Create user
            newUser = await User.create({
                name: requestToUpdate.name,
                email: requestToUpdate.email,
                phone: requestToUpdate.phone,
                passwordHash: password, // The pre-save hook expects passwordHash, wait, earlier I used password: password. Wait, if schema only has passwordHash, using password might have crashed!
                role: 'CUSTOMER',
                expiresAt: expiresAt,
            });
        }

        requestToUpdate.status = status;
        const updatedRequest = await requestToUpdate.save();

        return res.status(200).json({
            success: true,
            message: status === 'APPROVED' ? 'Access request approved and user account created successfully.' : 'Access request status updated successfully.',
            data: updatedRequest,
            credentials: status === 'APPROVED' ? { email: newUser.email, password: req.body.password } : undefined
        });
    } catch (error) {
        next(error);
    }
};
