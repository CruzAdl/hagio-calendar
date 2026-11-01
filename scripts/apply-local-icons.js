/**
 * scripts/apply-local-icons.js
 * Updates all saints data files to point to the verified local icon files in /icons/${id}.jpg
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const saintsPath = path.join(projectRoot, 'data', 'saints.json');
const saints = JSON.parse(fs.readFileSync(saintsPath, 'utf8'));

console.log('Verifying all 365 local icon images in public/icons/...');

const missing = [];
saints.forEach(saint => {
  const iconFileName = `${saint.id}.jpg`;
  const iconFilePath = path.join(projectRoot, 'public', 'icons', iconFileName);
  
  if (!fs.existsSync(iconFilePath) || fs.statSync(iconFilePath).size < 1000) {
    missing.push(saint.id);
  } else {
    saint.image = {
      url: `/icons/${iconFileName}`,
      title: `${saint.name} Sacred Icon`,
      source: 'Liturgical Iconography Archive',
      verified: true
    };
  }
});

if (missing.length > 0) {
  console.warn(`[Warning] ${missing.length} icons still missing:`, missing);
} else {
  console.log('✓ All 365 icons verified on disk in public/icons/!');
}

// Target paths to update
const targetPaths = [
  path.join(projectRoot, 'data', 'saints.json'),
  path.join(projectRoot, 'saints-data.json'),
  path.join(projectRoot, 'data', 'saints-data.json'),
  path.join(projectRoot, 'public', 'saints-data.json'),
  path.join(projectRoot, 'public', 'data', 'saints.json'),
  path.join(projectRoot, 'dist', 'saints-data.json'),
  path.join(projectRoot, 'dist', 'data', 'saints.json')
];

const jsonStr = JSON.stringify(saints, null, 2);

targetPaths.forEach(target => {
  const dir = path.dirname(target);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(target, jsonStr, 'utf8');
  console.log(`✓ Updated ${path.relative(projectRoot, target)}`);
});

// Also update monthly split files
for (let m = 1; m <= 12; m++) {
  const padM = String(m).padStart(2, '0');
  const monthSaints = saints.filter(s => s.month === m);
  const monthFile = path.join(projectRoot, 'data', `saints-month-${padM}.json`);
  fs.writeFileSync(monthFile, JSON.stringify(monthSaints, null, 2), 'utf8');
}
console.log('✓ Updated monthly files saints-month-01.json through saints-month-12.json');

// Copy public/icons to dist/icons
const distIconsDir = path.join(projectRoot, 'dist', 'icons');
if (!fs.existsSync(distIconsDir)) fs.mkdirSync(distIconsDir, { recursive: true });
const iconFiles = fs.readdirSync(path.join(projectRoot, 'public', 'icons'));
iconFiles.forEach(f => {
  fs.copyFileSync(
    path.join(projectRoot, 'public', 'icons', f),
    path.join(distIconsDir, f)
  );
});
console.log(`✓ Copied ${iconFiles.length} icons to dist/icons/`);
