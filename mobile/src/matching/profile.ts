import type { Answers, CareerAttributes, WorkEnvironmentTag } from '../types';

/**
 * Converts questionnaire answers into a user profile:
 *
 * - `interests` — how strongly the user leans toward each career attribute
 *   (0–10). Built from activities, subjects, math comfort, work type,
 *   work style, creativity, entrepreneurship and personality answers.
 * - `priorities` — how much the user cares about what a career *offers*
 *   (salary, stability, remote work, international options), 0–10.
 * - `educationTolerance` — willingness to study for many years, 0–10.
 * - `preferredEnvironment` — the work environment picked in Q10.
 */

export interface UserProfile {
  interests: CareerAttributes;
  priorities: {
    salary: number;
    stability: number;
    remote: number;
    international: number;
  };
  educationTolerance: number;
  preferredEnvironment: WorkEnvironmentTag | null;
}

type InterestKey = keyof CareerAttributes;

/** Attribute boosts contributed by each selectable option, per question. */
const ACTIVITY_BOOSTS: Record<string, Partial<Record<InterestKey, number>>> = {
  solving_problems: { analytical: 3, research: 1 },
  computers_tech: { technical: 3, analytical: 1 },
  helping_people: { social: 3, communication: 1 },
  creating_designing: { creative: 3 },
  numbers: { mathematical: 3, analytical: 1 },
  leading: { leadership: 3, communication: 1 },
  writing: { communication: 3, creative: 1 },
  building_fixing: { hands_on: 3, technical: 1 },
  researching: { research: 3, analytical: 1 },
  business: { business: 3, leadership: 1 },
};

const SUBJECT_BOOSTS: Record<string, Partial<Record<InterestKey, number>>> = {
  mathematics: { mathematical: 3, analytical: 1 },
  physics: { analytical: 2, technical: 1, research: 1 },
  chemistry: { research: 2, biology: 1 },
  biology: { biology: 3, research: 1 },
  computer_science: { technical: 3, analytical: 1 },
  commerce: { business: 2, mathematical: 1 },
  economics: { business: 2, analytical: 2 },
  english: { communication: 3, creative: 1 },
  social_sciences: { social: 2, communication: 1, research: 1 },
  art_design: { creative: 3 },
  none: {},
};

const WORK_TYPE_BOOSTS: Record<string, Partial<Record<InterestKey, number>>> = {
  technology: { technical: 3, analytical: 1 },
  people: { social: 3, communication: 2 },
  data: { mathematical: 3, analytical: 2 },
  creating: { creative: 3, hands_on: 1 },
  managing: { business: 3, leadership: 2 },
  research: { research: 3, analytical: 1 },
  healthcare: { biology: 3, social: 2 },
  law_government: { communication: 2, analytical: 2, social: 1 },
  hands_on: { hands_on: 3, technical: 1 },
};

const PERSONALITY_BOOSTS: Record<string, Partial<Record<InterestKey, number>>> = {
  analytical: { analytical: 2, mathematical: 1 },
  creative: { creative: 2 },
  social: { social: 2, communication: 1 },
  organized: { business: 1, analytical: 1 },
  curious: { research: 2 },
  persuasive: { communication: 2, leadership: 1, business: 1 },
  practical: { hands_on: 2 },
  leadership: { leadership: 2 },
};

const MATH_COMFORT_SCORE: Record<string, number> = {
  love: 10,
  comfortable: 7.5,
  okay: 5,
  dislike: 2.5,
  strongly_dislike: 0,
};

const ENTREPRENEURSHIP_SCORE: Record<string, number> = {
  very_interested: 10,
  somewhat_interested: 6,
  not_sure: 3,
  stable_job: 0,
};

const STUDY_WILLINGNESS_SCORE: Record<string, number> = {
  yes: 10,
  maybe: 5,
  no: 2,
};

function emptyAttributes(): CareerAttributes {
  return {
    analytical: 0,
    mathematical: 0,
    technical: 0,
    creative: 0,
    social: 0,
    leadership: 0,
    communication: 0,
    biology: 0,
    business: 0,
    research: 0,
    hands_on: 0,
    salary_priority: 0,
    stability: 0,
    education_length: 0,
    remote_work: 0,
    international_opportunity: 0,
  };
}

function applyBoosts(
  target: CareerAttributes,
  selections: string[],
  boosts: Record<string, Partial<Record<InterestKey, number>>>,
): void {
  for (const id of selections) {
    const boost = boosts[id];
    if (!boost) continue;
    for (const [key, value] of Object.entries(boost)) {
      target[key as InterestKey] += value ?? 0;
    }
  }
}

