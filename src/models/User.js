import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const addressSchema = new mongoose.Schema({
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zip: { type: String, required: true },
    isDefault: { type: Boolean, default: false }
}, { _id: false });

const userSchema = new mongoose.Schema({
    // Auth & Profile
    name: { type: String, required: true },
    email: { type: String, unique: true, sparse: true },
    phoneNumber: { type: String, unique: true, sparse: true },
    passwordHash: { type: String, required: true },
    avatar: { type: String, default: "" },
    role: { type: String, enum: ['ADMIN', 'CUSTOMER'], default: 'CUSTOMER' },
    
    // E-commerce Specifics
    customerId: { type: String, sparse: true }, // Populated via Counter for B2B/Invoicing
    accountType: { type: String, enum: ['B2B', 'B2C'], default: 'B2C' },
    walletBalance: { type: Number, default: 0 },
    addresses: [addressSchema]
}, { timestamps: true });

userSchema.pre("save", async function (next) {
    if (!this.isModified("passwordHash")) return next();
    
    try {
        this.passwordHash = await bcrypt.hash(this.passwordHash, 10);
        next();
    } catch (error) {
        next(error);
    }
});

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.passwordHash);
};

userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            name: this.name,
            role: this.role
        },
        process.env.ACCESS_TOKEN_SECRET || 'fallback_secret',
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY || '1d'
        }
    );
};

export const User = mongoose.model('User', userSchema);
