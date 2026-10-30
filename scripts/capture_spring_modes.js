const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const brainDir = 'C:\\Users\\apo_q\\.gemini\\antigravity\\brain\\f5f205c7-b713-4aef-a57c-825c5d10cba1';
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const captures = [
  {
    name: 'spring_compression_mode.png',
    url: 'http://localhost:3000/advanced-spring/?kind=compression',
    size: '1600,1050'
  },
  {
    name: 'spring_extension_mode.png',
    url: 'http://localhost:3000/advanced-spring/?kind=extension',
    size: '1600,1050'
  },
  {
    name: 'spring_extension_turkish.png',
    url: 'http://localhost:3000/advanced-spring/?kind=extension&lang=tr',
    size: '1600,1050'
  },
  {
    name: 'spring_compression_german.png',
    url: 'http://localhost:3000/advanced-spring/?kind=compression&lang=de',
    size: '1600,1050'
  }
];

for (const c of captures) {
  const outFile = path.join(brainDir, c.name);
  console.log(`Capturing ${c.name} from ${c.url}...`);
  try {
    const cmd = `powershell -Command "Start-Process '${chromePath}' -ArgumentList '--headless=new', '--screenshot=\\\"${outFile}\\\"', '--window-size=${c.size}', '--virtual-time-budget=2500', '${c.url}' -Wait"`;
    execSync(cmd, { stdio: 'inherit' });
    if (fs.existsSync(outFile)) {
      console.log(`  Done: ${outFile} (${fs.statSync(outFile).size} bytes)`);
    } else {
      console.error(`  Failed to generate ${outFile}`);
    }
  } catch (e) {
    console.error(`  Error: ${e.message}`);
  }
}
console.log('Capture completed.');
