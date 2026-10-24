// Writes public/splats/test.ply: a small spectrum sphere with a ring around it,
// so npm run check has something to draw without a real capture.
// npm runs this before dev and check. It only writes the file if it is missing.
//
//   node scripts/make-test-splat.mjs           write if missing
//   node scripts/make-test-splat.mjs --force   always write

import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

const OUT = join('public', 'splats', 'test.ply');
// Turns an RGB value (0..1) into the colour coefficient stored in 3DGS files.
const SH_C0 = 0.28209479177387814;
const PROPERTIES = ['x', 'y', 'z', 'f_dc_0', 'f_dc_1', 'f_dc_2', 'opacity'];
const PROPERTIES_REST = ['scale_0', 'scale_1', 'scale_2', 'rot_0', 'rot_1', 'rot_2', 'rot_3'];

if (existsSync(OUT) && !process.argv.includes('--force')) process.exit(0);

const splats = [...sphere(5000, 1), ...ring(1500, 1.6)];
await mkdir(dirname(OUT), { recursive: true });
await writeFile(OUT, toPly(splats));
console.log(`wrote ${OUT} (${splats.length} splats)`);

// Evenly spread points on a sphere, red at the top and violet at the bottom.
// Like most captures, the file is y-down: the top of the sphere is at y = -1.
function sphere(count, radius) {
  const golden = Math.PI * (3 - Math.sqrt(5));
  return Array.from({ length: count }, (_, i) => {
    const t = (i + 0.5) / count;
    const y = -1 + 2 * t;
    const r = Math.sqrt(1 - y * y);
    const angle = golden * i;
    return {
      position: [Math.cos(angle) * r * radius, y * radius, Math.sin(angle) * r * radius],
      color: spectrum(t),
      opacity: 0.95,
      scale: [0.045, 0.045, 0.045],
    };
  });
}

// A flat, light ring around the equator.
function ring(count, radius) {
  return Array.from({ length: count }, (_, i) => {
    const angle = (2 * Math.PI * i) / count;
    const r = radius + (i % 5) * 0.03;
    return {
      position: [Math.cos(angle) * r, 0, Math.sin(angle) * r],
      color: [0.95, 0.94, 0.92],
      opacity: 0.7,
      scale: [0.035, 0.008, 0.035],
    };
  });
}

// 0 = red, 1 = violet.
function spectrum(t) {
  const hue = t * 280;
  const chroma = 0.85;
  const x = chroma * (1 - Math.abs(((hue / 60) % 2) - 1));
  const [r, g, b] =
    hue < 60 ? [chroma, x, 0]
    : hue < 120 ? [x, chroma, 0]
    : hue < 180 ? [0, chroma, x]
    : hue < 240 ? [0, x, chroma]
    : [x, 0, chroma];
  const light = 0.12;
  return [r + light, g + light, b + light];
}

function toPly(list) {
  const names = [...PROPERTIES, ...PROPERTIES_REST];
  const header = [
    'ply',
    'format binary_little_endian 1.0',
    `element vertex ${list.length}`,
    ...names.map((name) => `property float ${name}`),
    'end_header',
    '',
  ].join('\n');
  const body = Buffer.alloc(list.length * names.length * 4);
  list.forEach((splat, i) => {
    const values = [
      ...splat.position,
      ...splat.color.map((value) => (value - 0.5) / SH_C0),
      Math.log(splat.opacity / (1 - splat.opacity)),
      ...splat.scale.map(Math.log),
      1, 0, 0, 0,
    ];
    values.forEach((value, j) => body.writeFloatLE(value, (i * names.length + j) * 4));
  });
  return Buffer.concat([Buffer.from(header, 'ascii'), body]);
}
