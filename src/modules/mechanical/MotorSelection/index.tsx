'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Zap, Activity, Settings, BarChart2, 
    Target, Cpu, Shield, TrendingUp, Thermometer,
    Layers, Sliders, CheckCircle2, AlertTriangle,
    Download, Copy, RefreshCw, Box, Eye, Check,
    Flame, Cable, Sparkles, Factory, Disc
} from 'lucide-react';
import { SidebarAnimatedIcon } from '@/components/ui/SidebarAnimatedIcon';
import { useI18nStore } from '@/store/i18nStore';
import { t12 } from '@/locales/t12';

// ═══════════════════════════════════════════════════════════════════════════
// IEC 60034 / IEC 60072-1 STANDARDIZED THREE-PHASE MOTOR DATABASE
// ═══════════════════════════════════════════════════════════════════════════

interface IECMotorData {
    powerKw: number;
    frame: string;
    pole2_rpm: number;
    pole4_rpm: number;
    pole6_rpm: number;
    pole8_rpm: number;
    ie3_eff: number; // % efficiency at full load (400V 50Hz)
    cosPhi: number;  // Power factor
    ts_tn: number;   // Starting torque ratio (Ts/Tn)
    tk_tn: number;   // Breakdown torque ratio (Tk/Tn)
    is_in: number;   // Starting current ratio (Is/In)
    // Mechanical Dimensions (IEC 60072-1 in mm)
    shaftD: number;  // Shaft diameter (D)
    shaftE: number;  // Shaft length (E)
    centerH: number; // Shaft center height (H)
    footA: number;   // Foot hole width (A)
    footB: number;   // Foot hole length (B)
    flangeM: number; // B5 Flange pitch circle diameter (M)
    weightKg: number;// Approx weight (B3 Foot mounted)
}

const IEC_CATALOG: IECMotorData[] = [
    { powerKw: 0.18, frame: '63M',   pole2_rpm: 2820, pole4_rpm: 1370, pole6_rpm: 870,  pole8_rpm: 650, ie3_eff: 70.0, cosPhi: 0.70, ts_tn: 2.1, tk_tn: 2.2, is_in: 4.5, shaftD: 11, shaftE: 23, centerH: 63,  footA: 100, footB: 80,  flangeM: 115, weightKg: 4.5 },
    { powerKw: 0.25, frame: '71M',   pole2_rpm: 2830, pole4_rpm: 1380, pole6_rpm: 890,  pole8_rpm: 660, ie3_eff: 73.5, cosPhi: 0.72, ts_tn: 2.2, tk_tn: 2.3, is_in: 4.8, shaftD: 14, shaftE: 30, centerH: 71,  footA: 112, footB: 90,  flangeM: 130, weightKg: 6.0 },
    { powerKw: 0.37, frame: '71M',   pole2_rpm: 2840, pole4_rpm: 1390, pole6_rpm: 900,  pole8_rpm: 670, ie3_eff: 76.1, cosPhi: 0.74, ts_tn: 2.3, tk_tn: 2.4, is_in: 5.2, shaftD: 14, shaftE: 30, centerH: 71,  footA: 112, footB: 90,  flangeM: 130, weightKg: 7.2 },
    { powerKw: 0.55, frame: '80M',   pole2_rpm: 2850, pole4_rpm: 1400, pole6_rpm: 910,  pole8_rpm: 680, ie3_eff: 79.0, cosPhi: 0.76, ts_tn: 2.4, tk_tn: 2.5, is_in: 5.6, shaftD: 19, shaftE: 40, centerH: 80,  footA: 125, footB: 100, flangeM: 165, weightKg: 10.5 },
    { powerKw: 0.75, frame: '80M',   pole2_rpm: 2860, pole4_rpm: 1410, pole6_rpm: 920,  pole8_rpm: 690, ie3_eff: 82.5, cosPhi: 0.78, ts_tn: 2.4, tk_tn: 2.6, is_in: 6.0, shaftD: 19, shaftE: 40, centerH: 80,  footA: 125, footB: 100, flangeM: 165, weightKg: 12.0 },
    { powerKw: 1.1,  frame: '90S',   pole2_rpm: 2870, pole4_rpm: 1420, pole6_rpm: 930,  pole8_rpm: 700, ie3_eff: 84.1, cosPhi: 0.79, ts_tn: 2.5, tk_tn: 2.7, is_in: 6.4, shaftD: 24, shaftE: 50, centerH: 90,  footA: 140, footB: 100, flangeM: 165, weightKg: 16.5 },
    { powerKw: 1.5,  frame: '90L',   pole2_rpm: 2880, pole4_rpm: 1430, pole6_rpm: 940,  pole8_rpm: 705, ie3_eff: 85.3, cosPhi: 0.81, ts_tn: 2.5, tk_tn: 2.8, is_in: 6.8, shaftD: 24, shaftE: 50, centerH: 90,  footA: 140, footB: 125, flangeM: 165, weightKg: 20.0 },
    { powerKw: 2.2,  frame: '100L',  pole2_rpm: 2890, pole4_rpm: 1440, pole6_rpm: 950,  pole8_rpm: 710, ie3_eff: 86.7, cosPhi: 0.82, ts_tn: 2.6, tk_tn: 2.9, is_in: 7.0, shaftD: 28, shaftE: 60, centerH: 100, footA: 160, footB: 140, flangeM: 215, weightKg: 28.0 },
    { powerKw: 3.0,  frame: '100L',  pole2_rpm: 2900, pole4_rpm: 1450, pole6_rpm: 960,  pole8_rpm: 715, ie3_eff: 87.7, cosPhi: 0.83, ts_tn: 2.6, tk_tn: 3.0, is_in: 7.2, shaftD: 28, shaftE: 60, centerH: 100, footA: 160, footB: 140, flangeM: 215, weightKg: 33.0 },
    { powerKw: 4.0,  frame: '112M',  pole2_rpm: 2910, pole4_rpm: 1460, pole6_rpm: 965,  pole8_rpm: 720, ie3_eff: 88.6, cosPhi: 0.84, ts_tn: 2.7, tk_tn: 3.1, is_in: 7.5, shaftD: 28, shaftE: 60, centerH: 112, footA: 190, footB: 140, flangeM: 215, weightKg: 42.0 },
    { powerKw: 5.5,  frame: '132S',  pole2_rpm: 2920, pole4_rpm: 1465, pole6_rpm: 970,  pole8_rpm: 725, ie3_eff: 89.6, cosPhi: 0.85, ts_tn: 2.7, tk_tn: 3.2, is_in: 7.6, shaftD: 38, shaftE: 80, centerH: 132, footA: 216, footB: 140, flangeM: 265, weightKg: 62.0 },
    { powerKw: 7.5,  frame: '132M',  pole2_rpm: 2925, pole4_rpm: 1470, pole6_rpm: 972,  pole8_rpm: 730, ie3_eff: 90.4, cosPhi: 0.86, ts_tn: 2.8, tk_tn: 3.2, is_in: 7.8, shaftD: 38, shaftE: 80, centerH: 132, footA: 216, footB: 178, flangeM: 265, weightKg: 74.0 },
    { powerKw: 11.0, frame: '160M',  pole2_rpm: 2935, pole4_rpm: 1475, pole6_rpm: 975,  pole8_rpm: 732, ie3_eff: 91.4, cosPhi: 0.87, ts_tn: 2.8, tk_tn: 3.3, is_in: 7.8, shaftD: 42, shaftE: 110,centerH: 160, footA: 254, footB: 210, flangeM: 300, weightKg: 115.0 },
    { powerKw: 15.0, frame: '160L',  pole2_rpm: 2940, pole4_rpm: 1480, pole6_rpm: 978,  pole8_rpm: 735, ie3_eff: 92.1, cosPhi: 0.87, ts_tn: 2.9, tk_tn: 3.3, is_in: 8.0, shaftD: 42, shaftE: 110,centerH: 160, footA: 254, footB: 254, flangeM: 300, weightKg: 138.0 },
    { powerKw: 18.5, frame: '180M',  pole2_rpm: 2945, pole4_rpm: 1480, pole6_rpm: 980,  pole8_rpm: 735, ie3_eff: 92.6, cosPhi: 0.88, ts_tn: 2.9, tk_tn: 3.4, is_in: 8.0, shaftD: 48, shaftE: 110,centerH: 180, footA: 279, footB: 241, flangeM: 300, weightKg: 170.0 },
    { powerKw: 22.0, frame: '180L',  pole2_rpm: 2950, pole4_rpm: 1482, pole6_rpm: 982,  pole8_rpm: 738, ie3_eff: 93.0, cosPhi: 0.88, ts_tn: 3.0, tk_tn: 3.4, is_in: 8.1, shaftD: 48, shaftE: 110,centerH: 180, footA: 279, footB: 279, flangeM: 300, weightKg: 195.0 },
    { powerKw: 30.0, frame: '200L',  pole2_rpm: 2955, pole4_rpm: 1485, pole6_rpm: 985,  pole8_rpm: 740, ie3_eff: 93.6, cosPhi: 0.89, ts_tn: 3.0, tk_tn: 3.5, is_in: 8.2, shaftD: 55, shaftE: 110,centerH: 200, footA: 318, footB: 305, flangeM: 350, weightKg: 260.0 },
    { powerKw: 37.0, frame: '225S',  pole2_rpm: 2960, pole4_rpm: 1485, pole6_rpm: 985,  pole8_rpm: 740, ie3_eff: 93.9, cosPhi: 0.89, ts_tn: 3.0, tk_tn: 3.5, is_in: 8.2, shaftD: 60, shaftE: 140,centerH: 225, footA: 356, footB: 286, flangeM: 400, weightKg: 320.0 },
    { powerKw: 45.0, frame: '225M',  pole2_rpm: 2965, pole4_rpm: 1488, pole6_rpm: 988,  pole8_rpm: 742, ie3_eff: 94.2, cosPhi: 0.90, ts_tn: 3.0, tk_tn: 3.5, is_in: 8.3, shaftD: 60, shaftE: 140,centerH: 225, footA: 356, footB: 311, flangeM: 400, weightKg: 365.0 },
    { powerKw: 55.0, frame: '250M',  pole2_rpm: 2970, pole4_rpm: 1488, pole6_rpm: 988,  pole8_rpm: 742, ie3_eff: 94.6, cosPhi: 0.90, ts_tn: 3.1, tk_tn: 3.5, is_in: 8.4, shaftD: 65, shaftE: 140,centerH: 250, footA: 406, footB: 349, flangeM: 500, weightKg: 460.0 },
    { powerKw: 75.0, frame: '280S',  pole2_rpm: 2975, pole4_rpm: 1490, pole6_rpm: 990,  pole8_rpm: 744, ie3_eff: 95.0, cosPhi: 0.90, ts_tn: 3.1, tk_tn: 3.6, is_in: 8.5, shaftD: 75, shaftE: 140,centerH: 280, footA: 457, footB: 368, flangeM: 500, weightKg: 620.0 },
    { powerKw: 90.0, frame: '280M',  pole2_rpm: 2975, pole4_rpm: 1490, pole6_rpm: 990,  pole8_rpm: 744, ie3_eff: 95.2, cosPhi: 0.91, ts_tn: 3.1, tk_tn: 3.6, is_in: 8.5, shaftD: 75, shaftE: 140,centerH: 280, footA: 457, footB: 419, flangeM: 500, weightKg: 710.0 },
    { powerKw: 110.0,frame: '315S',  pole2_rpm: 2980, pole4_rpm: 1492, pole6_rpm: 992,  pole8_rpm: 745, ie3_eff: 95.4, cosPhi: 0.91, ts_tn: 3.2, tk_tn: 3.6, is_in: 8.6, shaftD: 80, shaftE: 170,centerH: 315, footA: 508, footB: 406, flangeM: 600, weightKg: 940.0 },
    { powerKw: 132.0,frame: '315M',  pole2_rpm: 2980, pole4_rpm: 1492, pole6_rpm: 992,  pole8_rpm: 745, ie3_eff: 95.6, cosPhi: 0.91, ts_tn: 3.2, tk_tn: 3.6, is_in: 8.6, shaftD: 80, shaftE: 170,centerH: 315, footA: 508, footB: 457, flangeM: 600, weightKg: 1080.0 },
    { powerKw: 160.0,frame: '315L',  pole2_rpm: 2982, pole4_rpm: 1492, pole6_rpm: 992,  pole8_rpm: 745, ie3_eff: 95.8, cosPhi: 0.92, ts_tn: 3.2, tk_tn: 3.6, is_in: 8.7, shaftD: 80, shaftE: 170,centerH: 315, footA: 508, footB: 508, flangeM: 600, weightKg: 1250.0 },
    { powerKw: 200.0,frame: '315L',  pole2_rpm: 2985, pole4_rpm: 1494, pole6_rpm: 994,  pole8_rpm: 746, ie3_eff: 96.0, cosPhi: 0.92, ts_tn: 3.2, tk_tn: 3.6, is_in: 8.7, shaftD: 80, shaftE: 170,centerH: 315, footA: 508, footB: 508, flangeM: 600, weightKg: 1420.0 }
];

