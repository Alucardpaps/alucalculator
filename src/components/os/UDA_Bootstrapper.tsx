'use client';

import { useEffect } from 'react';
import { ModuleRegistry } from '@/engine/module/ModuleRegistry';

// Manifests
import mfgManifest from '@/modules/mechanical/MfgReadiness/manifest.json';
import costManifest from '@/modules/finance/RealTimeCost/manifest.json';
import failManifest from '@/modules/mechanical/FailurePrediction/manifest.json';
import genManifest from '@/modules/generative/GenerativeLite/manifest.json';
import assemblyManifest from '@/modules/mechanical/DragAndBuild/manifest.json';
import aiManifest from '@/modules/software/AiCoPilot/manifest.json';

// Components
import MfgReadinessModule from '@/modules/mechanical/MfgReadiness';
import RealTimeCostModule from '@/modules/finance/RealTimeCost';
import FailurePredictionModule from '@/modules/mechanical/FailurePrediction';
import GenerativeLiteModule from '@/modules/generative/GenerativeLite';
import DragAndBuildModule from '@/modules/mechanical/DragAndBuild';
import AiCoPilotModule from '@/modules/software/AiCoPilot';

export function UDA_Bootstrapper() {
    useEffect(() => {
        // Register all elite UDA phase modules
        ModuleRegistry.register(mfgManifest as any, MfgReadinessModule);
        ModuleRegistry.register(costManifest as any, RealTimeCostModule);
        ModuleRegistry.register(failManifest as any, FailurePredictionModule);
        ModuleRegistry.register(genManifest as any, GenerativeLiteModule);
        ModuleRegistry.register(assemblyManifest as any, DragAndBuildModule);
        ModuleRegistry.register(aiManifest as any, AiCoPilotModule);

        console.log("[UDA_Bootstrapper] Advanced Elite Modules registered successfully.");
    }, []);

    return null;
}
