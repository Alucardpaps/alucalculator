import React from 'react';

/**
 * NotebookLM Source Data for Dynamics & Vibration:
 * 1. Kinematik: Kuvvetleri dikkate almadan hareket, hız, ivme. Bağıl hareket, Genel düzlemsel hareket (anlık sıfır hız merkezi).
 * 2. Titreşim: Serbest ve zorlanmış titreşim. Doğal frekans (w = sqrt(k/m)). Rezonans (zorlayıcı frekans = doğal frekans). Sönümleme. Titreşim izolasyonu.
 */

export default function DynamicsPage() {
  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="space-y-4 border-b border-neutral-700 pb-6">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500">
            Dynamics & Vibration Analysis
          </h1>
          <p className="text-lg text-neutral-400">Foundations of Kinematics and Mechanical Vibrations</p>
        </header>

        <section className="bg-neutral-800 rounded-xl p-6 shadow-lg border border-neutral-700/50">
          <h2 className="text-2xl font-semibold mb-4 text-emerald-400">Kinematics Foundations</h2>
          <div className="space-y-4 text-neutral-300 leading-relaxed">
            <p>
              Kinematik, harekete neden olan kuvvetleri veya kütleleri dikkate almadan, yalnızca cisimlerin zamana ve geometriye bağlı hareketini inceler. Konum, hız, ivme ve zaman arasındaki ilişkileri kurar.
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Relative Motion (Bağıl Hareket):</strong> Birbirine rijit bağlı olmayan parçacıklar arası ilişkiler.</li>
              <li><strong>General Plane Motion:</strong> Katı cismin aynı anda öteleme ve dönme hareketi. Geometrik çözüm için <em>&quot;anlık sıfır hız merkezi&quot; (instantaneous center of zero velocity)</em> yöntemi kullanılır.</li>
            </ul>
          </div>
        </section>

        <section className="bg-neutral-800 rounded-xl p-6 shadow-lg border border-neutral-700/50">
          <h2 className="text-2xl font-semibold mb-4 text-teal-400">Vibration Fundamentals</h2>
          <div className="space-y-4 text-neutral-300 leading-relaxed">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-neutral-900 p-4 rounded-lg border border-neutral-700">
                <h3 className="text-lg font-medium text-emerald-300 mb-2">Free vs Forced Vibration</h3>
                <p className="text-sm">
                  <strong>Serbest:</strong> Sadece sistemin içindeki elastik geri çağırıcı kuvvet (yay) etkisiyle oluşur ({"$m\\ddot{x} + kx = 0$"}).<br/>
                  <strong>Zorlanmış:</strong> Periyodik bir dış kuvvetin (örn: harmonik) veya temelin hareketinin etki etmesiyle oluşur.
                </p>
              </div>
              
              <div className="bg-neutral-900 p-4 rounded-lg border border-neutral-700">
                <h3 className="text-lg font-medium text-emerald-300 mb-2">Natural Frequency & Resonance</h3>
                <p className="text-sm">
                  Doğal dairesel frekans {"$\\omega = \\sqrt{k/m}$"} formülü ile bulunur. Dışarıdan uygulanan zorlayıcı frekans ({"$\\Omega$"}), doğal frekansa eşit olduğunda <strong>Rezonans</strong> oluşur ve sönümleme yoksa genlik teorik olarak sonsuza ulaşır.
                </p>
              </div>

              <div className="bg-neutral-900 p-4 rounded-lg border border-neutral-700">
                <h3 className="text-lg font-medium text-emerald-300 mb-2">Damping (Sönümleme)</h3>
                <p className="text-sm">
                  Aşırı titreşim genliklerini önlemek için doğal veya tasarımla eklenen titreşim direncidir. Aşırı sönümlü, kritik sönümlü ve eksik sönümlü olarak sınıflandırılır.
                </p>
              </div>

              <div className="bg-neutral-900 p-4 rounded-lg border border-neutral-700">
                <h3 className="text-lg font-medium text-emerald-300 mb-2">Vibration Isolation & Modal Analysis</h3>
                <p className="text-sm">
                  İzolasyon verimliliği, iletilen kuvvetin bozucu kuvvete oranı olan <em>iletilebilirlik (transmissibility)</em> ile ölçülür. Çok serbestlik dereceli sistemler modal analiz ile incelenir.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