/** Reads a 1–5 scale answer and maps it to 0–10 (defaults to mid). */
function scaleToTen(answers: Answers, id: keyof Answers): number {
  const raw = Number(answers[id]?.[0] ?? 3);
  const clamped = Math.min(5, Math.max(1, Number.isFinite(raw) ? raw : 3));
  return ((clamped - 1) / 4) * 10;
}

export function buildUserProfile(answers: Answers): UserProfile {
  const interests = emptyAttributes();

  applyBoosts(interests, answers.activities ?? [], ACTIVITY_BOOSTS);
  applyBoosts(interests, answers.subjects ?? [], SUBJECT_BOOSTS);
  applyBoosts(interests, answers.work_type ?? [], WORK_TYPE_BOOSTS);
  applyBoosts(interests, answers.personality ?? [], PERSONALITY_BOOSTS);

  // Math comfort directly informs the mathematical axis (and softens it if
  // the user dislikes maths, even when other answers boosted it).
  const mathComfort = MATH_COMFORT_SCORE[answers.math_comfort?.[0] ?? ''] ?? 5;
  interests.mathematical = (interests.mathematical + mathComfort) / 2 + interests.mathematical * 0.2;
  if (mathComfort <= 2.5) {
    interests.mathematical = Math.min(interests.mathematical, 3);
  }

  // Creativity importance feeds the creative axis.
  const creativity = scaleToTen(answers, 'creativity_importance');
  interests.creative = Math.max(interests.creative, (interests.creative + creativity) / 2);

  // Entrepreneurship interest feeds the business axis.
  const entrepreneurship = ENTREPRENEURSHIP_SCORE[answers.entrepreneurship?.[0] ?? ''] ?? 3;
  interests.business = Math.max(interests.business, (interests.business + entrepreneurship) / 2);

  // Preferring team work leans social; preferring solo work leans away.
  const workStyle = answers.work_style?.[0];
  if (workStyle === 'team') interests.social += 1.5;
  if (workStyle === 'alone') interests.social = Math.max(0, interests.social - 1);

  // "Helping people" as a top-3 priority strengthens the social axis.
  const priorities = answers.career_priorities ?? [];
  if (priorities.includes('helping_people')) interests.social += 2;
  if (priorities.includes('creativity')) interests.creative += 2;
  if (priorities.includes('intellectual')) {
    interests.analytical += 1.5;
    interests.research += 1.5;
  }
  if (priorities.includes('entrepreneurship')) interests.business += 2;

  // Normalise so the strongest interest sits near the top of the scale.
  // Users who select few options should be compared by their RELATIVE
  // interests, not penalised for ticking fewer boxes.
  const INTEREST_ONLY: InterestKey[] = [
    'analytical', 'mathematical', 'technical', 'creative', 'social', 'leadership',
    'communication', 'biology', 'business', 'research', 'hands_on',
  ];
  const maxInterest = Math.max(...INTEREST_ONLY.map((k) => interests[k]));
  if (maxInterest > 0 && maxInterest < 9) {
    const factor = 9 / maxInterest;
    for (const key of INTEREST_ONLY) interests[key] *= factor;
  }
  // Re-apply the math dislike cap after normalisation.
  if (mathComfort <= 2.5) {
    interests.mathematical = Math.min(interests.mathematical, 3);
  }

  // Clamp every interest to 0–10.
  for (const key of Object.keys(interests) as InterestKey[]) {
    interests[key] = Math.min(10, Math.max(0, interests[key]));
  }

  // --- What the user wants a career to OFFER --------------------------------
  const salary = scaleToTen(answers, 'salary_importance');
  const stability = scaleToTen(answers, 'security_importance');

  let remote = 2;
  if (answers.work_environment?.[0] === 'remote') remote = 8;
  if (priorities.includes('remote_work')) remote = 10;
  if (answers.location_preference?.[0] === 'remote_anywhere') remote = Math.max(remote, 8);

  let international = 2;
  const location = answers.location_preference?.[0];
  if (location === 'india_or_abroad') international = 6;
  if (location === 'abroad') international = 10;
  if (priorities.includes('international')) international = Math.max(international, 9);

  return {
    interests,
    priorities: {
      salary: priorities.includes('high_salary') ? Math.max(salary, 8) : salary,
      stability: priorities.includes('job_security') ? Math.max(stability, 8) : stability,
      remote,
      international,
    },
    educationTolerance:
      STUDY_WILLINGNESS_SCORE[answers.study_willingness?.[0] ?? ''] ?? 5,
    preferredEnvironment:
      (answers.work_environment?.[0] as WorkEnvironmentTag | undefined) ?? null,
  };
}
