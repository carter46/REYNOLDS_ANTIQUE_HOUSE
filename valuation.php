<?php
/**
 * Estate valuation endpoint — emails ADMIN_TO via PHPMailer SMTP.
 * Same mail path as inquiry.php (includes/mail-config.php admin_to).
 * Accepts multipart/form-data (with optional image attachments) or JSON.
 */
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');

function rah_json(int $status, bool $ok, string $error = ''): void
{
    http_response_code($status);
    $payload = ['ok' => $ok];
    if ($error !== '') {
        $payload['error'] = $error;
    }
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

function rah_client_ip(): string
{
    $ip = $_SERVER['REMOTE_ADDR'] ?? '';
    if (!is_string($ip) || $ip === '' || !filter_var($ip, FILTER_VALIDATE_IP)) {
        return 'unknown';
    }
    return $ip;
}

function rah_norm_host(string $host): string
{
    $host = strtolower(trim($host));
    if ($host !== '' && $host[0] === '[') {
        $end = strpos($host, ']');
        if ($end !== false) {
            return substr($host, 0, $end + 1);
        }
    }
    if (substr_count($host, ':') === 1) {
        $parts = explode(':', $host, 2);
        if (isset($parts[1]) && ctype_digit($parts[1])) {
            return $parts[0];
        }
    }
    return $host;
}

function rah_request_host(): string
{
    return rah_norm_host((string) ($_SERVER['HTTP_HOST'] ?? ''));
}

function rah_hosts_match(string $a, string $b): bool
{
    if ($a === '' || $b === '') {
        return false;
    }
    if ($a === $b) {
        return true;
    }
    if ($a === 'www.' . $b || $b === 'www.' . $a) {
        return true;
    }
    return false;
}

function rah_origin_ok(): bool
{
    $reqHost = rah_request_host();
    if ($reqHost === '') {
        return false;
    }

    $origin = trim((string) ($_SERVER['HTTP_ORIGIN'] ?? ''));
    if ($origin !== '' && strtolower($origin) !== 'null') {
        $parts = parse_url($origin);
        $oHost = rah_norm_host((string) ($parts['host'] ?? ''));
        $scheme = strtolower((string) ($parts['scheme'] ?? ''));
        if (($scheme === 'http' || $scheme === 'https') && rah_hosts_match($oHost, $reqHost)) {
            return true;
        }
        return false;
    }

    $referer = trim((string) ($_SERVER['HTTP_REFERER'] ?? ''));
    if ($referer === '') {
        return false;
    }
    $parts = parse_url($referer);
    $rHost = rah_norm_host((string) ($parts['host'] ?? ''));
    $scheme = strtolower((string) ($parts['scheme'] ?? ''));
    return ($scheme === 'http' || $scheme === 'https') && rah_hosts_match($rHost, $reqHost);
}

function rah_rate_limited(string $ip, int $max, int $window): bool
{
    $dir = __DIR__ . '/includes/storage';
    if (!is_dir($dir)) {
        @mkdir($dir, 0750, true);
    }
    $file = $dir . '/valuation-rate.json';
    $now = time();
    $data = [];
    if (is_file($file)) {
        $raw = @file_get_contents($file);
        $decoded = is_string($raw) ? json_decode($raw, true) : null;
        if (is_array($decoded)) {
            $data = $decoded;
        }
    }
    $key = hash('sha256', $ip);
    $hits = [];
    if (isset($data[$key]) && is_array($data[$key])) {
        foreach ($data[$key] as $ts) {
            if (!is_numeric($ts)) {
                continue;
            }
            $tsi = (int) $ts;
            if (($now - $tsi) < $window) {
                $hits[] = $tsi;
            }
        }
    }
    if (count($hits) >= $max) {
        $data[$key] = $hits;
        @file_put_contents($file, json_encode($data), LOCK_EX);
        return true;
    }
    $hits[] = $now;
    $data[$key] = $hits;
    foreach ($data as $k => $list) {
        if (!is_array($list)) {
            unset($data[$k]);
            continue;
        }
        $kept = [];
        foreach ($list as $ts) {
            if (!is_numeric($ts)) {
                continue;
            }
            $tsi = (int) $ts;
            if (($now - $tsi) < $window) {
                $kept[] = $tsi;
            }
        }
        if ($kept === []) {
            unset($data[$k]);
        } else {
            $data[$k] = $kept;
        }
    }
    @file_put_contents($file, json_encode($data), LOCK_EX);
    return false;
}

function rah_log(string $message): void
{
    $dir = __DIR__ . '/includes/storage';
    if (!is_dir($dir)) {
        @mkdir($dir, 0750, true);
    }
    $line = '[' . date('c') . '] ' . $message . PHP_EOL;
    @file_put_contents($dir . '/valuation.log', $line, FILE_APPEND | LOCK_EX);
}

function rah_read_input(): array
{
    $ctype = strtolower((string) ($_SERVER['CONTENT_TYPE'] ?? $_SERVER['HTTP_CONTENT_TYPE'] ?? ''));
    if (strpos($ctype, 'application/json') !== false) {
        $raw = file_get_contents('php://input');
        $decoded = is_string($raw) ? json_decode($raw, true) : null;
        return is_array($decoded) ? $decoded : [];
    }
    return $_POST;
}

function rah_str(array $src, string $key, int $max, bool $allowNewlines = false): string
{
    $v = isset($src[$key]) ? trim((string) $src[$key]) : '';
    if ($allowNewlines) {
        $v = str_replace("\0", '', $v);
        $v = str_replace(["\r\n", "\r"], "\n", $v);
    } else {
        $v = str_replace(["\r", "\n", "\0"], '', $v);
    }
    if (function_exists('mb_substr')) {
        return mb_substr($v, 0, $max);
    }
    return substr($v, 0, $max);
}

/**
 * Collect uploaded images from my_file[] (and single my_file).
 * @return list<array{path:string,name:string,type:string,size:int}>
 */
function rah_collect_uploads(): array
{
    $maxFiles = 10;
    $maxBytes = 8 * 1024 * 1024; // 8MB each
    $allowedExt = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'heif', 'pdf'];
    $allowedMime = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/heic',
        'image/heif',
        'application/pdf',
    ];

    $bucket = null;
    if (isset($_FILES['my_file']) && is_array($_FILES['my_file'])) {
        $bucket = $_FILES['my_file'];
    }

    if ($bucket === null) {
        return [];
    }

    $names = $bucket['name'] ?? null;
    $tmps = $bucket['tmp_name'] ?? null;
    $errors = $bucket['error'] ?? null;
    $sizes = $bucket['size'] ?? null;
    $types = $bucket['type'] ?? null;

    // Normalize single-file shape to arrays
    if (!is_array($names)) {
        $names = [$names];
        $tmps = [$tmps];
        $errors = [$errors];
        $sizes = [$sizes];
        $types = [$types];
    }

    $out = [];
    $count = min(count($names), $maxFiles);
    for ($i = 0; $i < $count; $i++) {
        $err = (int) ($errors[$i] ?? UPLOAD_ERR_NO_FILE);
        if ($err === UPLOAD_ERR_NO_FILE) {
            continue;
        }
        if ($err !== UPLOAD_ERR_OK) {
            continue;
        }
        $tmp = (string) ($tmps[$i] ?? '');
        if ($tmp === '' || !is_uploaded_file($tmp)) {
            continue;
        }
        $size = (int) ($sizes[$i] ?? 0);
        if ($size <= 0 || $size > $maxBytes) {
            continue;
        }
        $origName = (string) ($names[$i] ?? 'upload');
        $origName = str_replace(["\r", "\n", "\0"], '', $origName);
        $ext = strtolower(pathinfo($origName, PATHINFO_EXTENSION));
        if (!in_array($ext, $allowedExt, true)) {
            continue;
        }
        $mime = strtolower((string) ($types[$i] ?? ''));
        if ($mime !== '' && !in_array($mime, $allowedMime, true)) {
            // Fall back to extension-only if browser mime is empty/odd but ext is ok
            if (function_exists('finfo_open')) {
                $fi = finfo_open(FILEINFO_MIME_TYPE);
                if ($fi) {
                    $detected = finfo_file($fi, $tmp);
                    finfo_close($fi);
                    if (is_string($detected) && $detected !== '') {
                        $mime = strtolower($detected);
                    }
                }
            }
            if ($mime !== '' && !in_array($mime, $allowedMime, true)) {
                continue;
            }
        }
        $safeName = preg_replace('/[^A-Za-z0-9._-]+/', '_', $origName) ?: ('upload.' . $ext);
        $out[] = [
            'path' => $tmp,
            'name' => $safeName,
            'type' => $mime !== '' ? $mime : 'application/octet-stream',
            'size' => $size,
        ];
    }
    return $out;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    rah_json(405, false, 'Method not allowed.');
}

