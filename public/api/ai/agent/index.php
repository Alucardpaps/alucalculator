<?php
/**
 * AluCalc OS — AI Agent Dynamic Gateway
 * 
 * Hostinger LiteSpeed/Apache dynamic endpoint for AI Agents and LLM crawlers.
 * Enforces key-based authentication for automated AI tools.
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-AI-Agent-Key');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

// -------------------------------------------------------------
// 1. Resolve Server-Side Secret Key
// -------------------------------------------------------------
$defaultKey = 'ALUCALC-AGENT-2026-X9Q';
$serverSecret = getenv('AI_AGENT_KEY') ?: $defaultKey;

// -------------------------------------------------------------
// 2. Extract Provided Key from Headers or Query Parameters
// -------------------------------------------------------------
$providedKey = null;

// Header: X-AI-Agent-Key
if (!empty($_SERVER['HTTP_X_AI_AGENT_KEY'])) {
    $providedKey = trim($_SERVER['HTTP_X_AI_AGENT_KEY']);
}
// Header: Authorization: Bearer <KEY>
elseif (!empty($_SERVER['HTTP_AUTHORIZATION'])) {
    if (preg_match('/Bearer\s+(.*)$/i', $_SERVER['HTTP_AUTHORIZATION'], $matches)) {
        $providedKey = trim($matches[1]);
    }
}
// Query param: ?ai_key= or ?agent_token=
elseif (!empty($_GET['ai_key'])) {
    $providedKey = trim($_GET['ai_key']);
}
elseif (!empty($_GET['agent_token'])) {
    $providedKey = trim($_GET['agent_token']);
}
// POST payload
elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $rawInput = file_get_contents('php://input');
    $postData = json_decode($rawInput, true);
    if (!empty($postData['ai_key'])) {
        $providedKey = trim($postData['ai_key']);
    }
}

// -------------------------------------------------------------
// 3. Timing-Safe Key Verification
// -------------------------------------------------------------
$isAuthorized = false;
if ($providedKey !== null) {
    $isAuthorized = hash_equals($serverSecret, $providedKey) || hash_equals($defaultKey, $providedKey);
}

if (!$isAuthorized) {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'status' => 'UNAUTHORIZED_AI_AGENT',
        'error' => 'Valid AI Agent Access Key required to inspect AluCalc OS.',
        'help' => [
            'header' => 'X-AI-Agent-Key: ALUCALC-AGENT-2026-X9Q',
            'bearer' => 'Authorization: Bearer ALUCALC-AGENT-2026-X9Q',
            'query_param' => '?ai_key=ALUCALC-AGENT-2026-X9Q',
            'docs' => 'https://www.alucalculator.com/llms.txt'
        ]
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    exit;
}

// -------------------------------------------------------------
// 4. Authorized Access Response: Machine-Readable Solver Catalog
// -------------------------------------------------------------
header('X-AI-Agent-Status: Authorized');

$requestedSolver = isset($_GET['solver']) ? strtolower(trim($_GET['solver'])) : null;
$format = isset($_GET['format']) ? strtolower(trim($_GET['format'])) : 'json';

$solvers = [
    'aerospace-dynamics' => [
        'name' => 'Aerospace & Aerodynamics Suite',
        'url' => 'https://www.alucalculator.com/aerospace-dynamics/',
        'standards' => ['ICAO Doc 7488', 'NASA SP-367', 'ISA 1976'],
        'description' => 'Deterministic ISA 1976 flight envelope, 3D wind tunnel aerodynamic drag (6 benchmark bodies), and NACA 4-digit airfoil polar solver.',
        'equations' => [
            'Dynamic Pressure' => 'q = 0.5 * rho * v^2',
            'Aerodynamic Drag' => 'F_D = q * C_D * A',
            'Propulsion Power' => 'P = F_D * v (P proportional to v^3)',
            'EV Aero Penalty' => 'Energy = (F_D * 100) / (3600 * 0.90) [kWh/100km]'
        ]
    ],
    'bolt-torque' => [
        'name' => 'Bolt Tightening & Preload Solver',
        'url' => 'https://www.alucalculator.com/bolt-torque/',
        'standards' => ['VDI 2230 Blatt 1', 'ISO 898-1', 'DIN EN ISO 4014'],
        'description' => 'Tightening torque, thread friction mu_th, head friction mu_b, yield utilization nu, and clamp load calculation for metric fasteners (M3-M64).',
        'equations' => [
            'Total Torque' => 'M_A = F_M * (0.16 * P + 0.58 * d2 * mu_th + 0.5 * D_b * mu_b)'
        ]
    ],
    'bearings' => [
        'name' => 'Rolling Bearing Rating Life Solver',
        'url' => 'https://www.alucalculator.com/bearings/',
        'standards' => ['ISO 281', 'ISO 76', 'DIN 622'],
        'description' => 'Equivalent dynamic load P, basic rating life L10, modified life L10h with viscosity ratio kappa and contamination factor a_iso.',
        'equations' => [
            'Rating Life' => 'L_10 = (C / P)^p [10^6 revs] (p=3 ball, p=10/3 roller)'
        ]
    ],
    'fluid-dynamics' => [
        'name' => 'Fluid Dynamics & Pipe Friction Solver',
        'url' => 'https://www.alucalculator.com/fluid-dynamics/',
        'standards' => ['ISO 5167', 'Crane TP-410', 'Darcy-Weisbach'],
        'description' => 'Reynolds number, Colebrook-White implicit friction factor f, hydraulic pressure loss, fitting K-factors, and centrifugal pump sizing.',
        'equations' => [
            'Head Loss' => 'h_f = f * (L / D) * (v^2 / 2g)'
        ]
    ],
    'pressure-vessel' => [
        'name' => 'ASME Pressure Vessel Solver',
        'url' => 'https://www.alucalculator.com/pressure-vessel/',
        'standards' => ['ASME BPVC Section VIII Div 1 (UG-27, UG-32)'],
        'description' => 'Cylindrical and spherical shell minimum thickness, 2:1 ellipsoidal and torispherical head sizing, hydrostatic test pressure.',
        'equations' => [
            'Cylindrical Shell' => 't = (P * R) / (S * E - 0.6 * P) + CA'
        ]
    ],
    'fits-tolerances' => [
        'name' => 'Fits & Tolerances ISO 286',
        'url' => 'https://www.alucalculator.com/fits/',
        'standards' => ['ISO 286-1', 'ISO 286-2', 'DIN 7157'],
        'description' => 'Deterministic limit deviations (ES, EI, es, ei) and clearance/interference boundaries for hole/shaft fits.'
    ],
    'handbook' => [
        'name' => 'Standards & Materials Handbook',
        'url' => 'https://www.alucalculator.com/handbook/',
        'standards' => ['EN 573-3', 'EN 755-2', 'ISO 209', 'ASTM B221'],
        'description' => 'Authoritative mechanical properties for aluminum alloys (6060, 6061, 6082, 7075), structural steels (S235, S355), stainless steels, and plastics.'
    ]
];

if ($format === 'markdown') {
    header('Content-Type: text/markdown; charset=utf-8');
    echo "# AluCalc OS — Authorized AI Agent Knowledge Stream\n\n";
    echo "**Status:** Access Granted (Key Validated)\n";
    echo "**Architecture:** Deterministic ISO/DIN/VDI/ASME Engineering Operating System\n\n";
    echo "## Available Solvers & Direct Routes\n\n";
    foreach ($solvers as $id => $data) {
        echo "### {$data['name']} (`{$id}`)\n";
        echo "- **URL:** {$data['url']}\n";
        echo "- **Standards:** " . implode(', ', $data['standards']) . "\n";
        echo "- **Description:** {$data['description']}\n";
        if (!empty($data['equations'])) {
            echo "- **Key Equations:**\n";
            foreach ($data['equations'] as $name => $eq) {
                echo "  - *{$name}:* `{$eq}`\n";
            }
        }
        echo "\n";
    }
    exit;
}

if ($requestedSolver && isset($solvers[$requestedSolver])) {
    echo json_encode([
        'success' => true,
        'status' => 'AUTHORIZED_AI_AGENT',
        'solver_id' => $requestedSolver,
        'data' => $solvers[$requestedSolver]
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    exit;
}

echo json_encode([
    'success' => true,
    'status' => 'AUTHORIZED_AI_AGENT',
    'access' => 'UNRESTRICTED',
    'system' => 'AluCalc OS Engineering Operating System',
    'version' => '5.2.0',
    'agent_key_status' => 'VALIDATED',
    'website_url' => 'https://www.alucalculator.com',
    'total_solvers' => count($solvers),
    'catalog' => $solvers
], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
