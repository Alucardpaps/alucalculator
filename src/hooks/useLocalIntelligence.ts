import { useState, useCallback } from 'react';
import { useOSStore } from '@/store/osStore';
import { useI18nStore } from '@/store/i18nStore';
import { ModuleType } from '@/config/modules';

export type IntentType = 'NAVIGATION' | 'CALCULATION' | 'CHAT' | 'HARDWARE' | 'IDENTITY' | 'ORCHESTRATION' | 'UNKNOWN';

export interface BModelResponse {
    status: 'success' | 'error';
    intent: string;
    target_module: string;
    validated: boolean;
    normalized_inputs: Record<string, any>;
    validation_flags: string[];
    execution_graph?: {
        nodes: any[];
        edges: any[];
    };
    visualization?: {
        type: 'none' | '2D' | '3D';
        engine: string;
        params: any;
    };
    ui_message: string;
}

interface IntelligenceResponse {
    type: IntentType;
    content: string;
    action?: () => void;
    payload?: BModelResponse;
}

const KNOWLEDGE_BASE = {
    TR: {
        identity: "Ben AluCalc OS Yerel Zeka Çekirdeğiyim. B-Model (Orkestrasyon) prensibiyle çalışıyorum. Niyetinizi anlayıp ilgili mühendislik modülüne yönlendirebilirim.",
        hardware: "Sistem: AluCalc OS v3.0 | Çekirdek: B-Model Orchestrator | Durum: Hibrit (Yerel/Bulut) | Bellek: Optimize Edildi.",
        unknown: "Niyetinizi tam olarak belirleyemedim. Lütfen 'çizim aç', 'sehim hesabı yap' gibi komutlar verin veya sistem navigasyonunda yardım isteyin.",
        routing: (module: string) => `${module} modülü niyetiniz üzerine başlatılıyor...`,
    },
    EN: {
        identity: "I am the AluCalc OS Local Intelligence Core. Running on B-Model Orchestration principles. I interpret engineering intent and route to deterministic modules.",
        hardware: "System: AluCalc OS v3.0 | Core: B-Model Orchestrator | Status: Hybrid (Local/Cloud) | Memory: Optimized.",
        unknown: "Intent could not be determined. Please use commands like 'open CAD', 'calculate deflection', or ask for system help.",
        routing: (module: string) => `Initializing ${module} module based on your intent...`,
    }
};

export function useLocalIntelligence() {
    const { openWindow, currentLanguage } = useOSStore();
    const [isProcessing, setIsProcessing] = useState(false);

    const processQuery = useCallback(async (query: string): Promise<IntelligenceResponse> => {
        setIsProcessing(true);

        const normalize = (text: string) => text.toLowerCase().trim();
        const input = normalize(query);
        const isTurkish = /[çşğüöı]/.test(input) || currentLanguage === 'tr';
        const langInfo = isTurkish ? KNOWLEDGE_BASE.TR : KNOWLEDGE_BASE.EN;

        // In a real implementation with AI SDK, we would call:
        // const { object } = await generateObject({ model, system: CORE_SYSTEM_PROMPT, prompt: input, schema: BModelSchema });
        // For now, we simulate the B-Model Orchestrator logic locally

        let response: IntelligenceResponse = {
            type: 'UNKNOWN',
            content: langInfo.unknown
        };

        // --- B-MODEL ORCHESTRATION LOGIC (Deterministic Routing) ---

        // 1. NAVIGATION MAPPINGS
        const navMap: Record<string, { module: ModuleType; titles: string[] }> = {
            'cad': { module: 'nesting-2d', titles: ['cad', 'çizim', 'draw', 'nesting'] },
            'calc': { module: 'calculator', titles: ['calculator', 'hesap makinesi', 'standart'] },
            'files': { module: 'file-explorer', titles: ['file', 'dosya', 'explorer'] },
            'browser': { module: 'browser', titles: ['browser', 'tarayıcı', 'internet'] },
            'paint': { module: 'paint', titles: ['paint', 'çiz', 'boya', 'creative'] },
            'weight': { module: 'profile-weight', titles: ['profile', 'profil', 'weight', 'ağırlık'] },
            'beam': { module: 'beam-deflection', titles: ['beam', 'kiriş', 'deflection', 'sehim'] },
            'units': { module: 'unit-converter', titles: ['unit', 'birim', 'çevir', 'convert'] },
        };

        for (const [key, data] of Object.entries(navMap)) {
            if (data.titles.some(t => input.includes(t))) {
                response = {
                    type: 'NAVIGATION',
                    content: langInfo.routing(data.module),
                    action: () => openWindow(data.module)
                };
                break;
            }
        }

        // 2. STATUS / IDENTITY
        if (response.type === 'UNKNOWN') {
            if (input.includes('system') || input.includes('sistem') || input.includes('version')) {
                response = { type: 'HARDWARE', content: langInfo.hardware };
            } else if (input.includes('who are you') || input.includes('help') || input.includes('kimsin') || input.includes('yardım')) {
                response = { type: 'IDENTITY', content: langInfo.identity };
            }
        }

        // 3. COMPLEX INTENT SIMULATION (B-Model Payload)
        // If query looks like an engineering intent (has numbers and units)
        if (/\d+/.test(input) && (input.includes('mm') || input.includes('cm') || input.includes('kg') || input.includes('m'))) {
            // Mocking a successful B-Model orchestration payload
            response = {
                type: 'ORCHESTRATION',
                content: isTurkish ? "Mühendislik niyeti saptandı. Parametreler normalize ediliyor..." : "Engineering intent detected. Normalizing parameters...",
                payload: {
                    status: 'success',
                    intent: 'calculation',
                    target_module: input.includes('bend') || input.includes('büküm') ? 'src/calculators/sheet_metal' : 'src/calculators/general',
                    validated: true,
                    normalized_inputs: {
                        raw_query: query,
                        detected_units: 'SI'
                    },
                    validation_flags: [],
                    ui_message: isTurkish ? "Hesaplama modülü hazır." : "Calculation module ready."
                }
            };

            // Auto-route based on mock orchestration
            if (input.includes('bend') || input.includes('büküm')) {
                response.action = () => openWindow('profile-weight'); // Correct module would go here
            }
        }

        // Execute action if present
        if (response.action) {
            setTimeout(response.action, 500);
        }

        await new Promise(resolve => setTimeout(resolve, 400)); // Simulating AI thinking delay
        setIsProcessing(false);
        return response;
    }, [openWindow, currentLanguage]);

    return {
        processQuery,
        isProcessing
    };
}
