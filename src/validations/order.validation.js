import { z } from 'zod';

const orderStatusEnum = z.enum([
    'PENDING',
    'PROCESSING',
    'PENDING_PROCESSING',
    'SHIPPED',
    'DELIVERED',
    'PROFIT_CREDITED',
    'NDR',
    'RTO',
    'CANCELLED',
    'ALL',
]);

export const orderValidation = {
    getMyOrders: z.object({
        query: z.object({
            page: z
                .string()
                .regex(/^[1-9]\d*$/)
                .optional(),
            limit: z
                .string()
                .regex(/^[1-9]\d*$/)
                .optional(),
            status: orderStatusEnum.optional(),
            search: z.string().trim().max(120).optional(),
            sort: z.enum(['latest', 'oldest']).optional(),
        }),
    }),
};
