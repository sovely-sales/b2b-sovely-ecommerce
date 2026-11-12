import { z } from 'zod';

const message = z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string().trim().min(1).max(1000),
});

export const chatSchema = z.object({
    body: z.object({
        messages: z.array(message).min(1).max(12),
    }),
});
