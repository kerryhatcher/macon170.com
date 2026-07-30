/** The one build-time CMS origin used by every public CMS integration. */
export const CMS_ORIGIN = (import.meta.env.PUBLIC_CMS_ORIGIN ?? 'https://cms.macon170.com').replace(/\/$/, '');

export function cmsUrl(path: `/${string}`): string {
  return `${CMS_ORIGIN}${path}`;
}

export const CALENDAR_API_BASE = cmsUrl('/api/calendar/v1');
export const CALENDAR_SUBSCRIPTION_URL = cmsUrl('/api/calendar/v1/calendar.ics').replace(/^https?:/, 'webcal:');
export const LEADERSHIP_ROSTER_URL = cmsUrl('/api/collections/leadership-roster/content');
export const CONTACT_SUBMISSION_URL = cmsUrl('/api/forms/contact/submit');
