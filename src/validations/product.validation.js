import { z } from 'zod';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid MongoDB ObjectId');

export const productValidation = {
    getProducts: z.object({
        query: z.object({
            page: z.string().regex(/^\d+$/).optional(),
            limit: z.string().regex(/^\d+$/).optional(),
            query: z.string().optional(),
            categoryId: z.union([objectId, z.literal('All')]).optional(),
            minPrice: z
                .string()
                .regex(/^\d+(\.\d{1,2})?$/)
                .optional(),
            maxPrice: z
                .string()
                .regex(/^\d+(\.\d{1,2})?$/)
                .optional(),
            saleOnly: z.enum(['true', 'false']).optional(),
            shipping: z.string().optional(),
            minRating: z
                .string()
                .regex(/^[1-5]$/)
                .optional(),
            sort: z.enum(['price-asc', 'price-desc', 'rating', 'reviews', 'newest']).optional(),
        }),
    }),

    getProductById: z.object({
        params: z.object({
            productId: objectId,
        }),
    }),

    updateProduct: z.object({
        params: z.object({
            id: objectId,
        }),
        body: z
            .object({
                platformSellPrice: z.number().positive().optional(),
                stock: z.number().int().nonnegative().optional(),
                status: z.enum(['active', 'draft', 'archived']).optional(),
            })
            .strict(),
    }),
};
