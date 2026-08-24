export const dynamic = 'force-static';
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize the SDK with the server-side environment variable.
// We use NVIDIA_API_KEY (or fallback to GEMINI_API_KEY if they just reused the variable)
const getOpenAI = () => {
    const apiKey = process.env.NVIDIA_API_KEY || process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) return null;
    return new OpenAI({
        apiKey: apiKey,
        baseURL: 'https://integrate.api.nvidia.com/v1',
    });
};

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { prompt, schemaDescription } = body;

        if (!prompt) {
            return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
        }

        const openai = getOpenAI();
        if (!openai) {
            return NextResponse.json(
                { error: 'API key not configured on server', code: 'NO_API_KEY' },
                { status: 503 }
            );
        }

        const fullPrompt = `${prompt}\n\nMANDATORY SCHEMA: ${schemaDescription || "Return ONLY valid JSON. No markdown formatting."}`;
        
        const result = await openai.chat.completions.create({
            model: "meta/llama-3.1-70b-instruct",
            messages: [{ role: 'user', content: fullPrompt }],
            temperature: 0.2, // Low temperature for factual, deterministic structural extraction
            response_format: { type: "json_object" },
        });

        let responseText = result.choices[0]?.message?.content || "{}";

        // Strip markdown wrapping if model decides to ignore instructions
        responseText = responseText.replace(/^```json\s*/, '').replace(/\s*```$/, '');

        // Validate JSON before sending payload to the client
        let jsonPayload;
        try {
            jsonPayload = JSON.parse(responseText.trim());
        } catch (e) {
            console.error("[Platform Kernel] JSON Parse error from NIM API:", responseText);
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
