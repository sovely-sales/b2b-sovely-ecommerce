import { User } from '../models/User.js';
import { UserSession } from '../models/UserSession.js';
import { OtpToken } from '../models/OtpToken.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { Notification } from '../models/Notification.js';
import { WalletTransaction } from '../models/WalletTransaction.js';
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

export const sendLoginOtp = asyncHandler(async (req, res) => {
    const { phoneNumber } = req.body;
    if (!phoneNumber) throw new ApiError(400, 'Phone number is required');

    const existingUser = await User.findOne({ phoneNumber });
    if (!existingUser)
        throw new ApiError(
            404,
            'Phone number not registered. Please contact an administrator to request access.'
        );

    const recentOtp = await OtpToken.findOne({
        identifier: phoneNumber,
        createdAt: { $gte: new Date(Date.now() - 60 * 1000) },
    });

    if (recentOtp) {
        throw new ApiError(429, 'Please wait 60 seconds before requesting another OTP.');
    }

    const otpCode = crypto.randomInt(100000, 1000000).toString();
    await OtpToken.updateMany({ identifier: phoneNumber, isUsed: false }, { isUsed: true });
    await OtpToken.create({
        identifier: phoneNumber,
        otpCode,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
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
    const updateRequestStatus = req.query.updateRequestStatus || 'ALL';
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
    if (updateRequestStatus !== 'ALL') query.updateRequestStatus = updateRequestStatus;
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

export const processUpdateRequest = asyncHandler(async (req, res) => {
    const { action, rejectionReason } = req.body;

    if (!['APPROVE', 'REJECT'].includes(action)) {
        throw new ApiError(400, 'Invalid Action. Must be APPROVE or REJECT.');
    }

    const userToUpdate = await User.findById(req.params.id);
    if (!userToUpdate) throw new ApiError(404, 'User not found');

    const updateData = {};

    if (action === 'APPROVE') {
        updateData.updateRequestStatus = 'NONE';
        updateData.updateRejectionReason = null;

        if (userToUpdate.pendingUpdates?.gstin)
            updateData.gstin = userToUpdate.pendingUpdates.gstin;
        if (userToUpdate.pendingUpdates?.panNumber)
            updateData.panNumber = userToUpdate.pendingUpdates.panNumber;
        if (userToUpdate.pendingUpdates?.companyName)
            updateData.companyName = userToUpdate.pendingUpdates.companyName;

        updateData.pendingUpdates = { gstin: null, panNumber: null, companyName: null };
    } else if (action === 'REJECT') {
        updateData.updateRequestStatus = 'REJECTED';
        updateData.updateRejectionReason = rejectionReason || 'Update request denied by admin.';

        updateData.pendingUpdates = { gstin: null, panNumber: null, companyName: null };
    }

    const user = await User.findByIdAndUpdate(req.params.id, updateData, { new: true }).select(
        '-passwordHash -refreshToken'
    );

    return res
        .status(200)
        .json(new ApiResponse(200, user, `User update request ${action.toLowerCase()}d`));
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

export const deleteUser = asyncHandler(async (req, res) => {
    await UserSession.updateMany(
        { userId: req.params.id, isRevoked: false },
        { isRevoked: true, revokedAt: new Date() }
    );

    const user = await User.findByIdAndUpdate(
        req.params.id,
        {
            deletedAt: new Date(),
            isActive: false,
            refreshToken: null,
        },
        { new: true }
    );

    if (!user) throw new ApiError(404, 'User not found');

    return res.status(200).json(new ApiResponse(200, null, 'User has been deleted successfully'));
});

export const updateMyProfile = asyncHandler(async (req, res) => {
    const {
        name,
        email,
        billingAddress,
        emailNotifications,
        orderSms,
        promotionalEmails,
        companyName,
        gstin,
        panNumber,
        entityType,
        industry,
        website,
        yearEstablished,
    } = req.body;

    if (email) {
        const existingUser = await User.findOne({
            email,
            _id: { $ne: req.user._id },
        });

        if (existingUser) {
            throw new ApiError(409, 'This email is already in use by another account.');
        }
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (email !== undefined) updateData.email = email.trim().toLowerCase();

    if (companyName !== undefined) updateData.companyName = companyName.trim();
    if (gstin !== undefined) updateData.gstin = gstin.trim().toUpperCase() || undefined;
    if (panNumber !== undefined) updateData.panNumber = panNumber.trim().toUpperCase() || undefined;
    if (entityType !== undefined) updateData.entityType = entityType.trim();
    if (industry !== undefined) updateData.industry = industry.trim();
    if (website !== undefined) updateData.website = website.trim();
    if (yearEstablished !== undefined) updateData.yearEstablished = yearEstablished.trim();

    if (billingAddress) {
        if (billingAddress.street !== undefined)
            updateData['billingAddress.street'] = billingAddress.street?.trim() || '';
        if (billingAddress.city !== undefined)
            updateData['billingAddress.city'] = billingAddress.city?.trim() || '';
        if (billingAddress.state !== undefined)
            updateData['billingAddress.state'] = billingAddress.state?.trim() || '';
        if (billingAddress.zip !== undefined)
            updateData['billingAddress.zip'] = billingAddress.zip?.trim() || '';
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

export const requestProfileUpdate = asyncHandler(async (req, res) => {
    const { gstin, panNumber, companyName, billingAddress, bankDetails } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) throw new ApiError(404, 'User not found');

    if (user.updateRequestStatus === 'PENDING') {
        throw new ApiError(400, 'You already have a pending update request.');
    }

    if (!user.pendingUpdates) user.pendingUpdates = {};
    if (gstin) user.pendingUpdates.gstin = gstin;
    if (panNumber) user.pendingUpdates.panNumber = panNumber;
    if (companyName) user.pendingUpdates.companyName = companyName;

    if (billingAddress) {
        if (!user.billingAddress) user.billingAddress = {};
        if (billingAddress.street !== undefined) user.billingAddress.street = billingAddress.street;
        if (billingAddress.city !== undefined) user.billingAddress.city = billingAddress.city;
        if (billingAddress.state !== undefined) user.billingAddress.state = billingAddress.state;
        if (billingAddress.zip !== undefined) user.billingAddress.zip = billingAddress.zip;
    }

    if (bankDetails) {
        if (!user.bankDetails) user.bankDetails = {};
        if (bankDetails.accountName !== undefined)
            user.bankDetails.accountName = bankDetails.accountName;
        if (bankDetails.accountNumber !== undefined)
            user.bankDetails.accountNumber = bankDetails.accountNumber;
        if (bankDetails.ifscCode !== undefined) user.bankDetails.ifscCode = bankDetails.ifscCode;
        if (bankDetails.bankName !== undefined) user.bankDetails.bankName = bankDetails.bankName;
    }

    if (gstin || panNumber || companyName) {
        user.updateRequestStatus = 'PENDING';
    }

    await user.save({ validateBeforeSave: false });

    const updatedUser = await User.findById(user._id).select('-passwordHash -refreshToken');
    return res
        .status(200)
        .json(new ApiResponse(200, updatedUser, 'Update request submitted for review'));
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

export const updateUserByAdmin = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, email, companyName, gstin, walletAdjustment, role } = req.body;

    const user = await User.findById(id);
    if (!user) throw new ApiError(404, 'User not found');

    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (email !== undefined) {
        const existingUser = await User.findOne({ email, _id: { $ne: id } });
        if (existingUser) throw new ApiError(400, 'Email already in use by another user');
        updateData.email = email.trim().toLowerCase();
    }
    if (companyName !== undefined) updateData.companyName = companyName.trim();
    if (gstin !== undefined) updateData.gstin = gstin.trim().toUpperCase();
    if (role !== undefined) updateData.role = role;

    if (walletAdjustment && walletAdjustment !== 0) {
        const adjustment = Number(walletAdjustment);
        if (isNaN(adjustment)) throw new ApiError(400, 'Invalid wallet adjustment amount');

        user.walletBalance = (user.walletBalance || 0) + adjustment;

        await WalletTransaction.create({
            resellerId: user._id,
            type: adjustment > 0 ? 'CREDIT' : 'DEBIT',
            purpose: 'ADMIN_ADJUSTMENT',
            amount: Math.abs(adjustment),
            closingBalance: user.walletBalance,
            referenceId: `ADMIN-${Date.now()}`,
            description: `Manual adjustment by administrator.`,
            status: 'COMPLETED',
        });
    }

    Object.assign(user, updateData);
    await user.save({ validateBeforeSave: false });

    const updatedUser = await User.findById(id).select('-passwordHash -refreshToken');

    return res
        .status(200)
        .json(new ApiResponse(200, updatedUser, 'User profile updated successfully by admin'));
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

    user.passwordHash = newPassword;
    await user.save({ validateBeforeSave: false });

    return res.status(200).json(new ApiResponse(200, null, 'Password updated successfully'));
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

export const getSavedCustomers = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select('savedCustomers');
    if (!user) throw new ApiError(404, 'User not found');

    return res
        .status(200)
        .json(new ApiResponse(200, user.savedCustomers, 'Saved customers fetched'));
});

export const saveCustomerToAddressBook = asyncHandler(async (req, res) => {
    const { name, phone, street, city, state, zip } = req.body;

    if (!name || !phone || !street || !zip) {
        throw new ApiError(400, 'Name, phone, street, and zip are required to save a customer.');
    }

    const newCustomer = {
        name: name.trim(),
        phone: phone.replace(/\D/g, ''),
        address: {
            street: street.trim(),
            city: city?.trim() || '',
            state: state?.trim() || '',
            zip: zip.trim(),
        },
    };

    const user = await User.findById(req.user._id);
    const exists = user.savedCustomers.some((c) => c.phone === newCustomer.phone);

    if (!exists) {
        user.savedCustomers.push(newCustomer);
        await user.save({ validateBeforeSave: false });
    }

    return res
        .status(201)
        .json(new ApiResponse(201, user.savedCustomers, 'Customer saved to address book'));
});

export const deleteSavedCustomer = asyncHandler(async (req, res) => {
    const { phone } = req.params;

    const user = await User.findByIdAndUpdate(
        req.user._id,
        { $pull: { savedCustomers: { phone: phone } } },
        { new: true }
    );

    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    return res
        .status(200)
        .json(new ApiResponse(200, user.savedCustomers, 'Customer removed successfully'));
});

export const addBranch = asyncHandler(async (req, res) => {
    const { branchName, gstin, address, isPrimary } = req.body;
    const user = await User.findById(req.user._id);

    if (isPrimary && user.branches?.length > 0) {
        user.branches.forEach((b) => (b.isPrimary = false));
    }

    user.branches.push({ branchName, gstin, address, isPrimary });
    await user.save({ validateBeforeSave: false });

    return res.status(201).json(new ApiResponse(201, user.branches, 'Branch added successfully'));
});

export const updateBranch = asyncHandler(async (req, res) => {
    const { branchName, gstin, address, isPrimary } = req.body;
    const user = await User.findById(req.user._id);

    const branch = user.branches.id(req.params.branchId);
    if (!branch) throw new ApiError(404, 'Branch not found');

    if (isPrimary) {
        user.branches.forEach((b) => (b.isPrimary = false));
    }

    branch.branchName = branchName;
    branch.gstin = gstin;
    branch.address = address;
    branch.isPrimary = isPrimary;

    await user.save({ validateBeforeSave: false });
    return res.status(200).json(new ApiResponse(200, user.branches, 'Branch updated successfully'));
});

export const deleteBranch = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    user.branches.pull(req.params.branchId);
    await user.save({ validateBeforeSave: false });
    return res.status(200).json(new ApiResponse(200, user.branches, 'Branch deleted'));
});

export const createUser = asyncHandler(async (req, res) => {
    const {
        name,
        phoneNumber,
        email,
        password,
        role,
        companyName,
        gstin,
        panNumber,
        street,
        city,
        state,
        zip,
        accountName,
        accountNumber,
        ifscCode,
        bankName,
    } = req.body;

    if (!name || !phoneNumber || !password) {
        throw new ApiError(400, 'Name, Phone Number, and Password are required.');
    }

    const existingUser = await User.findOne({
        $or: [
            { phoneNumber: phoneNumber.replace(/\D/g, '') },
            { email: email ? email.trim().toLowerCase() : null },
        ],
    });

    if (existingUser) {
        if (existingUser.phoneNumber === phoneNumber.replace(/\D/g, '')) {
            throw new ApiError(409, 'A user with this phone number already exists.');
        }
        if (email && existingUser.email === email.toLowerCase()) {
            throw new ApiError(409, 'A user with this email already exists.');
        }
    }

    // 3. Construct nested objects
    const billingAddress =
        street || city || state || zip
            ? {
                  street: street?.trim() || '',
                  city: city?.trim() || '',
                  state: state?.trim() || '',
                  zip: zip?.trim() || '',
              }
            : undefined;

    const bankDetails =
        accountName || accountNumber || ifscCode || bankName
            ? {
                  accountName: accountName?.trim() || '',
                  accountNumber: accountNumber?.trim() || '',
                  ifscCode: ifscCode?.trim().toUpperCase() || '',
                  bankName: bankName?.trim() || '',
              }
            : undefined;

    // 4. Create the user
    const user = await User.create({
        name: name.trim(),
        phoneNumber: phoneNumber.replace(/\D/g, ''),
        email: email ? email.trim().toLowerCase() : undefined,
        passwordHash: password, // The pre-save hook will hash this

        companyName: companyName?.trim(),
        gstin: gstin?.trim().toUpperCase(),
        panNumber: panNumber?.trim().toUpperCase(),

        billingAddress,
        bankDetails,

        role: role || 'CUSTOMER',
        isActive: true,
        accountType: 'B2B',
        isVerifiedB2B: true,
        updateRequestStatus: 'NONE',
    });

    const createdUser = await User.findById(user._id).select('-passwordHash -refreshToken');

    if (!createdUser) {
        throw new ApiError(500, 'Something went wrong while registering the user.');
    }

    return res
        .status(201)
        .json(new ApiResponse(201, createdUser, 'Complete user profile successfully created.'));
});

export const getMyNotifications = asyncHandler(async (req, res) => {
    const notifications = await Notification.find({ recipientId: req.user._id })
        .sort({ createdAt: -1 })
        .limit(20);

    return res.status(200).json(new ApiResponse(200, notifications, 'Notifications fetched'));
});

export const markNotificationsAsRead = asyncHandler(async (req, res) => {
    await Notification.updateMany(
        { recipientId: req.user._id, isRead: false },
        { $set: { isRead: true } }
    );

    return res.status(200).json(new ApiResponse(200, null, 'Notifications marked as read'));
});
