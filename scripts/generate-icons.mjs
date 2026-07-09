// One-off icon generator for the WerkCheck PWA.
// The PNG outputs are committed as static assets in /public, so the production
// build does NOT depend on sharp. To regenerate, install sharp ad-hoc:
//   npm i -D sharp && node scripts/generate-icons.mjs && npm un sharp
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pub = join(__dirname, '..', 'public');

const BRAND = '#e11d48';

// Centered "W" mark on a brand-colour field. `pad` is the fraction of the
// canvas kept clear around the mark (used for the maskable safe zone).
function markSvg({ rounded = true, pad = 0.16 } = {}) {
  const s = 512;
  const r = rounded ? 96 : 0;
  const fontSize = Math.round(s * (1 - pad * 2) * 0.82);
  return Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
  <rect width="${s}" height="${s}" rx="${r}" ry="${r}" fill="${BRAND}"/>
  <text x="50%" y="50%" dy="0.34em" text-anchor="middle"
        font-family="Helvetica, Arial, sans-serif" font-weight="700"
        font-size="${fontSize}" fill="#ffffff">W</text>
</svg>`);
}

async function png(svg, size, out) {
  await sharp(svg).resize(size, size).png().toFile(join(pub, out));
  console.log('wrote', out);
}

await png(markSvg({ rounded: true }), 192, 'pwa-192.png');
await png(markSvg({ rounded: true }), 512, 'pwa-512.png');
// maskable: full-bleed background, mark inside the safe zone, no rounding
await png(markSvg({ rounded: false, pad: 0.2 }), 512, 'maskable-512.png');
// iOS home-screen icon: square, no transparency, iOS applies its own mask
await png(markSvg({ rounded: false, pad: 0.16 }), 180, 'apple-touch-icon.png');

// crisp vector favicon for browser tabs
import { writeFileSync } from 'node:fs';
writeFileSync(join(pub, 'favicon.svg'), markSvg({ rounded: true }).toString());
console.log('wrote favicon.svg');
