import type { Answers, Career, CareerAttributes, CareerMatch } from '../types';
import { CAREERS } from '../data/careers';
import { buildUserProfile, type UserProfile } from './profile';

/**
 * Career matching algorithm.
 *
 * Deterministic and fully local — no AI involved. For each career we compute
 * a 0–100 compatibility score from three components:
 *
 * 1. Interest fit (70%): weighted similarity between the user's interest
 *    profile and the career's attribute vector. Attributes the user feels
 *    strongly about (high or low) count more than ones they are neutral on.
 * 2. Priority fit (22%): does the career offer what the user says they care
 *    about (earning potential, stability, remote work, international
 *    mobility) — weighted by how much they care.
 * 3. Practical fit (8%): preferred work environment and willingness to study
 *    for a long time vs. the career's education length.
 *
 * The result is a compatibility score for exploration, not a scientific
 * prediction — the UI presents it accordingly.
 */

const INTEREST_KEYS = [
  'analytical',
  'mathematical',
  'technical',
  'creative',
  'social',
  'leadership',
  'communication',
  'biology',
  'business',
  'research',
  'hands_on',
] as const satisfies readonly (keyof CareerAttributes)[];

function interestFit(user: UserProfile, career: Career): number {
  // Cosine similarity captures the DIRECTION of the user's interests, so a
  // user who ticked few boxes isn't punished on every attribute they simply
  // didn't mention (an unselected interest is weak evidence, not a dislike).
  let dot = 0;
  let userNorm = 0;
  let careerNorm = 0;
  for (const key of INTEREST_KEYS) {
    const u = user.interests[key];
    const c = career.attributes[key];
    dot += u * c;
    userNorm += u * u;
    careerNorm += c * c;
  }
  const cosine =
    userNorm > 0 && careerNorm > 0 ? dot / (Math.sqrt(userNorm) * Math.sqrt(careerNorm)) : 0.5;

  // Small distance term keeps expressed dislikes meaningful (e.g. "I strongly
  // dislike maths" should still pull maths-heavy careers down).
  let distanceSim = 0;
  for (const key of INTEREST_KEYS) {
    distanceSim += 1 - Math.abs(user.interests[key] - career.attributes[key]) / 10;
  }
  distanceSim /= INTEREST_KEYS.length;

  return cosine * 0.75 + distanceSim * 0.25;
}

function priorityFit(user: UserProfile, career: Career): number {
  const pairs: Array<[importance: number, offered: number]> = [
    [user.priorities.salary, career.attributes.salary_priority],
    [user.priorities.stability, career.attributes.stability],
    [user.priorities.remote, career.attributes.remote_work],
    [user.priorities.international, career.attributes.international_opportunity],
  ];

  let score = 0;
  let totalWeight = 0;
  for (const [importance, offered] of pairs) {
    const weight = importance / 10; // things the user doesn't care about barely count
    score += (offered / 10) * weight;
    totalWeight += weight;
  }

  // A user with no strong priorities gets a neutral 0.7 here.
  return totalWeight > 0.1 ? score / totalWeight : 0.7;
}

function practicalFit(user: UserProfile, career: Career): number {
  let score = 0.5;

  if (user.preferredEnvironment) {
    score = career.workEnvironments.includes(user.preferredEnvironment) ? 1 : 0.4;
  }

  // Penalise long education paths for users unwilling to study for years.
  const educationGap = career.attributes.education_length - user.educationTolerance;
  if (educationGap > 2) {
    score -= Math.min(0.4, (educationGap - 2) * 0.1);
  }

  return Math.max(0, Math.min(1, score));
}

/** Human-readable reasons used as a fallback when AI analysis is offline. */
function buildLocalReasons(user: UserProfile, career: Career): string[] {
  const reasons: Array<{ text: string; strength: number }> = [];

  const labels: Partial<Record<keyof CareerAttributes, string>> = {
    analytical: 'problem solving and analytical work',
    mathematical: 'working with numbers',
    technical: 'technology',
    creative: 'creating and designing things',
    social: 'helping and working with people',
    leadership: 'leading and managing',
    communication: 'writing and communication',
    biology: 'biology and life sciences',
    business: 'business and entrepreneurship',
    research: 'research and discovery',
    hands_on: 'hands-on, practical work',
  };

  for (const key of INTEREST_KEYS) {
    const u = user.interests[key];
    const c = career.attributes[key];
    if (u >= 6.5 && c >= 7) {
      reasons.push({ text: `Your interest in ${labels[key]} fits this field well`, strength: u + c });
    }
  }
  if (user.priorities.stability >= 7 && career.attributes.stability >= 8) {
    reasons.push({ text: 'It offers the job security you value', strength: 14 });
  }
  if (user.priorities.salary >= 7 && career.attributes.salary_priority >= 8) {
    reasons.push({ text: 'It has the strong earning potential you are looking for', strength: 14 });
  }
  if (user.priorities.remote >= 7 && career.attributes.remote_work >= 7) {
    reasons.push({ text: 'It supports the remote-friendly work you prefer', strength: 13 });
  }
  if (user.priorities.international >= 7 && career.attributes.international_opportunity >= 7) {
    reasons.push({ text: 'It opens the international doors you are interested in', strength: 13 });
  }

  return reasons
    .sort((a, b) => b.strength - a.strength)
    .slice(0, 3)
    .map((r) => r.text);
}

export function scoreCareer(user: UserProfile, career: Career): number {
  const combined =
    interestFit(user, career) * 0.7 +
    priorityFit(user, career) * 0.22 +
    practicalFit(user, career) * 0.08;

  // Map to 0–100 and gently widen the spread so results are readable
  // (raw similarity clusters between ~0.4 and ~0.9).
  const stretched = (combined - 0.35) / 0.6;
  return Math.round(Math.min(0.98, Math.max(0.05, stretched)) * 100);
}

/** Scores every career in the database and returns them sorted, best first. */
export function matchCareers(answers: Answers): CareerMatch[] {
  const user = buildUserProfile(answers);

  return CAREERS.map((career) => ({
    careerId: career.id,
    career,
    score: scoreCareer(user, career),
    localReasons: buildLocalReasons(user, career),
  })).sort((a, b) => b.score - a.score);
}

export const TOP_MATCHES_FREE = 5;
export const TOP_MATCHES_UNLOCKED = 10;
