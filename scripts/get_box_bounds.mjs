import { spawn } from 'child_process';

const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--remote-debugging-port=9227',
  '--headless=new',
  '--disable-gpu',
  '--user-data-dir=C:\\Users\\apo_q\\AppData\\Local\\Temp\\chrome_cdp_eval2',
  'http://localhost:3000/design-studio/'
]);

setTimeout(async () => {
  try {
    const res = await fetch('http://127.0.0.1:9227/json');
    const tabs = await res.json();
    const tab = tabs.find(t => t.url.includes('design-studio'));
    const ws = new WebSocket(tab.webSocketDebuggerUrl);
    ws.onopen = () => {
      let id = 1;
      ws.onmessage = (e) => {
        const msg = JSON.parse(e.data);
        if (msg.id === 1) {
          ws.send(JSON.stringify({
            id: 2,
            method: 'Runtime.evaluate',
            params: {
              expression: `
                const btns = Array.from(document.querySelectorAll('button'));
                const btn = btns.find(b => b.textContent && b.textContent.includes('ASSEMBLY'));
                if (btn) btn.click();
              `
            }
          }));
        } else if (msg.id === 2) {
          setTimeout(() => {
            ws.send(JSON.stringify({
              id: 3,
              method: 'Runtime.evaluate',
              params: {
                expression: `
                  (() => {
                    const el = document.querySelector('.cursor-grab');
                    if (!el) return JSON.stringify(null);
                    const r = el.getBoundingClientRect();
                    return JSON.stringify({ x: r.x, y: r.y, width: r.width, height: r.height, top: r.top, left: r.left });
                  })()
                `
              }
            }));
          }, 800);
        } else if (msg.id === 3) {
          console.log('BOX HEADER BOUNDS:', msg.result.result.value);
          ws.close();
          chrome.kill();
          process.exit(0);
        }
      };
      ws.send(JSON.stringify({ id: 1, method: 'Page.enable' }));
    };
  } catch (err) {
    console.error(err);
    chrome.kill();
    process.exit(1);
  }
}, 3000);
