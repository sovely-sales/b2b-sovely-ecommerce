import { z } from 'zod';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid MongoDB ObjectId');

export const authValidation = {
    login: z.object({
        body: z
            .object({
                email: z.string().email('Invalid email address format').optional(),
                phoneNumber: z.string().min(10, 'Invalid phone number').optional(),
                password: z.string().min(1, 'Password is required').optional(),
                otpCode: z.string().length(4, 'OTP must be 4 digits').optional(),
            })
            .refine((data) => data.email || data.phoneNumber, {
                message: 'Please provide either an email or phone number to login',
                path: ['email'],
            }),
    }),

    revokeSession: z.object({
        params: z.object({
            sessionId: objectId,
        }),
    }),
};
