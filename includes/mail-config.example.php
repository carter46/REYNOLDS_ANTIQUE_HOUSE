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
    // SMTP server (use the authenticated mailbox's provider settings)
    'smtp_host' => 'smtp.example.com',
    'smtp_port' => 587,
    'smtp_user' => 'your-smtp-username@example.com',
    'smtp_pass' => 'YOUR_SMTP_PASSWORD_HERE',
    'smtp_encryption' => 'tls', // 'tls' or 'ssl'

    // FROM must be the authenticated SMTP mailbox when the provider requires it
    'smtp_from_email' => 'your-smtp-username@example.com',
    'smtp_from_name' => 'Reynolds Antique House',

    // Fixed admin recipient (endpoint never accepts an arbitrary "to")
    'admin_to' => 'info@reynoldsantiquehouse.com',

    // Abuse controls
    'rate_limit_max' => 5,       // max submissions
    'rate_limit_window' => 300,  // seconds
];
