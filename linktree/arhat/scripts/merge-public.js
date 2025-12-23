const fs = require('fs');
const path = require('path');

function copyRecursiveSync(src, dest) {
  if (!fs.existsSync(src)) return;
  const stats = fs.statSync(src);
  if (stats.isDirectory()) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    for (const child of fs.readdirSync(src)) {
      copyRecursiveSync(path.join(src, child), path.join(dest, child));
    }
  } else {
    // Overwrite files in dest
    fs.copyFileSync(src, dest);
  }
}

const repoRoot = path.join(__dirname, '..');
const legacyDir = path.join(repoRoot, 'legacy_public');
const publicDir = path.join(repoRoot, 'public');

console.log('Merging', legacyDir, '->', publicDir);

try {
  copyRecursiveSync(legacyDir, publicDir);
  console.log('Merge complete.');
  process.exit(0);
} catch (err) {
  console.error('Merge failed:', err);
  process.exit(1);
}
