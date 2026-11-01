/**
 * scripts/fetch-all-icons.js
 * Downloads accurate icon images for all 365 saints and saves them locally in public/icons/${id}.jpg
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const iconsDir = path.join(projectRoot, 'public', 'icons');

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

const saintsDataPath = path.join(projectRoot, 'data', 'saints.json');
const saints = JSON.parse(fs.readFileSync(saintsDataPath, 'utf8'));

console.log(`Starting icon acquisition for ${saints.length} saints...`);

const USER_AGENT = 'HagioCalendarBot/1.0 (contact: info@hagiocalendar.org; educational liturgical calendar)';

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function fetchWithRetry(url, options = {}, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        ...options,
        headers: {
          'User-Agent': USER_AGENT,
          ...(options.headers || {})
        },
        signal: AbortSignal.timeout(6000)
      });
      if (res.status === 429) {
        const waitTime = (i + 1) * 2000;
        console.warn(`[Rate limited 429] Waiting ${waitTime}ms for ${url}...`);
        await sleep(waitTime);
        continue;
      }
      return res;
    } catch (err) {
      if (i === retries - 1) throw err;
      await sleep(1000);
    }
  }
  return null;
}

async function getOcaIcon(ocaUrl) {
  try {
    const res = await fetchWithRetry(ocaUrl);
    if (!res || !res.ok) return null;
    const html = await res.text();
    const matchLg = html.match(/https:\/\/images\.oca\.org\/icons\/lg\/[^\"]+\.jpg/i);
    if (matchLg) return matchLg[0];
    const matchSm = html.match(/https:\/\/images\.oca\.org\/icons\/sm\/[^\"]+\.jpg/i);
    if (matchSm) return matchSm[0];
    return null;
  } catch {
    return null;
  }
}

async function getWikipediaIcon(wikiUrl) {
  try {
    const match = wikiUrl.match(/\/wiki\/(.+)$/);
    if (!match) return null;
    const slug = match[1];
    const apiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${slug}`;
    const res = await fetchWithRetry(apiUrl);
    if (!res || !res.ok) return null;
    const json = await res.json();
    return json.thumbnail?.source || json.originalimage?.source || null;
  } catch {
    return null;
  }
}

async function searchCommonsIcon(query) {
  try {
    const encoded = encodeURIComponent(query);
    const apiUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch=${encoded}&gsrlimit=3&prop=imageinfo&iiprop=url|mime&format=json`;
    const res = await fetchWithRetry(apiUrl);
    if (!res || !res.ok) return null;
    const json = await res.json();
    const pages = json.query?.pages;
    if (!pages) return null;
    for (const pageId of Object.keys(pages)) {
      const info = pages[pageId]?.imageinfo?.[0];
      if (info?.url && (info.mime === 'image/jpeg' || info.mime === 'image/png')) {
        return info.url;
      }
    }
    return null;
  } catch {
    return null;
  }
}

async function downloadImage(url, destPath) {
  try {
    const res = await fetchWithRetry(url);
    if (!res || !res.ok) return false;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 800) {
      return false; // too small or error page
    }
    fs.writeFileSync(destPath, buf);
    return true;
  } catch {
    return false;
  }
}

async function processSaint(saint, idx) {
  const destPath = path.join(iconsDir, `${saint.id}.jpg`);

  // If already downloaded and valid, skip
  if (fs.existsSync(destPath)) {
    const stat = fs.statSync(destPath);
    if (stat.size > 1500) {
      return { id: saint.id, success: true, source: 'cached' };
    }
  }

  const oca = saint.sources.find(s => s.url?.includes('oca.org/saints/lives/'));
  const wiki = saint.sources.find(s => s.url?.includes('wikipedia.org/wiki/'));

  let candidateUrl = null;
  let sourceLabel = '';

  // 1. Try OCA icon
  if (oca) {
    candidateUrl = await getOcaIcon(oca.url);
    if (candidateUrl) sourceLabel = 'OCA';
  }

  // 2. Try Wikipedia summary
  if (!candidateUrl && wiki) {
    candidateUrl = await getWikipediaIcon(wiki.url);
    if (candidateUrl) sourceLabel = 'Wikipedia';
  }

  // 3. Try Commons Search: "${saint.name} icon"
  if (!candidateUrl) {
    candidateUrl = await searchCommonsIcon(`"${saint.name}" icon`);
    if (candidateUrl) sourceLabel = 'Commons (Search)';
  }

  // 4. Try Commons Search: "${saint.name}"
  if (!candidateUrl) {
    candidateUrl = await searchCommonsIcon(`"${saint.name}"`);
    if (candidateUrl) sourceLabel = 'Commons (Direct)';
  }

  // 5. Try existing image.url if available
  if (!candidateUrl && saint.image?.url && !saint.image.url.startsWith('/icons/')) {
    candidateUrl = saint.image.url;
    sourceLabel = 'Existing';
  }

  if (candidateUrl) {
    const ok = await downloadImage(candidateUrl, destPath);
    if (ok) {
      console.log(`[${idx + 1}/365] ✓ ${saint.id} ${saint.name} (${sourceLabel})`);
      return { id: saint.id, success: true, source: sourceLabel };
    }
  }

  console.warn(`[${idx + 1}/365] ✗ Failed to find icon for: ${saint.id} - ${saint.name}`);
  return { id: saint.id, success: false, name: saint.name, tradition: saint.tradition, date: saint.date };
}

async function main() {
  const failed = [];
  const concurrency = 4;

  for (let i = 0; i < saints.length; i += concurrency) {
    const chunk = saints.slice(i, i + concurrency);
    const results = await Promise.all(chunk.map((s, cIdx) => processSaint(s, i + cIdx)));
    results.forEach(r => {
      if (!r.success) failed.push(r);
    });
    await sleep(150);
  }

  console.log('\n=== Download Summary ===');
  console.log(`Success: ${saints.length - failed.length} / ${saints.length}`);
  console.log(`Failed: ${failed.length}`);

  if (failed.length > 0) {
    fs.writeFileSync(path.join(projectRoot, 'data', 'failed_icons.json'), JSON.stringify(failed, null, 2), 'utf8');
    console.log('Failed list saved to data/failed_icons.json');
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
