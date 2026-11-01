# AluCalc OS — Faz 0 Envanter & Tek Kaynak Doğruluk Raporu

> **Tarih**: 2026-10-19  
> **Tek Doğruluk Kaynağı**: `src/data/canonicalInventory.ts`  
> **Denetlenen Toplam Gerçek Mühendislik Aracı**: **86**  
> **Ayrık Alt Modüller**: 34 Saha Sensör Aracı (`/field`) + 15 Akademi Ünitesi (`/academy`)  

## 1. Sayı Tutarsızlığının Çözümü (The Canonical Resolution)

AluCalc OS üzerinde daha önce görülen 36 / 44 / 48 / 90+ çelişkisinin tam kök neden analizi:

1. **Sol Menü (36 Araç)**: `DesktopSidebar.tsx` içindeki `ALL_NAV_GROUPS` listesi tarihsel olarak yalnızca 36 popüler aracı içeriyordu. Kolon Burkulma, Betonarme, Gemi Hidrostatiği, Basınç Düşümü gibi pek çok araç menüde yoktu.
2. **Hesaplayıcı Hub (48 Modül)**: `src/data/calculatorHubData.ts` ve `APP_MODULE_COUNT` 48 adet hesaplayıcı kartı tanımlıyordu.
3. **SEO Headless Veritabanı (44 Çözücü)**: `src/data/seo-calculators/calculators.json` 44 formülü kapsıyordu.
4. **Pazarlama Metinleri ("90+ / 94+ Solvers")**: Gerçekte platformda bulunan 70+ TS çözücüsü, CAD atölyeleri, simülasyonlar ve şemalar kabaca "90+" olarak yuvarlanmıştı.

### Alınan Kesin Karar:
- **Tek Sayı**: **`86`**. Platformda çalışan, rotası, motoru veya şeması olan benzersiz mühendislik araç sayısı tam olarak **86**'dir.
- Tüm hardcoded stringler (`48 Modules`, `Over 48 modules`, `90+ Solvers`, `WORKSPACE 36`) yerine `CANONICAL_TOOL_COUNT` (86) sabiti bağlanacaktır.

## 2. 6 Sütunlu Birleşik Bilgi Mimarisi

| Sütun No | Sütun Adı | Araç Sayısı | Örnek Araçlar & Normlar |
|---|---|---|---|
| 1 | **CAD & Design Studios** (`cad_design`) | **8** | Parametric Part Configurator (3D CAD), 2D AluCAD Drafting & Constraints, Technical Sketch Pad & Whiteboard, FEA Linear Static Simulation... |
| 2 | **Mechanical Solvers (ISO/DIN/VDI)** (`mechanical`) | **16** | Bolt Preload & Torque (VDI 2230), Parallel Keyway Stress (DIN 6885), Interference / Press Fit (DIN 7190), O-Ring Gland & Squeeze (ISO 3601)... |
| 3 | **Materials, Structural & Manufacturing** (`materials_mfg`) | **21** | Beam Deflection & Bending Moments, Column Buckling (Euler & Johnson), Reinforced Concrete (RC) Sizing, Engineering Materials Physical Database... |
| 4 | **Fluids, Thermal & Electrical Power** (`fluids_thermal_power`) | **16** | Extruded Aluminum Heat Sink (Thermal Resistance), Linear & Volumetric Thermal Expansion, Centrifugal Pump Performance & NPSH, Pipe Flow & Darcy-Weisbach Pressure Drop... |
| 5 | **Engineering Science & Theory** (`science_theory`) | **22** | Scientific CAS & Unit Calculator, Hardness & Engineering Unit Converter, Computational Physics & Classical Mechanics, 1D/2D Kinematics & Projectile Motion... |
| 6 | **Platform, Field & Academy** (`platform_academy`) | **3** | Engineering Academy & Interactive Curriculum, Field Engineering Mobile Sensor Suite, Mobile Workstation (PWA & Offline Mode)... |

## 3. Tam Mühendislik Envanteri (86 Araç)

