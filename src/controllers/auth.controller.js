import { User } from '../models/User.js';
import { UserSession } from '../models/UserSession.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import jwt from 'jsonwebtoken';
import { OtpToken } from '../models/OtpToken.js';
import crypto from 'crypto';

const accessTokenMaxAge = 24 * 60 * 60 * 1000; // 1 Day in milliseconds

const getAccessTokenCookieOptions = () => ({
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // Changed back to 'none' for Render proxy
    maxAge: accessTokenMaxAge
});

const getRefreshTokenCookieOptions = () => ({
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // Changed back to 'none' for Render proxy
    maxAge: refreshTokenExpiryMs
});

const parseExpiryToMs = (value, fallbackMs) => {
    if (!value) return fallbackMs;

    if (/^\d+$/.test(value)) {
        return Number(value) * 1000;
    }

    const match = String(value)
        .trim()
        .match(/^(\d+)\s*([smhd])$/i);
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

const generateAccessAndRefreshTokens = async (userId, req, existingSessionId = null) => {
    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, 'User not found');

    const userAgent = req.get('user-agent') || '';
    const ipAddress = getClientIp(req);
    const device = parseDeviceInfo(userAgent);

    let session = null;
    if (existingSessionId) {
        session = await UserSession.findOne({
            _id: existingSessionId,
            userId: user._id,
            isRevoked: false,
        });
    }

    if (!session) {
        session = await UserSession.create({
            userId: user._id,
            tokenHash: 'pending',
            userAgent,
            ipAddress,
            ...device,
            lastSeenAt: new Date(),
            expiresAt: new Date(Date.now() + refreshTokenExpiryMs),
        });
    }

    const accessToken = user.generateAccessToken(session._id);
    const refreshToken = user.generateRefreshToken(session._id);

    session.tokenHash = hashToken(refreshToken);
    session.userAgent = userAgent || session.userAgent;
    session.ipAddress = ipAddress || session.ipAddress;
    session.deviceType = device.deviceType;
    session.os = device.os;
    session.browser = device.browser;
    session.lastSeenAt = new Date();
    session.expiresAt = new Date(Date.now() + refreshTokenExpiryMs);
    session.isRevoked = false;
    session.revokedAt = null;
    await session.save({ validateBeforeSave: false });

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken, session };
};

export const sendOtp = asyncHandler(async (req, res) => {
    const { phoneNumber, isLogin } = req.body;

    if (!phoneNumber) {
        throw new ApiError(400, 'Phone number is required');
    }

    if (isLogin) {
        const userExists = await User.findOne({ phoneNumber, isActive: true, deletedAt: null });
        if (!userExists) {
            throw new ApiError(404, 'No active account found with this phone number');
        }
    }

    const otpCode = crypto.randomInt(100000, 1000000).toString();

    await OtpToken.deleteMany({ identifier: phoneNumber, isUsed: false });

    await OtpToken.create({
        identifier: phoneNumber,
        otpCode,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    console.log(`[SMS MOCK] Sent OTP ${otpCode} to ${phoneNumber}`);

    return res.status(200).json(new ApiResponse(200, {}, 'OTP sent successfully'));
});

export const loginWithOtp = asyncHandler(async (req, res) => {
    const { phoneNumber, otpCode } = req.body;

    if (!phoneNumber || !otpCode) {
        throw new ApiError(400, 'Phone number and OTP are required');
    }

    const validOtp = await OtpToken.findOne({
        identifier: phoneNumber,
        otpCode,
        isUsed: false,
        expiresAt: { $gt: new Date() },
    });

    if (!validOtp) {
        throw new ApiError(400, 'Invalid or expired OTP');
    }

    validOtp.isUsed = true;
    await validOtp.save();

    const user = await User.findOne({ phoneNumber, isActive: true, deletedAt: null });
    if (!user) {
        throw new ApiError(404, 'User account not found or suspended');
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id, req);
    const loggedInUser = await User.findById(user._id).select('-passwordHash -refreshToken');

    return res
        .status(200)
        .cookie('accessToken', accessToken, getAccessTokenCookieOptions())
        .cookie('refreshToken', refreshToken, getRefreshTokenCookieOptions())
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser,
                    accessToken,
                    refreshToken,
                },
                'Logged in successfully via OTP'
            )
        );
});

