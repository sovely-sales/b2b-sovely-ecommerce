import { User } from '../models/User.js';
import { UserSession } from '../models/UserSession.js';
import { OtpToken } from '../models/OtpToken.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
};

const escapeRegex = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const parseExpiryToMs = (value, fallbackMs) => {
    if (!value) return fallbackMs;
    if (/^\d+$/.test(value)) return Number(value) * 1000;

    const match = String(value).trim().match(/^(\d+)\s*([smhd])$/i);
    if (!match) return fallbackMs;

    const qty = Number(match[1]);
    const unit = match[2].toLowerCase();
    const unitMap = { s: 1000, m: 60 * 1000, h: 60 * 60 * 1000, d: 24 * 60 * 60 * 1000 };
    return qty * (unitMap[unit] || 0) || fallbackMs;
};

const refreshTokenExpiryMs = parseExpiryToMs(
    process.env.REFRESH_TOKEN_EXPIRY?.trim(),
    10 * 24 * 60 * 60 * 1000
);

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const getClientIp = (req) => {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded && typeof forwarded === 'string') {
        return forwarded.split(',')[0].trim();
    }
    return req.ip || req.socket?.remoteAddress || '';
};

const parseDeviceInfo = (userAgent = '') => {
    const ua = String(userAgent).toLowerCase();
    let deviceType = 'Unknown';
    if (/ipad|tablet/.test(ua)) deviceType = 'Tablet';
    else if (/mobi|android|iphone/.test(ua)) deviceType = 'Mobile';
    else if (ua) deviceType = 'Desktop';

    let os = 'Unknown OS';
    if (ua.includes('windows')) os = 'Windows';
    else if (ua.includes('android')) os = 'Android';
    else if (/iphone|ipad|ipod|ios/.test(ua)) os = 'iOS';
    else if (ua.includes('mac os') || ua.includes('macintosh')) os = 'macOS';
    else if (ua.includes('linux')) os = 'Linux';

    let browser = 'Unknown Browser';
    if (ua.includes('edg/')) browser = 'Edge';
    else if (ua.includes('chrome/') && !ua.includes('edg/')) browser = 'Chrome';
    else if (ua.includes('firefox/')) browser = 'Firefox';
    else if (ua.includes('safari/') && !ua.includes('chrome/')) browser = 'Safari';

    return { deviceType, os, browser };
};

