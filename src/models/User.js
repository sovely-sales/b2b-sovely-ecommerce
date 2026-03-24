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

        // Strict B2B Roles
        role: { type: String, enum: ['ADMIN', 'RESELLER', 'CUSTOMER'], default: 'CUSTOMER' },
        refreshToken: { type: String },

        // B2B & Business Identity
        companyName: { type: String, trim: true },
        gstin: {
            type: String,
            trim: true,
            uppercase: true,
            match: [
                // FIX: Relaxed the 14th character from strict 'Z' to alphanumeric for future-proofing
                /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[A-Z0-9]{1}[0-9A-Z]{1}$/,
                'Invalid GSTIN format',
            ],
        },
        kycStatus: {
            type: String,
            enum: ['PENDING', 'APPROVED', 'REJECTED'],
            default: 'PENDING',
        },

        // Financials & Payouts
        walletBalance: { type: Number, default: 0 },
        bankDetails: {
            accountName: { type: String },
            accountNumber: { type: String },
            ifscCode: { type: String },
            bankName: { type: String },
        },

        // Dropshipping Specifics
        storeIntegrations: [storeIntegrationSchema],
        billingAddress: {
            street: { type: String },
            city: { type: String },
            state: { type: String },
            zip: { type: String },
        },

        // Account Status
        isActive: { type: Boolean, default: true },
        deletedAt: { type: Date, default: null },
    },
    { timestamps: true }
);
// --- Security Hooks ---
userSchema.pre('save', async function (next) {
    if (!this.isModified('passwordHash')) return next();
    this.passwordHash = await bcrypt.hash(this.passwordHash, 10);
    next(); // Added explicit next() for safer middleware execution
});

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.passwordHash);
};

// --- Token Generation ---
userSchema.methods.generateAccessToken = function () {
    // We use optional chaining (?.) and trim() to strip out any invisible spaces from Render!
    const expiry = process.env.ACCESS_TOKEN_EXPIRY?.trim() || '1d';
    
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            role: this.role,
            kycStatus: this.kycStatus,
        },
        process.env.ACCESS_TOKEN_SECRET || 'fallback_secret',
        { expiresIn: expiry }
    );
};

// NEW: Added the missing Refresh Token generator!
userSchema.methods.generateRefreshToken = function () {
    const expiry = process.env.REFRESH_TOKEN_EXPIRY?.trim() || '10d';
    
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET || 'fallback_refresh_secret',
        { expiresIn: expiry }
    );
};

export const User = mongoose.model('User', userSchema);