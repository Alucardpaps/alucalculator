const fs = require('fs');
const path = require('path');

const scriptContent = `
import { HANDBOOK_DATA } from '../data/handbookData';
import * as fs from 'fs';

const uniqueStrings = new Set<string>();

const extractStrings = (obj: any) => {
    if (typeof obj === "string") {
        const str = obj.trim();
        if (str && !str.match(/^\\/\\//) && !str.match(/\\.(png|jpg|jpeg|svg)$/i) && !str.match(/^\\d+(\\.\\d+)?$/) && str.length > 1) {
            uniqueStrings.add(str);
        }
    } else if (Array.isArray(obj)) {
        obj.forEach(extractStrings);
    } else if (typeof obj === "object" && obj !== null) {
        for (const key in obj) {
            if (key !== 'id' && key !== 'icon' && key !== 'formula' && key !== 'image') {
                extractStrings(obj[key]);
            }
        }
    }
};

extractStrings(HANDBOOK_DATA);

const stringsArray = Array.from(uniqueStrings);
fs.writeFileSync('C:/Users/apo_q/.gemini/antigravity/scratch/alucalculator/scripts/unique_strings.json', JSON.stringify(stringsArray, null, 2));
console.log("Extracted " + stringsArray.length + " unique strings.");
`;

fs.writeFileSync('C:/Users/apo_q/.gemini/antigravity/scratch/alucalculator/scripts/extract_strings.ts', scriptContent);
