/**
 * scripts/resolve-remaining-icons.js
 * Targeted multi-strategy resolver for the remaining saints without icons.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const iconsDir = path.join(projectRoot, 'public', 'icons');
const failedListPath = path.join(projectRoot, 'data', 'failed_icons.json');

const failedSaints = JSON.parse(fs.readFileSync(failedListPath, 'utf8'));
const USER_AGENT = 'HagioCalendarBot/1.0 (contact: info@hagiocalendar.org; liturgical calendar research)';

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function searchCommonsFiles(query) {
  try {
    const url = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srnamespace=6&format=json`;
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT }, signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const data = await res.json();
    const search = data.query?.search;
    if (!search || search.length === 0) return null;

    for (const item of search) {
      const title = item.title;
      // Get direct image info
      const infoUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=imageinfo&iiprop=url|mime|size&format=json`;
      const infoRes = await fetch(infoUrl, { headers: { 'User-Agent': USER_AGENT }, signal: AbortSignal.timeout(5000) });
      if (!infoRes.ok) continue;
      const infoData = await infoRes.json();
      const page = Object.values(infoData.query?.pages || {})[0];
      const imgInfo = page?.imageinfo?.[0];
      if (imgInfo?.url && (imgInfo.mime === 'image/jpeg' || imgInfo.mime === 'image/png')) {
        return imgInfo.url;
      }
    }
    return null;
  } catch {
    return null;
  }
}

async function searchWikipediaArticle(lang, query) {
  try {
    const searchUrl = `https://${lang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json`;
    const sRes = await fetch(searchUrl, { headers: { 'User-Agent': USER_AGENT }, signal: AbortSignal.timeout(5000) });
    if (!sRes.ok) return null;
    const sData = await sRes.json();
    const topTitle = sData.query?.search?.[0]?.title;
    if (!topTitle) return null;

    const sumUrl = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topTitle.replace(/ /g, '_'))}`;
    const sumRes = await fetch(sumUrl, { headers: { 'User-Agent': USER_AGENT }, signal: AbortSignal.timeout(5000) });
    if (!sumRes.ok) return null;
    const sumData = await sumRes.json();
    return sumData.thumbnail?.source || sumData.originalimage?.source || null;
  } catch {
    return null;
  }
}

async function downloadImage(url, destPath) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT }, signal: AbortSignal.timeout(8000) });
    if (!res.ok) return false;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 1000) return false;
    fs.writeFileSync(destPath, buf);
    return true;
  } catch {
    return false;
  }
}

async function resolveOne(saint) {
  const destPath = path.join(iconsDir, `${saint.id}.jpg`);

  // Clean name without prefixes
  const cleanName = saint.name
    .replace(/^(Saint|Saints|Blessed|Righteous|Holy|Venerable)\s+/i, '')
    .trim();

  const queries = [
    cleanName + ' (Menologion of Basil II)',
    cleanName + ' icon',
    saint.name + ' icon',
    cleanName + ' saint',
    saint.name,
    cleanName
  ];

  // Strategy 1: Commons File search
  for (const q of queries) {
    const url = await searchCommonsFiles(q);
    if (url) {
      const ok = await downloadImage(url, destPath);
      if (ok) return { id: saint.id, name: saint.name, success: true, method: `Commons: ${q}` };
    }
    await sleep(80);
  }

  // Strategy 2: Wikipedia Search in en, it, fr, es
  for (const lang of ['en', 'it', 'fr', 'es']) {
    for (const q of [saint.name, cleanName]) {
      const url = await searchWikipediaArticle(lang, q);
      if (url) {
        const ok = await downloadImage(url, destPath);
        if (ok) return { id: saint.id, name: saint.name, success: true, method: `Wiki (${lang}): ${q}` };
      }
      await sleep(80);
    }
  }

  return { id: saint.id, name: saint.name, success: false };
}

async function main() {
  console.log(`Attempting resolution for ${failedSaints.length} remaining saints...`);
  const stillFailed = [];

  for (let i = 0; i < failedSaints.length; i++) {
    const s = failedSaints[i];
    const res = await resolveOne(s);
    if (res.success) {
      console.log(`[${i + 1}/${failedSaints.length}] ✓ Resolved ${s.id}: ${s.name} via ${res.method}`);
    } else {
      console.warn(`[${i + 1}/${failedSaints.length}] ✗ Still unresolved: ${s.id}: ${s.name}`);
      stillFailed.push(s);
    }
    await sleep(150);
  }

  console.log(`\nRemaining unresolved: ${stillFailed.length} / ${failedSaints.length}`);
  fs.writeFileSync(path.join(projectRoot, 'data', 'still_failed.json'), JSON.stringify(stillFailed, null, 2), 'utf8');
}

main().catch(console.error);
