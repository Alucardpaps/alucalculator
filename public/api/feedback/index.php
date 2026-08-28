<?php
/**
 * AluCalc OS — static-host feedback endpoint (Hostinger PHP).
 * Next.js API routes are not available with `output: 'export'`.
 */
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

$allowedOrigins = [
    'https://alucalculator.com',
    'https://www.alucalculator.com',
    'https://admin.alucalculator.com',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
];

$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
if ($origin && in_array($origin, $allowedOrigins, true)) {
    header('Access-Control-Allow-Origin: ' . $origin);
} else {
    header('Access-Control-Allow-Origin: https://www.alucalculator.com');
}
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Alucalc-License');
header('Access-Control-Max-Age: 86400');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method Not Allowed']);
    exit;
}

function alu_env($name, $default = null) {
    $val = getenv($name);
    if ($val !== false && $val !== '') {
        return $val;
    }
    $dir = __DIR__;
    for ($i = 0; $i < 8; $i++) {
        foreach (['.env', '.env.local'] as $file) {
            $path = $dir . DIRECTORY_SEPARATOR . $file;
            if (!is_readable($path)) {
                continue;
            }
            $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            foreach ($lines as $line) {
                $line = trim($line);
                if ($line === '' || $line[0] === '#') {
                    continue;
                }
                $parts = explode('=', $line, 2);
                if (count($parts) !== 2) {
                    continue;
                }
                $key = trim($parts[0]);
                $v = trim(trim($parts[1]), "\"'");
                if ($key === $name && $v !== '') {
                    return $v;
                }
            }
        }
        $parent = dirname($dir);
        if ($parent === $dir) {
            break;
        }
        $dir = $parent;
    }
    return $default;
}

function alu_origin_ok() {
    $origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
    $referer = isset($_SERVER['HTTP_REFERER']) ? $_SERVER['HTTP_REFERER'] : '';
    $target = $origin ?: $referer;
    if ($target === '') {
        return true;
    }
    $host = parse_url($target, PHP_URL_HOST);
    if (!$host) {
        return false;
    }
    $ok = [
        'alucalculator.com',
        'www.alucalculator.com',
        'admin.alucalculator.com',
        'localhost',
        '127.0.0.1',
    ];
    return in_array(strtolower($host), $ok, true);
}

if (!alu_origin_ok()) {
    http_response_code(403);
    echo json_encode(['success' => false, 'error' => 'Origin doğrulaması başarısız.']);
    exit;
}

$raw = file_get_contents('php://input');
$body = json_decode($raw, true);
if (!is_array($body)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Geçersiz JSON gövdesi.']);
    exit;
}

$message = isset($body['message']) ? trim((string) $body['message']) : '';
if (strlen($message) < 5) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Açıklama metni en az 5 karakter olmalıdır.']);
    exit;
}

$category = isset($body['category']) ? substr(preg_replace('/[^a-z]/', '', strtolower((string) $body['category'])), 0, 24) : 'other';
if ($category === '') {
    $category = 'other';
}
$module = isset($body['module']) ? substr(trim((string) $body['module']), 0, 80) : 'general';
$email = isset($body['email']) ? substr(trim((string) $body['email']), 0, 100) : '';
$consentDiagnostics = !empty($body['consentDiagnostics']);
$consentScreenshot = !empty($body['consentScreenshot']);
$diagnostics = ($consentDiagnostics && isset($body['diagnostics']) && is_array($body['diagnostics']))
    ? $body['diagnostics']
    : null;

$to = alu_env('FEEDBACK_TO', 'destek@alucalculator.com');
$from = alu_env('FEEDBACK_FROM', 'AluCalc Feedback <noreply@alucalculator.com>');
$resendKey = alu_env('RESEND_API_KEY');

$id = 'fb_' . base_convert((string) time(), 10, 36) . '_' . substr(bin2hex(random_bytes(4)), 0, 5);
$subject = '[AluCalc Feedback] [' . strtoupper($category) . '] ' . $module;

$textBody = "Yeni AluCalc Geri Bildirimi\n"
    . "ID: {$id}\n"
    . "Kategori: {$category}\n"
    . "Modül: {$module}\n"
    . 'Tarih: ' . gmdate('c') . "\n"
    . 'Kullanıcı E-posta: ' . ($email !== '' ? $email : '(Belirtilmedi)') . "\n";
if ($diagnostics) {
    $textBody .= "Teşhis: " . json_encode($diagnostics, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT) . "\n";
}
$textBody .= "----------------------------------------\nMesaj:\n" . substr($message, 0, 2000) . "\n";

$screenshotB64 = null;
if ($consentScreenshot && isset($body['screenshot']) && is_string($body['screenshot']) && strpos($body['screenshot'], 'base64,') !== false) {
    $parts = explode('base64,', $body['screenshot'], 2);
    $bin = base64_decode($parts[1], true);
    if ($bin !== false && strlen($bin) > 32 && strlen($bin) <= 500 * 1024) {
        $screenshotB64 = base64_encode($bin);
    }
}

$sent = false;

if ($resendKey) {
    $payload = [
        'from' => $from,
        'to' => [$to],
        'subject' => $subject,
        'text' => $textBody,
    ];
    if ($screenshotB64) {
        $payload['attachments'] = [[
            'filename' => 'screenshot.png',
            'content' => $screenshotB64,
        ]];
    }
    $ch = curl_init('https://api.resend.com/emails');
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => [
            'Authorization: Bearer ' . $resendKey,
            'Content-Type: application/json',
        ],
        CURLOPT_POSTFIELDS => json_encode($payload),
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 15,
    ]);
    $res = curl_exec($ch);
    $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    $sent = ($code >= 200 && $code < 300);
}

if (!$sent) {
    $fromHeader = $from;
    if (strpos($fromHeader, '<') === false) {
        $fromHeader = 'AluCalc Feedback <noreply@alucalculator.com>';
    }
    $headers = [
        'MIME-Version: 1.0',
        'From: ' . $fromHeader,
        'Reply-To: ' . ($email !== '' ? $email : $to),
        'X-Mailer: AluCalc-OS',
        'X-AluCalc-Feedback-Id: ' . $id,
    ];
    if ($screenshotB64) {
        $boundary = 'alu_' . bin2hex(random_bytes(8));
        $headers[] = 'Content-Type: multipart/mixed; boundary=' . $boundary;
        $mailBody = "--{$boundary}\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: 8bit\r\n\r\n{$textBody}\r\n"
            . "--{$boundary}\r\nContent-Type: image/png; name=\"screenshot.png\"\r\nContent-Transfer-Encoding: base64\r\nContent-Disposition: attachment; filename=\"screenshot.png\"\r\n\r\n"
            . chunk_split($screenshotB64) . "--{$boundary}--\r\n";
    } else {
        $headers[] = 'Content-Type: text/plain; charset=UTF-8';
        $mailBody = $textBody;
    }
    $sent = @mail($to, '=?UTF-8?B?' . base64_encode($subject) . '?=', $mailBody, implode("\r\n", $headers));
}

if (!$sent) {
    http_response_code(502);
    echo json_encode([
        'success' => false,
        'error' => 'E-posta iletilemedi. Lütfen doğrudan destek@alucalculator.com adresine yazın.',
    ]);
    exit;
}

echo json_encode([
    'success' => true,
    'id' => $id,
    'message' => 'Geri bildirim başarıyla iletildi.',
]);
