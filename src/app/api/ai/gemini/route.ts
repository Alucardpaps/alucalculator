import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the SDK with the server-side environment variable.
// We use GEMINI_API_KEY (server-side only) to keep it secure from public visitors.
const getGenAI = () => {
    // Check both secure server key and legacy client key for fallback
    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) return null;
    return new GoogleGenerativeAI(apiKey);
};

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { prompt, schemaDescription } = body;

        if (!prompt) {
            return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
        }

        const genAI = getGenAI();
        if (!genAI) {
            return NextResponse.json(
                { error: 'API key not configured on server', code: 'NO_API_KEY' },
                { status: 503 }
            );
        }

        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            generationConfig: {
                temperature: 0.2, // Low temperature for factual, deterministic structural extraction
            }
        });

        const fullPrompt = `${prompt}\n\nMANDATORY SCHEMA: ${schemaDescription || "Return ONLY valid JSON. No markdown formatting."}`;
        const result = await model.generateContent(fullPrompt);
        let responseText = result.response.text();

        // Strip markdown wrapping if Gemini decides to ignore instructions
        responseText = responseText.replace(/^```json\s*/, '').replace(/\s*```$/, '');

        // Validate JSON before sending payload to the client
        let jsonPayload;
        try {
            jsonPayload = JSON.parse(responseText.trim());
        } catch (e) {
            console.error("[Platform Kernel] JSON Parse error from Gemini API:", responseText);
            return NextResponse.json({ error: 'Invalid JSON returned from AI infrastructure' }, { status: 500 });
        }

        return NextResponse.json(jsonPayload);
    } catch (error: any) {
        console.error("[Platform Kernel] Server Proxy Cognitive Services Error:", error);
        return NextResponse.json(
            { error: 'Internal Server Proxy Error', message: error.message },
            { status: 500 }
        );
    }
}
