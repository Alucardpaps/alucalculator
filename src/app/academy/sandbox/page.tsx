'use client';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Box } from '@react-three/drei';
import { useState } from 'react';

/**
 * NotebookLM Source Data for Euler-Bernoulli Beam Theory:
 * 1. Basit kiriş eğilme teorisi, homojen ve elastik bir kirişin dış yükler altında nasıl büküldüğünü tanımlar.
 * 2. 1/rho = M/EI ilişkisi geçerlidir.
 * 3. Temel Varsayımlar: Lineer elastik, homojen, izotropik. Başlangıçta düz. Kesitlerin düzlemselliği korunur (Bernoulli Hipotezi).
 */

const BeamVisualizer = ({ deflection }: { deflection: number }) => {
  return (
    <Canvas camera={{ position: [0, 2, 10], fov: 50 }}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <OrbitControls />
      {/* A simple representation of a beam, curving based on deflection */}
      <group>
        {/* We use a simple cylinder to represent the beam. In a real scenario with high deflection,
            a custom shader or multiple segments would be used to physically bend the mesh. */}
        <mesh position={[0, -deflection, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.2, 0.2, 8, 32]} />
          <meshStandardMaterial color="#4f46e5" wireframe />
        </mesh>
        <Box args={[0.4, 0.4, 0.4]} position={[-4, -0.2, 0]}>
          <meshStandardMaterial color="#9ca3af" />
        </Box>
        <Box args={[0.4, 0.4, 0.4]} position={[4, -0.2, 0]}>
          <meshStandardMaterial color="#9ca3af" />
        </Box>
        {/* Load indicator */}
        <mesh position={[0, 1 - deflection, 0]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.3, 0.6, 16]} />
          <meshStandardMaterial color="#ef4444" />
        </mesh>
      </group>
      <gridHelper args={[20, 20]} position={[0, -2, 0]} />
    </Canvas>
  );
};

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
