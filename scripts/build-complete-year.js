/**
 * scripts/build-complete-year.js
 * Compiles and validates the complete 365-day liturgical year of Female Saints (2026).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { januarySaints } from './data/january.js';
import { februarySaints } from './data/february.js';
import { marchSaints } from './data/march.js';
import { aprilSaints } from './data/april.js';
import { maySaints } from './data/may.js';
import { juneSaints } from './data/june.js';
import { julySaints } from './data/july.js';
import { augustSaints } from './data/august.js';
import { septemberSaints } from './data/september.js';
import { octoberSaints } from './data/october.js';
import { novemberSaints } from './data/november.js';
import { decemberSaints } from './data/december.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const EXPECTED_DAYS_2026 = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

const RAW_MONTHS = [
  januarySaints,
  februarySaints,
  marchSaints,
  aprilSaints,
  maySaints,
  juneSaints,
  julySaints,
  augustSaints,
  septemberSaints,
  octoberSaints,
  novemberSaints,
  decemberSaints
];

console.log('=== Compiling 365-Day Calendar of Female Saints (2026) ===');

const consolidatedYear = [];

RAW_MONTHS.forEach((rawMonth, monthIdx) => {
  const monthNum = monthIdx + 1;
  const monthName = MONTH_NAMES[monthIdx];
  const expectedDays = EXPECTED_DAYS_2026[monthIdx];

  if (!rawMonth || !Array.isArray(rawMonth)) {
    throw new Error(`Month ${monthName} (${monthNum}) is missing or not an array!`);
  }

  if (rawMonth.length !== expectedDays) {
    throw new Error(`Month ${monthName} (${monthNum}) has ${rawMonth.length} entries, expected ${expectedDays}!`);
  }

  const monthSaints = [];

  rawMonth.forEach((entry, dayIdx) => {
    const dayNum = entry.day || (dayIdx + 1);

    if (dayNum !== dayIdx + 1) {
      console.warn(`[Warning] Month ${monthName} index ${dayIdx} has day property ${entry.day}; correcting to ${dayIdx + 1}.`);
    }

    const padMonth = String(monthNum).padStart(2, '0');
    const padDay = String(dayNum).padStart(2, '0');
    const id = `saint-${padMonth}-${padDay}`;
    const date = `${monthName} ${dayNum}`;

    // Validate required fields
    if (!entry.name || typeof entry.name !== 'string') {
      throw new Error(`Invalid or missing name on ${date}`);
    }
    if (!entry.title || typeof entry.title !== 'string') {
      throw new Error(`Invalid or missing title on ${date}`);
    }
    if (!entry.curatedBio || entry.curatedBio.length < 50) {
      throw new Error(`Bio too short or missing on ${date} for ${entry.name}`);
    }
    if (typeof entry.isMartyr !== 'boolean') {
      throw new Error(`Missing boolean isMartyr on ${date} for ${entry.name}`);
    }
    if (!entry.mannerOfDeath) {
      throw new Error(`Missing mannerOfDeath on ${date} for ${entry.name}`);
    }
    if (!entry.deathSummary) {
      throw new Error(`Missing deathSummary on ${date} for ${entry.name}`);
    }
    if (!entry.sources || !Array.isArray(entry.sources) || entry.sources.length === 0) {
      throw new Error(`Missing sources on ${date} for ${entry.name}`);
    }

    const standardizedEntry = {
      id,
      month: monthNum,
      day: dayNum,
      date,
      name: entry.name.trim(),
      title: entry.title.trim(),
      tradition: entry.tradition || 'Shared',
      curatedBio: entry.curatedBio.trim(),
      isMartyr: Boolean(entry.isMartyr),
      mannerOfDeath: entry.mannerOfDeath.trim(),
      deathSummary: entry.deathSummary.trim(),
      image: {
        url: entry.image?.url || '',
        title: entry.image?.title || entry.name,
        source: entry.image?.source || 'Wikimedia Commons',
        verified: entry.image?.verified !== false
      },
      sources: entry.sources.map(s => ({
        label: s.label || 'Historical Record',
        url: s.url
      }))
    };

    monthSaints.push(standardizedEntry);
    consolidatedYear.push(standardizedEntry);
  });

  // Write single-month JSON
  const monthFileName = `saints-month-${String(monthNum).padStart(2, '0')}.json`;
  const monthFilePath = path.join(projectRoot, 'data', monthFileName);
  fs.writeFileSync(monthFilePath, JSON.stringify(monthSaints, null, 2), 'utf8');
  console.log(`✓ Month ${String(monthNum).padStart(2, '0')} (${monthName}): ${monthSaints.length} days written to data/${monthFileName}`);
});

console.log(`\nConsolidated Year Total: ${consolidatedYear.length} / 365 days`);
if (consolidatedYear.length !== 365) {
  throw new Error(`Total days count is ${consolidatedYear.length}, expected 365!`);
}

// Ensure output directories exist
const dataDir = path.join(projectRoot, 'data');
const publicDir = path.join(projectRoot, 'public');
const publicDataDir = path.join(projectRoot, 'public', 'data');

[dataDir, publicDir, publicDataDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Target output paths
const targets = [
  path.join(projectRoot, 'data', 'saints.json'),
  path.join(projectRoot, 'saints-data.json'),
  path.join(projectRoot, 'data', 'saints-data.json'),
  path.join(projectRoot, 'public', 'saints-data.json'),
  path.join(projectRoot, 'public', 'data', 'saints.json')
];

const jsonOutput = JSON.stringify(consolidatedYear, null, 2);

targets.forEach(targetPath => {
  fs.writeFileSync(targetPath, jsonOutput, 'utf8');
  console.log(`✓ Saved ${consolidatedYear.length} saints to: ${path.relative(projectRoot, targetPath)}`);
});

// Summary breakdown
const martyrsCount = consolidatedYear.filter(s => s.isMartyr).length;
const venerableCount = consolidatedYear.length - martyrsCount;
const traditionBreakdown = consolidatedYear.reduce((acc, s) => {
  acc[s.tradition] = (acc[s.tradition] || 0) + 1;
  return acc;
}, {});

console.log('\n=== Liturgical Breakdown ===');
console.log(`- Martyrs: ${martyrsCount} (${Math.round(martyrsCount / consolidatedYear.length * 100)}%)`);
console.log(`- Venerable / Confessors: ${venerableCount} (${Math.round(venerableCount / consolidatedYear.length * 100)}%)`);
console.log('- Traditions:', traditionBreakdown);
console.log('\n✨ Complete 365-day calendar built and verified successfully!');
