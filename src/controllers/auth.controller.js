import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import jwt from 'jsonwebtoken';
import { OtpToken } from '../models/OtpToken.js';
import { AuthService } from '../services/auth.service.js';
import crypto from 'crypto';


const cookieOptions = {
    httpOnly: true,
    
    secure: process.env.NODE_ENV === 'production',
    
    
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
};

const generateAccessAndRefreshTokens = async (userId) => {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
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

    
    const otpCode = crypto.randomInt(1000, 10000).toString();

    
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

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);
    const loggedInUser = await User.findById(user._id).select('-passwordHash -refreshToken');

    return res
        .status(200)
        .cookie('accessToken', accessToken, cookieOptions)
        .cookie('refreshToken', refreshToken, cookieOptions)
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

export const registerUser = asyncHandler(async (req, res) => {
    
    const createdUser = await AuthService.registerUser(req.body);

    
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(createdUser._id);

    return res
        .status(201)
        .cookie('accessToken', accessToken, cookieOptions)
        .cookie('refreshToken', refreshToken, cookieOptions)
        .json(
            new ApiResponse(
                201,
                {
                    user: createdUser,
                    accessToken,
                    refreshToken,
                },
                `Account created successfully.`
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
    if (cleanEmail) {
        query.email = cleanEmail;
    } else if (cleanPhone) {
        query.phoneNumber = cleanPhone;
    }

    
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

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);
    const loggedInUser = await User.findById(user._id).select('-passwordHash -refreshToken');

    return res
        .status(200)
        .cookie('accessToken', accessToken, cookieOptions)
        .cookie('refreshToken', refreshToken, cookieOptions)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser,
                },
                'Logged in successfully'
            )
        );
});

export const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(req.user._id, { $unset: { refreshToken: 1 } }, { new: true });

    return res
        .status(200)
        .clearCookie('accessToken', cookieOptions)
        .clearCookie('refreshToken', cookieOptions)
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

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, 'Refresh token is expired or used');
        }

        const { accessToken, refreshToken: newRefreshToken } = await generateAccessAndRefreshTokens(
            user._id
        );

        return res
            .status(200)
            .cookie('accessToken', accessToken, cookieOptions)
            .cookie('refreshToken', newRefreshToken, cookieOptions)
            .json(new ApiResponse(200, {}, 'Access token refreshed successfully'));
    } catch (error) {
        throw new ApiError(401, error?.message || 'Invalid refresh token');
    }
});
