import { describe, expect, it } from 'vitest';
import { configuredCmsOrigin, contactSubmissionsEnabled } from './cms-origin';

describe('CMS preview configuration', () => {
  it('uses the production CMS origin when the configured value is absent or blank', () => {
    expect(configuredCmsOrigin()).toBe('https://cms.macon170.com');
    expect(configuredCmsOrigin('   ')).toBe('https://cms.macon170.com');
  });

  it('normalizes a configured CMS origin once for all CMS URLs', () => {
    expect(configuredCmsOrigin(' https://cms-preview.example/ ')).toBe('https://cms-preview.example');
  });

  it('requires an exact opt-in to enable preview contact submissions', () => {
    expect(contactSubmissionsEnabled('false')).toBe(false);
    expect(contactSubmissionsEnabled('')).toBe(false);
    expect(contactSubmissionsEnabled('true')).toBe(true);
  });
});
