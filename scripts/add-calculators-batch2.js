const fs = require('fs');
const path = require('path');

const jsonPath = path.join(__dirname, '..', 'src', 'data', 'seo-calculators', 'calculators.json');
const existing = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

const BATCH2 = [
  {
    "id": "power-electrical-calc",
    "title": "Power Calculator — Electrical (Formula + Example + Step-by-Step)",
    "slug": "power-electrical-calc",
    "keyword": "electrical power calculator",
    "category": "electrical",
    "intent": "professional_handbook",
    "meta": {
      "title": "Electrical Power Calculator — AC/DC Formula, Example & Guide | AluCalc",
      "description": "Free electrical power calculator for AC and DC circuits. Calculate watts from voltage, current, and power factor using P = V × I × cos(φ). Includes single-phase and three-phase examples."
    },
    "seo": {
      "h1": "Electrical Power Calculator — Formula, Example & Step-by-Step Guide",
      "intro": "Electrical power calculation determines the real power consumed or delivered in AC and DC circuits. For DC circuits, power is simply P = V × I. For single-phase AC circuits, the power factor cos(φ) must be included: P = V × I × cos(φ). The power factor accounts for the phase difference between voltage and current waveforms caused by reactive components (inductors and capacitors). A power factor of 1.0 means all power does useful work; below 0.85 typically incurs utility penalties. This calculator is essential for electrical panel sizing, motor circuit design, generator capacity planning, and energy efficiency analysis in industrial and commercial installations.",
      "formula": "P = V * I * cos(phi)",
      "variables": {
        "P": "Real (active) power (W)",
        "V": "Voltage (V)",
        "I": "Current (A)",
        "phi": "Phase angle between V and I"
      },
      "step_by_step": "1. Measure or determine the circuit voltage V (line-to-neutral for single-phase, line-to-line for three-phase).\n2. Measure or calculate the circuit current I in amperes.\n3. Determine the power factor cos(φ): 0.80–0.85 for motors, 0.95+ for resistive loads, 1.0 for heating elements.\n4. For single-phase: P = V × I × cos(φ).\n5. For three-phase: P = √3 × V_LL × I_L × cos(φ).\n6. Calculate apparent power S = V × I (VA) and reactive power Q = V × I × sin(φ) (VAR) for complete power triangle analysis.",
      "practical": "Electrical power calculations are fundamental to every electrical installation. Sizing a motor circuit breaker requires knowing the full-load current, which derives from the power equation solved for I. Industrial plants with large motor loads often have poor power factor (0.7–0.8), requiring capacitor banks for correction to avoid utility surcharges. Generator sizing must account for apparent power (kVA), not just real power (kW), because generators are limited by their current capacity. In data centers, Power Usage Effectiveness (PUE) calculations compare total facility power to IT equipment power. Solar inverter sizing requires matching the DC input power to the AC output capacity considering efficiency losses and power factor of connected loads.",
      "example": "Problem: A single-phase 230V motor draws 12A at power factor 0.85. Calculate real, apparent, and reactive power. Solution: P = 230 × 12 × 0.85 = 2,346 W (2.35 kW). S = 230 × 12 = 2,760 VA (2.76 kVA). Q = 2760 × sin(arccos(0.85)) = 2760 × 0.527 = 1,454 VAR.",
      "technical_data": [{"name": "Typical Power Factors", "rows": [{"Load": "Resistive heater", "PF": "1.00"}, {"Load": "LED lighting", "PF": "0.90–0.95"}, {"Load": "Induction motor", "PF": "0.80–0.85"}, {"Load": "Welding machine", "PF": "0.50–0.70"}]}],
      "checklist": ["Verify single-phase vs three-phase configuration", "Include power factor in all AC calculations", "Check cable sizing for apparent power, not real power"],
      "pitfalls": ["Confusing kW with kVA", "Ignoring power factor for motor loads"],
      "faq": [
        {"q": "What is electrical power?", "a": "Electrical power is the rate at which electrical energy is transferred. Real power (watts) does useful work. Apparent power (VA) includes reactive components."},
        {"q": "How do you calculate AC power?", "a": "For single-phase AC: P = V × I × cos(φ). For three-phase: P = √3 × V_line × I_line × cos(φ). The power factor cos(φ) accounts for the phase difference."},
        {"q": "Why is power factor important?", "a": "Low power factor means more current flows than necessary to deliver useful power, increasing cable losses, transformer loading, and utility penalties."}
      ]
    },
    "cta": {"label": "Open in AluCalc OS", "link": "/ohms-law"},
    "relatedCalculators": [
      {"title": "Motor Power Calculator", "slug": "motor-power-calc"},
      {"title": "Voltage Drop Calculator", "slug": "voltage-drop"},
      {"title": "Bolt Torque Calculator", "slug": "bolt-torque-calc"},
      {"title": "Heat Transfer Calculator", "slug": "heat-transfer-calc"}
    ]
  },
  {
    "id": "pressure-drop-calc",
    "title": "Pressure Drop Calculator (Formula + Example + Step-by-Step)",
    "slug": "pressure-drop-calc",
    "keyword": "pressure drop calculator",
    "category": "fluid",
    "intent": "professional_handbook",
    "meta": {
      "title": "Pressure Drop Calculator — Darcy-Weisbach Formula, Example & Guide | AluCalc",
      "description": "Free pipe pressure drop calculator using Darcy-Weisbach equation. Calculate friction losses in pipes with ΔP = f(L/D)(ρv²/2). Includes Moody chart friction factors."
    },
    "seo": {
      "h1": "Pressure Drop Calculator — Formula, Example & Step-by-Step Guide",
      "intro": "Pressure drop calculation determines the loss of fluid pressure due to friction as fluid flows through pipes, ducts, and fittings. The Darcy-Weisbach equation ΔP = f × (L/D) × (ρv²/2) is the standard method for calculating friction losses in both laminar and turbulent flow. The friction factor f depends on the Reynolds number and pipe roughness, typically determined from the Moody chart or Colebrook equation. Accurate pressure drop prediction is essential for pump sizing, HVAC duct design, chemical process piping, fire suppression systems, and oil & gas pipeline engineering. Undersized pipes waste pump energy; oversized pipes waste capital cost.",
      "formula": "dP = f * (L / D) * (rho * v^2 / 2)",
      "variables": {
        "dP": "Pressure drop (Pa)",
        "f": "Darcy friction factor (dimensionless)",
        "L": "Pipe length (m)",
        "D": "Internal pipe diameter (m)",
        "rho": "Fluid density (kg/m³)",
        "v": "Flow velocity (m/s)"
      },
      "step_by_step": "1. Calculate flow velocity v = Q/A, where Q is volumetric flow rate and A = πD²/4.\n2. Calculate Reynolds number Re = ρvD/μ. If Re < 2300, flow is laminar; if > 4000, turbulent.\n3. For laminar flow: f = 64/Re. For turbulent flow: use Moody chart or Colebrook equation.\n4. Apply Darcy-Weisbach: ΔP = f × (L/D) × (ρv²/2).\n5. Add minor losses from fittings: ΔP_fitting = K × (ρv²/2), where K is the loss coefficient.\n6. Sum all pressure drops: ΔP_total = ΔP_friction + ΣΔP_fittings.",
      "practical": "Pressure drop is the dominant calculation in fluid system design. Every pump must overcome the total system pressure drop to maintain design flow rates. In HVAC systems, duct pressure drop determines fan sizing and energy consumption — a poorly designed duct system wastes significant energy over the building's lifetime. Chemical process engineers use pressure drop calculations to size control valves and ensure process fluids reach reactors at required pressures. In oil pipelines spanning hundreds of kilometers, even small friction factor errors translate to millions of dollars in pumping costs. Fire protection engineers must verify that sprinkler systems maintain minimum pressure at the most remote head. The Darcy-Weisbach equation is preferred over the older Hazen-Williams formula because it is valid for any fluid, not just water.",
      "example": "Problem: Water (ρ = 998 kg/m³, μ = 0.001 Pa·s) flows at 2 m/s through a 50mm steel pipe (ε = 0.045 mm) for 100 m. Solution: Re = 998×2×0.05/0.001 = 99,800 (turbulent). f ≈ 0.018 (from Moody chart). ΔP = 0.018 × (100/0.05) × (998 × 4/2) = 0.018 × 2000 × 1996 = 71,856 Pa ≈ 0.72 bar.",
      "technical_data": [{"name": "Pipe Roughness Values", "rows": [{"Material": "PVC/Plastic", "ε (mm)": "0.0015"}, {"Material": "Copper", "ε (mm)": "0.0015"}, {"Material": "Commercial steel", "ε (mm)": "0.045"}, {"Material": "Cast iron", "ε (mm)": "0.26"}]}],
      "checklist": ["Verify Reynolds number regime", "Include fitting losses", "Check units consistency"],
      "pitfalls": ["Using Fanning friction factor instead of Darcy (4× difference)", "Ignoring pipe roughness in turbulent flow"],
      "faq": [
        {"q": "What is pressure drop?", "a": "Pressure drop is the reduction in fluid pressure as it flows through pipes and fittings due to friction between the fluid and pipe walls."},
        {"q": "How do you calculate pressure drop in a pipe?", "a": "Use the Darcy-Weisbach equation: ΔP = f(L/D)(ρv²/2), where f is the friction factor from the Moody chart or Colebrook equation."},
        {"q": "What causes high pressure drop?", "a": "High velocity, long pipes, small diameters, rough pipe surfaces, and numerous fittings all increase pressure drop. Reducing velocity by half reduces friction loss by 75%."}
      ]
    },
    "cta": {"label": "Open in AluCalc OS", "link": "/fluid-dynamics"},
    "relatedCalculators": [
      {"title": "Pump Performance", "slug": "pumps"},
      {"title": "Heat Transfer Calculator", "slug": "heat-transfer-calc"},
      {"title": "Power Calculator", "slug": "power-electrical-calc"},
      {"title": "Beam Deflection Calculator", "slug": "beam-deflection-calc"}
    ]
  },
  {
    "id": "heat-transfer-calc",
    "title": "Heat Transfer Calculator (Formula + Example + Step-by-Step)",
    "slug": "heat-transfer-calc",
    "keyword": "heat transfer calculator",
    "category": "mechanical",
    "intent": "professional_handbook",
    "meta": {
      "title": "Heat Transfer Calculator — Formula, Example & Step-by-Step Guide | AluCalc",
      "description": "Free heat transfer calculator. Calculate heat flow using Q = U × A × ΔT for conduction, convection, and overall heat transfer. Includes U-value tables."
    },
    "seo": {
      "h1": "Heat Transfer Calculator — Formula, Example & Step-by-Step Guide",
      "intro": "Heat transfer calculation determines the rate of thermal energy flow between systems at different temperatures. The general heat transfer equation Q = U × A × ΔT applies to conduction through walls, convection from surfaces, and overall heat exchanger performance. U is the overall heat transfer coefficient (combining conduction and convection resistances), A is the heat transfer area, and ΔT is the temperature difference. This is essential for heat exchanger sizing, building insulation design, electronic cooling, engine thermal management, and any system where temperature control is critical. Understanding the three modes — conduction, convection, and radiation — is fundamental to thermal engineering.",
      "formula": "Q = U * A * dT",
      "variables": {
        "Q": "Heat transfer rate (W)",
        "U": "Overall heat transfer coefficient (W/m²·K)",
        "A": "Heat transfer area (m²)",
        "dT": "Temperature difference (K or °C)"
      },
      "step_by_step": "1. Identify the hot and cold temperatures and calculate ΔT. For heat exchangers, use LMTD (log mean temperature difference).\n2. Determine the heat transfer area A: for a pipe, A = π × D × L.\n3. Calculate or look up the overall U-value: for a wall, 1/U = 1/h₁ + t/k + 1/h₂ (convection + conduction + convection).\n4. Apply Q = U × A × ΔT.\n5. For multi-layer walls: sum thermal resistances R = Σ(t/k) + Σ(1/h).\n6. Verify the result against energy balance: Q = ṁ × cp × ΔT for the fluid side.",
      "practical": "Heat transfer calculations appear in virtually every engineering discipline. HVAC engineers calculate building heat loss to size boilers and air conditioning units. Chemical engineers design shell-and-tube heat exchangers to recover process heat, saving millions in energy costs. Electronics engineers must dissipate CPU heat through heatsinks and fans — a smartphone processor generates 5–10W in an area smaller than a coin. Automotive engineers design radiators to reject 30–50 kW of engine waste heat. Building insulation U-values directly determine heating energy consumption and are regulated by building codes worldwide. In cryogenic engineering, minimizing heat leak into LNG tanks requires multi-layer vacuum insulation with U-values below 0.01 W/m²·K.",
      "example": "Problem: Calculate heat loss through a 3m × 4m brick wall (thickness 230mm, k = 0.72 W/m·K). Inside temp: 22°C, outside: -5°C. Inside film h₁ = 8 W/m²·K, outside h₂ = 25 W/m²·K. Solution: A = 12 m². R_total = 1/8 + 0.23/0.72 + 1/25 = 0.125 + 0.319 + 0.04 = 0.484 m²·K/W. U = 1/0.484 = 2.066 W/m²·K. Q = 2.066 × 12 × 27 = 669 W.",
      "technical_data": [{"name": "Typical U-Values", "rows": [{"Element": "Single brick wall", "U": "2.0–3.0"}, {"Element": "Insulated cavity wall", "U": "0.3–0.5"}, {"Element": "Double glazing", "U": "2.5–3.0"}, {"Element": "Insulated roof", "U": "0.15–0.25"}]}],
      "checklist": ["Use LMTD for heat exchangers, not arithmetic mean", "Include all thermal resistances", "Verify energy balance on both fluid sides"],
      "pitfalls": ["Forgetting surface film coefficients", "Confusing conduction k-value with overall U-value"],
      "faq": [
        {"q": "What is heat transfer?", "a": "Heat transfer is the movement of thermal energy from a hotter region to a cooler region through conduction (solids), convection (fluids), or radiation (electromagnetic waves)."},
        {"q": "How do you calculate heat transfer rate?", "a": "Use Q = U × A × ΔT, where U is the overall heat transfer coefficient, A is the area, and ΔT is the temperature difference across the system."},
        {"q": "What is a U-value?", "a": "A U-value (W/m²·K) measures how effectively heat passes through a building element. Lower U-values mean better insulation. It combines conduction, convection, and radiation resistances."}
      ]
    },
    "cta": {"label": "Open in AluCalc OS", "link": "/thermal-expansion"},
    "relatedCalculators": [
      {"title": "Pressure Drop Calculator", "slug": "pressure-drop-calc"},
      {"title": "Motor Power Calculator", "slug": "motor-power-calc"},
      {"title": "Beam Deflection Calculator", "slug": "beam-deflection-calc"},
      {"title": "Power Calculator", "slug": "power-electrical-calc"}
    ]
  },
  {
    "id": "motor-power-calc",
    "title": "Motor Power Calculator (Formula + Example + Step-by-Step)",
    "slug": "motor-power-calc",
    "keyword": "motor power calculator",
    "category": "mechanical",
    "intent": "professional_handbook",
    "meta": {
      "title": "Motor Power Calculator — Torque, RPM & Efficiency Formula | AluCalc",
      "description": "Free motor power calculator. Calculate required motor power from torque, speed, and efficiency using P = T × ω / η. Includes motor selection guide."
    },
    "seo": {
      "h1": "Motor Power Calculator — Formula, Example & Step-by-Step Guide",
      "intro": "Motor power calculation determines the electrical or mechanical power required to drive a load at a specified torque and speed. The fundamental relationship P = T × ω links power (W), torque (N·m), and angular velocity (rad/s). Including the drive train efficiency η accounts for losses in gearboxes, belts, couplings, and the motor itself. This calculation is the starting point for every motor selection process — from small servo motors in robotic arms to 10+ MW drives in mining and cement mills. Selecting the correct motor size prevents overheating (undersized) and energy waste (oversized), directly impacting operational costs and equipment lifetime.",
      "formula": "P = T * omega / eta",
      "variables": {
        "P": "Required motor power (W)",
        "T": "Load torque at motor shaft (N·m)",
        "omega": "Angular velocity (rad/s) = 2πn/60",
        "eta": "Overall drive train efficiency (0–1)"
      },
      "step_by_step": "1. Determine the load torque T at the driven equipment (N·m). Include friction, gravity, and acceleration torques.\n2. Determine the required speed n (rpm) at the driven equipment.\n3. If a gearbox is used: T_motor = T_load / (i × η_gear). n_motor = n_load × i.\n4. Convert speed to angular velocity: ω = 2π × n_motor / 60.\n5. Calculate power: P = T_motor × ω.\n6. Apply service factor (1.15–1.50) and select the next standard motor size (0.37, 0.55, 0.75, 1.1, 1.5, 2.2, 3, 4, 5.5, 7.5, 11, 15, 18.5, 22, 30 kW).",
      "practical": "Motor sizing affects energy costs, reliability, and system performance. An oversized motor operates at low load factor with poor efficiency and power factor, wasting electricity over its 20+ year lifetime. An undersized motor overheats, trips on thermal protection, and fails prematurely. In conveyor design, the motor must overcome belt friction, material lift, and acceleration loads. In pump applications, power scales with the cube of flow rate — a 10% increase in flow requires 33% more power. Variable frequency drives (VFDs) allow motors to operate at optimal efficiency across varying loads but add 2–5% losses. IE3/IE4 premium efficiency motors cost more upfront but save 2–5% energy over standard motors, typically paying back within 1–2 years in continuous duty applications.",
      "example": "Problem: A conveyor requires 450 N·m torque at 60 rpm. Gearbox ratio 25:1, efficiency 95%. Motor efficiency 92%. Solution: T_motor = 450 / (25 × 0.95) = 18.95 N·m. n_motor = 60 × 25 = 1500 rpm. ω = 2π × 1500 / 60 = 157.08 rad/s. P_shaft = 18.95 × 157.08 = 2,977 W. P_electrical = 2977 / 0.92 = 3,236 W → Select 4 kW motor (next standard size with service factor).",
      "technical_data": [{"name": "Standard Motor Sizes (IEC)", "rows": [{"kW": "0.75", "Frame": "80"}, {"kW": "1.5", "Frame": "90S"}, {"kW": "4.0", "Frame": "112M"}, {"kW": "7.5", "Frame": "132S"}, {"kW": "15", "Frame": "160M"}]}],
      "checklist": ["Include gearbox and coupling losses", "Apply service factor for load type", "Verify motor frame thermal capacity"],
      "pitfalls": ["Forgetting acceleration torque for cyclic loads", "Using shaft power instead of electrical input power"],
      "faq": [
        {"q": "How do you calculate motor power?", "a": "P = T × ω / η, where T is torque in N·m, ω is angular velocity in rad/s (= 2πn/60), and η is overall efficiency."},
        {"q": "What is a motor service factor?", "a": "A service factor (1.0–1.5) is a multiplier applied to the calculated power to account for overload conditions, ambient temperature, and altitude."},
        {"q": "How do you convert HP to kW?", "a": "1 HP = 0.7457 kW. Multiply horsepower by 0.7457 to get kilowatts."}
      ]
    },
    "cta": {"label": "Open in AluCalc OS", "link": "/motor-selection-std"},
    "relatedCalculators": [
      {"title": "Gear Ratio Calculator", "slug": "gear-ratio-calc"},
      {"title": "Shaft Diameter Calculator", "slug": "shaft-diameter-calc"},
      {"title": "Power Calculator (Electrical)", "slug": "power-electrical-calc"},
      {"title": "Bearing Life Calculator", "slug": "bearing-life-calc"}
    ]
  },
  {
    "id": "spring-constant-calc",
    "title": "Spring Constant Calculator (Formula + Example + Step-by-Step)",
    "slug": "spring-constant-calc",
    "keyword": "spring constant calculator",
    "category": "mechanical",
    "intent": "professional_handbook",
    "meta": {
      "title": "Spring Constant Calculator — Helical Spring Formula & Guide | AluCalc",
      "description": "Free spring constant calculator. Calculate helical compression spring rate using k = Gd⁴/(8D³N). Includes material shear modulus tables and worked examples."
    },
    "seo": {
      "h1": "Spring Constant Calculator — Formula, Example & Step-by-Step Guide",
      "intro": "Spring constant (spring rate) calculation determines the stiffness of a helical compression or extension spring. The formula k = Gd⁴/(8D³N) relates the spring rate to wire diameter (d), mean coil diameter (D), number of active coils (N), and the wire material's shear modulus (G). A stiffer spring (higher k) requires more force for the same deflection. This calculation is essential for designing valve springs in engines, suspension springs in vehicles, return springs in mechanisms, and vibration isolation mounts. Understanding spring rate allows engineers to control force-deflection behavior, natural frequency, and energy storage in mechanical systems.",
      "formula": "k = G * d^4 / (8 * D^3 * N)",
      "variables": {
        "k": "Spring rate / spring constant (N/m or N/mm)",
        "G": "Shear modulus of wire material (Pa)",
        "d": "Wire diameter (m)",
        "D": "Mean coil diameter (m)",
        "N": "Number of active coils"
      },
      "step_by_step": "1. Define the required force-deflection relationship: k = F/δ, where F is the working load and δ is the working deflection.\n2. Select wire material and note shear modulus G: music wire G = 81.7 GPa, stainless 302 G = 69 GPa.\n3. Choose a trial wire diameter d based on available stock sizes.\n4. Calculate the spring index C = D/d (aim for 4 < C < 12 for manufacturability).\n5. Calculate required active coils: N = Gd⁴/(8D³k).\n6. Verify stress: τ = 8FD/(πd³) × K_w (Wahl factor). Ensure τ < 45% of ultimate tensile strength.",
      "practical": "Spring design appears throughout mechanical engineering. Automotive valve springs must maintain precise force over millions of cycles at engine speeds exceeding 6000 rpm, requiring fatigue-resistant materials like chrome-vanadium steel. Vehicle suspension springs control ride quality and handling — progressive-rate springs use variable pitch to provide soft ride at low loads and firm support at high loads. In precision instruments, springs provide return force for switches, relays, and MEMS devices. Vibration isolation mounts use soft springs (low k) to decouple equipment from structural vibrations. Die springs in stamping presses must withstand extreme fatigue under compressive cycling. The spring constant also determines the natural frequency f = (1/2π)√(k/m), which is critical for avoiding resonance in dynamic systems.",
      "example": "Problem: Design a compression spring with k = 15 N/mm using music wire (G = 81,700 MPa), wire diameter d = 3 mm, mean coil diameter D = 20 mm. Solution: N = Gd⁴/(8D³k) = 81700 × 3⁴ / (8 × 20³ × 15) = 81700 × 81 / (8 × 8000 × 15) = 6,617,700 / 960,000 = 6.89 → Use N = 7 active coils. Actual k = 81700 × 81 / (8 × 8000 × 7) = 14.8 N/mm.",
      "technical_data": [{"name": "Wire Material Shear Modulus", "rows": [{"Material": "Music wire (ASTM A228)", "G (GPa)": "81.7"}, {"Material": "Chrome-vanadium", "G (GPa)": "77.2"}, {"Material": "Stainless 302", "G (GPa)": "69.0"}, {"Material": "Phosphor bronze", "G (GPa)": "41.4"}]}],
      "checklist": ["Check spring index 4 < C < 12", "Verify solid height doesn't exceed space", "Calculate fatigue life for cyclic applications"],
      "pitfalls": ["Confusing mean diameter D with outer diameter", "Ignoring dead coils when counting active coils"],
      "faq": [
        {"q": "What is a spring constant?", "a": "The spring constant (k) measures how stiff a spring is. It equals the force required to deflect the spring by one unit of length: k = F/δ, measured in N/mm or lb/in."},
        {"q": "How do you calculate spring constant for a coil spring?", "a": "Use k = Gd⁴/(8D³N), where G is shear modulus, d is wire diameter, D is mean coil diameter, and N is the number of active coils."},
        {"q": "What affects spring stiffness?", "a": "Wire diameter has the strongest effect (k ∝ d⁴). Increasing wire diameter by 25% nearly doubles the spring rate. Larger coil diameter and more coils decrease stiffness."}
      ]
    },
    "cta": {"label": "Open in AluCalc OS", "link": "/workspace"},
    "relatedCalculators": [
      {"title": "Shaft Diameter Calculator", "slug": "shaft-diameter-calc"},
      {"title": "Bolt Torque Calculator", "slug": "bolt-torque-calc"},
      {"title": "Bearing Life Calculator", "slug": "bearing-life-calc"},
      {"title": "Beam Deflection Calculator", "slug": "beam-deflection-calc"}
    ]
  }
];

const merged = [...existing, ...BATCH2];
fs.writeFileSync(jsonPath, JSON.stringify(merged, null, 2), 'utf-8');
console.log(`✅ Added ${BATCH2.length} calculators. Total: ${merged.length}`);
