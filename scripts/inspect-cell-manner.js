import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';
import { writeFile } from 'node:fs/promises';

async function run() {
  console.log('1. Starting preview server...');
  const server = spawn('npx', ['vite', 'preview', '--port', '4173'], {
    cwd: process.cwd(),
    stdio: 'ignore'
  });

  await sleep(1500);

  console.log('2. Starting Chrome...');
  const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--window-size=1920,1080',
    '--hide-scrollbars',
    'http://localhost:4173'
  ], {
    stdio: 'ignore'
  });

  await sleep(2500);

  console.log('3. Connecting to Chrome via CDP...');
  const res = await fetch('http://localhost:9222/json');
  const pages = await res.json();
  const page = pages.find(p => p.type === 'page' && p.url.includes('4173'));
  
  if (!page) {
    console.error('Page not found in Chrome pages:', pages);
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
  await send('DOM.enable');

  // Evaluate cells info
  const evalResult = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const cells = Array.from(document.querySelectorAll('.day-cell:not(.offset-empty)'));
        return cells.slice(0, 5).map(c => {
          const date = c.querySelector('.cell-date-num')?.textContent;
          const statusBadge = c.querySelector('.cell-status-badge')?.textContent;
          const name = c.querySelector('.cell-saint-name')?.textContent;
          const manner = c.querySelector('.cell-manner-tag')?.textContent;
          const mannerTag = c.querySelector('.cell-manner-tag');
          const rect = mannerTag ? mannerTag.getBoundingClientRect() : null;
          const cellRect = c.getBoundingClientRect();
          const compStyle = mannerTag ? window.getComputedStyle(mannerTag) : null;
          return {
            date,
            statusBadge,
            name,
            manner,
            mannerVisible: rect ? (rect.width > 0 && rect.height > 0) : false,
            mannerRect: rect ? { width: rect.width, height: rect.height, top: rect.top, bottom: rect.bottom } : null,
            cellHeight: cellRect.height,
            cellWidth: cellRect.width,
            mannerColor: compStyle?.color,
            mannerBg: compStyle?.backgroundColor,
            mannerBorder: compStyle?.border
          };
        });
      })()
    `,
    returnByValue: true
  });

  console.log('Cell inspection results:');
  console.log(JSON.stringify(evalResult.result.value, null, 2));

  // Take screenshot
  const screenshot = await send('Page.captureScreenshot', { format: 'png' });
  await writeFile('/Users/adlcruz/.gemini/antigravity/brain/a489c5a7-0672-4023-9c58-ec9ac2acde2a/scratch/current_view.png', Buffer.from(screenshot.data, 'base64'));
  console.log('Screenshot saved to scratch/current_view.png');

  ws.close();
  chrome.kill();
  server.kill();
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
