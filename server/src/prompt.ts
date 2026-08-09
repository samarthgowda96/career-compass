import type { AnalyzeRequest } from './types.js';

/**
 * Prompt + output schema for the career analysis.
 * Provider-agnostic: the Gemini adapter (gemini.ts) consumes these; swapping
 * providers later only means writing a new adapter.
 */

export const SYSTEM_PROMPT = `You are a career guidance assistant for students and young professionals in India.

Analyze the user's questionnaire responses and the career compatibility scores computed by the app. Explain why each recommended career matches the user's interests, strengths, preferences, and goals.

Rules:
- Do not claim that any career is guaranteed to be suitable. These are possibilities to explore, not predictions.
- Do not make psychological or medical diagnoses.
- Be practical and encouraging. Use simple, clear language suitable for Indian students (Class 10 to postgraduate).
- Mention important tradeoffs and what the user should explore before making a decision.
- Ground advice in the Indian context (entrance exams, typical education routes, job market realities) where relevant.
- Never invent salary figures.
- Write in second person ("you enjoy...", "your answers show...").`;

export function buildUserMessage(request: AnalyzeRequest): string {
  const answers = request.answers
    .map((a, i) => `${i + 1}. ${a.question}\n   Answer: ${a.answer}`)
    .join('\n');

  const matches = request.topMatches
    .map((m, i) => `${i + 1}. ${m.careerName} (id: ${m.careerId}) — ${m.score}% compatibility`)
    .join('\n');

  return `QUESTIONNAIRE RESPONSES:
${answers}

TOP CAREER MATCHES (computed by the app's matching algorithm):
${matches}

Produce the personalised analysis as JSON with:
- profileSummary: a short (3-4 sentence) personality/work-style summary based on the answers.
- careers: one entry per career listed above, in the same order, each with:
  - careerId: exactly the id given above
  - careerName: the career name
  - whyItMatches: 2-3 sentences on why this career fits this user's answers
  - potentialChallenges: 1-2 honest sentences on challenges or tradeoffs for this user
  - skillsToDevelop: 3-4 concrete skills this user should build for this career
- suggestedEducationPath: 2-3 sentences suggesting a sensible education direction in India given their current education level and top matches.
- nextSteps: 4-5 concrete, low-cost next steps the user can take in the coming weeks.`;
}

/**
 * JSON schema for the response, in Gemini's responseSchema format
 * (an OpenAPI-style subset with uppercase type names).
 */
export const RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    profileSummary: { type: 'STRING' },
    careers: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          careerId: { type: 'STRING' },
          careerName: { type: 'STRING' },
          whyItMatches: { type: 'STRING' },
          potentialChallenges: { type: 'STRING' },
          skillsToDevelop: { type: 'ARRAY', items: { type: 'STRING' } },
        },
        required: [
          'careerId',
          'careerName',
          'whyItMatches',
          'potentialChallenges',
          'skillsToDevelop',
        ],
        propertyOrdering: [
          'careerId',
          'careerName',
          'whyItMatches',
          'potentialChallenges',
          'skillsToDevelop',
        ],
      },
    },
    suggestedEducationPath: { type: 'STRING' },
    nextSteps: { type: 'ARRAY', items: { type: 'STRING' } },
  },
  required: ['profileSummary', 'careers', 'suggestedEducationPath', 'nextSteps'],
  propertyOrdering: ['profileSummary', 'careers', 'suggestedEducationPath', 'nextSteps'],
} as const;
