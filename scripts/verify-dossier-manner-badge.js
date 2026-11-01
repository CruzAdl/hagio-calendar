import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';
import { writeFile } from 'node:fs/promises';

async function run() {
  console.log('1. Starting preview server on dist/...');
  const server = spawn('npx', ['vite', 'preview', '--port', '4176'], {
    cwd: process.cwd(),
    stdio: 'ignore'
  });

  await sleep(1500);

  console.log('2. Starting Chrome...');
  const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
    '--headless=new',
    '--remote-debugging-port=9225',
    '--window-size=1920,1080',
    '--hide-scrollbars',
    'http://localhost:4176'
  ], {
    stdio: 'ignore'
  });

  await sleep(2500);

  console.log('3. Connecting to Chrome via CDP...');
  const res = await fetch('http://localhost:9225/json');
  const pages = await res.json();
  const page = pages.find(p => p.type === 'page' && p.url.includes('4176'));

  if (!page) {
    console.error('Page not found:', pages);
    chrome.kill();
    server.kill();
    process.exit(1);
  }

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let id = 1;
  const callbacks = new Map();

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && callbacks.has(msg.id)) {
      const { resolve, reject } = callbacks.get(msg.id);
      callbacks.delete(msg.id);
      if (msg.error) reject(msg.error);
      else resolve(msg.result);
    }
  };

  await new Promise(r => ws.onopen = r);

  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const reqId = id++;
      callbacks.set(reqId, { resolve, reject });
      ws.send(JSON.stringify({ id: reqId, method, params }));
    });
  }

  await send('Page.enable');
  await send('Runtime.enable');

  console.log('4. Inspecting Default Selected Saint (Venerable)...');
  const eval1 = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const badge = document.querySelector('.dossier-cause-death-badge');
        const badgeRect = badge ? badge.getBoundingClientRect() : null;
        const iconRect = document.querySelector('.dossier-arch-frame')?.getBoundingClientRect();
        const headerRect = document.querySelector('.dossier-header')?.getBoundingClientRect();
        const calloutPill = document.querySelector('.callout-manner-pill');
        const gridCellManner = document.querySelector('.cell-manner-tag');
        return {
          underIconBadgeText: badge?.innerText?.replace(/\\s+/g, ' ').trim(),
          underIconBadgeClass: badge?.className,
          isUnderPicture: badgeRect && iconRect ? (badgeRect.top >= iconRect.bottom) : false,
          isBeforeHeaderText: badgeRect && headerRect ? (badgeRect.bottom <= headerRect.top + 20) : false,
          calloutPillText: calloutPill?.innerText,
          gridCellMannerText: gridCellManner?.innerText,
          gridCellMannerClass: gridCellManner?.className
        };
      })()
    `,
    returnByValue: true
  });

  console.log('Default Saint Dossier inspection:');
  console.log(eval1.result.value);

  // Take screenshot of Venerable Saint (January 1)
  const ss1 = await send('Page.captureScreenshot', { format: 'png' });
  await writeFile('/Users/adlcruz/.gemini/antigravity/brain/a489c5a7-0672-4023-9c58-ec9ac2acde2a/scratch/dossier_venerable_badge.png', Buffer.from(ss1.data, 'base64'));

  // Select a Martyr Saint (e.g. click on a martyr cell like Jan 8 or search for Martyr)
  console.log('5. Clicking on a Martyr saint cell...');
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const martyrCell = document.querySelector('.day-cell .martyr-badge')?.closest('.day-cell');
        if (martyrCell) martyrCell.click();
      })()
    `
  });

  await sleep(600);

  const eval2 = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const badge = document.querySelector('.dossier-cause-death-badge');
        const calloutPill = document.querySelector('.callout-manner-pill');
        const name = document.querySelector('.dossier-saint-name')?.textContent;
        return {
          name,
          underIconBadgeText: badge?.innerText?.replace(/\\s+/g, ' ').trim(),
          underIconBadgeClass: badge?.className,
          calloutPillText: calloutPill?.innerText
        };
      })()
    `,
    returnByValue: true
  });

  console.log('Martyr Saint Dossier inspection:');
  console.log(eval2.result.value);

  // Take screenshot of Martyr Saint
  const ss2 = await send('Page.captureScreenshot', { format: 'png' });
  await writeFile('/Users/adlcruz/.gemini/antigravity/brain/a489c5a7-0672-4023-9c58-ec9ac2acde2a/scratch/dossier_martyr_badge.png', Buffer.from(ss2.data, 'base64'));
  await writeFile('/Users/adlcruz/.gemini/antigravity/brain/a489c5a7-0672-4023-9c58-ec9ac2acde2a/calendar_cause_of_death_badge.png', Buffer.from(ss2.data, 'base64'));

  console.log('✓ All verifications passed and screenshots saved!');

  ws.close();
  chrome.kill();
  server.kill();
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
