/**
 * Request/response contract for the analyze endpoint.
 * Mirrors mobile/src/types.ts (AiAnalysis) — keep the two in sync.
 */

export interface AnalyzeRequest {
  answers: Array<{ question: string; answer: string }>;
  topMatches: Array<{ careerId: string; careerName: string; score: number }>;
}

export interface AiCareerExplanation {
  careerId: string;
  careerName: string;
  whyItMatches: string;
  potentialChallenges: string;
  skillsToDevelop: string[];
}

export interface AiAnalysis {
  profileSummary: string;
  careers: AiCareerExplanation[];
  suggestedEducationPath: string;
  nextSteps: string[];
}

/** Basic runtime validation of the incoming request body. */
export function parseAnalyzeRequest(body: unknown): AnalyzeRequest | null {
  if (typeof body !== 'object' || body === null) return null;
  const b = body as AnalyzeRequest;

  const answersOk =
    Array.isArray(b.answers) &&
    b.answers.length > 0 &&
    b.answers.length <= 30 &&
    b.answers.every(
      (a) =>
        typeof a === 'object' &&
        a !== null &&
        typeof a.question === 'string' &&
        typeof a.answer === 'string' &&
        a.question.length <= 300 &&
        a.answer.length <= 500,
    );

  const matchesOk =
    Array.isArray(b.topMatches) &&
    b.topMatches.length > 0 &&
    b.topMatches.length <= 10 &&
    b.topMatches.every(
      (m) =>
        typeof m === 'object' &&
        m !== null &&
        typeof m.careerId === 'string' &&
        typeof m.careerName === 'string' &&
        typeof m.score === 'number' &&
        m.careerId.length <= 100 &&
        m.careerName.length <= 100,
    );

  if (!answersOk || !matchesOk) return null;
  return { answers: b.answers, topMatches: b.topMatches };
}
