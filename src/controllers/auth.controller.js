import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import jwt from 'jsonwebtoken';
import { OtpToken } from '../models/OtpToken.js';
import { AuthService } from '../services/auth.service.js';

// Helper for setting secure cookies
const cookieOptions = {
    httpOnly: true,
    // MUST be false for localhost (since you aren't using https://)
    secure: process.env.NODE_ENV === 'production',
    // 'lax' allows localhost:3000 to send cookies to localhost:5173
    // 'none' is required for production if frontend and backend are on different domains
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
};

const generateAccessAndRefreshTokens = async (userId) => {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();

    // Generate Refresh Token
    const refreshToken = jwt.sign(
        { _id: user._id },
        process.env.REFRESH_TOKEN_SECRET || 'fallback_refresh_secret',
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || '7d' }
    );

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
};

/**
 * @desc    Generate and send OTP
 * @route   POST /api/auth/send-otp
 */
export const sendOtp = asyncHandler(async (req, res) => {
    const { phoneNumber, isLogin } = req.body;

    if (!phoneNumber) {
        throw new ApiError(400, 'Phone number is required');
    }

    // If it's a login request, ensure the user actually exists first
    if (isLogin) {
        const userExists = await User.findOne({ phoneNumber, isActive: true, deletedAt: null });
        if (!userExists) {
            throw new ApiError(404, 'No active account found with this phone number');
        }
    }

    // Generate a 4-digit OTP
    const otpCode = Math.floor(1000 + Math.random() * 9000).toString();

    // Clear any existing unused OTPs for this number to prevent spam/conflicts
    await OtpToken.deleteMany({ identifier: phoneNumber, isUsed: false });

    // Create new OTP valid for 10 minutes
    await OtpToken.create({
        identifier: phoneNumber,
        otpCode,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    // TODO: Integrate your SMS Gateway here (Twilio, MSG91, Fast2SMS, etc.)
    console.log(`[SMS MOCK] Sent OTP ${otpCode} to ${phoneNumber}`);

    return res.status(200).json(new ApiResponse(200, {}, 'OTP sent successfully'));
});

/**
 * @desc    Verify OTP and Login
 * @route   POST /api/auth/login-otp
 */
export const loginWithOtp = asyncHandler(async (req, res) => {
    const { phoneNumber, otpCode } = req.body;

    if (!phoneNumber || !otpCode) {
        throw new ApiError(400, 'Phone number and OTP are required');
    }

    // Find the valid OTP
    const validOtp = await OtpToken.findOne({
        identifier: phoneNumber,
        otpCode,
        isUsed: false,
        expiresAt: { $gt: new Date() }, // Ensure it hasn't expired
    });

    if (!validOtp) {
        throw new ApiError(400, 'Invalid or expired OTP');
    }

    // Mark OTP as used
    validOtp.isUsed = true;
    await validOtp.save();

    // Find user and log them in
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

/**
 * @desc    Register a new User (B2C or B2B)
 * @route   POST /api/auth/register
 */
export const registerUser = asyncHandler(async (req, res) => {
    // 1. Let the Service handle all the creation logic and validation
    const createdUser = await AuthService.registerUser(req.body);

    // 2. Controller handles HTTP-specific stuff (Tokens & Cookies)
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

/**
 * @desc    Login Reseller / Admin / Customer
 * @route   POST /api/auth/login
 */
export const loginUser = asyncHandler(async (req, res) => {
    const { email, phoneNumber, password } = req.body;

    if (!email && !phoneNumber) {
        throw new ApiError(400, 'Email or phone number is required');
    }

    // 1. Clean inputs (fixes issues where frontend sends trailing spaces)
    const cleanEmail = email ? email.trim().toLowerCase() : undefined;
    const cleanPhone = phoneNumber ? phoneNumber.trim() : undefined;

    // 2. Build a safer dynamic query
    const query = { isActive: true };
    if (cleanEmail) {
        query.email = cleanEmail;
    } else if (cleanPhone) {
        query.phoneNumber = cleanPhone;
    }

    // 3. Find the user
    const user = await User.findOne(query);

    // FIX: Check user existence and soft-delete status in JS memory 
    // to avoid MongoDB null vs undefined field matching quirks.
    if (!user || user.deletedAt) {
        // Updated error message to be generic (since Admins log in here too)
        throw new ApiError(404, 'Account does not exist or has been suspended');
    }

    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
        throw new ApiError(401, 'Invalid credentials');
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
                'Logged in successfully'
            )
        );
});

/**
 * @desc    Logout User
 * @route   POST /api/auth/logout
 */
export const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(req.user._id, { $unset: { refreshToken: 1 } }, { new: true });

    return res
        .status(200)
        .clearCookie('accessToken', cookieOptions)
        .clearCookie('refreshToken', cookieOptions)
        .json(new ApiResponse(200, {}, 'Logged out successfully'));
});

/**
 * @desc    Get Current Logged-In User Profile
 * @route   GET /api/auth/me
 */
export const getCurrentUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select('-passwordHash -refreshToken');

    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    return res.status(200).json(new ApiResponse(200, user, 'Current user fetched'));
});

/**
 * @desc    NEW: Refresh the Access Token
 * @route   POST /api/auth/refresh-token
 */
export const refreshAccessToken = asyncHandler(async (req, res) => {
    // Extract token from cookies OR body (depending on how frontend sends it)
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
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken: newRefreshToken },
                    'Access token refreshed successfully'
                )
            );
    } catch (error) {
        throw new ApiError(401, error?.message || 'Invalid refresh token');
    }
});
