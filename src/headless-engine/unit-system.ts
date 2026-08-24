import * as math from 'mathjs';

export class UnitSystem {
  static convert(value: number, fromUnit: string, toUnit: string): number {
    if (fromUnit === toUnit) return value;
    
    try {
       return math.unit(value, fromUnit).toNumber(toUnit);
    } catch (e) {
       return value;
    }
  }
}