// Industrial Presets
interface ApplicationPreset {
    id: string;
    labelTr: string;
    labelEn: string;
    defaultTorque: number;
    defaultSpeed: number;
    defaultRatio: number;
    serviceFactor: number;
    driveType: 'direct' | 'gearbox' | 'v_belt' | 'timing_belt' | 'chain';
    loadType: 'constant' | 'quadratic' | 'shock';
}

const PRESETS: ApplicationPreset[] = [
    { id: 'conveyor', labelTr: 'Bantlı Konveyör', labelEn: 'Belt Conveyor', defaultTorque: 180, defaultSpeed: 60, defaultRatio: 24.5, serviceFactor: 1.25, driveType: 'gearbox', loadType: 'constant' },
    { id: 'pump', labelTr: 'Santrifüj Pompa', labelEn: 'Centrifugal Pump', defaultTorque: 45, defaultSpeed: 2900, defaultRatio: 1.0, serviceFactor: 1.10, driveType: 'direct', loadType: 'quadratic' },
    { id: 'fan', labelTr: 'Endüstriyel Fan / Blower', labelEn: 'Industrial Fan / Blower', defaultTorque: 95, defaultSpeed: 1450, defaultRatio: 1.0, serviceFactor: 1.15, driveType: 'direct', loadType: 'quadratic' },
    { id: 'hoist', labelTr: 'Vinç / Kaldırma', labelEn: 'Crane / Hoist', defaultTorque: 650, defaultSpeed: 25, defaultRatio: 58.0, serviceFactor: 1.60, driveType: 'gearbox', loadType: 'constant' },
    { id: 'mixer', labelTr: 'Kimyasal Mikser / Karıştırıcı', labelEn: 'Agitator / Mixer', defaultTorque: 320, defaultSpeed: 95, defaultRatio: 15.2, serviceFactor: 1.40, driveType: 'gearbox', loadType: 'constant' },
    { id: 'crusher', labelTr: 'Taş Kırıcı / Değirmen', labelEn: 'Rock Crusher / Mill', defaultTorque: 1200, defaultSpeed: 180, defaultRatio: 8.2, serviceFactor: 2.00, driveType: 'v_belt', loadType: 'shock' },
    { id: 'extruder', labelTr: 'Plastik Ekstrüder', labelEn: 'Plastic Extruder', defaultTorque: 450, defaultSpeed: 120, defaultRatio: 12.0, serviceFactor: 1.50, driveType: 'gearbox', loadType: 'constant' },
    { id: 'lathe', labelTr: 'CNC Takım Tezgahı / İş Mili', labelEn: 'CNC Machine Spindle', defaultTorque: 85, defaultSpeed: 3000, defaultRatio: 1.0, serviceFactor: 1.30, driveType: 'direct', loadType: 'constant' }
];

