// ponytail: one line beats adding a `slug` field to `ranks` — all six rank names slugify cleanly.
export const denSlug = (rankName: string) => rankName.toLowerCase().replace(/ /g, '-');
