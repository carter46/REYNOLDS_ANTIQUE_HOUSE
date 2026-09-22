# PHPMailer audit (Oddcoll → Reynolds)

Source: `C:\Users\user pc\OneDrive\Documents\carter\oddcoll.com\includes\lib\PHPMailer\`

| File | Copied |
|------|--------|
| `Exception.php` | yes |
| `PHPMailer.php` | yes |
| `SMTP.php` | yes |

- **Version:** PHPMailer 6.0.5 (`PHPMailer\PHPMailer` namespace)
- **Autoload:** manual `require_once` of the three files (no Composer)
- **SMTP pattern:** `isSMTP()`, Host/Auth/Username/Password/Port, `SMTPSecure` tls|ssl, `setFrom`, `addAddress`, optional `addReplyTo`, HTML body
- **Not copied:** Oddcoll `SmtpFallback`, Brevo, Dispatcher, form-handler, settings-store, credentials, branding
- **PHP compatibility:** PHPMailer 6.0.5 requires PHP ≥ 5.5; Hostinger shared PHP 7.4+/8.x is fine
- **Destination:** `includes/lib/PHPMailer/`
