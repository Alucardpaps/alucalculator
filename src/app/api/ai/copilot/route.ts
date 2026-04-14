import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import guides from '@/data/seo-calculators/guides.json';

// Initialize SDK securely
const getGenAI = () => {
    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) return null;
    return new GoogleGenerativeAI(apiKey);
};

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { query, context } = body;

        if (!query) {
            return NextResponse.json({ error: 'Query is required' }, { status: 400 });
        }

        const genAI = getGenAI();
        if (!genAI) {
            return NextResponse.json(
                { answer: "SYSTEM ERROR: Neural net disconnected. Provide a valid GEMINI_API_KEY in .env.local to activate the Copilot." },
                { status: 200 } // We return 200 so the UI handles it gracefully as an AI response
            );
        }

        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            generationConfig: {
                temperature: 0.3, 
            }
        });

        // Basic RAG logic: Extract theoretical guidelines to inject into system prompt
        const guideContext = guides.map(g => `Topic: ${g.article.h1}\nSummary: ${g.article.intro}\nFormula: ${g.article.sections.map(s => s.content).join(' ')}`).join('\n---\n');

        const systemPrompt = `You are AluCalc Copilot, a brilliant, elite Software Architect and Structural Engineer Assistant built for the inside of a web-based Engineering OS.
Respond in plain text. Format your logic cleanly. You are calculating numbers or providing engineering theory.
Don't use markdown code blocks unless writing actual code. 
If the user provides a headless calculation context, perform the calculation using that explicit context.
Here is your theoretical Knowledge Base:
---
${guideContext}
---
If the user passes external context: ${context || 'None'}
`;

        const fullPrompt = `${systemPrompt}\n\nUSER QUERY: ${query}`;
        
        const result = await model.generateContent(fullPrompt);
        const responseText = result.response.text();

        return NextResponse.json({ answer: responseText });

    } catch (error: any) {
        console.error("[Copilot RAG] Server Proxy Error:", error);
        return NextResponse.json(
            { answer: `I experienced a cognitive anomaly while processing your request: ${error.message}` },
            { status: 200 }
        );
    }
}
