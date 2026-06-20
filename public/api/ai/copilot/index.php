<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed']);
    exit;
}

// 1. Locate and parse API key
function getGeminiApiKey() {
    $envKey = getenv('GEMINI_API_KEY') ?: getenv('NEXT_PUBLIC_GEMINI_API_KEY');
    if ($envKey) {
        return $envKey;
    }

    $currentDir = __DIR__;
    for ($i = 0; $i < 6; $i++) {
        foreach (['.env', '.env.local'] as $file) {
            $path = $currentDir . DIRECTORY_SEPARATOR . $file;
            if (file_exists($path)) {
                $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
                foreach ($lines as $line) {
                    $line = trim($line);
                    if (empty($line) || strpos($line, '#') === 0) {
                        continue;
                    }
                    $parts = explode('=', $line, 2);
                    if (count($parts) === 2) {
                        $key = trim($parts[0]);
                        $val = trim(trim($parts[1]), "\"'");
                        if ($key === 'GEMINI_API_KEY' || $key === 'NEXT_PUBLIC_GEMINI_API_KEY') {
                            return $val;
                        }
                    }
                }
            }
        }
        $parent = dirname($currentDir);
        if ($parent === $currentDir) {
            break;
        }
        $currentDir = $parent;
    }
    return null;
}

$apiKey = getGeminiApiKey();
if (!$apiKey) {
    http_response_code(503);
    echo json_encode([
        'error' => 'API key is missing',
        'code' => 'NO_API_KEY'
    ]);
    exit;
}

// 2. Parse request payload
$inputData = json_decode(file_get_contents('php://input'), true);
$query = isset($inputData['query']) ? $inputData['query'] : null;
$context = isset($inputData['context']) ? $inputData['context'] : '/';
$language = isset($inputData['language']) ? $inputData['language'] : 'en';

$languageNames = [
    'en' => 'English', 'tr' => 'Turkish', 'de' => 'German', 'es' => 'Spanish',
    'fr' => 'French', 'it' => 'Italian', 'pt' => 'Portuguese', 'ru' => 'Russian',
    'zh' => 'Chinese (Simplified)', 'ja' => 'Japanese', 'ko' => 'Korean', 'ar' => 'Arabic',
];
$responseLanguage = isset($languageNames[$language]) ? $languageNames[$language] : 'English';

if (!$query) {
    http_response_code(400);
    echo json_encode(['error' => 'Query is required']);
    exit;
}

// 3. Load calculators.json context for RAG
$guideContext = "";
$jsonPath = __DIR__ . '/calculators.json';
if (file_exists($jsonPath)) {
    $calculatorsJson = file_get_contents($jsonPath);
    $calculators = json_decode($calculatorsJson, true);
    if (is_array($calculators)) {
        $parts = [];
        foreach ($calculators as $c) {
            $h1 = isset($c['seo']['h1']) ? $c['seo']['h1'] : '';
            $intro = isset($c['seo']['intro']) ? $c['seo']['intro'] : '';
            $formula = isset($c['seo']['formula']) ? $c['seo']['formula'] : '';
            $parts[] = "Topic: " . $h1 . "\nSummary: " . $intro . "\nFormula: " . $formula;
        }
        $guideContext = implode("\n---\n", $parts);
    }
}

// 4. Construct System Prompt
$systemPrompt = "You are AluCalc Sovereign Intelligence Copilot, a brilliant, elite Software Architect and Structural Engineer Assistant built for the inside of a web-based Engineering OS.
Your task is to analyze the query, write a highly intelligent response, and output a JSON object.

MANDATORY JSON STRUCTURE:
{
  \"answer\": \"markdown-formatted detailed engineering response in " . $responseLanguage . " only. Be extremely thorough and professional.\",
  \"actionUrl\": \"optional URL string to redirect/route to a workspace or external support link. If no routing is needed, set to null.\",
  \"actionLabel\": \"optional button label string. Set to null if actionUrl is null.\",
  \"showSupportButton\": true/false (set to true if the user reports a bug, error, incorrect calculation, or asks for support)
}

