import type { AiAnalysis, AnalyzeRequest } from './types.js';
import { SYSTEM_PROMPT, buildUserMessage, RESPONSE_SCHEMA } from './prompt.js';

/**
 * Google Gemini adapter — the ONLY file that talks to the AI provider.
 *
 * Why Gemini: it has a genuinely free tier. Get a free API key (no credit
 * card) at https://aistudio.google.com/apikey and put it in .env as
 * GEMINI_API_KEY. The key must NEVER ship inside the mobile app.
 *
 * To switch providers later (Claude, Groq, OpenRouter, a local model…),
 * write a sibling adapter exposing the same `generateAnalysis()` signature
 * and swap the import in server.ts — prompt.ts and types.ts stay unchanged.
 */

const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';

/**
 * 'gemini-flash-latest' is Google's rolling alias for the current Flash
 * model — it keeps working when pinned versions (like gemini-2.5-flash)
 * are retired for new accounts. Pin a specific model via GEMINI_MODEL in
 * .env if you prefer (e.g. gemini-flash-lite-latest for higher free limits).
 */
const DEFAULT_MODEL = 'gemini-flash-latest';

export class AiProviderError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = 'AiProviderError';
  }
}

interface GeminiResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
    finishReason?: string;
  }>;
  error?: { message?: string };
}

export async function generateAnalysis(request: AnalyzeRequest): Promise<AiAnalysis> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new AiProviderError('GEMINI_API_KEY is not configured on the server');
  }
  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;

  const response = await fetch(`${GEMINI_ENDPOINT}/${model}:generateContent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // Key travels in a header, not the URL, so it never lands in logs.
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ role: 'user', parts: [{ text: buildUserMessage(request) }] }],
      generationConfig: {
        // Forces valid JSON that conforms to our schema.
        responseMimeType: 'application/json',
        responseSchema: RESPONSE_SCHEMA,
        temperature: 0.6,
        maxOutputTokens: 4096,
      },
    }),
    signal: AbortSignal.timeout(40_000),
  });

  const data = (await response.json().catch(() => ({}))) as GeminiResponse;

  if (!response.ok) {
    // 429 = free-tier rate limit; surface it distinctly so the client/user
    // understands it is temporary.
    throw new AiProviderError(
      data.error?.message ?? `Gemini responded with HTTP ${response.status}`,
      response.status,
    );
  }

  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('');
  if (!text) {
    throw new AiProviderError('Gemini returned an empty response');
  }

  let parsed: AiAnalysis;
  try {
    parsed = JSON.parse(text) as AiAnalysis;
  } catch {
    throw new AiProviderError('Gemini returned invalid JSON');
  }

  if (
    typeof parsed.profileSummary !== 'string' ||
    !Array.isArray(parsed.careers) ||
    typeof parsed.suggestedEducationPath !== 'string' ||
    !Array.isArray(parsed.nextSteps)
  ) {
    throw new AiProviderError('Gemini returned an unexpected JSON shape');
  }

  return parsed;
}