| # | Başlık (EN) | Başlık (TR) | Rota | Sütun | Motor Tipi | Standart / Referans |
|---|---|---|---|---|---|---|
| 1 | **Parametric Part Configurator (3D CAD)** | Parametrik Parça Konfigüratörü (3D CAD) | `/design-studio` | cad_design | `cad_3d` | WASM OpenCASCADE, STEP/STL ISO 10303 |
| 2 | **2D AluCAD Drafting & Constraints** | 2D AluCAD Çizim & Kısıt Çözücü | `/cad-editor` | cad_design | `cad_2d` | DXF R12/2000, PlaneGCS Solve |
| 3 | **Technical Sketch Pad & Whiteboard** | Mühendislik Şema Tahtası | `/sketch-pad` | cad_design | `cad_2d` | SVG Vector Export |
| 4 | **FEA Linear Static Simulation** | FEA Doğrusal Statik Simülasyon | `/fea` | cad_design | `fea_sim` | Von Mises Stress, Linear Elastic FEA |
| 5 | **Engineering Flow Engine (Node-RED/NX)** | Görsel Mühendislik Akış Motoru | `/flow` | cad_design | `flow_graph` | Deterministic Computation Graph |
| 6 | **2D Sheet Nesting & Remnant Optimizer** | 2D Plaka Yerleşim & Fire Optimizasyonu | `/nesting-2d` | cad_design | `optimizer_engine` | SigmaNEST Heuristic, DXF Cut Path |
| 7 | **1D Linear Profile Cut Optimizer** | 1D Profil Kesim Optimizasyonu | `/cutting-optimizer` | cad_design | `optimizer_engine` | Kerf Compensation, Stock Sawing |
| 8 | **Parametric CAD Model Generator** | Parametrik CAD Model Üretici | `/parametric-cad` | cad_design | `cad_3d` | Parametric CSG |
| 9 | **Bolt Preload & Torque (VDI 2230)** | Cıvata Ön Yükü & Torku (VDI 2230) | `/bolt-torque` | mechanical | `deterministic_solver` | VDI 2230 Blatt 1, ISO 898-1, ASME PCC-1 |
| 10 | **Parallel Keyway Stress (DIN 6885)** | Paralel Kama Dayanımı (DIN 6885) | `/keyway-connection` | mechanical | `deterministic_solver` | DIN 6885-1, ISO 773 |
| 11 | **Interference / Press Fit (DIN 7190)** | Sıkı Geçme / Pres & Sıcak (DIN 7190) | `/press-fit` | mechanical | `deterministic_solver` | DIN 7190, Lamé Equations |
| 12 | **O-Ring Gland & Squeeze (ISO 3601)** | O-Ring Sızdırmazlık & Kanal (ISO 3601) | `/o-ring` | mechanical | `deterministic_solver` | ISO 3601-1, AS568 |
| 13 | **Bearing Rating Life L10h (ISO 281)** | Rulman Ömrü Hesabı L10h (ISO 281) | `/bearings` | mechanical | `deterministic_solver` | ISO 281:2007, ISO 76, DIN 622 |
| 14 | **Spur & Helical Gear Design (ISO 6336)** | Silindirik Dişli Hesabı (ISO 6336) | `/gears` | mechanical | `deterministic_solver` | ISO 6336-1:2019, DIN 3990, AGMA 2001 |
| 15 | **Planetary Gearbox Epicyclic Ratio** | Planet Redüktör Oran & Tork Hesabı | `/planetary-gearbox` | mechanical | `deterministic_solver` | Willis Equations, AGMA 6123 |
| 16 | **Multi-Stage Gearbox Sizing Engine** | Kademeli Redüktör Tasarım Motoru | `/gearbox-design` | mechanical | `deterministic_solver` | DIN 3990, VDI 2736 |
| 17 | **Shaft Diameter & Torsion (DIN 743)** | Mil Boyutlandırma & Burulma (DIN 743) | `/shafts` | mechanical | `deterministic_solver` | DIN 743, ASME B106.1M |
| 18 | **Helical Compression Spring Design** | Helisel Basma Yayı Hesabı | `/advanced-spring` | mechanical | `deterministic_solver` | DIN EN 13906-1, Wahl Factor |
| 19 | **Roller Chain Drive Sizing (ISO 606)** | Makaralı Zincir Mekanizması (ISO 606) | `/chain-drive` | mechanical | `deterministic_solver` | ISO 606, DIN 8187 |
| 20 | **V-Belt & Timing Belt Drive (ISO 5291)** | Kayış-Kasnak Mekanizması (ISO 5291) | `/belt-drive` | mechanical | `deterministic_solver` | ISO 5291, DIN 2215, RMA IP-20 |
| 21 | **Electric Motor Power & Sizing (IEC 60034)** | Elektrik Motor Güç Seçimi (IEC 60034) | `/motor-selection-std` | mechanical | `deterministic_solver` | IEC 60034-30, DIN EN 60034 |
| 22 | **Natural Frequency & Vibration Harmonics** | Doğal Frekans & Titreşim Analizi | `/vibration` | mechanical | `deterministic_solver` | ISO 10816, Rayleigh Method |
| 23 | **Mechanical Engineering Standards Handbook** | Mühendislik Standartları El Kitabı | `/handbook` | mechanical | `deterministic_solver` | ISO / DIN / VDI / ASME Catalog |
| 24 | **Bolt Thread Shear Stripping Area** | Cıvata Diş Sıyırma Alanı Hesabı | `/thread-stripping-area` | mechanical | `deterministic_solver` | ISO 965, VDI 2230 Shear Stripping |
| 25 | **Beam Deflection & Bending Moments** | Kiriş Sehim & Moment Analizi | `/beam-deflection` | materials_mfg | `deterministic_solver` | Euler-Bernoulli Beam Theory, AISC 360-16 |
| 26 | **Column Buckling (Euler & Johnson)** | Kolon Burkulma Analizi (Euler-Johnson) | `/column-buckling` | materials_mfg | `deterministic_solver` | Euler Critical Load, Johnson Parabolic Criterion |
| 27 | **Reinforced Concrete (RC) Sizing** | Betonarme Donatı & Kesit Hesabı | `/concrete-reinforcement` | materials_mfg | `deterministic_solver` | Eurocode 2 (EN 1992), ACI 318 |
| 28 | **Engineering Materials Physical Database** | Mühendislik Malzemeleri Veritabanı | `/materials-db` | materials_mfg | `deterministic_solver` | EN 573-3, EN 10025, ASTM MatWeb Spec |
| 29 | **Materials Intelligence & Property Matrix** | Malzeme Özellikleri Matrisi | `/materials-explorer` | materials_mfg | `deterministic_solver` | Ashby Material Selection Charts |
| 30 | **Material Selector Engine (Pareto Optimal)** | Optimum Malzeme Seçim Motoru | `/material-selector-ai` | materials_mfg | `deterministic_solver` | Ashby Index Optimization |
| 31 | **ISO Fits & Tolerances (ISO 286)** | Toleranslar & Geçmeler (ISO 286) | `/fits` | materials_mfg | `deterministic_solver` | ISO 286-1, ISO 286-2, ANSI B4.2 |
| 32 | **Sheet Metal Bending & Flat Pattern (DIN 6935)** | Sac Büküm & Açınım Hesabı (DIN 6935) | `/sheet-metal` | materials_mfg | `deterministic_solver` | DIN 6935, K-Factor, Bend Deduction |
| 33 | **Machining Feeds, Speeds & Power** | Talaşlı İmalat Kesme Hızları & İlerleme | `/machining-details` | materials_mfg | `deterministic_solver` | ISO 513, Taylor Tool Life Formula |
| 34 | **Machining Cycle Time Estimator** | Talaşlı İmalat Süre Hesaplayıcı | `/machining-time` | materials_mfg | `deterministic_solver` | Standard Cycle Time Formulations |
| 35 | **Welding Joint Strength (AWS / Eurocode 3)** | Kaynak Mukavemeti & Dikiş Boyutlandırma | `/welding` | materials_mfg | `deterministic_solver` | AWS D1.1, Eurocode 3 EN 1993-1-8, ISO 2553 |
| 36 | **Fillet Weld Sizing & Directional Method** | Köşe Kaynağı Boyutlandırma | `/welding-fillet` | materials_mfg | `deterministic_solver` | EN 1993-1-8 Directional Method |
| 37 | **Profile Weight, Area & Mass Metrage** | Profil Ağırlık, Kesit & Metraj Hesabı | `/profile-weight` | materials_mfg | `deterministic_solver` | EN 755-9 Extruded Aluminum Tolerances |
| 38 | **Manufacturing Should-Cost & Carbon Estimator** | İmalat Maliyet & Karbon Ayak İzi Motoru | `/cost-estimator` | materials_mfg | `deterministic_solver` | Activity Based Costing (ABC), ISO 14040 LCA |
| 39 | **Stress Tensor & Mohr Circle Analysis** | Gerilme Tensörü & Mohr Çemberi Analizi | `/strength-analysis` | materials_mfg | `deterministic_solver` | Cauchy Stress Tensor 3D, Tresca & Von Mises |
| 40 | **Manufacturing Readiness Level (MRL) Audit** | İmalat Hazırlık Seviyesi (MRL) Denetimi | `/manufacturing-readiness` | materials_mfg | `deterministic_solver` | DoD MRL Deskbook V2 |
| 41 | **CAM Process Simulation Sandbox** | CAM Süreç Simülasyon Alanı | `/manufacturing-sandbox` | materials_mfg | `deterministic_solver` | CNC G-Code Kinematic Validation |
| 42 | **Machine Component Selection Guide** | Makine Parçası Seçim Kılavuzu | `/engineering-selection` | materials_mfg | `deterministic_solver` | Design for Manufacturing (DFMA) |
| 43 | **Manufacturing Process Planner** | İmalat Süreç Planlama Kılavuzu | `/manufacturing` | materials_mfg | `deterministic_solver` | Production Routing Best Practices |
| 44 | **Truss Member 2D Matrix Analysis** | Kafes Kiriş Matris Analizi | `/truss-analysis` | materials_mfg | `deterministic_solver` | Method of Joints & Sections, Stiffness Method |
| 45 | **Bending Moment & Shear Force Diagrams (SFD/BMD)** | Eğilme Momenti & Kesme Kuvveti Diyagramı | `/bending-moment` | materials_mfg | `deterministic_solver` | Singularity Functions, M/EI Curvature |
| 46 | **Extruded Aluminum Heat Sink (Thermal Resistance)** | Alüminyum Soğutucu Profil (Termal Direnç) | `/heat-sink` | fluids_thermal_power | `deterministic_solver` | Natural & Forced Convection Rth Formulas |
| 47 | **Linear & Volumetric Thermal Expansion** | Lineer & Hacimsel Isıl Genleşme Hesabı | `/thermal-expansion` | fluids_thermal_power | `deterministic_solver` | ASTM E228 Coefficient of Thermal Expansion (CTE) |
| 48 | **Centrifugal Pump Performance & NPSH** | Santrifüj Pompa & NPSH Hesabı | `/pumps` | fluids_thermal_power | `deterministic_solver` | ISO 9906 Rotodynamic Pumps, HI 1.3 |
| 49 | **Pipe Flow & Darcy-Weisbach Pressure Drop** | Boru Akışı & Basınç Düşümü Hesabı | `/fluid-dynamics` | fluids_thermal_power | `deterministic_solver` | Darcy-Weisbach Equation, Colebrook-White Formula |
| 50 | **Pipe Head Loss & Minor Losses (Fittings)** | Boru Sürtünme Kayıpları & Armatürler | `/pipe-friction` | fluids_thermal_power | `deterministic_solver` | Moody Chart, Crane Technical Paper 410 |
| 51 | **Thin & Thick-Walled Pressure Vessel** | İnce & Kalın Çeperli Basınçlı Kap | `/pressure-vessel` | fluids_thermal_power | `deterministic_solver` | ASME Boiler & Pressure Vessel Code Sec VIII Div 1 |
| 52 | **HVAC Heating & Cooling Thermal Load** | HVAC Isıtma & Soğutma Yükü Hesabı | `/hvac-load` | fluids_thermal_power | `deterministic_solver` | ASHRAE Fundamentals Handbook, EN 12831 |
| 53 | **Gearbox Thermal Capacity & Lubrication** | Redüktör Termal Güç & Yağlama Hesabı | `/reducer-lubrication` | fluids_thermal_power | `deterministic_solver` | ISO/TR 14179 Gearbox Thermal Capacity |
| 54 | **Wind Tunnel Aerodynamic Drag & Lift** | Rüzgar Tüneli Aerodinamik Sürükleme | `/wind-tunnel` | fluids_thermal_power | `deterministic_solver` | Bernoulli Equation, Compressible & Incompressible Flow |
| 55 | **Atmospheric Flight Dynamics (ISA Model)** | Atmosferik Uçuş Dinamiği (ISA Modeli) | `/aerospace-dynamics` | fluids_thermal_power | `deterministic_solver` | International Standard Atmosphere (ICAO Doc 7488) |
| 56 | **Three-Phase AC Power & Power Factor (IEEE 141)** | 3 Faz Güç & Güç Faktörü Hesabı (IEEE 141) | `/three-phase-power` | fluids_thermal_power | `deterministic_solver` | IEEE 141 (Red Book), IEC 60364 |
| 57 | **Ohm's Law & DC/AC Electrical Circuit Solver** | Ohm Kanunu & DC/AC Devre Çözücü | `/ohms-law` | fluids_thermal_power | `deterministic_solver` | IEC 60050, Ohm's Law & Joule Heating |
| 58 | **Cable Sizing & Voltage Drop (IEC 60287)** | Kablo Kesiti & Gerilim Düşümü (IEC 60287) | `/voltage-drop` | fluids_thermal_power | `deterministic_solver` | IEC 60287, IEC 60364-5-52, NEC Chapter 9 |
| 59 | **Transformer Winding & Core Sizing (IEEE C57)** | Transformatör Sargı & Nüve Boyutlandırma | `/transformer-calculation` | fluids_thermal_power | `deterministic_solver` | IEEE C57.12, IEC 60076 |
| 60 | **Active & Passive Analog Filter Design** | Aktif & Pasif Analog Filtre Tasarımı | `/filter-design` | fluids_thermal_power | `deterministic_solver` | Butterworth / Chebyshev Polynomial Filters |
| 61 | **Aerodynamic Lift & Drag Coefficients** | Aerodinamik Taşıma & Sürükleme Katsayısı | `/lift-coefficient` | fluids_thermal_power | `deterministic_solver` | Thin Airfoil Theory, Kutta-Joukowski Theorem |
| 62 | **Scientific CAS & Unit Calculator** | Bilimsel CAS & Birimli Hesap Makinesi | `/calculator` | science_theory | `deterministic_solver` | IEEE 754 64-bit Floating Point Precision |
| 63 | **Hardness & Engineering Unit Converter** | Sertlik & Mühendislik Birim Dönüştürücü | `/unit-converter` | science_theory | `deterministic_solver` | ASTM E140 Hardness Conversion, BIPM SI Units Guide |
| 64 | **Computational Physics & Classical Mechanics** | Hesaplamalı Fizik & Klasik Mekanik Çözücü | `/physics-solver` | science_theory | `deterministic_solver` | Newtonian & Lagrangian Mechanics |
| 65 | **1D/2D Kinematics & Projectile Motion** | Kinematik & Eğik Atış Hareketi | `/physics-kinematics` | science_theory | `deterministic_solver` | Uniform Acceleration Kinematics |
| 66 | **High-Cycle Fatigue & Goodman / Gerber Life** | Yorulma Ömrü (Goodman / Gerber Kriteri) | `/fatigue-analysis` | science_theory | `deterministic_solver` | ASTM E466, Goodman, Soderberg, Gerber Criteria |
| 67 | **Multi-Axial Fatigue Life & S-N Curves** | Çok Eksenli Yorulma Ömrü & S-N Eğrileri | `/fatigue-advanced` | science_theory | `deterministic_solver` | Basquin Law, Miner Cumulative Damage Rule |
| 68 | **Machine Failure & Reliability Prediction (MTBF)** | Arıza & Güvenilirlik Tahmini (MTBF) | `/failure-prediction` | science_theory | `deterministic_solver` | MIL-HDBK-217F, Weibull Reliability Analysis |
| 69 | **Chemical Stoichiometry & Reaction Balance** | Kimyasal Stokiyometri & Reaksiyon Dengesi | `/chemistry-reactions` | science_theory | `deterministic_solver` | Conservation of Mass, IUPAC Nomenclature |
| 70 | **Interactive Periodic Table of Elements** | Etkileşimli Periyodik Element Tablosu | `/periodic-table` | science_theory | `deterministic_solver` | IUPAC Standard Atomic Weights |
| 71 | **Population Genetics (Hardy-Weinberg)** | Popülasyon Genetiği (Hardy-Weinberg) | `/biology-genetics` | science_theory | `deterministic_solver` | Hardy-Weinberg Equilibrium Principle |
| 72 | **Computer Science Data Structures & Complexity** | Algoritma Analizi & Karmaşıklık (Big-O) | `/cs-algorithms` | science_theory | `deterministic_solver` | Big-O Asymptotic Complexity Models |
| 73 | **Boolean Algebra & Digital Logic Gate Simulator** | Boole Cebiri & Dijital Mantık Kapıları | `/digital-logic` | science_theory | `deterministic_solver` | IEEE 91/91a Binary Logic Symbols |
| 74 | **Hooke's Law & Elastic Spring Deformation** | Hooke Kanunu & Elastik Şekil Değiştirme | `/hooke-law` | science_theory | `deterministic_solver` | Hooke's Law (F=kx), Young Modulus Ratio |
| 75 | **Ideal Gas Law & Thermodynamic State (PV=nRT)** | İdeal Gaz Kanunu & Termodinamik Durum (PV=nRT) | `/ideal-gas-law` | science_theory | `deterministic_solver` | Ideal Gas Law, Van der Waals Real Gas Correction |
| 76 | **Solution Molarity, Molality & Dilution** | Çözelti Molarite, Molalite & Seyreltme | `/chemical-molarity` | science_theory | `deterministic_solver` | IUPAC Concentration Definitions |
| 77 | **Radioactive Decay & Isotope Half-Life** | Radyoaktif Bozunma & Yarı Ömür Hesabı | `/radioactive-decay` | science_theory | `deterministic_solver` | Exponential Decay Law, Bateman Equations |
| 78 | **Reynolds Number & Flow Regime (Laminar/Turbulent)** | Reynolds Sayısı & Akış Rejimi (Laminer/Türbülans) | `/reynolds-number` | science_theory | `deterministic_solver` | Dimensionless Flow Invariants |
| 79 | **Tsiolkovsky Rocket Equation & Delta-V** | Tsiolkovsky Roket Denklemi & Delta-V | `/rocket-equation` | science_theory | `deterministic_solver` | Tsiolkovsky Ideal Rocket Equation |
| 80 | **Centripetal Force & Rotational Dynamics** | Merkezcil Kuvvet & Dönel Dinamik | `/centripetal-force` | science_theory | `deterministic_solver` | Circular Motion Dynamics (F=mv²/r) |
| 81 | **Kinetic Energy & Work-Energy Theorem** | Kinetik Enerji & İş-Enerji Teoremi | `/kinetic-energy` | science_theory | `deterministic_solver` | Work-Energy Principle (E = 0.5*m*v^2) |
| 82 | **Newton's Second Law Dynamic Force (F=ma)** | Newton'un İkinci Kanunu Dinamik Kuvvet (F=ma) | `/newton-second-law` | science_theory | `deterministic_solver` | Newtonian Mechanics (F=ma) |
| 83 | **Material Specific Gravity & Relative Density** | Özgül Ağırlık & Bağıl Yoğunluk Hesabı | `/specific-gravity` | science_theory | `deterministic_solver` | ASTM D792 / ASTM C127 Specific Gravity |
| 84 | **Engineering Academy & Interactive Curriculum** | Mühendislik Akademisi & İnteraktif Müfredat | `/academy` | platform_academy | `academy_curriculum` | 15 Interactive Mechanical & CAD Engineering Units |
| 85 | **Field Engineering Mobile Sensor Suite** | Saha Mühendisliği Mobil Sensör Kiti | `/field` | platform_academy | `sensor_suite_34` | 34 Live Hardware Sensors & Inspection Tools |
| 86 | **Mobile Workstation (PWA & Offline Mode)** | Mobil İş İstasyonu (PWA & Çevrimdışı Mod) | `/mobile` | platform_academy | `pwa_workstation` | W3C Progressive Web App (PWA), ServiceWorker Cache |

