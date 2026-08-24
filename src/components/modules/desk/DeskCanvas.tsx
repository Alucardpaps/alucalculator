'use client';

import React from 'react';
import { AluDrawCanvas } from '@/components/canvas/AluDrawCanvas';
import { DeskErrorBoundary } from './DeskErrorBoundary';
import { UnifiedDock } from './UnifiedDock';

/**
 * 🎨 OS DESK CANVAS (Custom Engine)
 * 
 * Replaces Tldraw with our custom AluDraw engine.
 * No watermarks, no external library lag.
 */
export default function DeskCanvas() {
    return (
        <DeskErrorBoundary>
            <div className="w-full h-full relative desk-wrapper bg-transparent">
                {/* Custom High-Performance Canvas */}
                <AluDrawCanvas />

                <style jsx global>{`
                    .desk-wrapper {
                        background-color: transparent !important;
                    }
                    /* Custom Scrollbars for OS Look */
                    ::-webkit-scrollbar {
                        width: 4px;
                        height: 4px;
                    }
                    ::-webkit-scrollbar-track {
                        background: rgba(0, 0, 0, 0.1);
                    }
                    ::-webkit-scrollbar-thumb {
                        background: rgba(255, 255, 255, 0.1);
                        border-radius: 10px;
                    }
                    ::-webkit-scrollbar-thumb:hover {
                        background: rgba(255, 255, 255, 0.2);
                    }
                `}</style>
            </div>
        </DeskErrorBoundary>
    );
}
