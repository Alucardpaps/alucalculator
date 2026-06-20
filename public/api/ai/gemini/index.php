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

// 1. Locate and parse API key from .env / .env.local by traversing upwards
function getGeminiApiKey() {
    // Check system environment variables first
    $envKey = getenv('GEMINI_API_KEY') ?: getenv('NEXT_PUBLIC_GEMINI_API_KEY');
    if ($envKey) {
        return $envKey;
    }

    $currentDir = __DIR__;
    // Traverse up to 6 levels to find .env or .env.local
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
        'error' => 'API key not configured on server',
        'code' => 'NO_API_KEY'
    ]);
    exit;
}

// 2. Parse request payload
$inputData = json_decode(file_get_contents('php://input'), true);
$prompt = isset($inputData['prompt']) ? $inputData['prompt'] : null;
$schemaDescription = isset($inputData['schemaDescription']) ? $inputData['schemaDescription'] : "Return ONLY valid JSON. No markdown formatting.";

if (!$prompt) {
    http_response_code(400);
    echo json_encode(['error' => 'Prompt is required']);
    exit;
}

$fullPrompt = $prompt . "\n\nMANDATORY SCHEMA: " . $schemaDescription;

// 3. Construct Gemini REST API request payload
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
        'temperature' => 0.2
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

// 4. Extract generated text and format it
if (isset($decoded['candidates'][0]['content']['parts'][0]['text'])) {
    $responseText = $decoded['candidates'][0]['content']['parts'][0]['text'];
    
    // Strip markdown formatting if any
    $responseText = preg_replace('/^```json\s*/', '', $responseText);
    $responseText = preg_replace('/\s*```$/', '', $responseText);
    $responseText = trim($responseText);
    
    // Validate JSON before sending payload to the client
    $jsonPayload = json_decode($responseText, true);
    if (json_last_error() === JSON_ERROR_NONE) {
        echo json_encode($jsonPayload);
    } else {
        http_response_code(500);
        echo json_encode([
            'error' => 'Invalid JSON returned from AI infrastructure',
            'raw' => $responseText
        ]);
    }
} else {
    // If quota or rate limits hit
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