export default function MotorSelectionModule() {
    const { language } = useI18nStore();
    // ═══════════════════════════════════════════════════════════════════════
    // STATE MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════
    const [selectedPreset, setSelectedPreset] = useState<string>('conveyor');
    const [activeTab, setActiveTab] = useState<'blueprint' | 'curve' | 'switchgear' | 'dimensions'>('blueprint');

    // Section Collapsibles
    const [openSections, setOpenSections] = useState<Record<string, boolean>>({
        load: true,
        transmission: true,
        electrical: true
    });

    const toggleSection = (s: string) => {
        setOpenSections(prev => ({ ...prev, [s]: !prev[s] }));
    };

    // Load inputs
    const [targetTorque, setTargetTorque] = useState<number>(180); // Nm
    const [targetSpeed, setTargetSpeed] = useState<number>(60);    // RPM
    const [serviceFactor, setServiceFactor] = useState<number>(1.25);
    const [dailyHours, setDailyHours] = useState<number>(16);      // h/day
    const [startsPerHour, setStartsPerHour] = useState<number>(10);

    // Transmission inputs
    const [driveType, setDriveType] = useState<'direct' | 'gearbox' | 'v_belt' | 'timing_belt' | 'chain'>('gearbox');
    const [gearRatio, setGearRatio] = useState<number>(24.5);
    const [customEfficiency, setCustomEfficiency] = useState<number | null>(null);

    // Electrical grid & motor inputs
    const [poles, setPoles] = useState<2 | 4 | 6 | 8>(4);
    const [frequency, setFrequency] = useState<50 | 60>(50);
    const [gridVoltage, setGridVoltage] = useState<400 | 230 | 690>(400); // Volts
    const [effClass, setEffClass] = useState<'IE1' | 'IE2' | 'IE3' | 'IE4'>('IE3');
    const [electricityPriceKwh, setElectricityPriceKwh] = useState<number>(0.12); // $/kWh

    // Copy Notification
    const [copied, setCopied] = useState<boolean>(false);

    // ═══════════════════════════════════════════════════════════════════════
    // PRESET APPLICATION HANDLER
    // ═══════════════════════════════════════════════════════════════════════
    const handleApplyPreset = (pId: string) => {
        setSelectedPreset(pId);
        const p = PRESETS.find(x => x.id === pId);
        if (!p) return;
        setTargetTorque(p.defaultTorque);
        setTargetSpeed(p.defaultSpeed);
        setGearRatio(p.defaultRatio);
        setServiceFactor(p.serviceFactor);
        setDriveType(p.driveType);
        setCustomEfficiency(null);
    };

    // ═══════════════════════════════════════════════════════════════════════
    // ENGINEERING KERNEL CALCULATIONS (IEC 60034 & ISO 6336 STANDARDS)
    // ═══════════════════════════════════════════════════════════════════════
    const results = useMemo(() => {
        let effTrans = 0.96;
        if (driveType === 'direct') effTrans = 0.98;
        if (driveType === 'gearbox') effTrans = gearRatio > 30 ? 0.94 : 0.96;
        if (driveType === 'v_belt') effTrans = 0.92;
        if (driveType === 'timing_belt') effTrans = 0.97;
        if (driveType === 'chain') effTrans = 0.93;

        const effectiveTransEff = customEfficiency !== null ? customEfficiency : effTrans;

        // 1. Shaft Load Power (kW)
        const loadPowerKw = (targetTorque * targetSpeed) / 9549.3;

        // 2. Required Motor Shaft Power (accounting for transmission losses and service factor)
        const requiredMotorPowerKw = (loadPowerKw / Math.max(0.2, effectiveTransEff)) * Math.max(1.0, serviceFactor);

        // 3. Expected Motor Speed based on gear ratio and selected poles
        const motorTargetSpeedRpm = targetSpeed * Math.max(0.1, gearRatio);

        // 4. Select standard IEC Motor from catalog (Next available size)
        const matchedMotor = IEC_CATALOG.find(m => m.powerKw >= requiredMotorPowerKw) ?? IEC_CATALOG[IEC_CATALOG.length - 1];

        // 5. Motor RPM depending on selected pole count & frequency
        let nominalRpm = matchedMotor.pole4_rpm;
        if (poles === 2) nominalRpm = matchedMotor.pole2_rpm;
        if (poles === 4) nominalRpm = matchedMotor.pole4_rpm;
        if (poles === 6) nominalRpm = matchedMotor.pole6_rpm;
        if (poles === 8) nominalRpm = matchedMotor.pole8_rpm;

        if (frequency === 60) {
            nominalRpm = Math.round(nominalRpm * 1.2);
        }

        // 6. Motor Nominal Torque (N·m)
        const nominalTorque = (9549.3 * matchedMotor.powerKw) / nominalRpm;

        // 7. Motor Utilization (Load Factor)
        const loadFactor = (requiredMotorPowerKw / matchedMotor.powerKw) * 100;

        // 8. Electrical Full-load Current (Amps at 3-Phase Grid Voltage)
        const motorEfficiencyDecimal = (matchedMotor.ie3_eff / 100) * (effClass === 'IE4' ? 1.015 : effClass === 'IE2' ? 0.97 : effClass === 'IE1' ? 0.93 : 1.0);
        const nominalCurrent = (matchedMotor.powerKw * 1000) / (Math.sqrt(3) * gridVoltage * motorEfficiencyDecimal * matchedMotor.cosPhi);
        const startingCurrent = nominalCurrent * matchedMotor.is_in;

        // 9. Torques
        const startingTorque = nominalTorque * matchedMotor.ts_tn;
        const breakdownTorque = nominalTorque * matchedMotor.tk_tn;

        // 10. Switchgear & Electrical Protection Sizing
        const thermalRelaySetting = Number((nominalCurrent * 1.05).toFixed(1));
        const contactorRating = Math.ceil(nominalCurrent * 1.25);
        const mpcbMin = Math.floor(nominalCurrent * 0.9);
        const mpcbMax = Math.ceil(nominalCurrent * 1.4);
        const fuseRatingAm = Math.ceil(nominalCurrent * 1.6);

        let cableSize = '3x1.5 + 1.5 mm²';
        if (nominalCurrent > 12) cableSize = '3x2.5 + 2.5 mm²';
        if (nominalCurrent > 18) cableSize = '3x4 + 4 mm²';
        if (nominalCurrent > 26) cableSize = '3x6 + 6 mm²';
        if (nominalCurrent > 36) cableSize = '3x10 + 10 mm²';
        if (nominalCurrent > 50) cableSize = '3x16 + 16 mm²';
        if (nominalCurrent > 70) cableSize = '3x25 + 16 mm²';
        if (nominalCurrent > 95) cableSize = '3x35 + 16 mm²';
        if (nominalCurrent > 125) cableSize = '3x50 + 25 mm²';
        if (nominalCurrent > 160) cableSize = '3x70 + 35 mm²';
        if (nominalCurrent > 200) cableSize = '3x95 + 50 mm²';

        // 11. Energy Consumption & Savings (ROI Analysis)
        const annualOperatingHours = dailyHours * 300;
        const annualEnergyKwh = (matchedMotor.powerKw / motorEfficiencyDecimal) * (loadFactor / 100) * annualOperatingHours;
        const annualCost = annualEnergyKwh * electricityPriceKwh;
        const annualSavingsKwh = annualEnergyKwh * 0.045;
        const annualSavingsCost = annualSavingsKwh * electricityPriceKwh;
        const co2SavedTons = (annualSavingsKwh * 0.42) / 1000;

        const isOverloaded = loadFactor > 100;
        const isUnderloaded = loadFactor < 40;
        const isCritical = requiredMotorPowerKw > IEC_CATALOG[IEC_CATALOG.length - 1].powerKw;

        return {
            loadPowerKw,
            requiredMotorPowerKw,
            motorTargetSpeedRpm,
            matchedMotor,
            nominalRpm,
            nominalTorque,
            loadFactor,
            nominalCurrent,
            startingCurrent,
            startingTorque,
            breakdownTorque,
            effectiveTransEff,
            thermalRelaySetting,
            contactorRating,
            mpcbMin,
            mpcbMax,
            fuseRatingAm,
            cableSize,
            annualEnergyKwh,
            annualCost,
            annualSavingsCost,
            co2SavedTons,
            isOverloaded,
            isUnderloaded,
            isCritical
        };
    }, [targetTorque, targetSpeed, serviceFactor, driveType, gearRatio, customEfficiency, poles, frequency, gridVoltage, effClass, dailyHours, electricityPriceKwh]);

    // Copy Summary to Clipboard
    const handleCopySummary = () => {
        const text = `=== ALU-CALCULATOR MOTOR SELECTION REPORT ===
Application: ${PRESETS.find(p => p.id === selectedPreset)?.labelTr || selectedPreset}
Recommended Motor: IEC ${results.matchedMotor.frame} · ${results.matchedMotor.powerKw} kW · ${results.nominalRpm} RPM (${effClass})
Grid: ${gridVoltage}V 3-Phase · ${frequency} Hz · Poles: ${poles}P
Nominal Current (In): ${results.nominalCurrent.toFixed(1)} A (Starting: ${results.startingCurrent.toFixed(1)} A)
Nominal Torque (Tn): ${results.nominalTorque.toFixed(1)} N·m (Ts: ${results.startingTorque.toFixed(1)} N·m)
Load Factor: ${results.loadFactor.toFixed(1)}% (Req: ${results.requiredMotorPowerKw.toFixed(2)} kW)
Protection: Thermal Relay ${results.thermalRelaySetting}A · MPCB ${results.mpcbMin}-${results.mpcbMax}A · Cable ${results.cableSize}
Standard Dimensions: Shaft Ø${results.matchedMotor.shaftD}x${results.matchedMotor.shaftE}mm · Center Height H=${results.matchedMotor.centerH}mm · Weight ~${results.matchedMotor.weightKg}kg`;

        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
    };

    return (
        <div className="flex h-full w-full bg-[var(--bg-0)] text-slate-200 select-none font-sans overflow-hidden">
            
            {/* ═════════════════════════════════════════════════════════════════ */}
            {/* LEFT CONTROL SIDEBAR                                              */}
            {/* ═════════════════════════════════════════════════════════════════ */}
            <div className="w-[340px] xl:w-[380px] h-full shrink-0 flex flex-col bg-[var(--bg-0)]/95 border-r border-white/10 z-20 shadow-2xl">
                
                {/* Module Header & Animated Icon */}
                <div className="p-5 border-b border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <SidebarAnimatedIcon itemId="motor-selection-std" size={34} color="#00e5ff" />
                        <div>
                            <h1 className="text-base font-black tracking-tighter uppercase leading-none text-white flex items-center gap-2">
                                MotorDrive <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400 font-mono not-italic font-bold">IEC 60034</span>
                            </h1>
                            <p className="text-[10px] text-cyan-400/70 font-mono tracking-wider uppercase mt-1">
                                {t12(language, 'Industrial Motor & Switchgear Sizing', 'Endüstriyel Motor & Şalt Seçimi')}
                            </p>
                        </div>
                    </div>
                    
                    <button 
                        onClick={handleCopySummary}
                        title={t12(language, 'Copy Summary', 'Özeti Kopyala')}
                        className="p-2 rounded-xl bg-white/5 hover:bg-cyan-500/20 border border-white/10 hover:border-cyan-500/30 text-gray-400 hover:text-cyan-300 transition-all cursor-pointer"
                    >
                        {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                    </button>
                </div>

                {/* Industrial Application Presets Bar */}
                <div className="px-4 py-3 border-b border-white/5 bg-[var(--bg-0)]">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[9.5px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                            <Factory size={11} className="text-cyan-400" /> {t12(language, 'Application Template', 'Uygulama Şablonu')}
                        </span>
                        <span className="text-[9px] font-mono text-cyan-400/80 font-bold">
                            {t12(language, PRESETS.find(p => p.id === selectedPreset)?.labelEn || '', PRESETS.find(p => p.id === selectedPreset)?.labelTr || '')}
                        </span>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5">
                        {PRESETS.slice(0, 8).map(p => (
                            <button
                                key={p.id}
                                onClick={() => handleApplyPreset(p.id)}
                                className={`py-1.5 px-1 rounded-lg text-[9px] font-bold text-center truncate transition-all cursor-pointer ${
                                    selectedPreset === p.id 
                                        ? 'bg-[var(--cyan)] text-[var(--accent-ink)] font-black ' 
                                        : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/5'
                                }`}
                            >
                                {t12(language, p.labelEn.split(' ')[0], p.labelTr.split(' ')[0])}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Scrollable Configuration Sections */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
                    
                    {/* SECTION 1: LOAD & DUTY */}
                    <div className="rounded-2xl border border-white/10 bg-[var(--bg-1)]/70 overflow-hidden">
                        <button
                            onClick={() => toggleSection('load')}
                            className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-white/[0.02] transition-colors cursor-pointer"
                        >
                            <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest flex items-center gap-2">
                                <Target size={13} /> {t12(language, '1. Load & Operating Conditions', '1. Yük ve Çalışma Şartları')}
                            </span>
                            <span className="text-xs text-gray-500 font-mono">{openSections.load ? '−' : '+'}</span>
                        </button>

                        {openSections.load && (
                            <div className="p-4 pt-1 space-y-3.5 border-t border-white/5">
                                <NumericInput
                                    label={t12(language, 'Output Shaft Torque (T₂)', 'Çıkış Şaft Torku (T₂)')}
                                    unit="N·m"
                                    value={targetTorque}
                                    min={1} max={50000} step={5}
                                    onChange={setTargetTorque}
                                    desc={t12(language, 'Working torque required by machine', 'Makinanın ihtiyaç duyduğu çalışma momenti')}
                                />
                                <NumericInput
                                    label={t12(language, 'Output Shaft Speed (n₂)', 'Çıkış Şaft Devri (n₂)')}
                                    unit="RPM"
                                    value={targetSpeed}
                                    min={0.5} max={10000} step={1}
                                    onChange={setTargetSpeed}
                                    desc={t12(language, 'Rotational speed of load shaft', 'Yük şaftının dönüş hızı')}
                                />
                                <div className="grid grid-cols-2 gap-3">
                                    <NumericInput
                                        label={t12(language, 'Service Factor (fs)', 'Servis Faktörü (fs)')}
                                        unit="fs"
                                        value={serviceFactor}
                                        min={1.0} max={3.0} step={0.05}
                                        onChange={setServiceFactor}
                                        desc={t12(language, 'AGMA / ISO Load Duty Factor', 'AGMA / ISO Yük Faktörü')}
                                    />
                                    <NumericInput
                                        label={t12(language, 'Daily Operation', 'Günlük Çalışma')}
                                        unit={t12(language, 'hrs/day', 'saat/gün')}
                                        value={dailyHours}
                                        min={1} max={24} step={1}
                                        onChange={setDailyHours}
                                        desc={t12(language, 'S1 Continuous Duty', 'S1 Sürekli Çalışma')}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* SECTION 2: TRANSMISSION & GEARBOX */}
                    <div className="rounded-2xl border border-white/10 bg-[var(--bg-1)]/70 overflow-hidden">
                        <button
                            onClick={() => toggleSection('transmission')}
                            className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-white/[0.02] transition-colors cursor-pointer"
                        >
                            <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest flex items-center gap-2">
                                <Cpu size={13} /> {t12(language, '2. Transmission & Reduction', '2. Aktarma ve Redüksiyon')}
                            </span>
                            <span className="text-xs text-gray-500 font-mono">{openSections.transmission ? '−' : '+'}</span>
                        </button>

                        {openSections.transmission && (
                            <div className="p-4 pt-1 space-y-3.5 border-t border-white/5">
                                <div>
                                    <label className="text-[9.5px] font-black text-gray-400 uppercase tracking-wider block mb-1.5">
                                        {t12(language, 'Transmission Type', 'Aktarma Türü')}
                                    </label>
                                    <select
                                        value={driveType}
                                        onChange={(e: any) => setDriveType(e.target.value)}
                                        className="w-full bg-[var(--bg-0)] border border-white/10 rounded-xl px-3 py-2 text-xs font-mono font-bold text-white outline-none cursor-pointer"
                                    >
                                        <option value="direct">{t12(language, 'Direct Coupling (1:1, η=0.98)', 'Doğrudan Kaplin Bağlantısı (1:1, η=0.98)')}</option>
                                        <option value="gearbox">{t12(language, 'Helical Gearbox (η=0.95)', 'Helisel Redüktör (Gearbox, η=0.95)')}</option>
                                        <option value="v_belt">{t12(language, 'V-Belt Drive (η=0.92)', 'V-Kayış Kasnak (V-Belt, η=0.92)')}</option>
                                        <option value="timing_belt">{t12(language, 'Timing Belt Drive (η=0.97)', 'Triger / Zaman Kayışı (Timing Belt, η=0.97)')}</option>
                                        <option value="chain">{t12(language, 'Roller Chain Drive (η=0.93)', 'Makaralı Zincir (Roller Chain, η=0.93)')}</option>
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <NumericInput
                                        label={t12(language, 'Gear Ratio (i)', 'Çevrim Oranı (i)')}
                                        unit=":1"
                                        value={gearRatio}
                                        min={0.1} max={500} step={0.5}
                                        onChange={setGearRatio}
                                        desc="i = n_motor / n_load"
                                    />
                                    <NumericInput
                                        label={t12(language, 'Transmission Efficiency (η)', 'Aktarma Verimi (η)')}
                                        unit=""
                                        value={Number(results.effectiveTransEff.toFixed(2))}
                                        min={0.4} max={1.0} step={0.01}
                                        onChange={(v: number) => setCustomEfficiency(v)}
                                        desc={t12(language, 'Mechanical efficiency coefficient', 'Mekanik verim katsayısı')}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* SECTION 3: MOTOR & ELECTRICAL SPECIFICATION */}
                    <div className="rounded-2xl border border-white/10 bg-[var(--bg-1)]/70 overflow-hidden">
                        <button
                            onClick={() => toggleSection('electrical')}
                            className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-white/[0.02] transition-colors cursor-pointer"
                        >
                            <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest flex items-center gap-2">
                                <Zap size={13} /> {t12(language, '3. Electrical Grid & Standards', '3. Elektrik Şebekesi & Standart')}
                            </span>
                            <span className="text-xs text-gray-500 font-mono">{openSections.electrical ? '−' : '+'}</span>
                        </button>

                        {openSections.electrical && (
                            <div className="p-4 pt-1 space-y-3.5 border-t border-white/5">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[9.5px] font-black text-gray-400 uppercase tracking-wider block mb-1.5">
                                            {t12(language, 'Pole Count (P)', 'Kutup Sayısı (P)')}
                                        </label>
                                        <div className="grid grid-cols-4 gap-1 bg-[var(--bg-0)] p-1 rounded-xl border border-white/10">
                                            {[2, 4, 6, 8].map(p => (
                                                <button
                                                    key={p}
                                                    onClick={() => setPoles(p as any)}
                                                    className={`py-1.5 text-[10px] font-mono font-bold rounded-lg transition-all ${
                                                        poles === p ? 'bg-[var(--cyan)] text-[var(--accent-ink)] font-black shadow-md' : 'text-gray-400 hover:text-white'
                                                    }`}
                                                >
                                                    {p}P
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-[9.5px] font-black text-gray-400 uppercase tracking-wider block mb-1.5">
                                            {t12(language, 'Grid Frequency', 'Şebeke Frekansı')}
                                        </label>
                                        <div className="grid grid-cols-2 gap-1 bg-[var(--bg-0)] p-1 rounded-xl border border-white/10">
                                            {[50, 60].map(f => (
                                                <button
                                                    key={f}
                                                    onClick={() => setFrequency(f as any)}
                                                    className={`py-1.5 text-[10px] font-mono font-bold rounded-lg transition-all ${
                                                        frequency === f ? 'bg-[var(--cyan)] text-[var(--accent-ink)] font-black shadow-md' : 'text-gray-400 hover:text-white'
                                                    }`}
                                                >
                                                    {f} Hz
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[9.5px] font-black text-gray-400 uppercase tracking-wider block mb-1.5">
                                            {t12(language, 'Grid Voltage', 'Şebeke Gerilimi')}
                                        </label>
                                        <select
                                            value={gridVoltage}
                                            onChange={(e: any) => setGridVoltage(Number(e.target.value) as any)}
                                            className="w-full bg-[var(--bg-0)] border border-white/10 rounded-xl px-3 py-2 text-xs font-mono font-bold text-white outline-none cursor-pointer"
                                        >
                                            <option value={400}>{t12(language, '400 V (3-Phase Y/Δ)', '400 V (Trifaze Y/Δ)')}</option>
                                            <option value={230}>{t12(language, '230 V (3-Phase Δ)', '230 V (Trifaze Δ)')}</option>
                                            <option value={690}>{t12(language, '690 V (Heavy Industry Y)', '690 V (Ağır Sanayi Y)')}</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="text-[9.5px] font-black text-gray-400 uppercase tracking-wider block mb-1.5">
                                            {t12(language, 'Efficiency Class', 'Verim Sınıfı')}
                                        </label>
                                        <select
                                            value={effClass}
                                            onChange={(e: any) => setEffClass(e.target.value as any)}
                                            className="w-full bg-[var(--bg-0)] border border-white/10 rounded-xl px-3 py-2 text-xs font-mono font-bold text-emerald-400 outline-none cursor-pointer"
                                        >
                                            <option value="IE3">IE3 Premium (%90+)</option>
                                            <option value="IE4">IE4 Super Premium</option>
                                            <option value="IE2">IE2 High Efficiency</option>
                                            <option value="IE1">IE1 Standard</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ═════════════════════════════════════════════════════════════════ */}
            {/* CENTER DASHBOARD & INTERACTIVE VISUALIZER                         */}
            {/* ═════════════════════════════════════════════════════════════════ */}
            <div className="flex-1 flex flex-col min-w-0 bg-[var(--bg-0)] overflow-hidden">
                
                {/* Top Dynamic Stat Cards */}
                <div className="p-6 border-b border-white/10 bg-[var(--bg-0)]/80">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <QuickStatCard 
                            label={t12(language, 'Recommended Motor Power', 'Önerilen Motor Gücü')} 
                            value={`${results.matchedMotor.powerKw} kW`} 
                            sub={`(${(results.matchedMotor.powerKw * 1.341).toFixed(1)} HP) · IEC ${results.matchedMotor.frame}`}
                            color="#00e5ff"
                            icon={<Zap size={16} />}
                        />
                        <QuickStatCard 
                            label={t12(language, 'Nominal Motor Speed', 'Nominal Motor Devri')} 
                            value={`${results.nominalRpm} RPM`} 
                            sub={`${t12(language, 'Sync', 'Senkron')}: ${frequency === 50 ? (6000 / poles) : (7200 / poles)} RPM · ${poles} ${t12(language, 'Poles', 'Kutup')}`}
                            color="#818cf8"
                            icon={<Disc size={16} />}
                        />
                        <QuickStatCard 
                            label={t12(language, 'Nominal Torque (Tn)', 'Nominal Tork (Tn)')} 
                            value={`${results.nominalTorque.toFixed(1)} N·m`} 
                            sub={`${t12(language, 'Starting', 'Kalkış')}: ${results.startingTorque.toFixed(0)} N·m (${results.matchedMotor.ts_tn}x)`}
                            color="#f59e0b"
                            icon={<Activity size={16} />}
                        />
                        <QuickStatCard 
                            label={t12(language, 'Load Factor', 'Yüklenme Oranı')} 
                            value={`${results.loadFactor.toFixed(1)}%`} 
                            sub={results.loadFactor > 95 ? t12(language, 'HIGH LOAD', 'YÜKSEK YÜK') : results.loadFactor < 40 ? t12(language, 'LIGHT LOAD (Low cosφ)', 'DÜŞÜK YÜK (Düşük cosφ)') : t12(language, 'OPTIMAL OPERATION', 'OPTİMAL ÇALIŞMA')}
                            color={results.loadFactor > 100 ? '#ef4444' : results.loadFactor < 40 ? '#f59e0b' : '#10b981'}
                            icon={<Thermometer size={16} />}
                        />
                    </div>
                </div>

                {/* Visualizer & Analytics Canvas */}
                <div className="flex-1 flex flex-col 2xl:flex-row min-h-0 overflow-hidden">
                    
                    {/* Main Visualizer Stage */}
                    <div className="flex-1 relative m-6 rounded-xl overflow-hidden border border-cyan-500/20 bg-gradient-to-b from-[var(--bg-1)] to-[var(--bg-0)] shadow-inner flex flex-col">
                        
                        {/* Tab Switcher on Canvas */}
                        <div className="p-4 border-b border-white/5 flex items-center justify-between z-20">
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setActiveTab('blueprint')}
                                    className={`px-3.5 py-1.5 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                                        activeTab === 'blueprint'
                                            ? 'bg-[var(--cyan)] text-[var(--accent-ink)] font-black '
                                            : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white'
                                    }`}
                                >
                                    <Box size={13} /> {t12(language, '2D Motor CAD Cross-Section', '2D Motor CAD Kesiti')}
                                </button>
                                <button
                                    onClick={() => setActiveTab('curve')}
                                    className={`px-3.5 py-1.5 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                                        activeTab === 'curve'
                                            ? 'bg-[var(--cyan)] text-[var(--accent-ink)] font-black '
                                            : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white'
                                    }`}
                                >
                                    <BarChart2 size={13} /> {t12(language, 'Torque-Speed Curve (Kloss)', 'Tork-Hız Eğrisi (Kloss)')}
                                </button>
                            </div>

                            <span className="text-[10px] font-mono text-cyan-400 font-bold bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/20">
                                IEC {results.matchedMotor.frame} · {results.matchedMotor.powerKw} kW
                            </span>
                        </div>

                        {/* Visual Canvas Area */}
                        <div className="flex-1 relative min-h-[300px] flex items-center justify-center p-6">
                            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

                            {activeTab === 'blueprint' ? (
                                <ElectricMotorCADVisualizer motor={results.matchedMotor} rpm={results.nominalRpm} loadFactor={results.loadFactor} />
                            ) : (
                                <TorqueSpeedCurveVisualizer 
                                    motor={results.matchedMotor} 
                                    nominalTorque={results.nominalTorque} 
                                    nominalRpm={results.nominalRpm}
                                    operatingTorque={(9549.3 * results.requiredMotorPowerKw) / results.nominalRpm}
                                    loadType={PRESETS.find(p => p.id === selectedPreset)?.loadType || 'constant'}
                                />
                            )}
                        </div>
                    </div>

                    {/* ═════════════════════════════════════════════════════════ */}
                    {/* RIGHT SPECIFICATION & ELECTRICAL SWITCHGEAR PANEL        */}
                    {/* ═════════════════════════════════════════════════════════ */}
                    <div className="2xl:w-[420px] shrink-0 m-6 2xl:ml-0 overflow-y-auto custom-scrollbar flex flex-col gap-4">
                        
                        {/* 1. Electrical Sizing & Protection (Şalt & Kablo) */}
                        <div className="rounded-2xl border border-white/10 bg-[var(--bg-1)]/80 p-5 space-y-4">
                            <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                                <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
                                    <Cable size={13} /> {t12(language, 'Electrical Switchgear & Protection (400V)', 'Elektrik Şalt & Koruma (400V)')}
                                </span>
                                <span className="text-[9px] font-mono text-gray-500">IEC 60947</span>
                            </div>

                            <div className="space-y-2.5">
                                <SpecRow label={t12(language, 'Nominal Current (In)', 'Nominal Akım (In)')} value={`${results.nominalCurrent.toFixed(1)} A`} highlight />
                                <SpecRow label={t12(language, 'Starting Current (Is)', 'Kalkış Akımı (Is)')} value={`${results.startingCurrent.toFixed(1)} A (${results.matchedMotor.is_in}x In)`} />
                                <SpecRow label={t12(language, 'Thermal Overload Relay', 'Termik Röle Ayarı')} value={`${results.thermalRelaySetting} A (1.05 × In)`} />
                                <SpecRow label={t12(language, 'Motor Protection Breaker (MPCB)', 'Motor Koruma Şalteri (MPCB)')} value={`${results.mpcbMin} - ${results.mpcbMax} A`} />
                                <SpecRow label={t12(language, 'Recommended Contactor (AC-3)', 'Önerilen Kontaktör (AC-3)')} value={`Min. ${results.contactorRating} A`} />
                                <SpecRow label={t12(language, 'Backup Fuse (aM/gG)', 'Şebeke Sigortası (aM/gG)')} value={`${results.fuseRatingAm} A`} />
                                <SpecRow label={t12(language, 'Recommended Copper Cable', 'Önerilen Bakır Kablo')} value={results.cableSize} color="#10b981" />
                            </div>
                        </div>

                        {/* 2. IEC 60072-1 Mechanical Standard Dimensions */}
                        <div className="rounded-2xl border border-white/10 bg-[var(--bg-1)]/80 p-5 space-y-4">
                            <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                                <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
                                    <Box size={13} /> {t12(language, 'IEC 60072-1 Mechanical Dimensions', 'IEC 60072-1 Mekanik Boyutlar')}
                                </span>
                                <span className="text-[9px] font-mono text-gray-500">{t12(language, 'Frame', 'Gövde')}: {results.matchedMotor.frame}</span>
                            </div>

                            <div className="grid grid-cols-3 gap-2 text-center font-mono">
                                <DimBox label={t12(language, 'Shaft Dia (D)', 'Şaft Çapı (D)')} value={`Ø${results.matchedMotor.shaftD} mm`} />
                                <DimBox label={t12(language, 'Shaft Len (E)', 'Şaft Boyu (E)')} value={`${results.matchedMotor.shaftE} mm`} />
                                <DimBox label={t12(language, 'Center Ht (H)', 'Eksen Yük. (H)')} value={`${results.matchedMotor.centerH} mm`} />
                                <DimBox label={t12(language, 'Foot Hole (A)', 'Ayak Aralığı (A)')} value={`${results.matchedMotor.footA} mm`} />
                                <DimBox label={t12(language, 'Foot Hole (B)', 'Ayak Aralığı (B)')} value={`${results.matchedMotor.footB} mm`} />
                                <DimBox label={t12(language, 'Flange PCD (M)', 'Flanş PCD (M)')} value={`Ø${results.matchedMotor.flangeM} mm`} />
                            </div>
                        </div>

                        {/* 3. Energy Analytics & ROI (Enerji Tasarrufu) */}
                        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/10 p-5 space-y-3">
                            <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2">
                                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                                    <Sparkles size={13} /> {t12(language, 'Annual Energy & Efficiency', 'Yıllık Enerji & Verimlilik')}
                                </span>
                                <span className="text-[9px] font-mono text-emerald-400/80">{effClass} (%{results.matchedMotor.ie3_eff})</span>
                            </div>

                            <div className="space-y-2 text-xs font-mono">
                                <div className="flex justify-between text-gray-300">
                                    <span>{t12(language, 'Annual Consumption:', 'Yıllık Tüketim:')}</span>
                                    <span className="font-bold text-white">{Math.round(results.annualEnergyKwh).toLocaleString()} {t12(language, 'kWh/yr', 'kWh/yıl')}</span>
                                </div>
                                <div className="flex justify-between text-gray-300">
                                    <span>{t12(language, 'Annual Electricity Cost:', 'Yıllık Elektrik Maliyeti:')}</span>
                                    <span className="font-bold text-white">${Math.round(results.annualCost).toLocaleString()} {t12(language, '/yr', '/yıl')}</span>
                                </div>
                                <div className="flex justify-between text-emerald-400 font-bold border-t border-emerald-500/10 pt-1.5">
                                    <span>{t12(language, 'IE3 vs IE1 Annual Savings:', 'IE3 vs IE1 Yıllık Tasarruf:')}</span>
                                    <span>${Math.round(results.annualSavingsCost).toLocaleString()} {t12(language, '/yr', '/yıl')}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// SUBCOMPONENTS: 2D MOTOR CAD VISUALIZER & TORQUE-SPEED KLOSS PLOTTER
// ═══════════════════════════════════════════════════════════════════════════

function ElectricMotorCADVisualizer({ motor, rpm, loadFactor }: { motor: IECMotorData; rpm: number; loadFactor: number }) {
    const { language } = useI18nStore();
    const dur = rpm > 0 ? Math.max((60 / rpm) * 4, 0.25) : 0;

    return (
        <div className="w-full h-full flex flex-col items-center justify-center relative">
            <svg viewBox="0 0 660 300" className="w-full h-full max-h-[380px] select-none" preserveAspectRatio="xMidYMid meet">
                <defs>
                    {/* Gradients */}
                    <linearGradient id="castIronHousingGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#334155" />
                        <stop offset="30%" stopColor="#1e293b" />
                        <stop offset="70%" stopColor="#0f172a" />
                        <stop offset="100%" stopColor="#020617" />
                    </linearGradient>
                    <linearGradient id="statorCoreGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#475569" />
                        <stop offset="50%" stopColor="#334155" />
                        <stop offset="100%" stopColor="#1e293b" />
                    </linearGradient>
                    <linearGradient id="rotorCylinderGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#0284c7" />
                        <stop offset="25%" stopColor="#38bdf8" />
                        <stop offset="50%" stopColor="#0369a1" />
                        <stop offset="85%" stopColor="#075985" />
                        <stop offset="100%" stopColor="#082f49" />
                    </linearGradient>
                    <linearGradient id="shaftSteelGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#e2e8f0" />
                        <stop offset="40%" stopColor="#94a3b8" />
                        <stop offset="80%" stopColor="#475569" />
                        <stop offset="100%" stopColor="#334155" />
                    </linearGradient>
                    <linearGradient id="copperWindingGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#b45309" />
                        <stop offset="30%" stopColor="#f59e0b" />
                        <stop offset="70%" stopColor="#d97706" />
                        <stop offset="100%" stopColor="#78350f" />
                    </linearGradient>
                    <linearGradient id="fluxGlowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#38bdf8" stopOpacity="0" />
                        <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
                    </linearGradient>

                    {/* Clip path for seamless horizontal rotor bar translation across cylinder */}
                    <clipPath id="rotorCoreClip">
                        <rect x="210" y="105" width="200" height="90" rx="4" />
                    </clipPath>
                    <clipPath id="fanShroudClip">
                        <path d="M 170,68 L 105,82 L 105,218 L 170,232 Z" />
                    </clipPath>

                    <filter id="motorCadGlow">
                        <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#000000" floodOpacity="0.75" />
                    </filter>
                </defs>

                <style>{`
                    @keyframes rotorBarTravel {
                        0% { transform: translateX(0px); }
                        100% { transform: translateX(40px); }
                    }
                    @keyframes fanStrobe {
                        0% { opacity: 0.4; }
                        50% { opacity: 0.9; }
                        100% { opacity: 0.4; }
                    }
                    @keyframes fluxPulse {
                        0% { opacity: 0.2; }
                        50% { opacity: 0.7; }
                        100% { opacity: 0.2; }
                    }
                    @keyframes shaftRingSpin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}</style>

                {/* ISO 128 Axis Centerline */}
                <line x1="40" y1="150" x2="620" y2="150" stroke="#00e5ff" strokeWidth="0.8" strokeDasharray="16 4 3 4" opacity={0.4} />

                <g filter="url(#motorCadGlow)">
                    {/* 1. Foot Mount Base (IEC B3 Foot Stand & Foundation Pad) */}
                    <rect x="180" y="240" width="280" height="18" rx="4" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
                    <rect x="200" y="254" width="46" height="10" rx="3" fill="#0f172a" stroke="#64748b" strokeWidth="1.2" />
                    <rect x="394" y="254" width="46" height="10" rx="3" fill="#0f172a" stroke="#64748b" strokeWidth="1.2" />
                    {/* Bolt Holes */}
                    <ellipse cx="223" cy="259" rx="5" ry="2" fill="#38bdf8" opacity={0.8} />
                    <ellipse cx="417" cy="259" rx="5" ry="2" fill="#38bdf8" opacity={0.8} />

                    {/* 2. Top Terminal Connection Box (Klemens Kutusu) */}
                    <rect x="260" y="32" width="100" height="34" rx="5" fill="url(#castIronHousingGrad)" stroke="#64748b" strokeWidth="1.5" />
                    {/* Cable Gland */}
                    <rect x="360" y="44" width="12" height="10" rx="2" fill="#d97706" stroke="#f59e0b" strokeWidth="0.8" />
                    {/* 3-Phase Phase Terminals (U, V, W) */}
                    <circle cx="285" cy="49" r="4.5" fill="#f59e0b" stroke="#fff" strokeWidth="0.5" />
                    <circle cx="310" cy="49" r="4.5" fill="#38bdf8" stroke="#fff" strokeWidth="0.5" />
                    <circle cx="335" cy="49" r="4.5" fill="#c084fc" stroke="#fff" strokeWidth="0.5" />
                    <text x="285" y="42" fill="#f59e0b" fontSize="7" fontFamily="monospace" textAnchor="middle" fontWeight="bold">U1</text>
                    <text x="310" y="42" fill="#38bdf8" fontSize="7" fontFamily="monospace" textAnchor="middle" fontWeight="bold">V1</text>
                    <text x="335" y="42" fill="#c084fc" fontSize="7" fontFamily="monospace" textAnchor="middle" fontWeight="bold">W1</text>

                    {/* 3. Main Stator Housing with External Cast Iron Fins */}
                    <rect x="170" y="60" width="300" height="180" rx="12" fill="url(#castIronHousingGrad)" stroke="#475569" strokeWidth="2" />
                    {/* Cooling Fins (Döküm Soğutma Kanatçıkları) */}
                    {[195, 220, 245, 270, 295, 320, 345, 370, 395, 420, 445].map(fx => (
                        <line key={fx} x1={fx} y1="60" x2={fx} y2="240" stroke="#334155" strokeWidth="3" opacity={0.6} />
                    ))}

                    {/* 4. Rear Fan Cowl (Soğutma Muhafazası) */}
                    <path d="M 170,68 L 105,82 L 105,218 L 170,232 Z" fill="url(#castIronHousingGrad)" stroke="#475569" strokeWidth="1.5" />
                    {/* Fan Louver Ventilation Slots */}
                    <line x1="115" y1="105" x2="115" y2="195" stroke="#1e293b" strokeWidth="4" strokeDasharray="8 6" />
                    <line x1="128" y1="95" x2="128" y2="205" stroke="#1e293b" strokeWidth="4" strokeDasharray="8 6" />
                    <line x1="142" y1="88" x2="142" y2="212" stroke="#1e293b" strokeWidth="4" strokeDasharray="8 6" />

                    {/* Internal Cooling Fan Impeller (Inside Shroud) */}
                    <g clipPath="url(#fanShroudClip)">
                        <rect x="125" y="90" width="22" height="120" rx="3" fill="#0284c7" stroke="#38bdf8" strokeWidth="1"
                            style={dur > 0 ? { animation: `fanStrobe ${dur.toFixed(2)}s ease-in-out infinite` } : undefined} />
                    </g>

                    {/* 5. Stator Laminated Core & Copper Windings (Top & Bottom Cutaway) */}
                    {/* Top Stator Core */}
                    <rect x="200" y="70" width="220" height="24" rx="3" fill="url(#statorCoreGrad)" stroke="#64748b" strokeWidth="1.2" />
                    <rect x="205" y="74" width="210" height="16" rx="2" fill="url(#copperWindingGrad)" stroke="#d97706" strokeWidth="1" />
                    
                    {/* Bottom Stator Core */}
                    <rect x="200" y="206" width="220" height="24" rx="3" fill="url(#statorCoreGrad)" stroke="#64748b" strokeWidth="1.2" />
                    <rect x="205" y="210" width="210" height="16" rx="2" fill="url(#copperWindingGrad)" stroke="#d97706" strokeWidth="1" />

                    {/* Air Gap Electromagnetic Flux Pulsing Layer */}
                    <rect x="208" y="96" width="204" height="6" fill="url(#fluxGlowGrad)" 
                        style={dur > 0 ? { animation: `fluxPulse ${dur.toFixed(2)}s ease-in-out infinite` } : undefined} />
                    <rect x="208" y="198" width="204" height="6" fill="url(#fluxGlowGrad)" 
                        style={dur > 0 ? { animation: `fluxPulse ${dur.toFixed(2)}s ease-in-out infinite` } : undefined} />

                    {/* 6. Precision Ground Drive Shaft */}
                    <rect x="65" y="139" width="510" height="22" rx="2" fill="url(#shaftSteelGrad)" stroke="#475569" strokeWidth="1.5" />
                    
                    {/* Keyway on Drive End (DIN 6885) */}
                    <rect x="505" y="140" width="45" height="6" rx="1" fill="#020617" stroke="#38bdf8" strokeWidth="1" />

                    {/* 7. Deep Groove Ball Bearings (DE & NDE Rulman Yuvaları) */}
                    {/* NDE Bearing */}
                    <rect x="180" y="123" width="16" height="54" rx="2" fill="#334155" stroke="#94a3b8" strokeWidth="1.5" />
                    <circle cx="188" cy="132" r="3.5" fill="#e2e8f0" />
                    <circle cx="188" cy="168" r="3.5" fill="#e2e8f0" />

                    {/* DE Bearing */}
                    <rect x="424" y="123" width="16" height="54" rx="2" fill="#334155" stroke="#94a3b8" strokeWidth="1.5" />
                    <circle cx="432" cy="132" r="3.5" fill="#e2e8f0" />
                    <circle cx="432" cy="168" r="3.5" fill="#e2e8f0" />

                    {/* 8. SQUIRREL CAGE ROTOR (Döner Sincap Kafesli Rotor - Doğru Eksenel Kesit) */}
                    {/* Rotor Body Cylinder */}
                    <rect x="210" y="105" width="200" height="90" rx="4" fill="url(#rotorCylinderGrad)" stroke="#38bdf8" strokeWidth="1.5" />
                    
                    {/* Rotor End-Rings (Kısa Devre Bakır/Alüminyum Halkaları) */}
                    <rect x="210" y="105" width="12" height="90" fill="#f59e0b" opacity={0.7} />
                    <rect x="398" y="105" width="12" height="90" fill="#f59e0b" opacity={0.7} />

                    {/* Skewed Rotor Bars Seamless Horizontal Traversal (Simulating True Cylindrical Rotation) */}
                    <g clipPath="url(#rotorCoreClip)">
                        <g style={dur > 0 ? {
                            animation: `rotorBarTravel ${dur.toFixed(3)}s linear infinite`
                        } : undefined}>
                            {[-80, -40, 0, 40, 80, 120, 160, 200, 240, 280, 320, 360, 400, 440].map(bx => (
                                <line 
                                    key={bx} 
                                    x1={210 + bx - 10} 
                                    y1="105" 
                                    x2={210 + bx + 10} 
                                    y2="195" 
                                    stroke="#e0f2fe" 
                                    strokeWidth="3.5" 
                                    strokeLinecap="round"
                                    opacity={0.85} 
                                />
                            ))}
                        </g>
                    </g>

                    {/* 9. Front Flange End Shield (DE Kapak) */}
                    <rect x="450" y="66" width="18" height="168" rx="4" fill="url(#castIronHousingGrad)" stroke="#64748b" strokeWidth="1.5" />

                    {/* 10. Live Rotational Vector Arrow on Output Shaft */}
                    <g transform="translate(565, 150)">
                        <circle cx="0" cy="0" r="18" fill="none" stroke="#00e5ff" strokeWidth="1.5" strokeDasharray="22 8"
                            style={dur > 0 ? { animation: `shaftRingSpin ${dur.toFixed(2)}s linear infinite` } : undefined} />
                        <polygon points="12,-6 18,0 12,6" fill="#00e5ff" />
                    </g>

                    {/* 11. Technical Dimension Callouts (ISO 129 Annotations) */}
                    <g opacity={0.9}>
                        {/* Shaft Diameter Dimension */}
                        <line x1="535" y1="126" x2="535" y2="174" stroke="#38bdf8" strokeWidth="1" strokeDasharray="2 2" />
                        <line x1="530" y1="139" x2="540" y2="139" stroke="#38bdf8" strokeWidth="1" />
                        <line x1="530" y1="161" x2="540" y2="161" stroke="#38bdf8" strokeWidth="1" />
                        <text x="546" y="153" fill="#38bdf8" fontSize="10" fontFamily="monospace" fontWeight="bold">Ø{motor.shaftD} mm</text>
                        
                        {/* Center Height H Dimension */}
                        <line x1="150" y1="150" x2="150" y2="254" stroke="#f59e0b" strokeWidth="1" strokeDasharray="2 2" />
                        <line x1="145" y1="150" x2="155" y2="150" stroke="#f59e0b" strokeWidth="1.2" />
                        <line x1="145" y1="254" x2="155" y2="254" stroke="#f59e0b" strokeWidth="1.2" />
                        <text x="110" y="206" fill="#f59e0b" fontSize="10" fontFamily="monospace" fontWeight="bold">H={motor.centerH}</text>

                        {/* Overall Length Reference Line */}
                        <line x1="105" y1="278" x2="575" y2="278" stroke="#64748b" strokeWidth="0.8" strokeDasharray="3 3" />
                        <line x1="105" y1="273" x2="105" y2="283" stroke="#64748b" strokeWidth="1" />
                        <line x1="575" y1="273" x2="575" y2="283" stroke="#64748b" strokeWidth="1" />
                        <text x="340" y="292" fill="#94a3b8" fontSize="9" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                            IEC {motor.frame} (L ≈ {(motor.centerH * 3.4).toFixed(0)} mm)
                        </text>
                    </g>
                </g>
            </svg>

            {/* Live Operational Status Bar Below Graphic */}
            <div className="flex items-center justify-between w-full max-w-[560px] px-4 py-1.5 mt-2 rounded-xl bg-[var(--bg-0)] border border-white/10 text-[10px] font-mono">
                <span className="text-cyan-400 font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                    {t12(language, 'SPEED:', 'DÖNÜŞ HIZI:')} {rpm.toFixed(0)} RPM
                </span>
                <span className="text-amber-400 font-bold">
                    {t12(language, 'LOAD:', 'YÜKLENME:')} %{(loadFactor * 100).toFixed(1)}
                </span>
                <span className="text-slate-400">
                    {t12(language, 'FRAME:', 'GÖVDE:')} IEC {motor.frame} {t12(language, '(B3 Foot)', '(B3 Ayaklı)')}
                </span>
            </div>
        </div>
    );
}

function TorqueSpeedCurveVisualizer({ motor, nominalTorque, nominalRpm, operatingTorque, loadType }: any) {
    const { language } = useI18nStore();
    const Ts = nominalTorque * motor.ts_tn;
    const Tk = nominalTorque * motor.tk_tn;
    const syncRpm = 1500;

    return (
        <div className="w-full h-full flex flex-col items-center justify-center p-2">
            <svg viewBox="0 0 500 240" className="w-full h-full max-w-[540px] select-none overflow-visible">
                <defs>
                    <linearGradient id="klossCurveGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#a855f7" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="#a855f7" stopOpacity="0.0" />
                    </linearGradient>
                </defs>

                {/* Grid Lines */}
                <line x1="60" y1="20" x2="60" y2="200" stroke="#334155" strokeWidth="1.2" />
                <line x1="60" y1="200" x2="460" y2="200" stroke="#334155" strokeWidth="1.2" />

                {/* Y-Axis (Torque) Labels */}
                <text x="50" y="30" fill="#a855f7" fontSize="9" textAnchor="end" fontFamily="monospace">Tk ({Tk.toFixed(0)} N·m)</text>
                <text x="50" y="110" fill="#38bdf8" fontSize="9" textAnchor="end" fontFamily="monospace">Tn ({nominalTorque.toFixed(0)} N·m)</text>
                <text x="50" y="150" fill="#f59e0b" fontSize="9" textAnchor="end" fontFamily="monospace">Ts ({Ts.toFixed(0)} N·m)</text>
                <text x="50" y="200" fill="#64748b" fontSize="9" textAnchor="end" fontFamily="monospace">0</text>

                {/* X-Axis (Speed) Labels */}
                <text x="60" y="215" fill="#64748b" fontSize="9" textAnchor="middle" fontFamily="monospace">0 RPM</text>
                <text x="390" y="215" fill="#38bdf8" fontSize="9" textAnchor="middle" fontFamily="monospace">{nominalRpm} (Tn)</text>
                <text x="450" y="215" fill="#94a3b8" fontSize="9" textAnchor="middle" fontFamily="monospace">{syncRpm} (N_sync)</text>

                {/* Kloss Asynchronous Motor Characteristic Torque-Speed Curve Path */}
                <path
                    d="M 60,150 Q 140,140 240,65 Q 320,25 385,110 L 450,200 L 60,200 Z"
                    fill="url(#klossCurveGrad)"
                />
                <path
                    d="M 60,150 Q 140,140 240,65 Q 320,25 385,110 L 450,200"
                    fill="none"
                    stroke="#c084fc"
                    strokeWidth="2.5"
                />

                {/* Load Curve (Sabit Tork veya Karesel Pompa/Fan Eğrisi) */}
                {loadType === 'quadratic' ? (
                    <path
                        d="M 60,195 Q 260,185 385,115"
                        fill="none"
                        stroke="#f59e0b"
                        strokeWidth="2"
                        strokeDasharray="5 3"
                    />
                ) : (
                    <line x1="60" y1="115" x2="440" y2="115" stroke="#f59e0b" strokeWidth="2" strokeDasharray="5 3" />
                )}

                {/* Operating Point Marker */}
                <circle cx="385" cy="112" r="5" fill="#00e5ff" stroke="#ffffff" strokeWidth="2" />
                <line x1="385" y1="112" x2="385" y2="200" stroke="#00e5ff" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="60" y1="112" x2="385" y2="112" stroke="#00e5ff" strokeWidth="1" strokeDasharray="3 3" />

                <text x="395" y="105" fill="#00e5ff" fontSize="10" fontWeight="bold" fontFamily="monospace">{t12(language, 'Operating Point', 'Çalışma Noktası')}</text>
            </svg>
            
            <div className="flex items-center gap-6 mt-1 text-[10px] font-mono text-gray-400">
                <div className="flex items-center gap-1.5"><span className="w-3 h-1 bg-[#c084fc] rounded" /> {t12(language, 'Motor Characteristic (Kloss)', 'Motor Karakteristiği (Kloss)')}</div>
                <div className="flex items-center gap-1.5"><span className="w-3 h-1 bg-[var(--warn)] rounded border-b border-dashed" /> {t12(language, 'Load Curve', 'Yük Eğrisi')} ({loadType === 'quadratic' ? t12(language, 'Fan/Pump T∝n²', 'Fan/Pompa T∝n²') : t12(language, 'Constant Torque', 'Sabit Tork')})</div>
            </div>
        </div>
    );
}

function NumericInput({ label, unit, value, min, max, step, onChange, desc }: any) {
    return (
        <div>
            <div className="flex items-center justify-between mb-1">
                <label className="text-[9.5px] font-black text-gray-400 uppercase tracking-wider">{label}</label>
                <span className="text-[10px] font-mono font-bold text-cyan-400">{value} {unit}</span>
            </div>
            <input
                type="number"
                value={value}
                min={min} max={max} step={step}
                onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
                className="w-full bg-[var(--bg-0)] border border-white/10 focus:border-cyan-500/50 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-white outline-none transition-all"
            />
            {desc && <p className="text-[8.5px] text-gray-500 mt-0.5 italic">{desc}</p>}
        </div>
    );
}

function QuickStatCard({ label, value, sub, color, icon }: any) {
    return (
        <div className="rounded-2xl border border-white/10 bg-[var(--bg-1)]/90 p-4 relative overflow-hidden group">
            <div className="flex items-center justify-between mb-1.5">
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{label}</span>
                <span style={{ color }}>{icon}</span>
            </div>
            <div className="text-2xl font-black font-mono tracking-tight" style={{ color }}>
                {value}
            </div>
            <div className="text-[9.5px] font-mono text-gray-400 mt-1 truncate">
                {sub}
            </div>
        </div>
    );
}

function SpecRow({ label, value, highlight, color }: any) {
    return (
        <div className={`flex items-center justify-between text-xs font-mono py-1.5 border-b border-white/[0.04] ${highlight ? 'text-cyan-300 font-bold' : 'text-gray-300'}`}>
            <span className="text-[11px] text-gray-400">{label}:</span>
            <span className="font-bold" style={{ color }}>{value}</span>
        </div>
    );
}

function DimBox({ label, value }: any) {
    return (
        <div className="p-2 rounded-xl bg-white/[0.03] border border-white/5">
            <div className="text-[8.5px] text-gray-500 uppercase">{label}</div>
            <div className="text-xs font-bold text-amber-300 mt-0.5">{value}</div>
        </div>
    );
}
