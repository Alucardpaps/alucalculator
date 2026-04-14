const fs = require('fs');
const files = [
    'src/modules/mechanical/SheetMetal/manifest.json',
    'src/modules/mechanical/MfgReadiness/manifest.json',
    'src/modules/mechanical/FailurePrediction/manifest.json',
    'src/modules/mechanical/DragAndBuild/manifest.json',
    'src/modules/generative/GenerativeLite/manifest.json',
    'src/modules/finance/RealTimeCost/manifest.json',
    'src/modules/software/AiCoPilot/manifest.json'
];

for (const f of files) {
    if (fs.existsSync(f)) {
        let content = fs.readFileSync(f, 'utf8');
        content = content.replace(/\/\*[\s\S]*?\*\//g, '').trim();
        fs.writeFileSync(f, content, 'utf8');
        console.log('Fixed', f);
    }
}