export const sendSignupOtp = asyncHandler(async (req, res) => {
    const { phoneNumber } = req.body;
    if (!phoneNumber) throw new ApiError(400, 'Phone number is required');

    const existingUser = await User.findOne({ phoneNumber });
    if (existingUser) throw new ApiError(409, 'Phone number already registered');

    const otpCode = Math.floor(1000 + Math.random() * 9000).toString();
    await OtpToken.updateMany({ identifier: phoneNumber, isUsed: false }, { isUsed: true });
    await OtpToken.create({
        identifier: phoneNumber,
        otpCode,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    console.log(`\n📱 SMS SENT TO ${phoneNumber}: Your Sovely SIGNUP OTP is ${otpCode}\n`);
    return res.status(200).json(new ApiResponse(200, null, 'OTP sent successfully'));
});

export const sendLoginOtp = asyncHandler(async (req, res) => {
    const { phoneNumber } = req.body;
    if (!phoneNumber) throw new ApiError(400, 'Phone number is required');

    const existingUser = await User.findOne({ phoneNumber });
    if (!existingUser) throw new ApiError(404, 'Phone number not registered. Please sign up.');

    const otpCode = Math.floor(1000 + Math.random() * 9000).toString();
    await OtpToken.updateMany({ identifier: phoneNumber, isUsed: false }, { isUsed: true });
    await OtpToken.create({
        identifier: phoneNumber,
        otpCode,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    console.log(`\n📱 SMS SENT TO ${phoneNumber}: Your Sovely LOGIN OTP is ${otpCode}\n`);
    return res.status(200).json(new ApiResponse(200, null, 'Login OTP sent successfully'));
});

export const loginWithOtp = asyncHandler(async (req, res) => {
    const { phoneNumber, otpCode } = req.body;
    if (!phoneNumber || !otpCode) throw new ApiError(400, 'Phone and OTP required');

    const user = await User.findOne({ phoneNumber, isActive: true, deletedAt: null });
    if (!user) throw new ApiError(404, 'User not found or account suspended');

    const validOtp = await OtpToken.findOneAndUpdate(
        {
            identifier: phoneNumber,
            otpCode,
            isUsed: false,
            expiresAt: { $gt: new Date() },
        },
        { isUsed: true },
        { new: true }
    );

    if (!validOtp) throw new ApiError(400, 'Invalid or expired OTP');

    const userAgent = req.get('user-agent') || '';
    const ipAddress = getClientIp(req);
    const device = parseDeviceInfo(userAgent);

    const session = await UserSession.create({
        userId: user._id,
        tokenHash: 'pending',
        userAgent,
        ipAddress,
        ...device,
        lastSeenAt: new Date(),
        expiresAt: new Date(Date.now() + refreshTokenExpiryMs),
    });

    const accessToken = user.generateAccessToken(session._id);
    const refreshToken = user.generateRefreshToken(session._id);
    session.tokenHash = hashToken(refreshToken);
    await session.save({ validateBeforeSave: false });

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    const loggedInUser = await User.findById(user._id).select('-passwordHash -refreshToken');

    return res
        .status(200)
        .cookie('accessToken', accessToken, cookieOptions)
        .cookie('refreshToken', refreshToken, cookieOptions)
        .json(
            new ApiResponse(
                200,
                { user: loggedInUser, accessToken, refreshToken },
                'Logged in successfully'
            )
        );
});

export const getAllUsers = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const search = req.query.search || '';
    const role = req.query.role || 'ALL';
    const kycStatus = req.query.kycStatus || 'ALL';
    const isActive = req.query.isActive || 'ALL';

    const query = { deletedAt: null };

    if (search) {
        const safeSearch = escapeRegex(search);
        query['$or'] = [
            { name: { $regex: safeSearch, $options: 'i' } },
            { email: { $regex: safeSearch, $options: 'i' } },
            { phoneNumber: { $regex: safeSearch, $options: 'i' } },
            { companyName: { $regex: safeSearch, $options: 'i' } },
            { gstin: { $regex: safeSearch, $options: 'i' } },
        ];
    }

    if (role !== 'ALL') query.role = role;
    if (kycStatus !== 'ALL') query.kycStatus = kycStatus;
    if (isActive !== 'ALL') query.isActive = isActive === 'true';

    const total = await User.countDocuments(query);
    const users = await User.find(query)
        .select('-passwordHash -refreshToken')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                data: users,
                pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
            },
            'Users fetched successfully'
        )
    );
});

export const updateKycStatus = asyncHandler(async (req, res) => {
    const { kycStatus, kycRejectionReason } = req.body;

    if (!['PENDING', 'APPROVED', 'REJECTED'].includes(kycStatus)) {
        throw new ApiError(400, 'Invalid KYC Status. Must be PENDING, APPROVED, or REJECTED.');
    }

    const updateData = { kycStatus };
    if (kycStatus === 'APPROVED') {
        updateData.isActive = true;
        updateData.kycRejectionReason = null;
        updateData.role = 'RESELLER';
        updateData.isVerifiedB2B = true;
    } else if (kycStatus === 'REJECTED') {
        updateData.kycRejectionReason = kycRejectionReason || 'Details do not match our records.';
        updateData.isVerifiedB2B = false;
    }

    const user = await User.findByIdAndUpdate(req.params.id, updateData, { new: true }).select(
        '-passwordHash -refreshToken'
    );

    if (!user) throw new ApiError(404, 'User not found');

    return res
        .status(200)
        .json(new ApiResponse(200, user, `User KYC status updated to ${kycStatus}`));
});

export const toggleUserStatus = asyncHandler(async (req, res) => {
    const { isActive } = req.body;

    if (isActive === false) {
        await UserSession.updateMany(
            { userId: req.params.id, isRevoked: false },
            { isRevoked: true, revokedAt: new Date() }
        );
    }

    const user = await User.findByIdAndUpdate(
        req.params.id,
        {
            isActive,
            ...(isActive === false ? { refreshToken: null } : {}),
        },
        { new: true }
    ).select('-passwordHash -refreshToken');

    if (!user) throw new ApiError(404, 'User not found');

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                user,
                `User account has been ${isActive ? 'activated' : 'suspended'}`
            )
        );
});

