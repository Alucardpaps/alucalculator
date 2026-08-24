import { useState, useCallback } from 'react';
import { useOSStore } from '@/store/osStore';
import { useI18nStore } from '@/store/i18nStore';
import { ModuleType } from '@/config/modules';
import { generateStructuredJSON } from '@/lib/gemini';

export type IntentType = 'NAVIGATION' | 'CALCULATION' | 'CHAT' | 'HARDWARE' | 'IDENTITY' | 'ORCHESTRATION' | 'UNKNOWN';

interface AIIntentResponse {
    type: IntentType;
    content: string;
    target_module: string;
}

interface IntelligenceResponse {
    type: IntentType;
    content: string;
    action?: () => void;
}

const KNOWLEDGE_BASE = {
    TR: {
        unknown: "Niyetinizi tam olarak belirleyemedim. Lütfen 'çizim aç', 'sehim hesabı yap' gibi komutlar verin veya sistem navigasyonunda yardım isteyin.",
        routing: (module: string) => `${module} modülü niyetiniz üzerine başlatılıyor...`,
    },
    EN: {
        unknown: "Intent could not be determined. Please use commands like 'open CAD', 'calculate deflection', or ask for system help.",
        routing: (module: string) => `Initializing ${module} module based on your intent...`,
    }
};

export function useLocalIntelligence() {
    const { openWindow, currentLanguage } = useOSStore();
    const [isProcessing, setIsProcessing] = useState(false);

    const processQuery = useCallback(async (query: string): Promise<IntelligenceResponse> => {
        setIsProcessing(true);

        const isTurkish = /[çşğüöı]/.test(query.toLowerCase()) || currentLanguage === 'tr';
        const langInfo = isTurkish ? KNOWLEDGE_BASE.TR : KNOWLEDGE_BASE.EN;

        const prompt = `You are "AluCalc Intelligence Copilot", an expert engineering, manufacturing, and CAD AI assistant.
User Query: "${query}"
Response Language: ${isTurkish ? 'Turkish' : 'English'}

Your task is to analyze the intent and provide a direct, factual response.

RULES:
1. CALCULATION/CHAT: If the user asks an engineering question (e.g., standard part dimensions, material properties, formulas), you MUST provide the ACTUAL numbers, formulas, and exact data directly in the 'content'. DO NOT roleplay that you are "scanning databases" or "checking metadata". DO NOT use generic boilerplate like "Hemen anladım, tarama yapıyorum". Act as a real assistant and give the direct technical answer using your internal knowledge. Use markdown formatting.
2. NAVIGATION: If the user explicitly asks to open, launch, or navigate to a module or app, set 'target_module' to the corresponding string from the list below, and set 'content' to a brief confirmation message.
3. If it's a general greeting, respond professionally as an engineering AI.

Valid module list for 'target_module' (use 'none' if no navigation is requested):
- CAD/Manufacturing: 'manufacturing-sandbox', 'parametric-cad', 'cad-editor', 'nesting-2d', 'sheet-metal', 'cutting-optimizer', 'welding', 'fasteners'
- Civil/Mechanical: 'beam-deflection', 'strength-analysis', 'profile-weight', 'reducer-lubrication', 'gears-bearings', 'bearings', 'fits-tolerances', 'thermal-expansion', 'pumps'
- Science/Electrical: 'ohms-law', 'voltage-drop', 'periodic-table', 'unit-converter', 'calculator'
- Finance/Other: 'cost-estimator', 'vat-calculator', 'materials-db', 'handbook', 'engineering-selection'
- OS Tools: 'file-explorer', 'browser', 'paint', 'terminal', 'json-formatter', 'regex-tester'`;

        const schema = `{ "type": "NAVIGATION" | "CALCULATION" | "CHAT" | "UNKNOWN", "content": "string", "target_module": "string (from valid list) or 'none'" }`;

        let response: IntelligenceResponse = {
            type: 'UNKNOWN',
            content: langInfo.unknown
        };

        const aiResult = await generateStructuredJSON<AIIntentResponse>(prompt, schema);

        if (aiResult) {
            response.type = aiResult.type;
            response.content = aiResult.content;

            if (aiResult.target_module && aiResult.target_module !== 'none') {
                response.action = () => openWindow(aiResult.target_module as ModuleType);
            }
        } else {
            // Fallback to basic regex if AI API fails or is missing key
            const normalize = (text: string) => text.toLowerCase().trim();
            const input = normalize(query);

            if (input.includes('cad') || input.includes('çizim')) {
                response.content = langInfo.routing('cad-editor');
                response.action = () => openWindow('cad-editor');
            } else if (input.includes('kiriş') || input.includes('beam')) {
                response.content = langInfo.routing('beam-deflection');
                response.action = () => openWindow('beam-deflection');
            } else {
                response.content = langInfo.unknown;
            }
        }

        // Execute action if present
        if (response.action) {
            setTimeout(response.action, 800);
        }

        setIsProcessing(false);
        return response;
    }, [openWindow, currentLanguage]);

    return {
        processQuery,
        isProcessing
    };
}
