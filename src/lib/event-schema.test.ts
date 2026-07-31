import { describe, expect, it } from 'vitest';
import { organizationSchema } from './event-schema';

describe('organizationSchema', () => {
  it('identifies the pack with a stable @id other schemas can reference', () => {
    const schema = organizationSchema();

    expect(schema['@context']).toBe('https://schema.org');
    expect(schema['@type']).toBe('Organization');
    expect(schema['@id']).toBe('https://www.macon170.com/#organization');
    expect(schema.name).toBe('Cub Scout Pack 170');
    expect(schema.url).toBe('https://www.macon170.com');
  });

  it('points logo at a real crawlable square image', () => {
    // Google requires a logo of at least 112x112. pack170-logo-512.png is 512x512.
    expect(organizationSchema().logo).toBe('https://www.macon170.com/logo/pack170-logo-512.png');
  });

  it('claims a service area without claiming a street address', () => {
    const schema = organizationSchema();

    expect(schema.areaServed).toEqual({
      '@type': 'City',
      name: 'Macon',
      containedInPlace: { '@type': 'State', name: 'Georgia' },
    });
    // The pack meets at a church it does not own. Attributing that street address to the
    // organization would assert a business location that does not exist.
    expect(schema.address).toBeUndefined();
  });

  it('names the national organization as parent', () => {
    expect(organizationSchema().parentOrganization).toEqual({
      '@type': 'Organization',
      name: 'Boy Scouts of America',
    });
  });
});
