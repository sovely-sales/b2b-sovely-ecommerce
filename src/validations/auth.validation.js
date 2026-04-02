import { z } from 'zod';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid MongoDB ObjectId');

export const authValidation = {
    register: z.object({
        body: z
            .object({
                name: z.string().min(2, 'Name must be at least 2 characters').max(50),
                email: z.string().email('Invalid email address format').optional(),
                phoneNumber: z.string().min(10, 'Invalid phone number').optional(),
                password: z.string().min(6, 'Password must be at least 6 characters long'),

                companyName: z.string().min(2, 'Company name is required for B2B registration'),
                gstin: z
                    .string()
                    .regex(
                        /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[A-Z0-9]{1}[0-9A-Z]{1}$/,
                        'Invalid GSTIN format'
                    )
                    .optional(),
            })
            .refine((data) => data.email || data.phoneNumber, {
                message: 'Either Email or Phone Number is required',
                path: ['email'],
            }),
    }),

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