RULES:
1. Support: If the user complains about wrong results, errors, bugs, or asks for support, set showSupportButton to true, actionUrl to \"mailto:abdulsametyildirim95@gmail.com?subject=Technical Feedback Report\", and actionLabel to \"Contact Support\".
2. Navigation/Routing: If the user asks to open or navigate to a calculator, map their request to one of the following paths:
   - Gears: '/gears/'
   - CAD Editor: '/cad-editor/'
   - Beam Deflection: '/beam-deflection/'
   - Fatigue: '/fatigue/'
   - Thermal: '/thermal/'
   - Fluids: '/fluids/'
   - FEA: '/simulation-fea/'
   - Cutting Optimizer: '/cutting-optimizer/'
   - Materials DB: '/materials-db/'
   - AI Material Selector: '/material-selector-ai/'
   - Planetary Gearbox: '/planetary-gearbox/'
   - Ohm's Law: '/ohms-law/'
   - Voltage Drop: '/voltage-drop/'
   - Periodic Table: '/periodic-table/'
   - Calculator: '/calculator/'
   - Aluminum Profile: '/aluminum/'
   
   If the user is already on the target page (checked via the context parameter: \"" . $context . "\" matches the path), set actionUrl to null (no need to navigate).
3. If they ask a general greeting or non-engineering question, respond as a professional engineering system.
4. LANGUAGE (CRITICAL): The user's UI language is **" . $responseLanguage . "**. Write the entire answer exclusively in **" . $responseLanguage . "**, regardless of the query language. Never default to Turkish unless UI language is Turkish.

Theoretical Knowledge Base:
---
" . $guideContext . "
---
";

$fullPrompt = $systemPrompt . "\n\nUSER QUERY: " . $query;

// 5. Query Gemini API
$geminiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" . $apiKey;
$requestBody = [
    'contents' => [
        [
            'parts' => [
                ['text' => $fullPrompt]
            ]
        ]
    ],
    'generationConfig' => [
        'temperature' => 0.2,
        'responseMimeType' => 'application/json'
    ]
];

$ch = curl_init($geminiUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($requestBody));
curl_setopt($ch, CURLOPT_TIMEOUT, 30);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlErr = curl_error($ch);
curl_close($ch);

if ($response === false) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Failed to reach AI infrastructure',
        'message' => $curlErr
    ]);
    exit;
}

$decoded = json_decode($response, true);

if (isset($decoded['candidates'][0]['content']['parts'][0]['text'])) {
    $responseText = $decoded['candidates'][0]['content']['parts'][0]['text'];
    
    // Validate JSON before sending payload
    $parsed = json_decode(trim($responseText), true);
    if (json_last_error() === JSON_ERROR_NONE) {
        echo json_encode([
            'success' => true,
            'answer' => isset($parsed['answer']) ? $parsed['answer'] : '',
            'actionUrl' => isset($parsed['actionUrl']) ? $parsed['actionUrl'] : null,
            'actionLabel' => isset($parsed['actionLabel']) ? $parsed['actionLabel'] : null,
            'showSupportButton' => isset($parsed['showSupportButton']) ? $parsed['showSupportButton'] : false
        ]);
    } else {
        http_response_code(500);
        echo json_encode([
            'error' => 'Invalid JSON structure returned from model',
            'raw' => $responseText
        ]);
    }
} else {
    if ($httpCode === 429) {
        http_response_code(429);
        echo json_encode([
            'error' => 'Rate limit or quota exceeded',
            'code' => 'QUOTA_EXCEEDED'
        ]);
    } else {
        http_response_code($httpCode ?: 500);
        echo json_encode([
            'error' => 'AI generation failed',
            'details' => $decoded
        ]);
    }
}
?>
