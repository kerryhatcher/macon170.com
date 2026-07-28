// A link that leaves macon170.com opens in a new tab: a parent reading a page mid-visit should
// not lose it to scouting.org. Spread onto any anchor whose href may be either an internal path
// or an outside URL — the resources list and the den adventure lists mix the two freely.
// rel="noopener" is on for the usual reason: the opened tab must not get a handle on ours.
// Some hrefs come from data that may not have one (an adventure with no published page), so a
// nullable href is expected and simply gets no attributes.
export const externalLink = (href: string | null | undefined) =>
  href && /^https?:\/\//.test(href) ? { target: '_blank', rel: 'noopener' } : {};
