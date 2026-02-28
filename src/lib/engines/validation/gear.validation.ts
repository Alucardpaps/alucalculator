/**
 * 🏛️ ALUCALCULATOR ENGINE - VALIDATION
 * "Quality Control"
 */

import { ValidationError } from "../../kernel/errors";
import { InvoluteParams } from "../math/involute";

export class GearValidator {
    static validate(params: InvoluteParams): void {
        if (params.module <= 0) {
            throw new ValidationError("Module must be > 0");
        }
        if (params.teeth < 3) {
            throw new ValidationError("Gear must have at least 3 teeth");
        }
        if (params.teeth % 1 !== 0) {
            throw new ValidationError("Teeth count must be an integer");
        }

        // DIN 3960 Basic Rack limits
        if (params.pressureAngleDeg < 0 || params.pressureAngleDeg > 45) {
            throw new ValidationError("Pressure angle out of standard range (0-45)");
        }
    }
}
