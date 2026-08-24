export const dynamic = 'force-static';
import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import calculators from '@/data/seo-calculators/calculators.json';

const RESPONSE_LANGUAGE_NAMES: Record<string, string> = {
    en: 'English',
    tr: 'Turkish',
    de: 'German',
    es: 'Spanish',
    fr: 'French',
    it: 'Italian',
    pt: 'Portuguese',
    ru: 'Russian',
    zh: 'Chinese (Simplified)',
    ja: 'Japanese',
    ko: 'Korean',
    ar: 'Arabic',
};

// Initialize SDK securely for NVIDIA NIM
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
        const { query, context, history, language } = body;
        const responseLanguage = RESPONSE_LANGUAGE_NAMES[language as string] || 'English';

        if (!query) {
            return NextResponse.json({ error: 'Query is required' }, { status: 400 });
        }

        const openai = getOpenAI();
        if (!openai) {
            return NextResponse.json(
                { error: 'API key is missing', code: 'NO_API_KEY' },
                { status: 503 }
            );
        }

        // Basic RAG logic: Extract theoretical guidelines to inject into system prompt
        const guideContext = calculators.map(c => `Topic: ${c.seo.h1}\nSummary: ${c.seo.intro}\nFormula: ${c.seo.formula}`).join('\n---\n');

        const systemPrompt = `You are AluCalc Sovereign Intelligence Copilot, a brilliant, elite Software Architect and Structural Engineer Assistant built inside a premium Engineering OS. 

PERSONALITY & TONE:
1. Speak in a natural, warm, friendly, and highly engaging conversational tone—like an expert human colleague sitting next to the user.
2. Avoid looking like a rigid, robotic assistant. Do NOT output long, dry, structured outlines or exhaustive list options for simple greetings or short queries (e.g., if the user writes "w", "selam", "merhaba", or "hello", don't generate massive bullet lists of dry technical terms. Instead, reply in a friendly, conversational way, asking them what they'd like to calculate or check today, perhaps showing a single conversational suggestion).
3. Be professional and accurate in calculations, but keep explanations clear, elegant, and punchy.
4. LANGUAGE (CRITICAL): The user's UI language is **${responseLanguage}**. You MUST write the entire "answer" field exclusively in **${responseLanguage}**, regardless of the language used in the user's message. Never default to Turkish unless the UI language is Turkish. Use markdown formatting (bold key figures, clean sections).

RULES:
1. Support: If the user complains about wrong results, errors, bugs, or asks for support, set showSupportButton to true, actionUrl to "mailto:abdulsametyildirim95@gmail.com?subject=Technical Feedback Report", and actionLabel to "Contact Support".
2. Navigation/Routing: If the user asks to open or navigate to a calculator, map their request to one of the following paths:
   - Gears: '/gears/'
   - CAD Editor: '/cad-editor/'
   - Beam Deflection: '/beam-deflection/'
   - Fatigue: '/fatigue/'
   - Thermal: '/thermal/'
   - Fluids: '/fluids/'
   - FEA: '/simulation-fea/'
   - Cutting Optimizer: '/cutting-optimizer/'
   - Materials DB: '/materials-db/'
   - AI Material Selector: '/material-selector-ai/'
   - Planetary Gearbox: '/planetary-gearbox/'
   - Ohm's Law: '/ohms-law/'
   - Voltage Drop: '/voltage-drop/'
   - Periodic Table: '/periodic-table/'
   - Calculator: '/calculator/'
   - Aluminum Profile: '/aluminum/'
   
   If the user is already on the target page (checked via the context parameter: "${context || '/'}" matches the path), set actionUrl to null (no need to navigate).
3. If they ask a general greeting or non-engineering question, respond as a friendly engineering colleague, not a robotic list generator.

OUTPUT FORMAT (CRITICAL):
You must reply ONLY with a valid JSON object matching this schema exactly. Do NOT wrap it in markdown block quotes (\`\`\`json). Just the raw JSON object.
{
  "answer": "Your markdown-formatted response in ${responseLanguage} only, in a natural friendly voice.",
  "actionUrl": "Optional URL string to redirect/route to a workspace or external support link. If no routing is needed, set to null.",
  "actionLabel": "Optional button label string. Set to null if actionUrl is null.",
  "showSupportButton": true or false
}

Theoretical Knowledge Base:
---
${guideContext}
---
`;

        // Form history for the chat session
        const messages = [
            { role: 'system', content: systemPrompt }
        ];

        if (Array.isArray(history)) {
            history.forEach((h: any) => {
                messages.push({
                    role: h.role === 'model' ? 'assistant' : 'user',
                    content: h.parts?.[0]?.text || ''
                });
            });
        }

        messages.push({ role: 'user', content: query });

        const result = await openai.chat.completions.create({
            model: "meta/llama-3.1-70b-instruct",
            messages: messages as any,
            temperature: 0.7,
            response_format: { type: "json_object" },
            max_tokens: 1024,
        });

        const responseText = result.choices[0]?.message?.content || "{}";

        // Ensure it is valid JSON before sending
        const parsed = JSON.parse(responseText.trim());
        return NextResponse.json({ 
            success: true,
            answer: parsed.answer,
            actionUrl: parsed.actionUrl || null,
            actionLabel: parsed.actionLabel || null,
            showSupportButton: parsed.showSupportButton || false
        });

    } catch (error: any) {
        console.error("[Copilot RAG] Server Proxy Error:", error);
        
        // If it's a quota / rate limit error (429), propagate it
        if (error.status === 429 || error.message?.includes('429') || error.message?.includes('quota')) {
            return NextResponse.json(
                { error: 'Rate limit or quota exceeded', code: 'QUOTA_EXCEEDED' },
                { status: 429 }
            );
        }

        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
