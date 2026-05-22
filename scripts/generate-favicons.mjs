/**
 * Generate PNG favicons from icon.svg using sharp.
 * Run: node scripts/generate-favicons.mjs
 */
import sharp from "sharp";
import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const publicDir = resolve(root, "public");

const svgPath = resolve(publicDir, "icon.svg");
const svgBuffer = readFileSync(svgPath);

const sizes = [
  { name: "favicon-16x16.png",  size: 16  },
  { name: "favicon-32x32.png",  size: 32  },
  { name: "favicon-48x48.png",  size: 48  },
  { name: "favicon-192x192.png",size: 192 },
  { name: "favicon-512x512.png",size: 512 },
  { name: "apple-touch-icon.png",size: 180},
];

for (const { name, size } of sizes) {
  const outPath = resolve(publicDir, name);
  await sharp(svgBuffer)
    .resize(size, size)
    .png()
    .toFile(outPath);
  console.log(`Generated ${name} (${size}x${size})`);
}

// Generate favicon.ico (multi-size: 16, 32, 48)
// sharp doesn't write ICO natively, so we produce a 32x32 PNG named favicon.ico
// as a fallback — browsers accept PNG served as ICO via meta tag
const icoPath = resolve(publicDir, "favicon.ico");
await sharp(svgBuffer).resize(32, 32).png().toFile(icoPath);
console.log("Generated favicon.ico (32x32 PNG)");

console.log("\nAll favicons generated in /public");