export const loginUser = asyncHandler(async (req, res) => {
    const { email, phoneNumber, password } = req.body;

    if (!email && !phoneNumber) {
        throw new ApiError(400, 'Email or phone number is required');
    }

    const cleanEmail = email ? email.trim().toLowerCase() : undefined;
    const cleanPhone = phoneNumber ? phoneNumber.trim() : undefined;

    const query = { isActive: true };
    if (cleanEmail) query.email = cleanEmail;
    else if (cleanPhone) query.phoneNumber = cleanPhone;

    const user = await User.findOne(query);
    if (!user || user.deletedAt) {
        throw new ApiError(
            404,
            `No account found with this ${cleanEmail ? 'email' : 'phone number'}`
        );
    }

    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
        throw new ApiError(401, 'Incorrect password. Please try again.');
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id, req);
    const loggedInUser = await User.findById(user._id).select('-passwordHash -refreshToken');

    return res
        .status(200)
        .cookie('accessToken', accessToken, getAccessTokenCookieOptions())
        .cookie('refreshToken', refreshToken, getRefreshTokenCookieOptions())
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser,
                    accessToken,
                    refreshToken,
                },
                'Logged in successfully'
            )
        );
});

export const logoutUser = asyncHandler(async (req, res) => {
    if (req.authSessionId) {
        await UserSession.findOneAndUpdate(
            {
                _id: req.authSessionId,
                userId: req.user._id,
            },
            {
                isRevoked: true,
                revokedAt: new Date(),
            }
        );
    }

    await User.findByIdAndUpdate(req.user._id, { $unset: { refreshToken: 1 } }, { new: true });

    return res
        .status(200)
        .clearCookie('accessToken', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax' })
        .clearCookie('refreshToken', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax' })
        .json(new ApiResponse(200, {}, 'Logged out successfully'));
});

export const getCurrentUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select('-passwordHash -refreshToken');

    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    return res.status(200).json(new ApiResponse(200, user, 'Current user fetched'));
});

export const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(401, 'Unauthorized request. No refresh token provided.');
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET || 'fallback_refresh_secret'
        );

        const user = await User.findById(decodedToken?._id);
        if (!user || user.deletedAt !== null || !user.isActive) {
            throw new ApiError(401, 'Invalid refresh token or user account suspended');
        }

        let sessionId = decodedToken?.sid || null;

        if (sessionId) {
            const existingSession = await UserSession.findOne({
                _id: sessionId,
                userId: user._id,
                isRevoked: false,
                expiresAt: { $gt: new Date() },
            });

            if (!existingSession) {
                throw new ApiError(401, 'Session is no longer active');
            }

            const isTokenValid = existingSession.tokenHash === hashToken(incomingRefreshToken);
            if (!isTokenValid) {
                existingSession.isRevoked = true;
                existingSession.revokedAt = new Date();
                await existingSession.save({ validateBeforeSave: false });
                throw new ApiError(401, 'Refresh token mismatch for session');
            }
        } else {
            if (incomingRefreshToken !== user.refreshToken) {
                throw new ApiError(401, 'Refresh token is expired or used');
            }
        }

        const { accessToken, refreshToken: newRefreshToken } = await generateAccessAndRefreshTokens(
            user._id,
            req,
            sessionId
        );

        return res
        .status(200)
            .cookie('accessToken', accessToken, getAccessTokenCookieOptions())
            .cookie('refreshToken', refreshToken, getRefreshTokenCookieOptions())
            .json(
                new ApiResponse(
                    200,
                    {
                        accessToken,
                        refreshToken: newRefreshToken,
                    },
                    'Access token refreshed successfully'
                )
            );
    } catch (error) {
        throw new ApiError(401, error?.message || 'Invalid refresh token');
    }
});

