import { pack } from '../data/pack';

export const SITE_ORIGIN = 'https://www.macon170.com';
export const ORGANIZATION_ID = `${SITE_ORIGIN}/#organization`;

export function organizationSchema(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': ORGANIZATION_ID,
    name: pack.name,
    alternateName: pack.shortName,
    url: SITE_ORIGIN,
    logo: `${SITE_ORIGIN}/logo/pack170-logo-512.png`,
    description:
      'Volunteer-run Cub Scout pack for kindergarten through 5th grade, boys and girls, meeting monthly on Tuesdays at 6:30 PM in Macon, Georgia.',
    areaServed: {
      '@type': 'City',
      name: 'Macon',
      containedInPlace: { '@type': 'State', name: 'Georgia' },
    },
    // No `address`: the pack meets at a chartered organization's building it does not own.
    parentOrganization: { '@type': 'Organization', name: 'Boy Scouts of America' },
  };
}
