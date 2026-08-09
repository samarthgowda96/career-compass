/**
 * Lightweight analytics facade.
 *
 * No personal information is ever attached to events — only anonymous usage
 * signals. To wire up a real provider later (Firebase Analytics, PostHog,
 * Amplitude…), implement `AnalyticsBackend` and pass it to `setBackend()`;
 * every call site stays unchanged.
 */

export type AnalyticsEvent =
  | 'app_open'
  | 'assessment_started'
  | 'question_completed'
  | 'assessment_completed'
  | 'results_viewed'
  | 'career_opened'
  | 'rewarded_ad_started'
  | 'rewarded_ad_completed';

export interface AnalyticsBackend {
  track(event: AnalyticsEvent, params?: Record<string, string | number>): void;
}

let backend: AnalyticsBackend | null = null;

export function setBackend(b: AnalyticsBackend): void {
  backend = b;
}

export function track(event: AnalyticsEvent, params?: Record<string, string | number>): void {
  if (__DEV__) {
    console.log(`[analytics] ${event}`, params ?? '');
  }
  backend?.track(event, params);
}