if (!rah_origin_ok()) {
    rah_log('E5 Invalid request origin Host=' . ($_SERVER['HTTP_HOST'] ?? '') . ' Origin=' . ($_SERVER['HTTP_ORIGIN'] ?? '') . ' Referer=' . ($_SERVER['HTTP_REFERER'] ?? ''));
    rah_json(400, false, 'Invalid request origin. (E5)');
}

$configPath = __DIR__ . '/includes/mail-config.php';
if (!is_file($configPath)) {
    rah_log('E0 mail-config.php missing');
    rah_json(500, false, 'Unable to send your valuation request right now. Please try again later. (E0)');
}

/** @var mixed $config */
$config = require $configPath;
if (!is_array($config)) {
    rah_log('E0 mail-config.php invalid return (not an array)');
    rah_json(500, false, 'Unable to send your valuation request right now. Please try again later. (E0)');
}

$max = (int) ($config['rate_limit_max'] ?? 5);
$window = (int) ($config['rate_limit_window'] ?? 300);
$ip = rah_client_ip();
if (rah_rate_limited($ip, max(1, $max), max(60, $window))) {
    rah_json(429, false, 'Too many requests. Please try again later.');
}

$input = rah_read_input();

$honeypot = rah_str($input, 'website', 200);
if ($honeypot !== '') {
    rah_json(200, true);
}