export const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;
    if (!email) throw new ApiError(400, 'Email is required');

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) throw new ApiError(404, 'No account found with this email');

    const otpCode = crypto.randomInt(100000, 1000000).toString();

    await OtpToken.deleteMany({ identifier: email.toLowerCase(), isUsed: false });
    await OtpToken.create({
        identifier: email.toLowerCase(),
        otpCode,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    console.log(`\n📧 EMAIL SENT TO ${email}: Your Sovely Password Reset OTP is ${otpCode}\n`);

    return res.status(200).json(new ApiResponse(200, null, 'OTP sent to your email'));
});

export const resetPassword = asyncHandler(async (req, res) => {
    const { email, otpCode, newPassword } = req.body;
    if (!email || !otpCode || !newPassword) {
        throw new ApiError(400, 'Email, OTP, and new password are required');
    }

    const validOtp = await OtpToken.findOneAndUpdate(
        {
            identifier: email.toLowerCase(),
            otpCode,
            isUsed: false,
            expiresAt: { $gt: new Date() },
        },
        { isUsed: true },
        { new: true }
    );

    if (!validOtp) throw new ApiError(400, 'Invalid or expired OTP');

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) throw new ApiError(404, 'User not found');

    user.passwordHash = newPassword;

    await UserSession.updateMany(
        { userId: user._id, isRevoked: false },
        { isRevoked: true, revokedAt: new Date() }
    );

    await user.save();

    return res
        .status(200)
        .json(new ApiResponse(200, null, 'Password reset successfully. Please login again.'));
});

export const getMySessions = asyncHandler(async (req, res) => {
    const sessions = await UserSession.find({
        userId: req.user._id,
        isRevoked: false,
        expiresAt: { $gt: new Date() },
    })
        .sort({ lastSeenAt: -1 })
        .limit(20);

    const mappedSessions = sessions.map((session) => ({
        id: String(session._id),
        deviceType: session.deviceType,
        os: session.os,
        browser: session.browser,
        ipAddress: session.ipAddress || 'Unknown IP',
        lastSeenAt: session.lastSeenAt,
        createdAt: session.createdAt,
        isCurrent: req.authSessionId ? String(session._id) === String(req.authSessionId) : false,
    }));

    return res
        .status(200)
        .json(new ApiResponse(200, { sessions: mappedSessions }, 'Active sessions fetched'));
});

export const revokeMySession = asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    if (!/^[0-9a-fA-F]{24}$/.test(sessionId)) {
        throw new ApiError(400, 'Invalid session id');
    }

    const session = await UserSession.findOne({
        _id: sessionId,
        userId: req.user._id,
        isRevoked: false,
    });

    if (!session) {
        throw new ApiError(404, 'Session not found');
    }

    session.isRevoked = true;
    session.revokedAt = new Date();
    await session.save({ validateBeforeSave: false });

    const isCurrent = req.authSessionId && String(req.authSessionId) === String(session._id);
    if (isCurrent) {
        return res
            .status(200)
            .clearCookie('accessToken', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax' })
            .clearCookie('refreshToken', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax' })
            .json(new ApiResponse(200, { signedOut: true }, 'Current session revoked'));
    }

    return res.status(200).json(new ApiResponse(200, null, 'Session revoked successfully'));
});

export const revokeOtherSessions = asyncHandler(async (req, res) => {
    if (!req.authSessionId) {
        throw new ApiError(400, 'Current session could not be identified');
    }

    const result = await UserSession.updateMany(
        {
            userId: req.user._id,
            isRevoked: false,
            _id: { $ne: req.authSessionId },
        },
        {
            isRevoked: true,
            revokedAt: new Date(),
        }
    );

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { revokedCount: result.modifiedCount || 0 },
                'All other sessions revoked successfully'
            )
        );
});
