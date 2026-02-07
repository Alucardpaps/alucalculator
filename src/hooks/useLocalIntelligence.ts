import { useState, useCallback } from 'react';
import { useOSStore } from '@/store/osStore';
import { ModuleType } from '@/config/modules';

export type IntentType = 'NAVIGATION' | 'CALCULATION' | 'CHAT' | 'HARDWARE' | 'IDENTITY' | 'UNKNOWN';

interface IntelligenceResponse {
    type: IntentType;
    content: string;
    action?: () => void;
}

const KNOWLEDGE_BASE = {
    TR: {
        identity: "Ben AluCalc OS Yerel Zeka Çekirdeğiyim. Şu an çevrimdışı modda çalışıyorum. Sistem navigasyonu, basit hesaplamalar ve birim dönüşümleri yapabilirim.",
        hardware: "Sistem: AluCalc OS v2.0 | Çekirdek: Local Regex Parser | Durum: Çevrimdışı/Hızlı | Bellek: Optimize Edildi.",
        unknown: "Bulut bağlantım şu an pasif. Şu an sadece Sistem Navigasyonu (örn: 'CAD aç'), Modül Aktivasyonu ve temel mühendislik sorularına yanıt verebilirim.",
        density_alu: "Alüminyum (6061) yoğunluğu yaklaşık 2.70 g/cm³'tür.",
        density_steel: "Çelik (304) yoğunluğu yaklaşık 7.85 - 8.00 g/cm³'tür.",
        modulus_steel: "Çeliğin Elastisite Modülü (Young Modülü) yaklaşık 200-210 GPa'dır.",
        modulus_alu: "Alüminyumun Elastisite Modülü yaklaşık 69-70 GPa'dır."
    },
    EN: {
        identity: "I am the AluCalc OS Local Intelligence Core. Running in offline mode. I can assist with system navigation, basic calculations, and unit conversions.",
        hardware: "System: AluCalc OS v2.0 | Core: Local Regex Parser | Status: Offline/Fast | Memory: Optimized.",
        unknown: "My cloud neural link is offline. I can currently assist with: System Navigation (e.g., 'Open CAD'), Module Activation, and basic engineering questions.",
        density_alu: "The density of Aluminum (6061) is approximately 2.70 g/cm³.",
        density_steel: "The density of Steel (304) is approximately 7.85 - 8.00 g/cm³.",
        modulus_steel: "The Modulus of Elasticity (Young's Modulus) for Steel is approx. 200-210 GPa.",
        modulus_alu: "The Modulus of Elasticity for Aluminum is approx. 69-70 GPa."
    }
};

export function useLocalIntelligence() {
    const { openWindow, currentLanguage } = useOSStore();
    const [isProcessing, setIsProcessing] = useState(false);

    const processQuery = useCallback(async (query: string): Promise<IntelligenceResponse> => {
        setIsProcessing(true);

        // Simulate processing time for "thinking" effect
        await new Promise(resolve => setTimeout(resolve, 600 + Math.random() * 400));

        const normalize = (text: string) => text.toLowerCase().trim();
        const input = normalize(query);

        // Language Detection
        // Check for specific Turkish characters or common Turkish words
        const isTurkish = /[çşğüöı]/.test(input) ||
            input.includes('aç') ||
            input.includes('hesapla') ||
            input.includes('nedir') ||
            input.includes('merhaba') ||
            currentLanguage === 'tr';

        const langInfo = isTurkish ? KNOWLEDGE_BASE.TR : KNOWLEDGE_BASE.EN;

        let response: IntelligenceResponse = {
            type: 'UNKNOWN',
            content: langInfo.unknown
        };

        // --- INTENT PARSING LOGIC ---

        // 1. NAVIGATION (System Control)
        if (input.includes('cad') || input.includes('çizim') || input.includes('draw')) {
            response = {
                type: 'NAVIGATION',
                content: isTurkish ? "2D Nesting (CAD) Modülü başlatılıyor..." : "Initializing 2D Nesting (CAD) Module...",
                action: () => openWindow('nesting-2d')
            };
        }
        else if (input.includes('calculator') || input.includes('hesap makinesi')) {
            response = {
                type: 'NAVIGATION',
                content: isTurkish ? "Standart Hesap Makinesi açılıyor..." : "Opening Standard Calculator...",
                action: () => openWindow('calculator')
            };
        }
        else if (input.includes('file') || input.includes('dosya') || input.includes('explorer')) {
            response = {
                type: 'NAVIGATION',
                content: isTurkish ? "Dosya Gezgini açılıyor..." : "Opening File Explorer...",
                action: () => openWindow('file-explorer')
            };
        }
        else if (input.includes('browser') || input.includes('tarayıcı') || input.includes('internet')) {
            response = {
                type: 'NAVIGATION',
                content: isTurkish ? "Web Tarayıcısı başlatılıyor..." : "Launching Web Browser...",
                action: () => openWindow('browser')
            };
        }
        else if (input.includes('paint') || input.includes('çiz') || input.includes('boya')) {
            response = {
                type: 'NAVIGATION',
                content: isTurkish ? "Creative Studio (Paint) açılıyor..." : "Opening Creative Studio (Paint)...",
                action: () => openWindow('paint')
            };
        }
        else if (input.includes('profile') || input.includes('profil') || input.includes('weight') || input.includes('ağırlık')) {
            response = {
                type: 'NAVIGATION',
                content: isTurkish ? "Profil Ağırlık Hesaplayıcı açılıyor..." : "Opening Profile Weight Calculator...",
                action: () => openWindow('profile-weight')
            };
        }
        else if (input.includes('beam') || input.includes('kiriş') || input.includes('deflection') || input.includes('sehim')) {
            response = {
                type: 'NAVIGATION',
                content: isTurkish ? "Kiriş Sehim Analiz Modülü açılıyor..." : "Opening Beam Deflection Analysis Module...",
                action: () => openWindow('beam-deflection')
            };
        }


        // 2. HARDWARE / STATUS
        else if (input.includes('system') || input.includes('sistem') || input.includes('ram') || input.includes('cpu') || input.includes('gpu')) {
            response = {
                type: 'HARDWARE',
                content: langInfo.hardware
            };
        }

        // 3. IDENTITY
        else if (input.includes('who are you') || input.includes('kimsin') || input.includes('ne yapabilirsin') || input.includes('what can you do') || input.includes('help')) {
            response = {
                type: 'IDENTITY',
                content: langInfo.identity
            };
        }

        // 4. KNOWLEDGE BASE (Basic Engineering)
        else if (input.includes('density') || input.includes('yoğunluk')) {
            if (input.includes('alu') || input.includes('alü')) {
                response = { type: 'CALCULATION', content: langInfo.density_alu };
            } else if (input.includes('steel') || input.includes('çelik')) {
                response = { type: 'CALCULATION', content: langInfo.density_steel };
            }
        }
        else if (input.includes('modulus') || input.includes('elastisite') || input.includes('young')) {
            if (input.includes('alu') || input.includes('alü')) {
                response = { type: 'CALCULATION', content: langInfo.modulus_alu };
            } else if (input.includes('steel') || input.includes('çelik')) {
                response = { type: 'CALCULATION', content: langInfo.modulus_steel };
            }
        }

        // Execute action if present
        if (response.action) {
            // Small delay to let the user read the confirmation before window pops up
            setTimeout(response.action, 500);
        }

        setIsProcessing(false);
        return response;
    }, [openWindow, currentLanguage]);

    return {
        processQuery,
        isProcessing
    };
}
