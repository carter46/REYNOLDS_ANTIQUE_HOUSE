<?php
/**
 * SMTP / inquiry mail configuration — EXAMPLE TEMPLATE (safe to commit).
 *
 * Copy this file to mail-config.php on the server and replace placeholders
 * with real values. Do not commit mail-config.php.
 */
declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    $script = isset($_SERVER['SCRIPT_FILENAME']) ? basename((string) $_SERVER['SCRIPT_FILENAME']) : '';
    if ($script === 'mail-config.example.php' || $script === 'mail-config.php') {
        http_response_code(403);
        header('Content-Type: text/plain; charset=utf-8');
        echo 'Forbidden';
        exit;
    }
}

return [
    // Hostinger example:
    // 'smtp_host' => 'smtp.hostinger.com',
    // 'smtp_port' => 465,
    // 'smtp_encryption' => 'ssl',
    // (or port 587 with encryption 'tls')

    'smtp_host' => 'smtp.example.com',
    'smtp_port' => 587,
    'smtp_user' => 'your-smtp-username@example.com',
    'smtp_pass' => 'YOUR_SMTP_PASSWORD_HERE',
    'smtp_encryption' => 'tls', // 'tls' (587) or 'ssl' (465)

    // FROM must match the authenticated mailbox on Hostinger
    'smtp_from_email' => 'your-smtp-username@example.com',
    'smtp_from_name' => 'Reynolds Antique House',

    // Set true only if your host requires strict SSL cert verification
    'smtp_verify_ssl' => false,

    'admin_to' => 'info@reynoldsantiquehouse.com',

    'rate_limit_max' => 5,
    'rate_limit_window' => 300,
];
