import { promises as fs } from 'fs';
import path from 'path';

const root = process.cwd();
const distDir = path.join(root, 'dist');
const iconsSrc = path.join(root, 'icons');
const iconsDest = path.join(distDir, 'icons');
const trackersSrc = path.join(root, 'trackers.json');
const trackersDest = path.join(distDir, 'trackers.json');

async function ensureDir(p) {
  await fs.mkdir(p, { recursive: true }).catch(() => {});
}

async function copyDir(src, dest) {
  await ensureDir(dest);
  const entries = await fs.readdir(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

async function main() {
  try {
    await ensureDir(distDir);

    try {
      await copyDir(iconsSrc, iconsDest);
      console.log('[copy-assets] Copied icons to dist/icons');
    } catch (e) {
      console.warn('[copy-assets] Icons folder not found, skipping.');
    }

    try {
      await fs.copyFile(trackersSrc, trackersDest);
      console.log('[copy-assets] Copied trackers.json to dist');
    } catch (e) {
      console.warn('[copy-assets] trackers.json not found, skipping.');
    }
  } catch (err) {
    console.error('[copy-assets] Failed:', err);
    process.exit(1);
  }
}

main();