export const updateMyProfile = asyncHandler(async (req, res) => {
    const {
        name,
        email,
        companyName,
        gstin,
        billingAddress,
        emailNotifications,
        orderSms,
        promotionalEmails,
    } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (email !== undefined) updateData.email = email.trim().toLowerCase();
    if (companyName !== undefined) updateData.companyName = companyName.trim();
    if (gstin !== undefined) updateData.gstin = gstin.trim().toUpperCase();
    if (billingAddress) {
        updateData.billingAddress = {
            street: billingAddress.street?.trim() || '',
            city: billingAddress.city?.trim() || '',
            state: billingAddress.state?.trim() || '',
            zip: billingAddress.zip?.trim() || '',
        };
    }

    if (emailNotifications !== undefined) updateData.emailNotifications = emailNotifications;
    if (orderSms !== undefined) updateData.orderSms = orderSms;
    if (promotionalEmails !== undefined) updateData.promotionalEmails = promotionalEmails;

    const user = await User.findByIdAndUpdate(
        req.user._id,
        { $set: updateData },
        { new: true, runValidators: true }
    ).select('-passwordHash -refreshToken');

    return res.status(200).json(new ApiResponse(200, user, 'Profile updated successfully'));
});

export const updateAvatar = asyncHandler(async (req, res) => {
    if (!req.file) {
        throw new ApiError(400, 'Please select a valid image file (JPEG, PNG, or WEBP)');
    }

    const avatarUrl = `/avatars/${req.file.filename}`;

    const user = await User.findByIdAndUpdate(
        req.user._id,
        { $set: { avatar: avatarUrl } },
        { new: true }
    ).select('-passwordHash -refreshToken');

    if (!user) {
        throw new ApiError(404, 'User not found in system');
    }

    return res.status(200).json(new ApiResponse(200, user, 'Profile photo updated successfully'));
});

export const updatePassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) throw new ApiError(400, 'Both passwords are required');
    if (oldPassword === newPassword) {
        throw new ApiError(400, 'New password must be different from current password');
    }

    const user = await User.findById(req.user._id);

    const isPasswordValid = await user.isPasswordCorrect(oldPassword);
    if (!isPasswordValid) throw new ApiError(400, 'Invalid current password');

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save({ validateBeforeSave: false });

    return res.status(200).json(new ApiResponse(200, null, 'Password updated successfully'));
});

export const updateKycDetails = asyncHandler(async (req, res) => {
    const { gstin, panNumber, billingAddress, bankDetails } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) throw new ApiError(404, 'User not found');

    if (user.kycStatus === 'APPROVED') {
        throw new ApiError(
            403,
            'Your KYC is already approved. Contact support to modify locked business details.'
        );
    }

    if (gstin) user.gstin = gstin;
    if (panNumber) user.panNumber = panNumber;
    if (billingAddress) user.billingAddress = billingAddress;
    if (bankDetails) user.bankDetails = bankDetails;

    user.kycStatus = 'PENDING';

    await user.save({ validateBeforeSave: false });

    const updatedUser = await User.findById(user._id).select('-passwordHash -refreshToken');

    return res
        .status(200)
        .json(new ApiResponse(200, updatedUser, 'KYC details submitted for review'));
});

export const updateUserRole = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;

    if (!['CUSTOMER', 'ADMIN'].includes(role)) {
        throw new ApiError(400, 'Invalid role provided. Must be CUSTOMER or ADMIN.');
    }

    const userToUpdate = await User.findById(id);
    if (!userToUpdate) {
        throw new ApiError(404, 'User not found in system.');
    }

    if (userToUpdate._id.toString() === req.user._id.toString() && role === 'CUSTOMER') {
        throw new ApiError(403, 'You cannot demote yourself to a Customer.');
    }

    userToUpdate.role = role;
    await userToUpdate.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(
            new ApiResponse(200, userToUpdate, `User permissions successfully updated to ${role}`)
        );
});
