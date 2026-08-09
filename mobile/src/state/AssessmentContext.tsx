import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { AiAnalysis, AiStatus, Answers, CareerMatch, QuestionId } from '../types';
import { matchCareers } from '../matching/match';
import { fetchAiAnalysis } from '../services/aiService';

/**
 * Holds the state of one assessment run: answers, computed matches, and the
 * AI analysis (with its loading/error status). Screens read from here instead
 * of passing large objects through navigation params.
 */

interface AssessmentState {
  answers: Answers;
  setAnswer: (questionId: QuestionId, values: string[]) => void;
  resetAssessment: () => void;

  matches: CareerMatch[];
  /** Computes matches from the current answers and kicks off AI analysis. */
  finalizeAssessment: () => CareerMatch[];

  aiAnalysis: AiAnalysis | null;
  aiStatus: AiStatus;
  retryAiAnalysis: () => void;

  /** Ranks 6–10 are unlocked via the rewarded ad (or premium). */
  extraMatchesUnlocked: boolean;
  unlockExtraMatches: () => void;
}

const AssessmentContext = createContext<AssessmentState | null>(null);

export function AssessmentProvider({ children }: { children: React.ReactNode }) {
  const [answers, setAnswers] = useState<Answers>({});
  const [matches, setMatches] = useState<CareerMatch[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<AiAnalysis | null>(null);
  const [aiStatus, setAiStatus] = useState<AiStatus>('idle');
  const [extraMatchesUnlocked, setExtraMatchesUnlocked] = useState(false);

  const setAnswer = useCallback((questionId: QuestionId, values: string[]) => {
    setAnswers((prev) => ({ ...prev, [questionId]: values }));
  }, []);

  const resetAssessment = useCallback(() => {
    setAnswers({});
    setMatches([]);
    setAiAnalysis(null);
    setAiStatus('idle');
    setExtraMatchesUnlocked(false);
  }, []);

  const runAiAnalysis = useCallback((currentAnswers: Answers, currentMatches: CareerMatch[]) => {
    setAiStatus('loading');
    setAiAnalysis(null);
    fetchAiAnalysis(currentAnswers, currentMatches.slice(0, 5))
      .then((analysis) => {
        setAiAnalysis(analysis);
        setAiStatus('success');
      })
      .catch(() => {
        // The app keeps working on local matches; the UI explains that the
        // detailed AI analysis is temporarily unavailable.
        setAiStatus('error');
      });
  }, []);

  const finalizeAssessment = useCallback(() => {
    const computed = matchCareers(answers);
    setMatches(computed);
    runAiAnalysis(answers, computed);
    return computed;
  }, [answers, runAiAnalysis]);

  const retryAiAnalysis = useCallback(() => {
    if (matches.length > 0 && aiStatus !== 'loading') {
      runAiAnalysis(answers, matches);
    }
  }, [answers, matches, aiStatus, runAiAnalysis]);

  const unlockExtraMatches = useCallback(() => setExtraMatchesUnlocked(true), []);

  const value = useMemo(
    () => ({
      answers,
      setAnswer,
      resetAssessment,
      matches,
      finalizeAssessment,
      aiAnalysis,
      aiStatus,
      retryAiAnalysis,
      extraMatchesUnlocked,
      unlockExtraMatches,
    }),
    [
      answers,
      setAnswer,
      resetAssessment,
      matches,
      finalizeAssessment,
      aiAnalysis,
      aiStatus,
      retryAiAnalysis,
      extraMatchesUnlocked,
      unlockExtraMatches,
    ],
  );

  return <AssessmentContext.Provider value={value}>{children}</AssessmentContext.Provider>;
}

export function useAssessment(): AssessmentState {
  const ctx = useContext(AssessmentContext);
  if (!ctx) throw new Error('useAssessment must be used within AssessmentProvider');
  return ctx;
}
