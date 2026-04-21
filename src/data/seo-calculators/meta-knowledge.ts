export const META_KNOWLEDGE = {
    // ⚙️ POWER TRANSMISSION
    "timing-belt-design": {
        domain: "Mechanical",
        topic: "Timing Belt Design",
        formula: "L = 2C + 1.57(D+d) + \\frac{(D-d)^2}{4C}",
        variables: { "L": "Belt length", "C": "Center distance", "D": "Pulley 1 Dia", "d": "Pulley 2 Dia" },
        description: "Synchronous power transmission design focusing on precise positioning and load distribution.",
        standard: "ISO 5296",
        tables: [{ name: "Service Factors", rows: [{ "Load": "Uniform", "SF": 1.0 }, { "Load": "Heavy", "SF": 1.7 }] }],
        checks: ["Check tooth shear", "Validate tensioner range"],
        pitfalls: ["Underestimating startup torque"]
    },
    "reducer-lubrication": {
        domain: "Mechanical",
        topic: "Gearbox Lubrication & Thermal",
        formula: "Q = P(1-\\eta)",
        variables: { "Q": "Heat generated", "P": "Input Power", "eta": "Efficiency" },
        description: "Calculates the thermal capacity and lubrication requirements for industrial gear reducers.",
        standard: "AGMA 9005-F16",
        tables: [{ name: "ISO Viscosity Grades", rows: [{ "Ambient": "0-10C", "ISO VG": 150 }, { "Ambient": "10-30C", "ISO VG": 220 }, { "Ambient": "30-50C", "ISO VG": 320 }] }],
        checks: ["Check oil splash level", "Verify breather capacity"]
    },

    // 🧱 STRUCTURAL & CIVIL
    "concrete-reinforcement": {
        domain: "Civil",
        topic: "Reinforced Concrete (RC) Design",
        formula: "M_u = \\phi A_s f_y (d - \\frac{a}{2})",
        variables: { "Mu": "Flexural strength", "As": "Rebar area", "fy": "Yield strength", "d": "Effective depth" },
        description: "Calculates the required reinforcement steel for concrete structural elements according to limit state design.",
        standard: "ACI 318 / Eurocode 2",
        tables: [{ name: "Standard Rebar Sizes", rows: [{ "Bar #": "4", "Dia (mm)": 12.7 }, { "Bar #": "8", "Dia (mm)": 25.4 }] }],
        checks: ["Check minimum steel ratio", "Verify crack width limits"],
        pitfalls: ["Ignoring compression steel in deep beams"]
    },

    // 🌊 NAVAL & FLUIDS
    "naval-hydrostatics": {
        domain: "Mechanical",
        topic: "Naval Hydrostatics & Stability",
        formula: "GM = KB + BM - KG",
        variables: { "GM": "Metacentric height", "KB": "Center of buoyancy", "BM": "Metacentric radius", "KG": "Center of gravity" },
        description: "Analysis of ship stability and buoyancy including transverse/longitudinal metacentric height calculations.",
        standard: "IMO Code on Intact Stability",
        checks: ["Check righting lever (GZ) curve", "Verify floodpoint height"],
        pitfalls: ["Ignoring free surface effect of tanks"]
    },
    "pumps": {
        domain: "Mechanical",
        topic: "Centrifugal Pump Performance",
        formula: "NPSH_a = h_{atm} + h_s - h_f - h_{vp}",
        variables: { "NPSHa": "Available Net Positive Suction Head", "hs": "Static head", "hf": "Friction loss", "hvp": "Vapor pressure" },
        description: "Calculates pump head, power requirements, and cavitation risks (NPSH) for industrial fluid systems.",
        standard: "HI 9.6.1",
        checks: ["Verify NPSHa > NPSHr", "Check specific speed (Ns)"],
        pitfalls: ["Assuming pump curve is linear at low flows"]
    },

    // 🏭 MANUFACTURING & AI
    "failure-prediction": {
        domain: "Manufacturing",
        topic: "AI Failure Prediction & Reliability",
        formula: "R(t) = e^{-\\lambda t}",
        variables: { "Rt": "Reliability at time t", "lambda": "Failure rate", "t": "Time" },
        description: "Uses statistical models and AI patterns to predict the Remaining Useful Life (RUL) of mechanical components.",
        standard: "ISO 13381-1",
        checks: ["Verify MTBF data quality", "Check vibration spectral trends"],
        pitfalls: ["Ignoring non-linear wear stages"]
    },
    "failure-diagnosis": {
        domain: "Manufacturing",
        topic: "Engineering Failure Diagnosis",
        formula: "P(A|B) = \\frac{P(B|A)P(A)}{P(B)}",
        variables: { "P": "Probability of root cause given symptoms" },
        description: "Probabilistic framework for diagnosing mechanical failures based on multi-sensor input and symptom telemetry.",
        standard: "ISO 17359",
        checks: ["Cross-validate acoustic vs thermal data", "Check oil debris count"]
    },
    "simulation-fea": {
        domain: "Manufacturing",
        topic: "Finite Element Analysis (FEA)",
        formula: "[K]\\{u\} = \{F\}",
        variables: { "K": "Stiffness matrix", "u": "Displacement vector", "F": "Force vector" },
        description: "Numerical analysis for structural stress distribution, thermal gradients, and modal frequencies.",
        standard: "ASME V&V 10",
        checks: ["Check mesh convergence", "Verify boundary condition constraints"],
        pitfalls: ["Using singular elements at stress concentrations"]
    },
    "topology-optimization": {
        domain: "Manufacturing",
        topic: "Generative Topology Optimization",
        formula: "\\min C(\\rho) = \\int f(x) (\\rho(x))^p dx",
        variables: { "C": "Compliance", "rho": "Material density distribution" },
        description: "Mathematics of material distribution to optimize stiffness while minimizing mass for 3D printing and advanced casting.",
        standard: "Advanced Design Optimization",
        checks: ["Verify manufacturing constraints (Overhangs)", "Check minimum member size"]
    },
    "machine-assembly": {
        domain: "Manufacturing",
        topic: "Precision Machine Assembly",
        formula: "T_{assem} = \\sqrt{\\sum Tol_i^2}",
        variables: { "Tol": "Component tolerances" },
        description: "Geometric and dimensional analysis for complex mechanical assemblies and fit-up sequences.",
        standard: "ISO 1101 / ASME Y14.5",
        checks: ["Verify datum precedence", "Check clearance at max material condition"]
    },

    // ⚡ ELECTRICAL
    "ohms-law": {
        domain: "Electrical",
        topic: "Ohm's Law (Advanced DC/AC)",
        formula: "V = I \\cdot Z",
        variables: { "V": "Voltage", "I": "Current", "Z": "Impedance" },
        description: "Fundamental relationship between potential difference, flow, and combined resistance/reactance.",
        standard: "IEC 60038",
        checks: ["Verify resistor power rating (P=I²R)", "Check voltage drop limits"]
    },
    "voltage-drop": {
        domain: "Electrical",
        topic: "Conductor Voltage Drop",
        formula: "\\Delta V = \\frac{2 L I (R \\cos \\phi + X \\sin \\phi)}{1000}",
        variables: { "L": "Cable length", "R": "Resistance", "X": "Reactance", "phi": "Phase angle" },
        description: "Calculates the voltage loss across long electrical transmission lines to ensure equipment voltage stability.",
        standard: "NEC Chapter 9",
        checks: ["Verify drop < 3% for feeders", "Check terminal temperature rating"]
    },

    // 🔬 SCIENCE
    "biology-genetics": {
        domain: "Science",
        topic: "Population Genetics (Hardy-Weinberg)",
        formula: "p^2 + 2pq + q^2 = 1",
        variables: { "p/q": "Allele frequencies" },
        description: "Mathematical model for predicting genetic variation in populations under equilibrium.",
        standard: "Statistical Genetics",
        checks: ["Verify random mating assumption", "Account for mutation rate"]
    },
    "physics-solver": {
        domain: "Science",
        topic: "Computational Physics Solver",
        formula: "\\vec{F} = \\frac{d\\vec{p}}{dt}",
        variables: { "F": "Force vector", "p": "Momentum" },
        description: "Multi-physics engine for solving complex kinematic, dynamic, and electrodynamic differential equations.",
        standard: "General Physics Framework",
        checks: ["Verify energy conservation", "Check time-step stability in integration"]
    }
};
