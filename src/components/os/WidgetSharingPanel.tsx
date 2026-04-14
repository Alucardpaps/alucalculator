'use client';

import React, { useState } from 'react';

/**
 * WidgetSharingPanel - AluCalc OS v4
 * Generates HTML/IFrame embed codes for 3D analysis screens.
 */
export const WidgetSharingPanel: React.FC<{ calculationId?: string }> = ({ calculationId = 'demo-calc' }) => {
  const [copied, setCopied] = useState(false);
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://alucalc.os';
  
  const embedCode = `<div id="alucalc-widget" style="width: 100%; height: 500px;">
  <script src="${baseUrl}/api/v1/widget.js" async></script>
  <div class="alucalc-embed" data-id="${calculationId}" data-mode="3d-visualizer"></div>
</div>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-xl space-y-4 text-white">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
          Embed sharing
        </h3>
        <span className="px-2 py-1 text-xs font-mono bg-zinc-800 rounded text-zinc-400">Headless API v4</span>
      </div>
      
      <p className="text-sm text-zinc-400">
        Share your 3D engineering analysis on your website. Just copy the code snippet below.
      </p>

      <div className="relative group">
        <pre className="p-4 bg-black rounded-lg text-xs font-mono overflow-x-auto border border-zinc-700 group-hover:border-blue-500/50 transition-colors">
          {embedCode}
        </pre>
        <button
          onClick={handleCopy}
          className="absolute top-2 right-2 p-2 bg-zinc-800 hover:bg-zinc-700 rounded-md transition-all border border-zinc-600"
        >
          {copied ? '✅' : '📋'}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50 text-center">
          <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Preview</div>
          <div className="text-lg font-bold">Interactive</div>
        </div>
        <div className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50 text-center">
          <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Performance</div>
          <div className="text-lg font-bold">O(1) Load</div>
        </div>
      </div>
    </div>
  );
};
