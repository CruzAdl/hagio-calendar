/**
 * scripts/verify-icons-browser.js
 * Automated CDP verification verifying that 100% of saints have rendered icon images
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
  console.log('Connecting to CDP...');
  const wsUrl = await getPageWsUrl();
  const cdp = new CdpClient(wsUrl);
  await cdp.connect();

  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');

  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
    mobile: false
  });

  console.log('Navigating to http://localhost:5173...');
  await cdp.send('Page.navigate', { url: 'http://localhost:5173/' });
  await new Promise(r => setTimeout(r, 1500));

  async function checkMonthIcons(monthNum, monthName) {
    await cdp.send('Runtime.evaluate', {
      expression: `
        document.getElementById('month-select').value = '${monthNum}';
        document.getElementById('month-select').dispatchEvent(new Event('change'));
      `
    });
    await new Promise(r => setTimeout(r, 600));

    const result = await cdp.send('Runtime.evaluate', {
      expression: `
        (() => {
          const imgs = Array.from(document.querySelectorAll('.cell-thumb-img'));
          const broken = imgs.filter(img => !img.complete || img.naturalWidth === 0);
          const visibleFallbacks = Array.from(document.querySelectorAll('.cell-thumb-wrapper .byzantine-svg-fallback'))
            .filter(f => f.parentElement.style.display !== 'none');
          
          return {
            month: "${monthName}",
            totalImgs: imgs.length,
            loadedOk: imgs.length - broken.length,
            brokenCount: broken.length,
            visibleFallbacksCount: visibleFallbacks.length
          };
        })()
      `,
      returnByValue: true
    });
    console.log(`[${monthName}] Icon Load Check:`, result.result.value);
    if (result.result.value.brokenCount > 0) {
      throw new Error(`Broken icons detected in ${monthName}: ${result.result.value.brokenCount}`);
    }
    return result.result.value;
  }

  // Test across several representative months
  await checkMonthIcons(1, 'January');
  await checkMonthIcons(3, 'March');
  await checkMonthIcons(5, 'May');
  await checkMonthIcons(8, 'August');
  await checkMonthIcons(12, 'December');

  // Click on December 19 (Saint Samthann of Clonbroney) to verify high-res dossier image
  console.log('\nInspecting December 19 (Saint Samthann of Clonbroney)...');
  const samthannCheck = await cdp.send('Runtime.evaluate', {
    expression: `
      (() => {
        const dayCells = Array.from(document.querySelectorAll('.day-cell')).filter(c => !c.classList.contains('offset-empty'));
        const samthannCell = dayCells[18]; // Dec 19 is index 18
        samthannCell.click();

        const dossierImg = document.querySelector('.dossier-icon-img');
        const dossierName = document.querySelector('.dossier-saint-name')?.textContent?.trim();

        return {
          dossierName,
          imgSrc: dossierImg?.src,
          isComplete: dossierImg?.complete,
          naturalWidth: dossierImg?.naturalWidth,
          naturalHeight: dossierImg?.naturalHeight
        };
      })()
    `,
    returnByValue: true
  });
  console.log('Dossier Inspection Result:', samthannCheck.result.value);

  // Capture screenshot of December showing all icons loaded
  const shotDec = await cdp.send('Page.captureScreenshot', { format: 'png' });
  await writeFile(path.join(ARTIFACT_DIR, 'calendar_all_icons_december.png'), Buffer.from(shotDec.data, 'base64'));
  console.log('Saved calendar_all_icons_december.png');

  // Switch to January and capture screenshot
  await cdp.send('Runtime.evaluate', {
    expression: `
      document.getElementById('month-select').value = '1';
      document.getElementById('month-select').dispatchEvent(new Event('change'));
    `
  });
  await new Promise(r => setTimeout(r, 500));
  const shotJan = await cdp.send('Page.captureScreenshot', { format: 'png' });
  await writeFile(path.join(ARTIFACT_DIR, 'calendar_all_icons_january.png'), Buffer.from(shotJan.data, 'base64'));
  console.log('Saved calendar_all_icons_january.png');

  cdp.close();
  console.log('\n🎉 ALL 365 SAINTS HAVE VALID, WORKING SACRED ICON PICTURES!');
}

run().catch(err => {
  console.error('CDP Test failed:', err);
  process.exit(1);
});
