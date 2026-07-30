const DEFAULT_CMS_ORIGIN = 'https://cms.macon170.com';

/** The one build-time CMS origin used by every public CMS integration. */
export function configuredCmsOrigin(value = import.meta.env.PUBLIC_CMS_ORIGIN): string {
  return value?.trim().replace(/\/$/, '') || DEFAULT_CMS_ORIGIN;
}

/**
 * Contact submissions are enabled for ordinary local and production builds.
 * Preview workflows must explicitly opt in because their CMS may be production.
 */
export function contactSubmissionsEnabled(value = import.meta.env.PUBLIC_CONTACT_SUBMISSIONS_ENABLED): boolean {
  return value === undefined || value.trim().toLowerCase() === 'true';
}

export const CMS_ORIGIN = configuredCmsOrigin();

export function cmsUrl(path: `/${string}`): string {
  return `${CMS_ORIGIN}${path}`;
}

export const CALENDAR_API_BASE = cmsUrl('/api/calendar/v1');
export const CALENDAR_SUBSCRIPTION_URL = cmsUrl('/api/calendar/v1/calendar.ics').replace(/^https?:/, 'webcal:');
export const LEADERSHIP_ROSTER_URL = cmsUrl('/api/collections/leadership-roster/content');
export const CONTACT_SUBMISSION_URL = contactSubmissionsEnabled() ? cmsUrl('/api/forms/contact/submit') : '';
