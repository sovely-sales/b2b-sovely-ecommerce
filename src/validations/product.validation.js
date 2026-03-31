import { z } from 'zod';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid MongoDB ObjectId');

export const productValidation = {
    getProducts: z.object({
        query: z.object({
            page: z.string().regex(/^\d+$/).optional(),
            limit: z.string().regex(/^\d+$/).optional(),
            search: z.string().optional(),
            category: objectId.optional(),
            minMargin: z.string().regex(/^\d+$/).optional(),
            maxBasePrice: z
                .string()
                .regex(/^\d+(\.\d{1,2})?$/)
                .optional(),
            isDropship: z.enum(['true', 'false']).optional(),
        }),
    }),

    getProductById: z.object({
        params: z.object({
            id: objectId, 
        }),
    }),

    createProduct: z.object({
        body: z.object({
            title: z.string().min(3),
            sku: z.string().min(3),
            categoryId: objectId,

            
            dropshipBasePrice: z.number().positive(),
            suggestedRetailPrice: z.number().positive(),
            tieredPricing: z
                .array(
                    z.object({
                        minQty: z.number().int().positive(),
                        pricePerUnit: z.number().positive(),
                    })
                )
                .optional(),

            
            weightGrams: z.number().positive(),
            hsnCode: z.string().min(4, 'HSN Code must be at least 4 digits'),
            gstSlab: z.union([
                z.literal(0),
                z.literal(5),
                z.literal(12),
                z.literal(18),
                z.literal(28),
            ]),
            moq: z.number().int().positive().default(1),
            inventory: z
                .object({
                    stock: z.number().int().nonnegative(),
                    alertThreshold: z.number().int().nonnegative().optional(),
                })
                .optional(),
            status: z.enum(['active', 'draft', 'archived']).optional(),
        }),
    }),

    updateProduct: z.object({
        params: z.object({
            id: objectId,
        }),
        body: z
            .object({
                title: z.string().min(3).optional(),
                dropshipBasePrice: z.number().positive().optional(),
                suggestedRetailPrice: z.number().positive().optional(),
                tieredPricing: z
                    .array(
                        z.object({
                            minQty: z.number().int().positive(),
                            pricePerUnit: z.number().positive(),
                        })
                    )
                    .optional(),
                hsnCode: z.string().min(4).optional(),
                gstSlab: z
                    .union([
                        z.literal(0),
                        z.literal(5),
                        z.literal(12),
                        z.literal(18),
                        z.literal(28),
                    ])
                    .optional(),
                moq: z.number().int().positive().optional(),
                inventory: z
                    .object({
                        stock: z.number().int().nonnegative().optional(),
                        alertThreshold: z.number().int().nonnegative().optional(),
                    })
                    .optional(),
                status: z.enum(['active', 'draft', 'archived']).optional(),
            })
            .strict(), 
    }),
};
