import React from 'react';

/**
 * NotebookLM Source Data for Additive Manufacturing:
 * 1. DFAM Kuralları: Parça yönelimi, destek yapıları, geometrik özgürlük, malzeme verimliliği (%5 fire).
 * 2. Katman Yöneliminin Dayanımla İlişkisi (Anizotropi): X-Y düzleminde yüksek mukavemet, Z ekseninde (katman yapışması) zayıflık.
 * 3. PLA: FDM teknolojisine ait standart termoplastik.
 */

export default function AdditiveManufacturingPage() {
  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="space-y-4 border-b border-neutral-700 pb-6">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">
            Additive Manufacturing (3D Printing)
          </h1>
          <p className="text-lg text-neutral-400">Design for Additive Manufacturing (DFAM) & Material Characteristics</p>
        </header>

        <section className="bg-neutral-800 rounded-xl p-6 shadow-lg border border-neutral-700/50">
          <h2 className="text-2xl font-semibold mb-4 text-orange-400">Design Rules (DFAM)</h2>
          <div className="space-y-4 text-neutral-300 leading-relaxed">
            <p>
              Eklemeli imalatta tasarım süreci, &quot;Eklemeli İmalat için Tasarım&quot; (DFAM) kurallarına tabidir. Geleneksel eksiltici (subtractive) imalattan farklı olarak şu odak noktalarına sahiptir:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Part Orientation & Support Structures:</strong> Parçanın üretim tablasındaki yönelimi, destek yapılarına (support) olan ihtiyacı en aza indirecek şekilde seçilmelidir. Son işlemler (post-processing) maliyeti ve süreyi artırır.</li>
              <li><strong>Geometric Freedom:</strong> Kesici takımın giremeyeceği dar açılar veya karmaşık iç geometriler, soğutma kanalları ve kafes (lattice) yapılar kolaylıkla üretilebilir.</li>
              <li><strong>Material Efficiency:</strong> Geleneksel imalattaki %50-90 fireye kıyasla, katman katman üretim sayesinde fire oranı sadece %5 civarındadır.</li>
            </ul>
          </div>
        </section>

        <section className="bg-neutral-800 rounded-xl p-6 shadow-lg border border-neutral-700/50">
          <h2 className="text-2xl font-semibold mb-4 text-orange-400">Anisotropy & Layer Orientation</h2>
          <div className="space-y-4 text-neutral-300 leading-relaxed">
            <p>
              Geleneksel CNC ile üretilen parçalar her yönde aynı dayanımı (izotropik) gösterirken, 3D baskı parçaları <strong>anizotropik</strong> (yön bağımlı) özellik gösterir.
            </p>
            <div className="bg-neutral-900 p-4 rounded-lg border border-neutral-700 border-l-4 border-l-red-500">
              <p>
                <strong>Z-Axis Weakness:</strong> X ve Y eksenleri boyunca (yatay düzlem) yüksek mukavemet gösterirken, katmanların üst üste bindiği Z ekseninde katmanlar arası yapışma (interlayer adhesion) zayıflığından dolayı kırılganlığa açıktır. Yük taşıyacak kritik gerilmeler Z eksenine denk gelmemelidir.
              </p>
            </div>
          </div>
        </section>

        <section className="bg-neutral-800 rounded-xl p-6 shadow-lg border border-neutral-700/50">
          <h2 className="text-2xl font-semibold mb-4 text-orange-400">PLA Characteristics</h2>
          <div className="space-y-4 text-neutral-300 leading-relaxed">
            <p>
              <strong>Polilaktik Asit (PLA)</strong>, masaüstü ve endüstriyel FDM (Fused Deposition Modeling) teknolojisinde en yaygın kullanılan standart termoplastiktir. Hızlı, işlevsel ve maliyet etkin prototipleme süreçlerinde temel bir malzemedir.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
