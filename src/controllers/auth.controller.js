import { User } from "../models/User.js";
import { Counter } from "../models/Counter.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";

const generateAccessTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        return user.generateAccessToken();
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating access token");
    }
};

export const registerUser = asyncHandler(async (req, res) => {
    // SECURITY FIX: Explicitly remove 'role' from the destructuring
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        throw new ApiError(400, "All fields are required");
    }

    const existedUser = await User.findOne({ email });
    if (existedUser) {
        throw new ApiError(409, "User with email already exists");
    }

    // Generate B2C/B2B customer ID safely on the User record
    const sequenceDoc = await Counter.findOneAndUpdate(
        { _id: 'customerId' },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
    );
    let seq = sequenceDoc.seq.toString().padStart(5, '0');

    const user = await User.create({
        name,
        email,
        passwordHash: password, 
        role: 'CUSTOMER', // SECURITY FIX: Hardcode to CUSTOMER. Admins must be created manually.
        customerId: `CUST${seq}`
    });

    const createdUser = await User.findById(user._id).select("-passwordHash");
    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user");
    }

return res.status(201).json(
        new ApiResponse(201, createdUser, "User registered successfully")
    );
});

export const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) throw new ApiError(400, "Email and Password are required");

    const user = await User.findOne({ email });
    if (!user) throw new ApiError(404, "User does not exist");

    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) throw new ApiError(401, "Invalid user credentials");

    const accessToken = await generateAccessTokens(user._id);
    const loggedInUser = await User.findById(user._id).select("-passwordHash");

// Unified cookie options
    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax" // 'none' requires secure: true
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .json(
            new ApiResponse(
                200,
                { user: loggedInUser, accessToken },
                "User logged in successfully"
            )
        );
});

export const logoutUser = asyncHandler(async (req, res) => {
    // Unified cookie options to ensure the cookie is actually cleared
    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict"
    };

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .json(new ApiResponse(200, {}, "User logged out"));
});

export const getCurrentUser = asyncHandler(async (req, res) => {
    // Safety check in case the middleware passes but user isn't attached
    if (!req.user) throw new ApiError(401, "Unauthorized");
    return res.status(200).json(new ApiResponse(200, req.user, "Current user fetched successfully"));
});