## 4. Kanonik Alias & Yönlendirme Eşleşmeleri (61 Alias)

Hiçbir eski link kırılmayacak şekilde aşağıdaki alias'lar ana rotalara bağlanmıştır:

| Eski / Kısayol Rota | Hedef Rota |
|---|---|
| `/aluminum` | `/profile-weight` |
| `/fasteners` | `/bolt-torque` |
| `/fasteners-calc` | `/bolt-torque` |
| `/thread-geometry` | `/bolt-torque` |
| `/thread-standards` | `/bolt-torque` |
| `/tolerance-stackup` | `/fits` |
| `/fits-tolerances` | `/fits` |
| `/3-phase-power` | `/three-phase-power` |
| `/power-electrical` | `/three-phase-power` |
| `/simulation-fea` | `/fea` |
| `/machine-assembly` | `/design-studio` |
| `/workspace` | `/design-studio` |
| `/workspace/assembly` | `/design-studio` |
| `/calculators` | `/design-studio` |
| `/helical-spring` | `/advanced-spring` |
| `/spring-design` | `/advanced-spring` |
| `/spring-constant` | `/advanced-spring` |
| `/pressure-drop-calc` | `/fluid-dynamics` |
| `/pressure-drop` | `/fluid-dynamics` |
| `/fluids` | `/fluid-dynamics` |
| `/thermal` | `/thermal-expansion` |
| `/heat-transfer-calc` | `/thermal-expansion` |
| `/heat-transfer` | `/thermal-expansion` |
| `/bearing-life` | `/bearings` |
| `/bearing-life-calc` | `/bearings` |
| `/bolt-torque-calc` | `/bolt-torque` |
| `/vdi2230` | `/bolt-torque` |
| `/shaft-diameter` | `/shafts` |
| `/shaft-diameter-calc` | `/shafts` |
| `/motor-power` | `/motor-selection-std` |
| `/motor-power-calc` | `/motor-selection-std` |
| `/motor-selection` | `/motor-selection-std` |
| `/roller-chain-drive` | `/chain-drive` |
| `/timing-belt-design` | `/belt-drive` |
| `/v-belt-power` | `/belt-drive` |
| `/bend-allowance` | `/sheet-metal` |
| `/gear-contact-stress` | `/gears` |
| `/gear-module` | `/gears` |
| `/gear-ratio` | `/gears` |
| `/gear-ratio-calc` | `/gears` |
| `/gears-bearings` | `/gears` |
| `/beam-deflection-calc` | `/beam-deflection` |
| `/kama` | `/keyway-connection` |
| `/kama-hesabi` | `/keyway-connection` |
| `/parallel-key` | `/keyway-connection` |
| `/siki-gecme` | `/press-fit` |
| `/shrink-fit` | `/press-fit` |
| `/interference-fit` | `/press-fit` |
| `/oring` | `/o-ring` |
| `/o-ring-gland` | `/o-ring` |
| `/sizdirmazlik` | `/o-ring` |
| `/fatigue` | `/fatigue-analysis` |
| `/mfg-readiness` | `/manufacturing-readiness` |
| `/mfg-sandbox` | `/manufacturing-sandbox` |
| `/aerospace` | `/aerospace-dynamics` |
| `/kinematics` | `/physics-kinematics` |
| `/chemistry-solver` | `/chemistry-reactions` |
| `/converter` | `/unit-converter` |
| `/hardness-converter` | `/unit-converter` |
| `/pipe-friction-calc` | `/pipe-friction` |
| `/welding-calc` | `/welding` |
