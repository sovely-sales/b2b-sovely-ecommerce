import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, unique: true, sparse: true },
    phoneNumber: { type: String, unique: true, sparse: true },
    passwordHash: { type: String, required: true },
    avatar: { type: String, default: "" },
    role: { type: String, enum: ['ADMIN', 'CUSTOMER'], default: 'CUSTOMER' }
}, { timestamps: true });

userSchema.pre("save", async function () {
    if (!this.isModified("passwordHash")) return;

    this.passwordHash = await bcrypt.hash(this.passwordHash, 10);
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
            avatar: this.avatar
        },
        process.env.ACCESS_TOKEN_SECRET || 'fallback_secret',
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY || '1d'
        }
    );
};

export const User = mongoose.model('User', userSchema);