$firstName = rah_str($input, 'first_name', 80);
$lastName = rah_str($input, 'last_name', 80);
$email = rah_str($input, 'email', 200);
$phone = rah_str($input, 'phone', 40);
$about = rah_str($input, 'about_collection', 4000, true);
$pageUrl = rah_str($input, 'page_url', 500);

$interestKeys = [
    'selling' => 'Selling to Reynolds',
    'consigning' => 'Consigning',
    'auctioning' => 'Auctioning',
    'jewelry' => 'Jewelry & Watches',
    'schedule' => 'Schedule a Preview',
    'referral' => 'Referral Partnership',
    'press' => 'Press Inquiries',
    'other' => 'Other',
];
$interests = [];
foreach ($interestKeys as $key => $label) {
    if (!empty($input[$key])) {
        $interests[] = $label;
    }
}
// JSON clients may send interests[] array
if (isset($input['interests']) && is_array($input['interests'])) {
    foreach ($input['interests'] as $item) {
        $item = trim((string) $item);
        if ($item !== '' && !in_array($item, $interests, true)) {
            $interests[] = $item;
        }
    }
}

$referralPartner = !empty($input['referral_partner']) || !empty($input['checkbox-9948']);
$newsletter = !empty($input['newsletter_optin']) || !empty($input['checkbox-9951']);

$name = trim($firstName . ' ' . $lastName);
if ($name === '') {
    $name = rah_str($input, 'name', 120);
}

if ($firstName === '' || $lastName === '' || $email === '') {
    rah_json(400, false, 'Please provide your first name, last name, and email.');
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    rah_json(400, false, 'Please enter a valid email address.');
}
if ($interests === []) {
    rah_json(400, false, 'Please select at least one interest.');
}

$host = trim((string) ($config['smtp_host'] ?? ''));
$port = (int) ($config['smtp_port'] ?? 587);
$user = trim((string) ($config['smtp_user'] ?? ''));
$pass = (string) ($config['smtp_pass'] ?? '');
$from = trim((string) ($config['smtp_from_email'] ?? ''));
$fromName = trim((string) ($config['smtp_from_name'] ?? 'Reynolds Antique House'));
$secure = strtolower(trim((string) ($config['smtp_encryption'] ?? 'tls')));
$adminTo = trim((string) ($config['admin_to'] ?? ''));

$fromName = str_replace(["\r", "\n", "\0"], '', $fromName);
$nameSafe = str_replace(["\r", "\n", "\0"], '', $name);

if (
    $host === '' || $user === '' || $pass === ''
    || $pass === 'YOUR_SMTP_PASSWORD_HERE'
    || $host === 'smtp.example.com'
) {
    rah_log('E1 SMTP not configured (placeholder credentials)');
    rah_json(500, false, 'Unable to send your valuation request right now. Please try again later. (E1)');
}
if (!filter_var($from, FILTER_VALIDATE_EMAIL) || !filter_var($adminTo, FILTER_VALIDATE_EMAIL)) {
    rah_log('E2 Invalid FROM or ADMIN_TO in config');
    rah_json(500, false, 'Unable to send your valuation request right now. Please try again later. (E2)');
}

