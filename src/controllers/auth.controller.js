import { AuthService } from '../services/auth.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const cookieOptions = {
    httpOnly: true,
    secure: true, 
    sameSite: 'none',
};

export const registerUser = asyncHandler(async (req, res) => {
    const user = await AuthService.registerUser(req.body);

    return res.status(201).json(new ApiResponse(201, user, 'User registered successfully'));
});

export const loginUser = asyncHandler(async (req, res) => {
    const { user, accessToken } = await AuthService.loginUser(req.body);

    return res
        .status(200)
        .cookie('accessToken', accessToken, cookieOptions)
        .json(new ApiResponse(200, { user, accessToken }, 'User logged in successfully'));
});

export const logoutUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .clearCookie('accessToken', cookieOptions)
        .json(new ApiResponse(200, {}, 'User logged out successfully'));
});

export const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(new ApiResponse(200, req.user, 'Current user fetched successfully'));
});
