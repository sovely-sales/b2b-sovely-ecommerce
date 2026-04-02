import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { UserSession } from '../models/UserSession.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const verifyJWT = asyncHandler(async (req, res, next) => {
    try {
        const token =
            req.cookies?.accessToken || req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            throw new ApiError(401, 'Unauthorized request. No token provided.');
        }

        const decodedToken = jwt.verify(
            token,
            process.env.ACCESS_TOKEN_SECRET || 'fallback_secret'
        );

        if (decodedToken?.sid) {
            const session = await UserSession.findOne({
                _id: decodedToken.sid,
                userId: decodedToken._id,
                isRevoked: false,
                expiresAt: { $gt: new Date() },
            });

            if (!session) {
                throw new ApiError(401, 'Session expired or revoked. Please login again.');
            }

            req.authSessionId = decodedToken.sid;
        }

        const user = await User.findOne({
            _id: decodedToken._id,
            isActive: true,
            deletedAt: null,
        }).select('-passwordHash -refreshToken');

        if (!user) {
            throw new ApiError(401, 'Invalid Access Token or Account Suspended');
        }

        req.user = user;
        req.authTokenPayload = decodedToken;
        next();
    } catch (error) {
        throw new ApiError(401, error?.message || 'Invalid access token');
    }
});

export const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            throw new ApiError(
                403,
                `Access denied. Requires one of the following roles: ${allowedRoles.join(', ')}`
            );
        }
        next();
    };
};

export const requireKycApproved = asyncHandler(async (req, res, next) => {
    if (req.user.role === 'ADMIN') {
        return next();
    }

    if (req.user.kycStatus !== 'APPROVED') {
        throw new ApiError(
            403,
            'Your KYC is still pending or rejected. Please contact support or update your GSTIN to unlock this feature.'
        );
    }

    next();
});
