// Resolves a filename in assets/offical/ to an Astro image, so pages can render the official
// Scouting America rank badges and adventure loop/pin icons without a second copy in public/.
// Eager glob: Vite hands back the ImageMetadata for every match at build time, and Astro only
// processes the ones a page actually renders.
import type { ImageMetadata } from 'astro';

const files = import.meta.glob<{ default: ImageMetadata }>('../../assets/offical/*.webp', { eager: true });

export function officialImage(filename: string): ImageMetadata {
  const entry = files[`../../assets/offical/${filename}`];
  if (!entry) throw new Error(`assets/offical/${filename} not found — check the icon filename in src/data/`);
  return entry.default;
}
