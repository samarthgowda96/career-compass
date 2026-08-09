/**
 * Shared types for Career Compass India.
 *
 * Keeping every cross-module type here means the questionnaire data, the
 * career database, the matching algorithm, the AI service and the UI all
 * agree on one contract.
 */

// ---------------------------------------------------------------------------
// Questionnaire
// ---------------------------------------------------------------------------

export type QuestionType = 'single' | 'multi' | 'scale';

export interface QuestionOption {
  /** Stable id, used as the stored answer value. */
  id: string;
  label: string;
  /** Optional emoji rendered before the label. */
  emoji?: string;
}

export interface Question {
  id: QuestionId;
  type: QuestionType;
  title: string;
  /** Small helper text under the title ("Select all that apply", etc.). */
  subtitle?: string;
  options: QuestionOption[];
  /** For multi questions: max selections allowed (undefined = unlimited). */
  maxSelections?: number;
  /** For scale questions: labels for the two ends of the 1–5 scale. */
  scaleMinLabel?: string;
  scaleMaxLabel?: string;
}

export type QuestionId =
  | 'activities'
  | 'subjects'
  | 'math_comfort'
  | 'work_type'
  | 'work_style'
  | 'creativity_importance'
  | 'salary_importance'
  | 'security_importance'
  | 'study_willingness'
  | 'work_environment'
  | 'entrepreneurship'
  | 'personality'
  | 'education_level'
  | 'location_preference'
  | 'career_priorities';

/**
 * Answers keyed by question id.
 * - single/multi questions store option ids (multi stores several)
 * - scale questions store the string of the number, e.g. "4"
 */
export type Answers = Partial<Record<QuestionId, string[]>>;

// ---------------------------------------------------------------------------
// Careers
// ---------------------------------------------------------------------------

/**
 * Every career is described by the same attribute vector (0–10 each).
 * The matching algorithm compares the user's profile against this vector.
 */
export interface CareerAttributes {
  analytical: number;
  mathematical: number;
  technical: number;
  creative: number;
  social: number;
  leadership: number;
  communication: number;
  biology: number;
  business: number;
  research: number;
  hands_on: number;
  /** Earning potential of the career (NOT a salary figure). */
  salary_priority: number;
  /** Job security / stability the career typically offers. */
  stability: number;
  /** How long the education/training path is (10 = very long, e.g. doctor). */
  education_length: number;
  /** Remote-work potential. */
  remote_work: number;
  /** International opportunity. */
  international_opportunity: number;
}

export type WorkEnvironmentTag =
  | 'office'
  | 'remote'
  | 'laboratory'
  | 'hospital'
  | 'outdoors'
  | 'workshop'
  | 'school'
  | 'flexible';

export type EntryDifficulty = 'Low' | 'Moderate' | 'High' | 'Very High';

export interface Career {
  /** Stable kebab-case id, e.g. "software-engineer". */
  id: string;
  name: string;
  emoji: string;
  category: string;
  attributes: CareerAttributes;
  /** One/two sentence overview. */
  description: string;
  /** What people in this career actually do, as bullet points. */
  whatTheyDo: string[];
  importantSkills: string[];
  /** Typical education path in India, as ordered steps. */
  educationPath: string[];
  entryDifficulty: EntryDifficulty;
  entryDifficultyNote: string;
  careerGrowth: string;
  /** Human-readable summary of the typical work environment. */
  workEnvironment: string;
  /** Tags used by the matching algorithm (aligns with questionnaire Q10). */
  workEnvironments: WorkEnvironmentTag[];
  remoteNote: string;
  internationalNote: string;
  pros: string[];
  cons: string[];
  /** Low-cost ways to try the field before committing. */
  tryBeforeCommit: string[];
}

// ---------------------------------------------------------------------------
// Matching
// ---------------------------------------------------------------------------

export interface CareerMatch {
  careerId: string;
  career: Career;
  /** 0–100 compatibility score (presented as guidance, not prediction). */
  score: number;
  /** Locally generated one-line reasons (fallback when AI is unavailable). */
  localReasons: string[];
}

// ---------------------------------------------------------------------------
// AI analysis (mirrors server/src/types.ts — keep in sync)
// ---------------------------------------------------------------------------

export interface AiCareerExplanation {
  careerId: string;
  careerName: string;
  whyItMatches: string;
  potentialChallenges: string;
  skillsToDevelop: string[];
}

export interface AiAnalysis {
  /** Short personality / work-style summary. */
  profileSummary: string;
  careers: AiCareerExplanation[];
  suggestedEducationPath: string;
  nextSteps: string[];
}

export type AiStatus = 'idle' | 'loading' | 'success' | 'error';
