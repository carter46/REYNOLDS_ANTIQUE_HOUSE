<?php
/**
 * Product inquiry endpoint — emails ADMIN_TO via PHPMailer SMTP.
 * Not an open relay: recipient is fixed in mail-config.php.
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

/** Normalize host for Origin/Referer comparison (lowercase, no port). */
function rah_norm_host(string $host): string
{
    $host = strtolower(trim($host));
    // Strip brackets for IPv6 literals then port
    if ($host !== '' && $host[0] === '[') {
        $end = strpos($host, ']');
        if ($end !== false) {
            return substr($host, 0, $end + 1);
        }
    }
    // Remove :port for IPv4 / hostname
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
    // Allow www twin
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
    $file = $dir . '/inquiry-rate.json';
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
    // Never log secrets — callers must not pass passwords
    $line = '[' . date('c') . '] ' . $message . PHP_EOL;
    @file_put_contents($dir . '/inquiry.log', $line, FILE_APPEND | LOCK_EX);
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
        // Neutralize header / CRLF injection in fields that may touch mail headers
        $v = str_replace(["\r", "\n", "\0"], '', $v);
    }
    if (function_exists('mb_substr')) {
        return mb_substr($v, 0, $max);
    }
    return substr($v, 0, $max);
}

function rah_product_url_ok(string $url): bool
{
    if ($url === '') {
        return true;
    }
    $parts = parse_url($url);
    if (!is_array($parts)) {
        return false;
    }
    $scheme = strtolower((string) ($parts['scheme'] ?? ''));
    if ($scheme !== 'http' && $scheme !== 'https') {
        return false;
    }
    $host = rah_norm_host((string) ($parts['host'] ?? ''));
    return rah_hosts_match($host, rah_request_host());
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    rah_json(405, false, 'Method not allowed.');
}

if (!rah_origin_ok()) {
    rah_json(400, false, 'Invalid request origin.');
}

$configPath = __DIR__ . '/includes/mail-config.php';
if (!is_file($configPath)) {
    rah_log('mail-config.php missing');
    rah_json(500, false, 'Unable to send your inquiry right now. Please try again later.');
}

/** @var mixed $config */
$config = require $configPath;
if (!is_array($config)) {
    rah_log('mail-config.php invalid');
    rah_json(500, false, 'Unable to send your inquiry right now. Please try again later.');
}

$max = (int) ($config['rate_limit_max'] ?? 5);
$window = (int) ($config['rate_limit_window'] ?? 300);
$ip = rah_client_ip();
if (rah_rate_limited($ip, max(1, $max), max(60, $window))) {
    rah_json(429, false, 'Too many inquiries. Please try again later.');
}

$input = rah_read_input();

// Honeypot — must be empty
$honeypot = rah_str($input, 'website', 200);
if ($honeypot !== '') {
    rah_json(200, true);
}

$name = rah_str($input, 'name', 120);
$email = rah_str($input, 'email', 200);
$phone = rah_str($input, 'phone', 40);
$message = rah_str($input, 'message', 4000, true);
$productTitle = rah_str($input, 'product_title', 300);
$productSku = rah_str($input, 'product_sku', 80);
$productId = rah_str($input, 'product_id', 120);
$productUrl = rah_str($input, 'product_url', 500);

if ($name === '' || $email === '' || $message === '') {
    rah_json(400, false, 'Please provide your name, email, and message.');
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    rah_json(400, false, 'Please enter a valid email address.');
}
if (!rah_product_url_ok($productUrl)) {
    rah_json(400, false, 'Invalid product URL.');
}

$host = trim((string) ($config['smtp_host'] ?? ''));
$port = (int) ($config['smtp_port'] ?? 587);
$user = trim((string) ($config['smtp_user'] ?? ''));
$pass = (string) ($config['smtp_pass'] ?? '');
$from = trim((string) ($config['smtp_from_email'] ?? ''));
$fromName = trim((string) ($config['smtp_from_name'] ?? 'Reynolds Antique House'));
$secure = strtolower(trim((string) ($config['smtp_encryption'] ?? 'tls')));
$adminTo = trim((string) ($config['admin_to'] ?? ''));