$phpmailerDir = __DIR__ . '/includes/lib/PHPMailer';
foreach (['Exception.php', 'PHPMailer.php', 'SMTP.php'] as $pmFile) {
    if (!is_file($phpmailerDir . '/' . $pmFile)) {
        rah_log('E3 PHPMailer missing: ' . $pmFile);
        rah_json(500, false, 'Unable to send your valuation request right now. Please try again later. (E3)');
    }
}
require_once $phpmailerDir . '/Exception.php';
require_once $phpmailerDir . '/PHPMailer.php';
require_once $phpmailerDir . '/SMTP.php';

$escFlags = ENT_QUOTES;
if (defined('ENT_SUBSTITUTE')) {
    $escFlags |= ENT_SUBSTITUTE;
}
$esc = static function (string $s) use ($escFlags): string {
    return htmlspecialchars($s, $escFlags, 'UTF-8');
};

$interestLine = implode(', ', $interests);
$subject = 'Estate valuation: ' . $name;
if ($interestLine !== '') {
    $subject .= ' — ' . $interestLine;
}
$subject = str_replace(["\r", "\n", "\0"], '', $subject);
if (function_exists('mb_substr')) {
    $subject = mb_substr($subject, 0, 200);
} else {
    $subject = substr($subject, 0, 200);
}

$uploads = rah_collect_uploads();

$html = '<p><strong>New estate valuation request</strong></p>'
    . '<p><strong>Visitor</strong><br>'
    . '<strong>Name:</strong> ' . $esc($name) . '<br>'
    . '<strong>Email:</strong> ' . $esc($email) . '<br>'
    . ($phone !== '' ? '<strong>Phone:</strong> ' . $esc($phone) . '<br>' : '')
    . '</p>'
    . '<p><strong>Interested in</strong><br>' . $esc($interestLine) . '</p>'
    . ($about !== '' ? '<p><strong>About the collection</strong><br>' . nl2br($esc($about)) . '</p>' : '')
    . '<p><strong>Preferences</strong><br>'
    . '<strong>Referral partner interest:</strong> ' . ($referralPartner ? 'Yes' : 'No') . '<br>'
    . '<strong>Newsletter opt-in:</strong> ' . ($newsletter ? 'Yes' : 'No') . '<br>'
    . ($pageUrl !== '' ? '<strong>Page:</strong> ' . $esc($pageUrl) . '<br>' : '')
    . '<strong>Attachments:</strong> ' . count($uploads)
    . '</p>';

$text = "New estate valuation request\n\n"
    . "Visitor\n"
    . "Name: {$name}\nEmail: {$email}\n"
    . ($phone !== '' ? "Phone: {$phone}\n" : '')
    . "\nInterested in: {$interestLine}\n"
    . ($about !== '' ? "\nAbout the collection:\n{$about}\n" : '')
    . "\nReferral partner interest: " . ($referralPartner ? 'Yes' : 'No') . "\n"
    . 'Newsletter opt-in: ' . ($newsletter ? 'Yes' : 'No') . "\n"
    . ($pageUrl !== '' ? "Page: {$pageUrl}\n" : '')
    . 'Attachments: ' . count($uploads) . "\n";

try {
    $mail = new PHPMailer\PHPMailer\PHPMailer(true);
    $mail->isSMTP();
    $mail->Host = $host;
    $mail->SMTPAuth = true;
    $mail->Username = $user;
    $mail->Password = $pass;
    $mail->Port = $port > 0 ? $port : 587;
    $mail->Timeout = 20;
    $mail->CharSet = 'UTF-8';
    if ($secure === 'tls' || $secure === 'ssl') {
        $mail->SMTPSecure = $secure;
    }
    $verifySsl = array_key_exists('smtp_verify_ssl', $config) ? (bool) $config['smtp_verify_ssl'] : false;
    if (!$verifySsl) {
        $mail->SMTPOptions = [
            'ssl' => [
                'verify_peer' => false,
                'verify_peer_name' => false,
                'allow_self_signed' => true,
            ],
        ];
    }
    $mail->setFrom($from, $fromName !== '' ? $fromName : 'Reynolds Antique House');
    $mail->addAddress($adminTo);
    $mail->addReplyTo($email, $nameSafe);
    $mail->isHTML(true);
    $mail->Subject = $subject;
    $mail->Body = $html;
    $mail->AltBody = $text;

    foreach ($uploads as $file) {
        $mail->addAttachment($file['path'], $file['name']);
    }

    $mail->send();
    rah_json(200, true);
} catch (Throwable $e) {
    rah_log('E4 SMTP send failed: ' . get_class($e) . ' — ' . $e->getMessage());
    rah_json(500, false, 'Unable to send your valuation request right now. Please try again later. (E4)');
}
