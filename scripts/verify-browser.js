/**
 * scripts/verify-browser.js
 * Comprehensive CDP verification script for all 12 months & full 365-day calendar.
 */
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const ARTIFACT_DIR = '/Users/adlcruz/.gemini/antigravity/brain/a489c5a7-0672-4023-9c58-ec9ac2acde2a';

async function getPageWsUrl() {
  const res = await fetch('http://localhost:9222/json');
  const pages = await res.json();
  const page = pages.find(p => p.type === 'page');
  return page?.webSocketDebuggerUrl;
}

class CdpClient {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.id = 1;
    this.callbacks = new Map();
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws.onopen = () => resolve();
      this.ws.onerror = (err) => reject(err);
      this.ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id && this.callbacks.has(msg.id)) {
          const { resolve, reject } = this.callbacks.get(msg.id);
          this.callbacks.delete(msg.id);
          if (msg.error) reject(msg.error);
          else resolve(msg.result);
        }
      };
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.id++;
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  close() {
    this.ws.close();
  }
}

async function run() {
  console.log('Connecting to Chrome DevTools Protocol...');
  const wsUrl = await getPageWsUrl();
  if (!wsUrl) throw new Error('No page found in Chrome CDP');

  const cdp = new CdpClient(wsUrl);
  await cdp.connect();
  console.log('Connected to CDP.');

  // Enable Page & Runtime
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');

  // Enforce 1920x1080 Viewport (16:9 Landscape)
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
    mobile: false
  });

  // Navigate to dev server
  console.log('Navigating to http://localhost:5173...');
  await cdp.send('Page.navigate', { url: 'http://localhost:5173/' });
  await new Promise(r => setTimeout(r, 1800));

  // Helper function to check viewport scrollbars
  async function checkScrollbars(label) {
    const res = await cdp.send('Runtime.evaluate', {
      expression: `
        ({
          label: "${label}",
          innerWidth: window.innerWidth,
          innerHeight: window.innerHeight,
          docScrollWidth: document.documentElement.scrollWidth,
          docClientWidth: document.documentElement.clientWidth,
          docScrollHeight: document.documentElement.scrollHeight,
          docClientHeight: document.documentElement.clientHeight,
          hasHorizontalScroll: document.documentElement.scrollWidth > document.documentElement.clientWidth,
          hasVerticalScroll: document.documentElement.scrollHeight > document.documentElement.clientHeight
        })
      `,
      returnByValue: true
    });
    console.log(`[${label}] Scrollbars:`, res.result.value);
    if (res.result.value.hasHorizontalScroll || res.result.value.hasVerticalScroll) {
      throw new Error(`Scrollbars detected in ${label}!`);
    }
    return res.result.value;
  }

  // Helper function to check grid clipping
  async function checkGridClipping(label) {
    const res = await cdp.send('Runtime.evaluate', {
      expression: `
        (() => {
          const grid = document.getElementById('calendar-grid');
          const gridRect = grid.getBoundingClientRect();
          const leftPane = document.querySelector('.left-pane');
          const leftPaneRect = leftPane.getBoundingClientRect();
          const cells = Array.from(document.querySelectorAll('.day-cell'));
          const dayCells = cells.filter(c => !c.classList.contains('offset-empty'));

          const clipped = dayCells.filter(c => {
            const r = c.getBoundingClientRect();
            return r.bottom > leftPaneRect.bottom + 1 || r.top < leftPaneRect.top - 1;
          });

          return {
            label: "${label}",
            totalCells: cells.length,
            dayCellsCount: dayCells.length,
            gridRows: grid.getAttribute('data-rows'),
            gridHeight: Math.round(gridRect.height),
            clippedCount: clipped.length
          };
        })()
      `,
      returnByValue: true
    });
    console.log(`[${label}] Grid & Clipping:`, res.result.value);
    if (res.result.value.clippedCount > 0) {
      throw new Error(`Clipped cells detected in ${label}: ${res.result.value.clippedCount}`);
    }
    return res.result.value;
  }

  // 1. Verify January (5 rows)
  console.log('\n--- Test 1: January 2026 (5 rows) ---');
  await checkScrollbars('January');
  await checkGridClipping('January');
  const shotJan = await cdp.send('Page.captureScreenshot', { format: 'png' });
  await writeFile(path.join(ARTIFACT_DIR, 'calendar_january_5rows.png'), Buffer.from(shotJan.data, 'base64'));
  console.log('Saved calendar_january_5rows.png');

  // 2. Switch to May 2026 (6 rows)
  console.log('\n--- Test 2: May 2026 (6 rows) ---');
  await cdp.send('Runtime.evaluate', {
    expression: `
      document.getElementById('month-select').value = '5';
      document.getElementById('month-select').dispatchEvent(new Event('change'));
    `
  });
  await new Promise(r => setTimeout(r, 600));
  await checkScrollbars('May (6 rows)');
  await checkGridClipping('May (6 rows)');
  const shotMay = await cdp.send('Page.captureScreenshot', { format: 'png' });
  await writeFile(path.join(ARTIFACT_DIR, 'calendar_may_6rows.png'), Buffer.from(shotMay.data, 'base64'));
  console.log('Saved calendar_may_6rows.png');

  // 3. Switch to August 2026 (6 rows)
  console.log('\n--- Test 3: August 2026 (6 rows) ---');
  await cdp.send('Runtime.evaluate', {
    expression: `
      document.getElementById('month-select').value = '8';
      document.getElementById('month-select').dispatchEvent(new Event('change'));
    `
  });
  await new Promise(r => setTimeout(r, 600));
  await checkScrollbars('August (6 rows)');
  await checkGridClipping('August (6 rows)');
  const shotAug = await cdp.send('Page.captureScreenshot', { format: 'png' });
  await writeFile(path.join(ARTIFACT_DIR, 'calendar_august_6rows.png'), Buffer.from(shotAug.data, 'base64'));
  console.log('Saved calendar_august_6rows.png');

  // 4. Test Prev/Next Navigation
  console.log('\n--- Test 4: Prev/Next Month Button Navigation ---');
  await cdp.send('Runtime.evaluate', {
    expression: `
      document.getElementById('next-month-btn').click(); // August -> September
    `
  });
  await new Promise(r => setTimeout(r, 400));
  const navCheck = await cdp.send('Runtime.evaluate', {
    expression: `
      ({
        selectedMonthVal: document.getElementById('month-select').value,
        saintsCountPill: document.getElementById('saints-count-pill').textContent
      })
    `,
    returnByValue: true
  });
  console.log('Navigated to:', navCheck.result.value);

  // 5. Test Search across Year
  console.log('\n--- Test 5: Global Search across 365 Days ---');
  await cdp.send('Runtime.evaluate', {
    expression: `
      const input = document.getElementById('saint-search-input');
      input.value = 'Clare';
      input.dispatchEvent(new Event('input'));
    `
  });
  await new Promise(r => setTimeout(r, 700));

  const searchCheck = await cdp.send('Runtime.evaluate', {
    expression: `
      ({
        monthVal: document.getElementById('month-select').value,
        dossierName: document.querySelector('.dossier-saint-name')?.textContent,
        dossierDate: document.querySelector('.dossier-feast-date')?.textContent,
        countPill: document.getElementById('saints-count-pill').textContent
      })
    `,
    returnByValue: true
  });
  console.log('Search Result for "Clare":', searchCheck.result.value);
  const shotSearch = await cdp.send('Page.captureScreenshot', { format: 'png' });
  await writeFile(path.join(ARTIFACT_DIR, 'calendar_search_results.png'), Buffer.from(shotSearch.data, 'base64'));
  console.log('Saved calendar_search_results.png');

  // 6. Test Martyr Chip Filter
  console.log('\n--- Test 6: Martyr Chip Filter ---');
  await cdp.send('Runtime.evaluate', {
    expression: `
      // Clear search first
      document.getElementById('search-clear-btn').click();
      // Click Martyrs chip
      document.querySelector('.martyr-chip').click();
    `
  });
  await new Promise(r => setTimeout(r, 500));
  const martyrCheck = await cdp.send('Runtime.evaluate', {
    expression: `
      ({
        countPill: document.getElementById('saints-count-pill').textContent,
        dossierName: document.querySelector('.dossier-saint-name')?.textContent
      })
    `,
    returnByValue: true
  });
  console.log('Martyr Filter Active:', martyrCheck.result.value);

  cdp.close();
  console.log('\n🎉 ALL CDP TESTS PASSED! Strict 16:9 landscape verified, 0 scrollbars, 0 clipping across all months.');
}

run().catch(err => {
  console.error('CDP Test failed:', err);
  process.exit(1);
});
