const fs = require('fs');
const uniqueStrings = JSON.parse(fs.readFileSync('C:/Users/apo_q/.gemini/antigravity/scratch/alucalculator/scripts/unique_strings.json', 'utf8'));

const translatable = uniqueStrings.filter(s => {
    // If it's mostly numbers, math symbols, or bearing models like "30204 J2/Q", skip it
    if (s.match(/^[\\d\\.\\-\\+\\*/\\sxX=πστφε√]+$/)) return false; // purely math
    if (s.match(/^[A-Z0-9\\s/]+$/) && s.length < 15) return false; // e.g., "SKF", "NJ 220 ECP", "30202 J2/Q", "1/4", "W 5/8"
    if (s.match(/^M\\d+(\\.\\d+)?$/)) return false; // M6, M10.5
    if (s.match(/^Tr \\d+x\\d+$/)) return false; // Tr 10x2
    if (s.match(/^[\\d\\-\\.,]+$/)) return false; // purely numbers and dots/commas
    if (s.match(/^[\\w\\d]+$/i) && s.length < 3) return false; // too short like "v", "F", "d"
    // formulas with mostly english/math characters
    if (s.includes('=')) {
        const letters = s.replace(/[^a-zA-ZçğıöşüÇĞİÖŞÜ]/g, '');
        if (letters.length < 5) return false; // likely just a formula like "σ = F/A"
    }
    return true;
});

fs.writeFileSync('C:/Users/apo_q/.gemini/antigravity/scratch/alucalculator/scripts/translatable_strings.json', JSON.stringify(translatable, null, 2));
console.log("Filtered down to " + translatable.length + " translatable strings.");
