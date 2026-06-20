import aluminumDB from '../knowledge-base/aluminum.json';
import steelDB from '../knowledge-base/steel.json';
import woodDB from '../knowledge-base/wood.json';
import concreteDB from '../knowledge-base/concrete.json';
import glassDB from '../knowledge-base/glass.json';
import compositeDB from '../knowledge-base/composite.json';
import { GLOBAL_MODULES } from './module-routes';

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
    const intent: CopilotIntent = {
      assumptionsMade: [],
    };

    const lang = uiLanguage === 'tr' ? 'tr' : 'en';

    // 2. PRIORITY 1: Feedback / Support Interceptor
    const isNegativeFeedback = /(yanlış|hata|bozuk|kusur|olmadı|saçma|wrong|error|broken|incorrect|invalid|fail|stupid|bad|sucks|trash)/.test(q);
    if (isNegativeFeedback) {
      intent.showSupportButton = true;
      intent.replyOverride = lang === 'tr'
        ? "**Teknik Hata Bildirimi**\n\nAnalitik sonuçlardaki tutarsızlığı fark ettiğiniz için teşekkürler. Mühendislik kütüphanelerimiz bazen aşırı hassas sınır koşullarında sapma yapabilir. Lütfen teknik ekibimize bildirin, anında inceleyelim."
        : "**Technical Discrepancy Report**\n\nI apologize for the inaccuracy. Engineering simulations can occasionally drift under extreme boundary conditions. Please trigger a manual verification request via the button below.";
      intent.actionLabel = lang === 'tr' ? 'Teknik Destekle İletişime Geç' : 'Contact Engineering Support';
      intent.actionUrl = 'mailto:abdulsametyildirim95@gmail.com?subject=Technical Feedback Report';
      return intent;
    }

    // Reset instruction
    if (q.includes('reset') || q.includes('sıfırla') || q.includes('temizle')) {
      this.resetState();
      intent.replyOverride = lang === 'tr'
        ? "Mühendislik hafızam sıfırlandı. Yeni parametrelerinizi tanımlayabilirsiniz."
        : "Conversational memory reset. Ready for new parameter definitions.";
      return intent;
    }

    // 3. PRIORITY 2: Direct Module Routing (Fuzzy Match)
    for (const module of GLOBAL_MODULES) {
      if (module.keywords.some(k => q.includes(k))) {
        const isAlreadyOnPage = currentPath.includes(module.route) || (module.route !== '/' && currentPath === module.route);
        
        intent.actionUrl = isAlreadyOnPage ? undefined : module.route; // Don't show link if already there
        intent.actionLabel = module[lang].label;
        
        if (isAlreadyOnPage) {
            intent.replyOverride = lang === 'tr'
                ? `Şu anda zaten **${module[lang].label}** modülündesin. Bu modül ile kompleks sistemleri simüle edebilir, sınır koşullarını değiştirebilir ve gerçek zamanlı analitik verileri aşağıdaki panellerden takip edebilirsin. Spesifik bir hesaplama (örneğin: "Giriş torku 50Nm ise ne olur?") sormak ister misin?`
                : `You are currently navigating the **${module[lang].label}**. You can simulate complex systems here, adjust boundary conditions, and monitor real-time analytical data from the panels below. Would you like to ask a specific calculation question (e.g., "What if input torque is 50Nm?")?`;
        } else {
            intent.replyOverride = lang === 'tr'
                ? `Seni **${module[lang].label}** modülüne yönlendirebilirim. Bu modülün derinlikleri:\n\n${module[lang].desc}\n\nGitmek için aşağıdaki butonu kullanabilirsin.`
                : `I can route you to the **${module[lang].label}**. Deep dive info:\n\n${module[lang].desc}\n\nUse the button below to navigate there.`;
        }
        return intent;
      }
    }

    // 4. PRIORITY 3: Context Awareness (This page?)
    const isContextQuery = /(bu sayfa|burası|nasıl çalışır|nasıl çalışıyor|nedir|what is this|how does this work|tutorial|guide)/.test(q);
    if (isContextQuery) {
      const activeModule = GLOBAL_MODULES.find(m => currentPath.includes(m.route) || (m.route !== '/' && currentPath === m.route));
      if (activeModule) {
        intent.replyOverride = lang === 'tr'
            ? `Şu an **${activeModule[lang].label}** çalışma istasyonundasın.\n\n${activeModule[lang].desc}\n\nBuradaki tüm hesaplamalar ISO ve DIN standartlarına göre gerçek zamanlı çözülmektedir. Hangi parametre üzerinde optimizasyon yapmak istersin?`
            : `You are currently at the **${activeModule[lang].label}** workstation.\n\n${activeModule[lang].desc}\n\nAll calculations here are solved in real-time according to ISO and DIN standards. Which parameter would you like to optimize?`;
        intent.actionLabel = undefined;
        intent.actionUrl = undefined;
        return intent;
      }
    }

    // 5. Parameter Parsing & Integration
    // Parse Material Type
    if (q.includes('alüminyum') || q.includes('aluminum') || q.includes('6061')) {
      this._state.materialType = 'aluminum';
      this._state.alloyOrGrade = q.includes('6061') ? '6061-T6' : '7075-T6';
    } else if (q.includes('çelik') || q.includes('steel') || q.includes('s235') || q.includes('s355')) {
      this._state.materialType = 'steel';
      this._state.alloyOrGrade = q.includes('s355') ? 'S355JR' : 'S235JR';
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
    const forceMatch = q.match(/(\d+)\s*(n|newton|kn)/);
    if (forceMatch) {
      const val = parseFloat(forceMatch[1]);
      this._state.forceApplied = forceMatch[2] === 'kn' ? val * 1000 : val;
    }

    // Length extraction
    const lengthMatch = q.match(/(\d+)\s*(mm|cm|m\b|metre)/);
    if (lengthMatch) {
      const val = parseFloat(lengthMatch[1]);
      if (lengthMatch[2] === 'cm') this._state.length = val * 10;
      else if (lengthMatch[2].startsWith('m')) this._state.length = val * 1000;
      else this._state.length = val;
    }

    // Width/Height extraction (e.g. 50x100 or 50*100)
    const dimMatch = q.match(/(\d+)\s*(x|\*)\s*(\d+)/);
    if (dimMatch) {
      this._state.width = parseFloat(dimMatch[1]);
      this._state.height = parseFloat(dimMatch[3]);
    }

    // 6. PRIORITY 4: Engineering Calculations (If explicitly requested or implied by sehim/deflection/gerilme/stress)
    const isCalculationRequested = /(sehim|deflection|gerilme|stress|hesap|calculate|solve|safety|emniyet)/.test(q);
    if (isCalculationRequested) {
      // Set defaults for missing values
      if (this._state.materialType === 'unknown') {
        this._state.materialType = 'steel';
        this._state.alloyOrGrade = 'S235JR';
        intent.assumptionsMade.push(lang === 'tr' ? 'Varsayılan olarak çelik (S235JR) malzeme seçildi.' : 'Defaulted material to Steel (S235JR).');
      }
      if (!this._state.length) {
        this._state.length = 2000; // 2 meters
        intent.assumptionsMade.push(lang === 'tr' ? 'Açıklık boyu varsayılan 2 metre (2000 mm) kabul edildi.' : 'Span length defaulted to 2m (2000 mm).');
      }
      if (!this._state.forceApplied) {
        this._state.forceApplied = 5000; // 5 kN
        intent.assumptionsMade.push(lang === 'tr' ? 'Yük varsayılan 5000 N (5 kN) kabul edildi.' : 'Applied force defaulted to 5000 N (5 kN).');
      }
      if (this._state.profileType === 'unknown') {
        this._state.profileType = 'rectangular';
        intent.assumptionsMade.push(lang === 'tr' ? 'Profil kesiti 50x100 mm dikdörtgen kutu profil kabul edildi.' : 'Profile shape assumed 50x100 mm rectangular box.');
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
        // Solid rectangular for simplicity
        I = (b * Math.pow(h, 3)) / 12;
        W = (b * Math.pow(h, 2)) / 6;
      } else if (this._state.profileType === 'circular') {
        const d = b; // diameter is width
        I = (Math.PI * Math.pow(d, 4)) / 64;
        W = (Math.PI * Math.pow(d, 3)) / 32;
      } else { // I-beam (stub standard IPE100 values)
        I = 1.71 * 1000000; // mm^4
        W = 34.2 * 1000; // mm^3
      }

      const F = this._state.forceApplied;
      const L = this._state.length;

      // Calculation formulas based on beamType
      let deflection = 0;
      let maxMoment = 0;
      if (this._state.beamType === 'simply_supported') {
        // Center point load
        deflection = (F * Math.pow(L, 3)) / (48 * E * I);
        maxMoment = (F * L) / 4;
      } else {
        // Cantilever end load
        deflection = (F * Math.pow(L, 3)) / (3 * E * I);
        maxMoment = F * L;
      }

      const bendingStress = maxMoment / W;
      const safetyFactor = yieldStrength / bendingStress;

      // Format response
      if (lang === 'tr') {
        intent.replyOverride = `### 📊 Mekanik Analiz Raporu\n\nAktif parametrelerinize göre hesaplanan değerler:\n` +
          `• **Malzeme:** ${this._state.materialType.toUpperCase()} (${this._state.alloyOrGrade}) (E = ${E / 1000} GPa, Akma = ${yieldStrength} MPa)\n` +
          `• **Açıklık (L):** ${L} mm (${(L / 1000).toFixed(2)} m)\n` +
          `• **Uygulanan Yük (F):** ${F} N (${(F / 1000).toFixed(2)} kN)\n` +
          `• **Kiriş Tipi:** ${this._state.beamType === 'simply_supported' ? 'Basit Mesnetli' : 'Konsol Kiriş'}\n` +
          `• **Profil Kesiti:** ${this._state.profileType.toUpperCase()} (${b}x${h} mm)\n\n` +
          `#### 🧮 Analitik Sonuçlar:\n` +
          `• **Atalet Momenti (I_x):** ${I.toExponential(3)} mm⁴\n` +
          `• **Maksimum Eğilme Momenti (M_max):** ${(maxMoment / 1000000).toFixed(2)} kNm\n` +
          `• **Maksimum Eğilme Gerilmesi (σ_max):** ${bendingStress.toFixed(2)} MPa\n` +
          `• **Maksimum Sehim (δ_max):** ${deflection.toFixed(2)} mm\n` +
          `• **Emniyet Katsayısı (SF):** ${safetyFactor > 100 ? '>100' : safetyFactor.toFixed(2)} ` +
          `(${safetyFactor >= 1.5 ? '✅ GÜVENLİ' : '❌ KRİTİK SEVİYE'})\n\n` +
          `Hesaplamaları daha detaylı incelemek ve grafiklerini çizdirmek için sehim modülüne geçebilirsiniz.`;
        intent.actionUrl = '/calculators/structural/beam-deflection';
        intent.actionLabel = 'Kiriş Sehim Modülünü Aç';
      } else {
        intent.replyOverride = `### 📊 Structural Analysis Report\n\nActive values resolved:\n` +
          `• **Material:** ${this._state.materialType.toUpperCase()} (${this._state.alloyOrGrade}) (E = ${E / 1000} GPa, Yield = ${yieldStrength} MPa)\n` +
          `• **Span Length (L):** ${L} mm (${(L / 1000).toFixed(2)} m)\n` +
          `• **Applied Force (F):** ${F} N (${(F / 1000).toFixed(2)} kN)\n` +
          `• **Support Type:** ${this._state.beamType === 'simply_supported' ? 'Simply Supported' : 'Cantilever'}\n` +
          `• **Section Profile:** ${this._state.profileType.toUpperCase()} (${b}x${h} mm)\n\n` +
          `#### 🧮 Solver Results:\n` +
          `• **Moment of Inertia (I_x):** ${I.toExponential(3)} mm⁴\n` +
          `• **Max Bending Moment (M_max):** ${(maxMoment / 1000000).toFixed(2)} kNm\n` +
          `• **Max Bending Stress (σ_max):** ${bendingStress.toFixed(2)} MPa\n` +
          `• **Max Deflection (δ_max):** ${deflection.toFixed(2)} mm\n` +
          `• **Safety Factor (SF):** ${safetyFactor > 100 ? '>100' : safetyFactor.toFixed(2)} ` +
          `(${safetyFactor >= 1.5 ? '✅ SAFE' : '❌ CRITICAL UNDERSIZED'})\n\n` +
          `You can navigate to the full structural beam deflection solver page for shear/bending moment diagrams (SFD/BMD).`;
        intent.actionUrl = '/calculators/structural/beam-deflection';
        intent.actionLabel = 'Open Beam Deflection Solver';
      }

      // Populate intent data for visual tags
      intent.materialType = this._state.materialType;
      intent.alloyOrGrade = this._state.alloyOrGrade;
      intent.forceApplied = this._state.forceApplied;
      intent.length = this._state.length;
      intent.profileType = this._state.profileType;

      return intent;
    }

    // 7. PRIORITY 5: Conversational Brain (Gemini-style depth)
    const isGeneral = q.length < 5 || !/(beam|load|force|gear|thread|bolt|steel|çelik|aluminum|alüminyum|diş|vida|civat|somun|sehim|mukavemet|rulman|bearing|şaft|mil)/.test(q);
    
    if (isGeneral) {
        if (lang === 'tr') {
            if (q.includes('kimsin') || q.includes('nesin')) {
                intent.replyOverride = "Ben AluCalc'ın **Sovereign Intelligence** katmanıyım. Basit bir regex algoritması değil, arka planda tüm mühendislik standartlarını ve geometrik formülleri dinamik hesaplayabilen bir asistanım.\n\nHafızamda tuttuğum aktif parametreler:\n" +
                  `• Malzeme: ${this._state.materialType !== 'unknown' ? this._state.materialType : 'Henüz seçilmedi'}\n` +
                  `• Yük: ${this._state.forceApplied ? this._state.forceApplied + ' N' : 'Henüz girilmedi'}\n` +
                  `• Boy: ${this._state.length ? this._state.length + ' mm' : 'Henüz girilmedi'}\n\n` +
                  "Parametrelerinizi sırasıyla girerek benden analiz yapmamı isteyebilirsiniz (Örn: 'sehim hesabı yap').";
            } else if (q.includes('selam') || q.includes('merhaba')) {
                intent.replyOverride = "Selam! Bugün AluCalc laboratuvarında neyi simüle ediyoruz? Statik yükler mi, dinamik dişli kutuları mı? Parametreleri girerek başlayabiliriz. (Örn: 'malzemeyi çelik yap, 5000N yük uygula')";
            } else if (q.includes('şaka') || q.includes('komik')) {
                intent.replyOverride = "Bir gün bir yapısal mühendise sevgilisi 'aramızdaki gerilimi hissediyor musun?' demiş. Mühendis de 'Evet, ama Von Mises emniyet sınırları dahilinde' demiş. Biraz soğuk bir espri, değil mi?";
            } else if (q.includes('lol') || q.includes('hah') || q.includes('vay')) {
                intent.replyOverride = "Mizah anlayışım biraz 'statik' olabilir ama hesaplamalarım oldukça dinamiktir! Başka neyi analiz etmek istersin?";
            } else if (q.includes('sos') || q.includes('yardım')) {
                intent.replyOverride = "**Acil Durum Modu Aktif**\n\nNerede takıldın? Tasarım kısıtlamalarını mı bulamıyorsun yoksa analiz sonuçları mı garip geliyor? Spesifik bir mühendislik problemi söylersen (örn: 'M12 torku' veya 'Dişli oranı') anında çözebiliriz.";
            } else {
                intent.replyOverride = `Söylediğin şeyi ("${query}") geniş mühendislik veritabanımda taradım. Henüz bu konuda spesifik bir modülüm olmayabilir ama sana **ISO standartları**, **mekanik analizler** veya **CAD çizimleri** konusunda yardımcı olabilirim. Daha spesifik bir şey denemek ister misin?`;
            }
        } else {
            if (q.includes('who are you') || q.includes('what are you')) {
                intent.replyOverride = "I am the **Sovereign Intelligence** of AluCalc. I'm not just a bot; I'm an agentic engine designed to oversee your engineering workflows, ensure safety factors, and help you design faster. Current active parameters:\n" +
                  `• Material: ${this._state.materialType}\n` +
                  `• Load: ${this._state.forceApplied ? this._state.forceApplied + ' N' : 'Not set'}\n` +
                  `• Span: ${this._state.length ? this._state.length + ' mm' : 'Not set'}\n\n` +
                  "Ask me 'calculate deflection' once you have set these parameters!";
            } else if (q.includes('joke')) {
                intent.replyOverride = "Why did the robot go back to school? Because his skills were getting 'rusty'! Get it? Okay, let's get back to something more structural.";
            } else if (q.includes('sos') || q.includes('help')) {
                intent.replyOverride = "**Emergency Mode Triggered**\n\nAre you stuck in a simulation loop? Describe your problem—like 'M10 thread pitch' or 'S355 steel yield strength'—and I'll provide standard reference values immediately.";
            } else {
                intent.replyOverride = `I've analyzed your input ("${query}"). While it sounds interesting, I'm currently specialized in **50+ engineering modules** including CAD, FEA, and Structural analysis. Give me a technical parameter to get a real Gemini-level breakdown!`;
            }
        }
        return intent;
    }

    // 8. PRIORITY 6: Parameter Extraction & Settings confirmation
    // If the query parsed parameters but didn't trigger calculation, confirm settings
    let trConfirm = "Hafıza güncellendi:\n";
    let enConfirm = "Parameters updated in memory:\n";
    let updatedAny = false;

    if (q.includes('çelik') || q.includes('steel') || q.includes('alüminyum') || q.includes('aluminum') || q.includes('ahşap') || q.includes('wood') || q.includes('beton') || q.includes('concrete')) {
      trConfirm += `• **Malzeme:** ${this._state.materialType.toUpperCase()} (${this._state.alloyOrGrade})\n`;
      enConfirm += `• **Material:** ${this._state.materialType.toUpperCase()} (${this._state.alloyOrGrade})\n`;
      updatedAny = true;
    }
    if (forceMatch) {
      trConfirm += `• **Yük (F):** ${this._state.forceApplied} N\n`;
      enConfirm += `• **Load (F):** ${this._state.forceApplied} N\n`;
      updatedAny = true;
    }
    if (lengthMatch) {
      trConfirm += `• **Boy (L):** ${this._state.length} mm\n`;
      enConfirm += `• **Length (L):** ${this._state.length} mm\n`;
      updatedAny = true;
    }
    if (dimMatch) {
      trConfirm += `• **Profil Kesiti:** ${this._state.width}x${this._state.height} mm\n`;
      enConfirm += `• **Profile Section:** ${this._state.width}x${this._state.height} mm\n`;
      updatedAny = true;
    }

    if (updatedAny) {
      trConfirm += "\nHesaplamayı başlatmak için 'hesapla' veya 'sehim analizi yap' yazabilirsiniz.";
      enConfirm += "\nType 'calculate' or 'solve stress' to run structural analysis on these parameters.";
      intent.replyOverride = lang === 'tr' ? trConfirm : enConfirm;
      
      // Populate intent data for visual tags
      intent.materialType = this._state.materialType;
      intent.alloyOrGrade = this._state.alloyOrGrade;
      intent.forceApplied = this._state.forceApplied;
      intent.length = this._state.length;
      intent.profileType = this._state.profileType;

      return intent;
    }

    // 9. Fastener spec parser fallback
    const mMatch = q.match(/\bm(\d+)\b/);
    if (mMatch) {
      const size = parseInt(mMatch[1], 10);
      let pitch = (size * 0.125).toFixed(2);
      let drill = (size * 0.85).toFixed(1);
      if (size === 8) { pitch = "1.25"; drill = "6.8"; }
      else if (size === 12) { pitch = "1.75"; drill = "10.2"; }
      
      intent.replyOverride = lang === 'tr' 
        ? `**M${size} Metrik Vida Bilgileri**\n\nBu vida için standart adım **${pitch} mm**'dir. Matkap deliği olarak **${drill} mm** kullanmanı öneririm. Bağlantı elemanları modülünde daha fazla detay bulabilirsin.`
        : `**M${size} Metric Thread Specs**\n\nStandard pitch is **${pitch} mm**. Recommended drill size is **${drill} mm**. Check the Fasteners module for torque specs!`;
      intent.actionUrl = '/fasteners/';
      intent.actionLabel = lang === 'tr' ? 'Bağlantı Elemanlarını Aç' : 'Open Fasteners Suite';
      return intent;
    }

    // Default Fallback
    intent.replyOverride = lang === 'en'
      ? "No verifiable engineering boundary conditions or analytical tokens were detected. Please specify clear parametric queries like 'S235 steel 5000N load' or 'M12 thread'."
      : "Girdiğiniz metinde mühendislik terimi tespit edilemedi. Lütfen 'S235 çelik için 5000N yük' veya 'M12 vida' gibi belirgin bir talep giriniz.";
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

