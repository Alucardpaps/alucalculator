import { EngineeringUnit } from '@/types/engineering';

export interface UnitDefinition {
    unit: EngineeringUnit;
    label: string;
    factorToBase: number; // Multiply by this to get base unit value
}

export type UnitCategory =
    | 'length'
    | 'area'
    | 'force'
    | 'pressure'
    | 'torque'
    | 'energy'
    | 'power'
    | 'angle'
    | 'temperature'
    | 'time'
    | 'dimensionless';

export const UNIT_CATEGORIES: Record<UnitCategory, { baseUnit: EngineeringUnit; units: Record<string, UnitDefinition> }> = {
    length: {
        baseUnit: 'm',
        units: {
            'm': { unit: 'm', label: 'Meter (m)', factorToBase: 1 },
            'mm': { unit: 'mm', label: 'Millimeter (mm)', factorToBase: 0.001 },
            'inch': { unit: 'inch', label: 'Inch (in)', factorToBase: 0.0254 },
            'ft': { unit: 'ft', label: 'Foot (ft)', factorToBase: 0.3048 }
        }
    },
    area: {
        baseUnit: 'm2',
        units: {
            'm2': { unit: 'm2', label: 'Square Meter (m²)', factorToBase: 1 },
            'cm2': { unit: 'cm2', label: 'Square Centimeter (cm²)', factorToBase: 0.0001 },
            'mm2': { unit: 'mm2', label: 'Square Millimeter (mm²)', factorToBase: 0.000001 }
        }
    },
    force: {
        baseUnit: 'N',
        units: {
            'N': { unit: 'N', label: 'Newton (N)', factorToBase: 1 },
            'kN': { unit: 'kN', label: 'Kilonewton (kN)', factorToBase: 1000 },
            'lbf': { unit: 'lbf', label: 'Pound-Force (lbf)', factorToBase: 4.44822 }
        }
    },
    pressure: {
        baseUnit: 'Pa',
        units: {
            'Pa': { unit: 'Pa', label: 'Pascal (Pa)', factorToBase: 1 },
            'kPa': { unit: 'kPa' as any, label: 'Kilopascal (kPa)', factorToBase: 1000 },
            'MPa': { unit: 'MPa', label: 'Megapascal (MPa)', factorToBase: 1000000 },
            'GPa': { unit: 'GPa', label: 'Gigapascal (GPa)', factorToBase: 1000000000 },
            'bar': { unit: 'bar', label: 'Bar', factorToBase: 100000 },
            'psi': { unit: 'psi', label: 'PSI', factorToBase: 6894.76 }
        }
    },
    torque: {
        baseUnit: 'Nm',
        units: {
            'Nm': { unit: 'Nm', label: 'Newton Meter (Nm)', factorToBase: 1 },
            'kNm': { unit: 'kNm', label: 'Kilonewton Meter (kNm)', factorToBase: 1000 }
        }
    },
    energy: {
        baseUnit: 'J',
        units: {
            'J': { unit: 'J', label: 'Joule (J)', factorToBase: 1 },
            'kJ': { unit: 'kJ', label: 'Kilojoule (kJ)', factorToBase: 1000 },
            'kWh': { unit: 'kWh', label: 'Kilowatt-Hour (kWh)', factorToBase: 3600000 }
        }
    },
    power: {
        baseUnit: 'W',
        units: {
            'W': { unit: 'W', label: 'Watt (W)', factorToBase: 1 },
            'kW': { unit: 'kW', label: 'Kilowatt (kW)', factorToBase: 1000 },
            'HP': { unit: 'HP', label: 'Horsepower (HP)', factorToBase: 745.7 }
        }
    },
    angle: {
        baseUnit: 'rad',
        units: {
            'rad': { unit: 'rad', label: 'Radian (rad)', factorToBase: 1 },
            'deg': { unit: 'deg', label: 'Degree (°)', factorToBase: Math.PI / 180 }
        }
    },
    temperature: {
        baseUnit: '°C',
        units: {
            '°C': { unit: '°C', label: 'Celsius (°C)', factorToBase: 1 },
            '°F': { unit: '°F', label: 'Fahrenheit (°F)', factorToBase: 1 },
            'K': { unit: 'K', label: 'Kelvin (K)', factorToBase: 1 }
        }
    },
    time: {
        baseUnit: 's',
        units: {
            's': { unit: 's', label: 'Second (s)', factorToBase: 1 },
            'min': { unit: 'min', label: 'Minute (min)', factorToBase: 60 },
            'hours': { unit: 'hours', label: 'Hour (h)', factorToBase: 3600 }
        }
    },
    dimensionless: {
        baseUnit: '-',
        units: {
            '-': { unit: '-', label: 'Dimensionless', factorToBase: 1 },
            '%': { unit: '%', label: 'Percentage (%)', factorToBase: 0.01 },
            'ratio': { unit: 'ratio', label: 'Ratio', factorToBase: 1 }
        }
    }
};

/**
 * Returns the unit category of a given EngineeringUnit, or null if not found.
 */
export function getUnitCategory(unit: EngineeringUnit): UnitCategory | null {
    for (const [category, def] of Object.entries(UNIT_CATEGORIES)) {
        if (def.units[unit as string]) {
            return category as UnitCategory;
        }
    }
    return null;
}

/**
 * Safely converts a numerical value from one unit to another.
 * Throws an error if units are incompatible.
 */
export function convertUnit(value: number, from: EngineeringUnit, to: EngineeringUnit): number {
    if (from === to) return value;

    const fromCat = getUnitCategory(from);
    const toCat = getUnitCategory(to);

    if (!fromCat || !toCat || fromCat !== toCat) {
        throw new Error(`Incompatible unit conversion from "${from}" to "${to}"`);
    }

    // Special case for temperature conversions
    if (fromCat === 'temperature') {
        let tempInC = value;
        if (from === '°F') {
            tempInC = (value - 32) * 5 / 9;
        } else if (from === 'K') {
            tempInC = value - 273.15;
        }

        if (to === '°C') return tempInC;
        if (to === '°F') return (tempInC * 9 / 5) + 32;
        if (to === 'K') return tempInC + 273.15;
        return value;
    }

    // Standard linear scaling conversions
    const fromDef = UNIT_CATEGORIES[fromCat].units[from as string];
    const toDef = UNIT_CATEGORIES[toCat].units[to as string];

    const valueInBase = value * fromDef.factorToBase;
    return valueInBase / toDef.factorToBase;
}
