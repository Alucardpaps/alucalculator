const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');

// Load .env.local manually
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const keyMatch = envContent.match(/GEMINI_API_KEY="([^"]+)"/);

if (!keyMatch) {
    console.error("API Key not found in .env.local");
    process.exit(1);
}

const apiKey = keyMatch[1];
console.log("Loaded API Key prefix:", apiKey.substring(0, 8));

async function main() {
    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result = await model.generateContent("Say hello in Turkish.");
        console.log("Response:", result.response.text());
    } catch (e) {
        console.error("Error connecting to Gemini:", e);
    }
}

main();
