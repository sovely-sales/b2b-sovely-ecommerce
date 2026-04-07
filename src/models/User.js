import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const storeIntegrationSchema = new mongoose.Schema(
    {
        platform: { type: String, enum: ['SHOPIFY', 'WOOCOMMERCE', 'CUSTOM'], required: true },
        storeUrl: { type: String, required: true },
        accessToken: { type: String },
        isActive: { type: Boolean, default: true },
    },
    { _id: false }
);

const savedCustomerSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        phone: { type: String, required: true },
        address: {
            street: { type: String, required: true },
            city: { type: String, required: true },
            state: { type: String, required: true },
            zip: { type: String, required: true },
        },
    },
    { _id: true }
);

const branchSchema = new mongoose.Schema({
    branchName: { type: String, required: true },
    gstin: {
        type: String,
        trim: true,
        uppercase: true,
        match: [
            /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[A-Z0-9]{1}[0-9A-Z]{1}$/,
            'Invalid GSTIN',
        ],
    },
    address: {
        street: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        zip: { type: String, required: true },
    },
    isPrimary: { type: Boolean, default: false },
});

const userSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        email: { type: String, unique: true, sparse: true },
        phoneNumber: { type: String, unique: true, sparse: true },
        passwordHash: { type: String, required: true },
        avatar: { type: String, default: '' },
        customerId: { type: String, unique: true, sparse: true },
        accountType: { type: String, enum: ['B2C', 'B2B'], default: 'B2C' },
        isVerifiedB2B: { type: Boolean, default: false },

        role: { type: String, enum: ['ADMIN', 'RESELLER', 'CUSTOMER'], default: 'CUSTOMER' },
        refreshToken: { type: String },
        savedCustomers: [savedCustomerSchema],
        companyName: { type: String, trim: true },
        branches: [branchSchema],
        gstin: {
            type: String,
            trim: true,
            uppercase: true,
            match: [
                /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[A-Z0-9]{1}[0-9A-Z]{1}$/,
                'Invalid GSTIN format',
            ],
        },
        panNumber: {
            type: String,
            trim: true,
            uppercase: true,
            match: [/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN format'],
        },

        walletBalance: { type: Number, default: 0 },
        bankDetails: {
            accountName: { type: String },
            accountNumber: { type: String },
            ifscCode: { type: String },
            bankName: { type: String },
        },

        storeIntegrations: [storeIntegrationSchema],
        billingAddress: {
            street: { type: String },
            city: { type: String },
            state: { type: String },
            zip: { type: String },
        },

        emailNotifications: { type: Boolean, default: true },
        orderSms: { type: Boolean, default: true },
        promotionalEmails: { type: Boolean, default: false },

        updateRequestStatus: {
            type: String,
            enum: ['NONE', 'PENDING', 'REJECTED'],
            default: 'NONE',
        },
        updateRejectionReason: { type: String, default: null },
        pendingUpdates: {
            gstin: { type: String, uppercase: true, trim: true },
            panNumber: { type: String, uppercase: true, trim: true },
            companyName: { type: String, trim: true },
        },

        isActive: { type: Boolean, default: true },
        deletedAt: { type: Date, default: null },
    },
    { timestamps: true }
);

userSchema.pre('save', async function () {
    if (!this.isModified('passwordHash')) return;

    this.passwordHash = await bcrypt.hash(this.passwordHash, 10);
});

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.passwordHash);
};

userSchema.methods.generateAccessToken = function (sessionId = null) {
    if (!process.env.ACCESS_TOKEN_SECRET) {
        throw new Error('ACCESS_TOKEN_SECRET is missing in environment variables');
    }
    const expiry = process.env.ACCESS_TOKEN_EXPIRY?.trim() || '1d';

    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            role: this.role,
            ...(sessionId ? { sid: String(sessionId) } : {}),
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: expiry }
    );
};

userSchema.methods.generateRefreshToken = function (sessionId = null) {
    if (!process.env.REFRESH_TOKEN_SECRET) {
        throw new Error('REFRESH_TOKEN_SECRET is missing in environment variables');
    }

    const expiry = process.env.REFRESH_TOKEN_EXPIRY?.trim() || '10d';

    return jwt.sign(
        {
            _id: this._id,
            ...(sessionId ? { sid: String(sessionId) } : {}),
        },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: expiry }
    );
};

export const User = mongoose.model('User', userSchema);
