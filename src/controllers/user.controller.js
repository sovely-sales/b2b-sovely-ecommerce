import { User } from '../models/User.js';
import { OtpToken } from '../models/OtpToken.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const cookieOptions = {
    httpOnly: true,
    secure: true, 
    sameSite: 'none', 
};

const escapeRegex = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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

export const registerUser = asyncHandler(async (req, res) => {
    const { name, email, phoneNumber, password, otpCode } = req.body;

    if (!name || !password) throw new ApiError(400, 'Name and password are required');
    if (!email && !phoneNumber) throw new ApiError(400, 'Either Email or Phone Number is required');

    const query = [];
    if (email) query.push({ email });
    if (phoneNumber) query.push({ phoneNumber });

    if (query.length > 0) {
        const existedUser = await User.findOne({ $or: query });
        if (existedUser) throw new ApiError(409, 'User already exists with this contact method');
    }

    if (phoneNumber) {
        if (!otpCode) throw new ApiError(400, 'OTP is required for phone registration');

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
    }

    const user = await User.create({ name, email, phoneNumber, passwordHash: password });
    const createdUser = await User.findById(user._id).select('-passwordHash');

    return res.status(201).json(new ApiResponse(201, createdUser, 'User registered successfully'));
});

export const loginWithOtp = asyncHandler(async (req, res) => {
    const { phoneNumber, otpCode } = req.body;
    if (!phoneNumber || !otpCode) throw new ApiError(400, 'Phone and OTP required');

    const user = await User.findOne({ phoneNumber });
    if (!user) throw new ApiError(404, 'User not found');

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

    const accessToken = user.generateAccessToken();
    const loggedInUser = await User.findById(user._id).select('-passwordHash');

    return res
        .status(200)
        .cookie('accessToken', accessToken, cookieOptions)
        .json(new ApiResponse(200, { user: loggedInUser, accessToken }, 'Logged in successfully'));
});

export const getAllUsers = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const search = req.query.search || '';
    const role = req.query.role || 'ALL';

    const query = {};

    if (search) {
        const safeSearch = escapeRegex(search);
        query['$or'] = [
            { name: { $regex: safeSearch, $options: 'i' } },
            { email: { $regex: safeSearch, $options: 'i' } },
        ];
    }

    if (role !== 'ALL') {
        query.role = role;
    }

    const total = await User.countDocuments(query);
    const users = await User.find(query)
        .select('-passwordHash')
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

export const updateUserRole = asyncHandler(async (req, res) => {
    const { role } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select(
        '-passwordHash'
    );
    return res.status(200).json(new ApiResponse(200, user, 'User role updated'));
});
