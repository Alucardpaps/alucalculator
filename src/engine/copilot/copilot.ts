import aluminumDB from '../knowledge-base/aluminum.json';
import steelDB from '../knowledge-base/steel.json';
import woodDB from '../knowledge-base/wood.json';
import concreteDB from '../knowledge-base/concrete.json';
import glassDB from '../knowledge-base/glass.json';
import compositeDB from '../knowledge-base/composite.json';
import { GLOBAL_MODULES } from './module-routes';
import { getCopilotEngineStrings, copilotFmt, getModuleLocaleCopy } from '@/locales/copilotEngineTranslations';
import { MATERIALS_DB } from '@/data/materialsData';

// Types for parsed intent
export interface CopilotIntent {
  materialType?: 'aluminum' | 'steel' | 'wood' | 'concrete' | 'glass' | 'composite' | 'unknown';
  alloyOrGrade?: string;
  forceApplied?: number; // in Newtons
  length?: number; // in mm
  profileType?: 'rectangular' | 'circular' | 'i-beam' | 'unknown';
  dimensions?: Record<string, number>;
  assumptionsMade: string[];
  replyOverride?: string;
  actionUrl?: string;
  actionLabel?: string;
  showSupportButton?: boolean;
}

export interface MaterialProperties {
  name: string;
  density: number;
  youngsModulus: number;
  yieldStrength: number;
  ultimateTensileStrength: number;
  poissonRatio: number;
  default?: boolean;
}

// Standard VDI 2230 Metric Bolt Database
const VDI_2230_BOLTS: Record<string, { As: number; F02: number; pitch: number }> = {
  M4: { As: 8.78, F02: 5600, pitch: 0.7 },
  M5: { As: 14.2, F02: 9000, pitch: 0.8 },
  M6: { As: 20.1, F02: 12800, pitch: 1.0 },
  M8: { As: 36.6, F02: 23400, pitch: 1.25 },
  M10: { As: 58.0, F02: 37100, pitch: 1.5 },
  M12: { As: 84.3, F02: 54000, pitch: 1.75 },
  M14: { As: 115, F02: 73600, pitch: 2.0 },
  M16: { As: 157, F02: 100000, pitch: 2.0 },
  M20: { As: 245, F02: 157000, pitch: 2.5 },
  M24: { As: 353, F02: 226000, pitch: 3.0 },
};

/**
 * AI Copilot for parsing user natural language queries and 
 * making smart engineering assumptions using the Knowledge Graph.
 */
export class EngineeringCopilot {
  private _state: {
    materialType: 'aluminum' | 'steel' | 'wood' | 'concrete' | 'glass' | 'composite' | 'unknown';
    alloyOrGrade: string;
    forceApplied?: number; // in N
    length?: number; // in mm
    profileType: 'rectangular' | 'circular' | 'i-beam' | 'unknown';
    width: number; // in mm
    height: number; // in mm
    beamType: 'simply_supported' | 'cantilever';
  } = {
    materialType: 'unknown',
    alloyOrGrade: '',
    forceApplied: undefined,
    length: undefined,
    profileType: 'unknown',
    width: 50,
    height: 100,
    beamType: 'simply_supported',
  };

  /**
   * Resets the active session state parameters.
   */
  public resetState(): void {
    this._state = {
      materialType: 'unknown',
      alloyOrGrade: '',
      forceApplied: undefined,
      length: undefined,
      profileType: 'unknown',
      width: 50,
      height: 100,
      beamType: 'simply_supported',
    };
  }

