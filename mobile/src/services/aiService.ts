import type { AiAnalysis, Answers, CareerMatch } from '../types';
import { AI_BACKEND_URL, AI_REQUEST_TIMEOUT_MS } from '../config';
import { QUESTIONS } from '../data/questions';

/**
 * Client for the AI analysis backend (see /server).
 *
 * The mobile app holds NO AI credentials — it sends the anonymous
 * questionnaire answers plus the locally computed top matches to our own
 * backend, which calls the AI provider server-side.
 *
 * Failure handling: callers treat any throw as "AI temporarily unavailable"
 * and fall back to the questionnaire-based matches, so the app always works.
 */

interface AnalyzePayload {
  answers: Array<{ question: string; answer: string }>;
  topMatches: Array<{ careerId: string; careerName: string; score: number }>;
}

/** Turns raw option-id answers into readable question/answer pairs for the AI. */
function describeAnswers(answers: Answers): AnalyzePayload['answers'] {
  return QUESTIONS.map((q) => {
    const selected = answers[q.id] ?? [];
    let text: string;
    if (q.type === 'scale') {
      text = `${selected[0] ?? '-'} out of 5`;
    } else {
      const labels = selected.map(
        (id) => q.options.find((o) => o.id === id)?.label ?? id,
      );
      text = labels.length > 0 ? labels.join(', ') : 'Not answered';
    }
    return { question: q.title, answer: text };
  });
}

function isValidAnalysis(data: unknown): data is AiAnalysis {
  if (typeof data !== 'object' || data === null) return false;
  const a = data as AiAnalysis;
  return (
    typeof a.profileSummary === 'string' &&
    Array.isArray(a.careers) &&
    a.careers.every(
      (c) =>
        typeof c.careerId === 'string' &&
        typeof c.whyItMatches === 'string' &&
        typeof c.potentialChallenges === 'string' &&
        Array.isArray(c.skillsToDevelop),
    ) &&
    typeof a.suggestedEducationPath === 'string' &&
    Array.isArray(a.nextSteps)
  );
}

/**
 * Requests the personalised AI analysis. Throws on network failure, timeout,
 * non-2xx response, or malformed payload — callers show the local results
 * with a friendly notice in that case.
 */
export async function fetchAiAnalysis(
  answers: Answers,
  topMatches: CareerMatch[],
): Promise<AiAnalysis> {
  const payload: AnalyzePayload = {
    answers: describeAnswers(answers),
    topMatches: topMatches.map((m) => ({
      careerId: m.careerId,
      careerName: m.career.name,
      score: m.score,
    })),
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AI_REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${AI_BACKEND_URL}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`AI backend responded with ${response.status}`);
    }

    const data: unknown = await response.json();
    if (!isValidAnalysis(data)) {
      throw new Error('AI backend returned an unexpected payload');
    }
    return data;
  } finally {
    clearTimeout(timeout);
  }
}
