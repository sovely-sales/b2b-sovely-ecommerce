import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { WHATSAPP_URL } from '../config/dropshippingKnowledge.js';
import { getKnowledge } from '../services/chatKnowledge.service.js';
import {
    answerKey,
    getCachedAnswer,
    cacheAnswer,
    overDailyBudget,
} from '../services/chatCache.service.js';

const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const DEFAULT_MODEL = 'gemini-3.5-flash-lite';
const REQUEST_TIMEOUT_MS = 15000;

const FALLBACK_REPLY =
    "Sorry, I can't answer right now. Please message the Sovely team on WhatsApp and they'll help you.";

const fallback = (res, status, message) =>
    res
        .status(status)
        .json(new ApiResponse(status, { reply: FALLBACK_REPLY, whatsapp: WHATSAPP_URL }, message));

// Converts the widget's history into Gemini's format. Gemini requires the
// conversation to start with a user turn and alternate roles.
const toGeminiContents = (messages) => {
    const contents = [];
    for (const m of messages) {
        const role = m.role === 'assistant' ? 'model' : 'user';
        if (contents.length === 0 && role !== 'user') continue;
        const last = contents[contents.length - 1];
        if (last && last.role === role) {
            last.parts[0].text += `\n${m.content}`;
        } else {
            contents.push({ role, parts: [{ text: m.content }] });
        }
    }
    return contents;
};

const callGemini = async ({ apiKey, model, systemPrompt, contents }) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
        const response = await fetch(`${GEMINI_BASE_URL}/${model}:generateContent`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
            body: JSON.stringify({
                systemInstruction: { parts: [{ text: systemPrompt }] },
                contents,
                generationConfig: { temperature: 0.2, maxOutputTokens: 400 },
            }),
            signal: controller.signal,
        });
        if (!response.ok) {
            const detail = await response.text();
            console.error(`Gemini error ${response.status}: ${detail.slice(0, 300)}`);
            return null;
        }
        const data = await response.json();
        return (
            data?.candidates?.[0]?.content?.parts
                ?.map((p) => p.text || '')
                .join('')
                .trim() || null
        );
    } catch (err) {
        console.error(err.name === 'AbortError' ? 'Gemini request timed out' : `Gemini request failed: ${err.message}`);
        return null;
    } finally {
        clearTimeout(timer);
    }
};

export const askDropshippingBot = asyncHandler(async (req, res) => {
    const { messages } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    const contents = toGeminiContents(messages);
    if (contents.length === 0 || contents[contents.length - 1].role !== 'user') {
        throw new ApiError(400, 'The last message must be from the user');
    }

    const knowledge = await getKnowledge();

    // A first question has no conversation context, so its answer can be reused
    // for anyone who asks the same thing (until the FAQ version changes).
    const cacheKey = messages.length === 1 ? answerKey(knowledge.version, messages[0].content) : null;
    if (cacheKey) {
        const cached = await getCachedAnswer(cacheKey);
        if (cached) {
            return res
                .status(200)
                .json(new ApiResponse(200, { reply: cached, whatsapp: WHATSAPP_URL, source: 'cache' }, 'OK'));
        }
    }

    if (!apiKey) return fallback(res, 503, 'Chat is not configured');
    if (await overDailyBudget()) return fallback(res, 503, 'Daily AI limit reached');

    const reply = await callGemini({
        apiKey,
        model: process.env.GEMINI_MODEL || DEFAULT_MODEL,
        systemPrompt: knowledge.prompt,
        contents,
    });

    if (!reply) return fallback(res, 502, 'Chat failed');

    if (cacheKey) await cacheAnswer(cacheKey, reply);
    return res
        .status(200)
        .json(new ApiResponse(200, { reply, whatsapp: WHATSAPP_URL, source: 'ai' }, 'OK'));
});