  /**
   * Parses natural language to extract key engineering parameters.
   * Fills in missing parameters with "Smart Assumptions" from the Knowledge Base.
   */
  public parseAndAssume(query: string, currentPath: string = '/', uiLanguage: string = 'en'): CopilotIntent {
    const q = query.toLowerCase().trim();
    const isTr = uiLanguage === 'tr';
    const intent: CopilotIntent = {
      assumptionsMade: [],
    };

    const s = getCopilotEngineStrings(uiLanguage);

    // 1. PRIORITY 1: Feedback / Support Interceptor
    const isNegativeFeedback = /(yanlış|hata|bozuk|kusur|olmadı|saçma|wrong|error|broken|incorrect|invalid|fail|stupid|bad|sucks|trash)/.test(q);
    if (isNegativeFeedback) {
      intent.showSupportButton = true;
      intent.replyOverride = 'Teknik bir hata veya tutarsızlık tespit ettiyseniz lütfen mühendislik ekibimizle iletişime geçin.';
      intent.actionUrl = 'mailto:contact@alucalculator.com?subject=Technical Feedback Report';
      intent.actionLabel = 'Destek ile İletişime Geç';
      return intent;
    }

    // Reset instruction
    if (q.includes('reset') || q.includes('sıfırla') || q.includes('temizle')) {
      this.resetState();
      intent.replyOverride = s.resetReply;
      return intent;
    }

    // 2. BOLT TORQUE & VDI 2230 SOLVER (High Precision AI Solver)
    const isBoltTorqueQuery = /(cıvata|civata|tork|torku|bolt|torque|vdi\s*2230|tighten|sikma|sıkma|preload|ön yük)/i.test(q);
    const boltMatch = q.match(/\bm(\d+)\b/i);
    if (isBoltTorqueQuery && boltMatch) {
      const sizeNum = parseInt(boltMatch[1], 10);
      const boltKey = `M${sizeNum}`;
      const boltData = VDI_2230_BOLTS[boltKey] || { As: Math.PI * (sizeNum * 0.45) ** 2, F02: sizeNum * 4000, pitch: sizeNum * 0.15 };
      
      // Determine grade (default 8.8)
      let grade = '8.8';
      let gradeFactor = 1.0;
      let yieldStress = 640; // MPa for 8.8 (0.8 * 800)
      if (q.includes('10.9')) { grade = '10.9'; gradeFactor = 1.40; yieldStress = 900; }
      else if (q.includes('12.9')) { grade = '12.9'; gradeFactor = 1.68; yieldStress = 1080; }
      else if (q.includes('a2') || q.includes('inox') || q.includes('paslanmaz')) { grade = 'A2-70'; gradeFactor = 0.70; yieldStress = 450; }

      // Friction coefficient (default mu = 0.14 for lightly oiled standard steel)
      const mu = 0.14;
      const d = sizeNum; // nominal diameter in mm
      const As = boltData.As; // stress area in mm2
      const F_preload = 0.9 * yieldStress * As; // 90% yield utilization (N)
      // VDI 2230 formula approximation: T = F_preload * (0.16 * pitch + 0.58 * d2 * mu + r_head * mu)
      const K = 0.20; // Torque coefficient
      const torqueNm = (K * (F_preload / 1000) * d) * gradeFactor;

      if (isTr) {
        intent.replyOverride = `### 🔩 VDI 2230 Cıvata Sıkma Torku Analizi\n\n` +
          `• **Cıvata Standardı:** ISO 4014 / DIN 931 **${boltKey} (Kalite: ${grade})**\n` +
          `• **Gerilme Alanı ($A_s$):** ${As.toFixed(1)} mm²\n` +
          `• **Anma Adımı ($P$):** ${boltData.pitch} mm\n` +
          `• **Sürtünme Katsayısı ($\mu$):** ${mu} (hafif yağlanmış)\n\n` +
          `#### ⚡ Hesaplanan Değerler:\n` +
          `• **Maksimum Montaj Ön Yükü ($F_M$):** ${(F_preload / 1000).toFixed(1)} kN\n` +
          `• **Önerilen Sıkma Torku ($M_A$):** **${torqueNm.toFixed(1)} N·m** (${(torqueNm * 0.73756).toFixed(1)} lbf·ft)\n` +
          `• **Akma Emniyet Marjı:** %90 VDI 2230 Standardı\n\n` +
          `Detaylı sürtünme katsayısı tabloları ve tork aralıkları için Cıvata Tork Çözücüyü açabilirsiniz.`;
      } else {
        intent.replyOverride = `### 🔩 VDI 2230 Bolt Tightening Torque Analysis\n\n` +
          `• **Fastener Spec:** ISO 4014 / DIN 931 **${boltKey} (Class ${grade})**\n` +
          `• **Tensile Stress Area ($A_s$):** ${As.toFixed(1)} mm²\n` +
          `• **Thread Pitch ($P$):** ${boltData.pitch} mm\n` +
          `• **Friction Coefficient ($\mu$):** ${mu} (standard lubricated)\n\n` +
          `#### ⚡ Solver Results:\n` +
          `• **Max Assembly Preload ($F_M$):** ${(F_preload / 1000).toFixed(1)} kN\n` +
          `• **Recommended Tightening Torque ($M_A$):** **${torqueNm.toFixed(1)} N·m** (${(torqueNm * 0.73756).toFixed(1)} lbf·ft)\n` +
          `• **Yield Utilization:** 90% per VDI 2230\n\n` +
          `You can navigate to the full Bolt Torque Calculator for clamping diagrams and friction tables.`;
      }

      intent.actionUrl = '/bolt-torque/';
      intent.actionLabel = isTr ? 'Cıvata Torku Modülü' : 'Open Bolt Torque Solver';
      return intent;
    }

    // 3. BEARING LIFE (ISO 281) SOLVER
    const isBearingQuery = /(rulman|bearing|iso\s*281|l10|l10h|skf|fag|bilye|makara)/i.test(q);
    if (isBearingQuery) {
      // Dynamic load rating C (kN) and equivalent load P (kN)
      const loadMatch = q.match(/(\d+(\.\d+)?)\s*(kn|n)/i);
      const rpmMatch = q.match(/(\d+)\s*rpm/i);
      
      const P_kN = loadMatch ? (loadMatch[3].toLowerCase() === 'kn' ? parseFloat(loadMatch[1]) : parseFloat(loadMatch[1]) / 1000) : 4.5;
      const rpm = rpmMatch ? parseInt(rpmMatch[1], 10) : 1500;
      const C_kN = P_kN * 3.5; // Typical 3.5x dynamic capacity
      const p_exp = q.includes('makara') || q.includes('roller') ? 10 / 3 : 3;

      const L10_revs = Math.pow(C_kN / P_kN, p_exp); // Millions of revs
      const L10h_hours = (1000000 / (60 * rpm)) * L10_revs;

      if (isTr) {
        intent.replyOverride = `### ⚙️ ISO 281 Rulman Ömrü Analizi\n\n` +
          `• **Eşdeğer Dinamik Yük (P):** ${P_kN.toFixed(2)} kN\n` +
          `• **Dinamik Yük Kapasitesi (C):** ${C_kN.toFixed(2)} kN (Tipik SKF Bilyalı)\n` +
          `• **Dönme Hızı (n):** ${rpm} RPM\n\n` +
          `#### 🕒 Hesaplanan Ömür Değerleri:\n` +
          `• **$L_{10}$ Ömrü (Milyon Devir):** **${L10_revs.toFixed(2)} Mrev**\n` +
          `• **$L_{10h}$ Nominal Çalışma Ömrü:** **${Math.round(L10h_hours).toLocaleString()} saat** (${(L10h_hours / (24 * 365)).toFixed(1)} yıl kesintisiz)\n` +
          `• **Güvenilirlik Oranı:** %90 (ISO 281)\n\n` +
          `Farklı rulman serileri (6000, 6200, 6300, konik makaralı) ve yağlama vizkozitesi faktörü için Rulman modülünü açabilirsiniz.`;
      } else {
        intent.replyOverride = `### ⚙️ ISO 281 Bearing Life Rating Calculation\n\n` +
          `• **Equivalent Dynamic Load (P):** ${P_kN.toFixed(2)} kN\n` +
          `• **Basic Dynamic Load Rating (C):** ${C_kN.toFixed(2)} kN\n` +
          `• **Operating Speed (n):** ${rpm} RPM\n\n` +
          `#### 🕒 Rating Results:\n` +
          `• **$L_{10}$ Life (Million Revs):** **${L10_revs.toFixed(2)} Mrev**\n` +
          `• **$L_{10h}$ Basic Rating Life:** **${Math.round(L10h_hours).toLocaleString()} operating hours** (${(L10h_hours / (24 * 365)).toFixed(1)} continuous years)\n` +
          `• **Reliability:** 90% per ISO 281\n\n` +
          `Navigate to the Bearing Life Solver to search 500+ SKF/FAG bearing designations with lubrication factors.`;
      }

      intent.actionUrl = '/bearings/';
      intent.actionLabel = isTr ? 'Rulman Ömrü Çözücü' : 'Open Bearing Solver';
      return intent;
    }

    // 4. GEAR RATIO & ISO 6336 SOLVER
    const isGearQuery = /(dişli|gear|gears|pinyon|pinion|modül|module|diş sayısı|z1|z2|tork oranı)/i.test(q);
    if (isGearQuery) {
      const zMatch = q.match(/z1\s*=\s*(\d+).*?z2\s*=\s*(\d+)/i) || q.match(/(\d+)\s*(diş|teeth).*?(\d+)\s*(diş|teeth)/i);
      const z1 = zMatch ? parseInt(zMatch[1], 10) : 20;
      const z2 = zMatch ? parseInt(zMatch[2], 10) : 60;
      const modMatch = q.match(/m\s*=\s*(\d+(\.\d+)?)|modül\s*(\d+(\.\d+)?)/i);
      const m = modMatch ? parseFloat(modMatch[1] || modMatch[3]) : 3;

      const d1 = m * z1;
      const d2 = m * z2;
      const a = (d1 + d2) / 2;
      const ratio = (z2 / z1);

      if (isTr) {
        intent.replyOverride = `### ⚙️ Düz Dişli Geometrisi & Aktarma Oranı (DIN 3960 / ISO 6336)\n\n` +
          `• **Modül ($m$):** ${m} mm\n` +
          `• **Pinyon Diş Sayısı ($z_1$):** ${z1}\n` +
          `• **Çark Diş Sayısı ($z_2$):** ${z2}\n\n` +
          `#### 📐 Geometri & Oranlar:\n` +
          `• **Aktarma / Tahvil Oranı ($i$):** **${ratio.toFixed(2)} : 1**\n` +
          `• **Pinyon Taksimat Çapı ($d_1$):** **${d1} mm**\n` +
          `• **Çark Taksimat Çapı ($d_2$):** **${d2} mm**\n` +
          `• **Eksenler Arası Mesafe ($a$):** **${a} mm**\n` +
          `• **Diş Başı Çapı ($d_{a1}$ / $d_{a2}$):** ${d1 + 2 * m} mm / ${d2 + 2 * m} mm\n` +
          `• **Diş Dibi Çapı ($d_{f1}$ / $d_{f2}$):** ${d1 - 2.5 * m} mm / ${d2 - 2.5 * m} mm\n\n` +
          `Temas gerilmesi ($\sigma_H$) ve kök eğilme mukavemeti ($\sigma_F$) analizi için Dişli Çözücüyü açabilirsiniz.`;
      } else {
        intent.replyOverride = `### ⚙️ Spur Gear Mesh Geometry & Ratio (DIN 3960 / ISO 6336)\n\n` +
          `• **Module ($m$):** ${m} mm\n` +
          `• **Pinion Teeth ($z_1$):** ${z1}\n` +
          `• **Gear Teeth ($z_2$):** ${z2}\n\n` +
          `#### 📐 Kinematic & Mesh Geometry:\n` +
          `• **Gear Ratio ($i$):** **${ratio.toFixed(2)} : 1**\n` +
          `• **Pinion Pitch Diameter ($d_1$):** **${d1} mm**\n` +
          `• **Gear Pitch Diameter ($d_2$):** **${d2} mm**\n` +
          `• **Center Distance ($a$):** **${a} mm**\n` +
          `• **Tip Diameter ($d_{a1}$ / $d_{a2}$):** ${d1 + 2 * m} mm / ${d2 + 2 * m} mm\n` +
          `• **Root Diameter ($d_{f1}$ / $d_{f2}$):** ${d1 - 2.5 * m} mm / ${d2 - 2.5 * m} mm\n\n` +
          `Navigate to the Gear Module for full ISO 6336 root fatigue & contact stress verifications.`;
      }

      intent.actionUrl = '/gears/';
      intent.actionLabel = isTr ? 'Dişli Modülünü Aç' : 'Open Gears Solver';
      return intent;
    }

    // 5. LIMITS & FITS (ISO 286) SOLVER
    const isFitQuery = /(tolerans|toleransı|fit|fits|tolerance|h7|g6|h6|p6|k6|iso\s*286|geçme|boşluklu|sıkı)/i.test(q);
    if (isFitQuery) {
      const fitGradeMatch = q.match(/\b([a-zA-Z]\d{1,2})\/([a-zA-Z]\d{1,2})\b/i);
      const grade = fitGradeMatch ? fitGradeMatch[0].toUpperCase() : 'H7/g6';
      
      let fitType = isTr ? 'Boşluklu Geçme (Hassas Kaymalı)' : 'Clearance Fit (Precision Sliding)';
      let clearanceRange = '+9 ile +34 µm';
      if (grade.includes('P6') || grade.includes('R6')) {
        fitType = isTr ? 'Sıkı Geçme (Presli)' : 'Interference Fit (Press Fit)';
        clearanceRange = '-26 ile -45 µm (Sıkılık)';
      } else if (grade.includes('K6') || grade.includes('J6') || grade.includes('M6')) {
        fitType = isTr ? 'Geçişli Geçme (Hafif Çakma)' : 'Transition Fit (Light Tap)';
        clearanceRange = '-15 ile +18 µm';
      }

      if (isTr) {
        intent.replyOverride = `### 📏 ISO 286 Tolerans ve Geçme Analizi\n\n` +
          `• **Seçilen Geçme Sistemi:** **${grade}** (Temel Delik Sistemi)\n` +
          `• **Geçme Karakteristiği:** **${fitType}**\n` +
          `• **Tipik Boşluk/Sıkılık Aralığı:** ${clearanceRange}\n\n` +
          `#### 🛠 Uygulama Alanları:\n` +
          `• Hassas yataklama, mil-kasnak bağlantıları ve kılavuzlanmış lineer millerde standart gereksinimleri karşılar.\n\n` +
          `Nominal çapa göre tam mikron değerleri ve mastar toleransları için Tolerans modülünü açabilirsiniz.`;
      } else {
        intent.replyOverride = `### 📏 ISO 286 Limits and Fits Analysis\n\n` +
          `• **Selected Fit Grade:** **${grade}** (Basic Hole System)\n` +
          `• **Fit Classification:** **${fitType}**\n` +
          `• **Nominal Clearance Range:** ${clearanceRange}\n\n` +
          `#### 🛠 Engineering Applications:\n` +
          `• Ideal for precision machine spindles, sliding sleeves, and standard bearing seats.\n\n` +
          `Open the Limits & Fits solver to compute upper and lower deviations for your exact shaft diameter.`;
      }

      intent.actionUrl = '/fits/';
      intent.actionLabel = isTr ? 'Tolerans Çözücü' : 'Open Limits & Fits';
      return intent;
    }

    // 6. Parameter Parsing & Engineering Calculation (Structural Beam & Stress Analysis)
    // Parse Material Type
    if (q.includes('alüminyum') || q.includes('aluminum') || q.includes('6061') || q.includes('6063') || q.includes('7075')) {
      this._state.materialType = 'aluminum';
      this._state.alloyOrGrade = q.includes('7075') ? '7075-T6' : q.includes('6063') ? '6063-T5' : '6061-T6';
    } else if (q.includes('çelik') || q.includes('steel') || q.includes('s235') || q.includes('s355') || q.includes('4140')) {
      this._state.materialType = 'steel';
      this._state.alloyOrGrade = q.includes('4140') ? '4140 (Cr-Mo)' : q.includes('s355') ? 'S355JR' : 'S235JR';
    } else if (q.includes('ahşap') || q.includes('wood') || q.includes('çam') || q.includes('timber')) {
      this._state.materialType = 'wood';
      this._state.alloyOrGrade = 'Pine';
    } else if (q.includes('beton') || q.includes('concrete') || q.includes('c25') || q.includes('c30')) {
      this._state.materialType = 'concrete';
      this._state.alloyOrGrade = q.includes('c30') ? 'C30/37' : 'C25/30';
    }

    // Parse Beam Type
    if (q.includes('konsol') || q.includes('cantilever')) {
      this._state.beamType = 'cantilever';
    } else if (q.includes('basit') || q.includes('supported') || q.includes('simply')) {
      this._state.beamType = 'simply_supported';
    }

    // Parse Profile
    if (q.includes('i-profil') || q.includes('i-beam') || q.includes('ipe')) {
      this._state.profileType = 'i-beam';
    } else if (q.includes('kutu') || q.includes('dikdörtgen') || q.includes('rectangular') || q.includes('box')) {
      this._state.profileType = 'rectangular';
    } else if (q.includes('dairesel') || q.includes('yuvarlak') || q.includes('circular') || q.includes('round')) {
      this._state.profileType = 'circular';
    }

    // Force extraction
    const forceMatch = q.match(/(\d+(\.\d+)?)\s*(n|newton|kn)/i);
    if (forceMatch) {
      const val = parseFloat(forceMatch[1]);
      this._state.forceApplied = forceMatch[3].toLowerCase() === 'kn' ? val * 1000 : val;
    }

    // Length extraction
    const lengthMatch = q.match(/(\d+(\.\d+)?)\s*(mm|cm|m\b|metre)/i);
    if (lengthMatch) {
      const val = parseFloat(lengthMatch[1]);
      if (lengthMatch[3].toLowerCase() === 'cm') this._state.length = val * 10;
      else if (lengthMatch[3].toLowerCase().startsWith('m')) this._state.length = val * 1000;
      else this._state.length = val;
    }

    // Width/Height extraction (e.g. 50x100 or 50*100)
    const dimMatch = q.match(/(\d+)\s*(x|\*)\s*(\d+)/);
    if (dimMatch) {
      this._state.width = parseFloat(dimMatch[1]);
      this._state.height = parseFloat(dimMatch[3]);
    }

    // Engineering Calculations (If explicitly requested or implied by sehim/deflection/gerilme/stress/kiriş/beam)
    const isCalculationRequested = /(sehim|deflection|gerilme|stress|hesap|calculate|solve|safety|emniyet|kiriş|beam)/.test(q);
    if (isCalculationRequested) {
      // Set defaults for missing values
      if (this._state.materialType === 'unknown') {
        this._state.materialType = 'steel';
        this._state.alloyOrGrade = 'S235JR';
        intent.assumptionsMade.push(s.assumeSteel);
      }
      if (!this._state.length) {
        this._state.length = 2000; // 2 meters
        intent.assumptionsMade.push(s.assumeLength);
      }
      if (!this._state.forceApplied) {
        this._state.forceApplied = 5000; // 5 kN
        intent.assumptionsMade.push(s.assumeForce);
      }
      if (this._state.profileType === 'unknown') {
        this._state.profileType = 'rectangular';
        intent.assumptionsMade.push(s.assumeProfile);
      }

      // Material Constants
      let E = 210000; // MPa (Steel)
      let yieldStrength = 235; // MPa (Steel)
      if (this._state.materialType === 'aluminum') { E = 70000; yieldStrength = 240; }
      else if (this._state.materialType === 'wood') { E = 11000; yieldStrength = 15; }
      else if (this._state.materialType === 'concrete') { E = 30000; yieldStrength = 25; }

      // Inertia (I) and Section Modulus (W)
      let I = 0;
      let W = 0;
      const b = this._state.width;
      const h = this._state.height;

      if (this._state.profileType === 'rectangular') {
        I = (b * Math.pow(h, 3)) / 12;
        W = (b * Math.pow(h, 2)) / 6;
      } else if (this._state.profileType === 'circular') {
        const d = b;
        I = (Math.PI * Math.pow(d, 4)) / 64;
        W = (Math.PI * Math.pow(d, 3)) / 32;
      } else {
        I = 1.71 * 1000000;
        W = 34.2 * 1000;
      }

      const F = this._state.forceApplied;
      const L = this._state.length;

      let deflection = 0;
      let maxMoment = 0;
      if (this._state.beamType === 'simply_supported') {
        deflection = (F * Math.pow(L, 3)) / (48 * E * I);
        maxMoment = (F * L) / 4;
      } else {
        deflection = (F * Math.pow(L, 3)) / (3 * E * I);
        maxMoment = F * L;
      }

      const bendingStress = maxMoment / W;
      const safetyFactor = yieldStrength / bendingStress;

      const beamTypeLabel = this._state.beamType === 'simply_supported' ? s.simplySupported : s.cantilever;
      const safetyLabel = safetyFactor >= 1.5 ? s.safe : s.critical;

      if (uiLanguage === 'tr') {
        intent.replyOverride = `### 📊 Yapısal Kiriş Mukavemet Analizi\n\n` +
          `• **Malzeme:** ${this._state.materialType.toUpperCase()} (${this._state.alloyOrGrade}) ($E$ = ${E / 1000} GPa, $R_e$ = ${yieldStrength} MPa)\n` +
          `• **Açıklık ($L$):** ${L} mm (${(L / 1000).toFixed(2)} m)\n` +
          `• **Uygulanan Yük ($F$):** ${F} N (${(F / 1000).toFixed(2)} kN)\n` +
          `• **Mesnetleme:** ${beamTypeLabel}\n` +
          `• **Kesit Geometrisi:** ${this._state.profileType.toUpperCase()} (${b}×${h} mm)\n\n` +
          `#### 🧮 Analitik Çözüm Sonuçları:\n` +
          `• **Atalet Momenti ($I_x$):** ${I.toExponential(3)} mm⁴\n` +
          `• **Maksimum Eğilme Momenti ($M_{max}$):** ${(maxMoment / 1000000).toFixed(3)} kNm\n` +
          `• **Maksimum Eğilme Gerilmesi ($\sigma_{max}$):** **${bendingStress.toFixed(2)} MPa**\n` +
          `• **Maksimum Sehim ($\delta_{max}$):** **${deflection.toFixed(2)} mm** (${deflection < L / 300 ? '✅ Emniyetli Sehim Limitinde' : '⚠️ İzin Verilen Sehimi Aşıyor'})\n` +
          `• **Güvenlik Katsayısı ($S_F$):** **${safetyFactor > 100 ? '>100' : safetyFactor.toFixed(2)}** (${safetyLabel})\n\n` +
          `Kesme kuvveti ve eğilme momenti diyagramları (SFD / BMD) için Kiriş Sehimi modülünü açabilirsiniz.`;
      } else {
        intent.replyOverride = `### 📊 Structural Beam Deflection & Stress Analysis\n\n` +
          `• **Material:** ${this._state.materialType.toUpperCase()} (${this._state.alloyOrGrade}) ($E$ = ${E / 1000} GPa, $S_y$ = ${yieldStrength} MPa)\n` +
          `• **Span Length ($L$):** ${L} mm (${(L / 1000).toFixed(2)} m)\n` +
          `• **Applied Force ($F$):** ${F} N (${(F / 1000).toFixed(2)} kN)\n` +
          `• **Boundary Condition:** ${beamTypeLabel}\n` +
          `• **Section Profile:** ${this._state.profileType.toUpperCase()} (${b}×${h} mm)\n\n` +
          `#### 🧮 Solver Results:\n` +
          `• **Moment of Inertia ($I_x$):** ${I.toExponential(3)} mm⁴\n` +
          `• **Max Bending Moment ($M_{max}$):** ${(maxMoment / 1000000).toFixed(3)} kNm\n` +
          `• **Max Bending Stress ($\sigma_{max}$):** **${bendingStress.toFixed(2)} MPa**\n` +
          `• **Max Deflection ($\delta_{max}$):** **${deflection.toFixed(2)} mm**\n` +
          `• **Safety Factor ($S_F$):** **${safetyFactor > 100 ? '>100' : safetyFactor.toFixed(2)}** (${safetyLabel})\n\n` +
          `Open the Beam Deflection solver for interactive shear/moment diagrams and continuous load profiles.`;
      }

      intent.actionUrl = '/beam-deflection/';
      intent.actionLabel = isTr ? 'Kiriş Sehimi Çözücü' : 'Open Beam Deflection';
      intent.materialType = this._state.materialType;
      intent.alloyOrGrade = this._state.alloyOrGrade;
      intent.forceApplied = this._state.forceApplied;
      intent.length = this._state.length;
      intent.profileType = this._state.profileType;

      return intent;
    }

    // 7. Direct Module Routing (Fuzzy Match for Non-Calculation queries)
    for (const module of GLOBAL_MODULES) {
      if (module.keywords.some(k => q.includes(k))) {
        const isAlreadyOnPage = currentPath.includes(module.route) || (module.route !== '/' && currentPath === module.route);
        const mod = getModuleLocaleCopy(module, uiLanguage);
        
        intent.actionUrl = isAlreadyOnPage ? undefined : module.route;
        intent.actionLabel = mod.label;
        
        if (isAlreadyOnPage) {
            intent.replyOverride = copilotFmt(s.moduleOnPage, { label: mod.label });
        } else {
            intent.replyOverride = copilotFmt(s.moduleRoute, { label: mod.label, desc: mod.desc });
        }
        return intent;
      }
    }

    // 8. Context Awareness (This page?)
    const isContextQuery = /(bu sayfa|burası|nasıl çalışır|nasıl çalışıyor|nedir|what is this|how does this work|tutorial|guide)/.test(q);
    if (isContextQuery) {
      const activeModule = GLOBAL_MODULES.find(m => currentPath.includes(m.route) || (m.route !== '/' && currentPath === m.route));
      if (activeModule) {
        const mod = getModuleLocaleCopy(activeModule, uiLanguage);
        intent.replyOverride = copilotFmt(s.contextReply, { label: mod.label, desc: mod.desc });
        intent.actionLabel = undefined;
        intent.actionUrl = undefined;
        return intent;
      }
    }

    // 9. Conversational Brain & General Engineering Q&A
    if (q.length < 5 || !/(beam|load|force|gear|thread|bolt|steel|çelik|aluminum|alüminyum|diş|vida|civat|somun|sehim|mukavemet|rulman|bearing|şaft|mil)/.test(q)) {
      if (uiLanguage === 'tr') {
        if (q.includes('kimsin') || q.includes('nesin')) {
          intent.replyOverride = copilotFmt(s.whoAreYou, {
            material: this._state.materialType !== 'unknown' ? this._state.materialType : 'Henüz seçilmedi',
            load: this._state.forceApplied ? `${this._state.forceApplied} N` : s.notSet,
            span: this._state.length ? `${this._state.length} mm` : s.notSet,
          });
        } else if (q.includes('selam') || q.includes('merhaba') || q.includes('hey')) {
          intent.replyOverride = "Merhaba Mühendis! ⚙️ Ben AluCalc AeGiS Otonom Mühendislik Asistanıyım. Cıvata torku (VDI 2230), rulman ömrü (ISO 281), kiriş sehimi, dişli oranları, mil yorulması ve 3D montaj konularında anlık analiz yapabilirim. Neyi hesaplamak istersiniz?";
        } else if (q.includes('şaka') || q.includes('komik')) {
          intent.replyOverride = "Mühendislik espirisi: Bir cıvata somuna 'beni çok fazla sıkıyorsun' demiş; somun da 'VDI 2230 standartlarına göre bu gerekli ön yük' cevabını vermiş! 🔩";
        } else {
          intent.replyOverride = copilotFmt(s.generalFallback, { query });
        }
      } else {
        if (q.includes('who are you') || q.includes('what are you')) {
          intent.replyOverride = copilotFmt(s.whoAreYou, {
            material: this._state.materialType,
            load: this._state.forceApplied ? `${this._state.forceApplied} N` : s.notSet,
            span: this._state.length ? `${this._state.length} mm` : s.notSet,
          });
        } else if (q.includes('hello') || q.includes('hi') || q.includes('hey')) {
          intent.replyOverride = "Hello Engineer! ⚙️ I am AluCalc AeGiS Autonomous Intelligence. I can solve Bolt Torque (VDI 2230), Bearing Life (ISO 281), Beam Deflection, Gear Strength (ISO 6336), and Limits & Fits in real time. What would you like to calculate?";
        } else {
          intent.replyOverride = copilotFmt(s.generalFallback, { query });
        }
      }
      return intent;
    }

    intent.replyOverride = s.defaultFallback;
    return intent;
  }

  public getMaterialProperties(materialType: string, gradeOrAlloy: string): MaterialProperties | null {
    const db: Record<string, any> = { aluminum: aluminumDB, steel: steelDB, wood: woodDB, concrete: concreteDB, glass: glassDB, composite: compositeDB };
    const material = db[materialType];
    if (!material) return null;
    const collections = material.alloys || material.grades || material.types;
    return collections ? collections[gradeOrAlloy] : null;
  }
}