// Strip CRLF from display names used in headers
$fromName = str_replace(["\r", "\n", "\0"], '', $fromName);
$nameSafe = str_replace(["\r", "\n", "\0"], '', $name);

if (
    $host === '' || $user === '' || $pass === ''
    || $pass === 'YOUR_SMTP_PASSWORD_HERE'
    || $host === 'smtp.example.com'
) {
    rah_log('SMTP not configured (placeholder credentials)');
    rah_json(500, false, 'Unable to send your inquiry right now. Please try again later.');
}
if (!filter_var($from, FILTER_VALIDATE_EMAIL) || !filter_var($adminTo, FILTER_VALIDATE_EMAIL)) {
    rah_log('Invalid FROM or ADMIN_TO in config');
    rah_json(500, false, 'Unable to send your inquiry right now. Please try again later.');
}

$phpmailerDir = __DIR__ . '/includes/lib/PHPMailer';
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

$subject = 'Inquiry: ' . ($productTitle !== '' ? $productTitle : 'Collection piece');
if ($productSku !== '') {
    $subject .= ' (' . $productSku . ')';
}
$subject = str_replace(["\r", "\n", "\0"], '', $subject);
if (function_exists('mb_substr')) {
    $subject = mb_substr($subject, 0, 200);
} else {
    $subject = substr($subject, 0, 200);
}

$html = '<p><strong>New product inquiry</strong></p>'
    . '<p><strong>Name:</strong> ' . $esc($name) . '<br>'
    . '<strong>Email:</strong> ' . $esc($email) . '<br>'
    . ($phone !== '' ? '<strong>Phone:</strong> ' . $esc($phone) . '<br>' : '')
    . '</p>'
    . '<p><strong>Product</strong><br>'
    . 'Title: ' . $esc($productTitle) . '<br>'
    . 'SKU: ' . $esc($productSku) . '<br>'
    . 'ID: ' . $esc($productId) . '<br>'
    . ($productUrl !== '' ? 'URL: <a href="' . $esc($productUrl) . '">' . $esc($productUrl) . '</a><br>' : '')
    . '</p>'
    . '<p><strong>Message</strong><br>' . nl2br($esc($message)) . '</p>';

$text = "New product inquiry\n\n"
    . "Name: {$name}\nEmail: {$email}\n"
    . ($phone !== '' ? "Phone: {$phone}\n" : '')
    . "\nProduct title: {$productTitle}\nSKU: {$productSku}\nID: {$productId}\n"
    . ($productUrl !== '' ? "URL: {$productUrl}\n" : '')
    . "\nMessage:\n{$message}\n";

try {
    $mail = new PHPMailer\PHPMailer\PHPMailer(true);
    $mail->isSMTP();
    $mail->Host = $host;
    $mail->SMTPAuth = true;
    $mail->Username = $user;
    $mail->Password = $pass;
    $mail->Port = $port > 0 ? $port : 587;
    $mail->Timeout = 15;
    $mail->CharSet = 'UTF-8';
    if ($secure === 'tls' || $secure === 'ssl') {
        $mail->SMTPSecure = $secure;
    }
    $mail->setFrom($from, $fromName !== '' ? $fromName : 'Reynolds Antique House');
    $mail->addAddress($adminTo);
    $mail->addReplyTo($email, $nameSafe);
    $mail->isHTML(true);
    $mail->Subject = $subject;
    $mail->Body = $html;
    $mail->AltBody = $text;
    $mail->send();
    rah_json(200, true);
} catch (Throwable $e) {
    // Log class only — never echo SMTP details / credentials to client
    rah_log('SMTP send failed: ' . get_class($e) . ' — ' . $e->getMessage());
    rah_json(500, false, 'Unable to send your inquiry right now. Please try again later.');
}
