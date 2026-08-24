'use client';
import dynamic from 'next/dynamic';
import { useState } from 'react';
const BeamVisualizer = dynamic(() => import('./BeamVisualizer'), { ssr: false });

export default function SandboxPage() {
  const [load, setLoad] = useState(1);

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="space-y-4">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">
            Euler-Bernoulli Beam Theory Sandbox
          </h1>
          <p className="text-lg text-neutral-400">Interactive 3D visualization and theoretical foundations.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <section className="bg-neutral-800 rounded-xl p-6 shadow-xl border border-neutral-700/50">
            <h2 className="text-2xl font-semibold mb-4 text-blue-400">Theoretical Summary</h2>
            <div className="space-y-4 text-neutral-300">
              <p>
                Basit kiriş eğilme teorisi, homojen ve elastik bir kirişin dış yükler altında nasıl büküldüğünü ve şekil değiştirdiğini tanımlar. 
                Dışbükey taraftaki lifler uzayarak çekme, içbükey taraftaki lifler kısalarak basma gerilmesine maruz kalır.
              </p>
              <p>
                <strong>Temel Bağıntı:</strong> Eğrilik ($1/\rho$), eğilme momenti ($M$) ile doğru, esneklik modülü ($E$) ve atalet momenti ($I$) çarpımından oluşan eğilme rijitliği ($EI$) ile ters orantılıdır ($1/\rho = M/EI$).
              </p>
              
              <h3 className="text-xl font-semibold text-indigo-400 mt-6">Fundamental Assumptions</h3>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Material Properties:</strong> Lineer elastik, homojen ve izotropiktir.</li>
                <li><strong>Geometry:</strong> Başlangıçta gerilmesiz, simetrik ve tamamen düzdür.</li>
                <li><strong>Bernoulli Hypothesis:</strong> Bükülmeden önce düzlem olan kesitler, büküldükten sonra da düzlemliğini korur.</li>
                <li><strong>Dimensions:</strong> Uzunluk, derinliğe göre oldukça büyüktür (açıklık/derinlik oranı &gt; 8).</li>
              </ul>
            </div>
          </section>

          <section className="bg-neutral-800 rounded-xl p-6 shadow-xl border border-neutral-700/50 flex flex-col">
            <h2 className="text-2xl font-semibold mb-4 text-blue-400">Interactive Deflection</h2>
            <div className="flex-1 min-h-[300px] rounded-lg overflow-hidden bg-neutral-950 relative border border-neutral-700/50">
              <BeamVisualizer deflection={load * 0.1} />
            </div>
            <div className="mt-6">
              <label className="block text-sm font-medium text-neutral-400 mb-2">Simulated Load Intensity</label>
              <input 
                type="range" 
                min="0" max="10" step="0.1" 
                value={load} 
                onChange={(e) => setLoad(parseFloat(e.target.value))}
                className="w-full accent-blue-500"
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
