import { z } from 'zod';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid MongoDB ObjectId');

export const productValidation = {
    getProducts: z.object({
        query: z
            .object({
                page: z.string().regex(/^\d+$/).optional(),
                limit: z.string().regex(/^\d+$/).optional(),
                search: z.string().optional(),
                category: objectId.optional(),
                minMargin: z.string().regex(/^\d*$/).optional(),
                margin: z.string().regex(/^\d*$/).optional(),
                minBasePrice: z.string().regex(/^\d*$/).optional(),
                maxBasePrice: z.string().regex(/^\d*$/).optional(),
                minWeight: z.any().optional(),
                maxWeight: z.any().optional(),
                minMoq: z.string().regex(/^\d*$/).optional(),
                maxMoq: z.string().regex(/^\d*$/).optional(),
                gstSlab: z.string().optional(),
                maxShippingDays: z.string().optional(),
                inStock: z.enum(['true', 'false']).optional(),
                isDropship: z.enum(['true', 'false']).optional(),
                isVerifiedSupplier: z.enum(['true', 'false']).optional(),
                lowRtoRisk: z.enum(['true', 'false']).optional(),
                sort: z.string().optional(),
                vendor: z.string().optional(),
                stock: z.enum(['ALL', 'IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK']).optional(),
            })
            .refine(
                (query) => {
                    if (query.minBasePrice === undefined || query.maxBasePrice === undefined) {
                        return true;
                    }
                    return Number(query.minBasePrice) <= Number(query.maxBasePrice);
                },
                {
                    message: 'minBasePrice cannot be greater than maxBasePrice',
                    path: ['minBasePrice'],
                }
            ),
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
            
            // z.coerce intercepts FormData strings (e.g. "450") and safely casts to 450
            dropshipBasePrice: z.coerce.number().positive(),
            suggestedRetailPrice: z.coerce.number().positive(),
            tieredPricing: z.array(
                z.object({
                    minQty: z.coerce.number().int().positive(),
                    pricePerUnit: z.coerce.number().positive(),
                })
            ).optional(),
            
            weightGrams: z.coerce.number().positive(),
            hsnCode: z.string().min(4, 'HSN Code must be at least 4 digits'),
            
            // Coerce the GST string dropdown to a strict number literal
            gstSlab: z.coerce.number().pipe(z.union([
                z.literal(0), z.literal(5), z.literal(12), 
                z.literal(18), z.literal(28)
            ])),
            moq: z.coerce.number().int().positive().default(1),
            inventory: z.object({
                stock: z.coerce.number().int().nonnegative(),
                alertThreshold: z.coerce.number().int().nonnegative().optional(),
            }).optional(),
            status: z.enum(['active', 'draft', 'archived']).optional(),
        }),
    }),

    updateProduct: z.object({
        params: z.object({ id: objectId }),
        body: z.object({
            title: z.string().min(3).optional(),
            dropshipBasePrice: z.coerce.number().positive().optional(),
            suggestedRetailPrice: z.coerce.number().positive().optional(),
            tieredPricing: z.array(
                z.object({
                    minQty: z.coerce.number().int().positive(),
                    pricePerUnit: z.coerce.number().positive(),
                })
            ).optional(),
            hsnCode: z.string().min(4).optional(),
            gstSlab: z.coerce.number().pipe(z.union([
                z.literal(0), z.literal(5), z.literal(12), 
                z.literal(18), z.literal(28)
            ])).optional(),
            moq: z.coerce.number().int().positive().optional(),
            inventory: z.object({
                stock: z.coerce.number().int().nonnegative().optional(),
                alertThreshold: z.coerce.number().int().nonnegative().optional(),
            }).optional(),
            status: z.enum(['active', 'draft', 'archived']).optional(),
        }).strict(),
    }),

    bulkAdjustPrice: z.object({
        body: z.object({
            percentage: z.coerce.number()
                .min(-90, 'Cannot decrease price by more than 90%')
                .max(500, 'Cannot increase price by more than 500%'),
        }).strict(),
    }),
};
