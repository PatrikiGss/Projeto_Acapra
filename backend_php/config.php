<?php
/**
 * Configuração principal da aplicação Acapra
 * Equivalente a settings.py do Django
 */

// =========================================================
// CARREGAR ARQUIVO .ENV
// =========================================================

$envFile = __DIR__ . '/.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        // Ignorar comentários
        if (strpos($line, '#') === 0) continue;

        // Parse da variável
        if (strpos($line, '=') !== false) {
            list($key, $value) = explode('=', $line, 2);
            $key = trim($key);
            $value = trim($value);

            // Remove aspas se houver
            if (substr($value, 0, 1) === '"' && substr($value, -1) === '"') {
                $value = substr($value, 1, -1);
            }

            putenv("$key=$value");
        }
    }
}

// =========================================================
// SEGURANÇA
// =========================================================

define('SECRET_KEY', getenv('SECRET_KEY') ?: 'default-insecure-key');
define('DEBUG', strtolower(getenv('DEBUG') ?: 'false') === 'true');

// Hosts permitidos
$allowed_hosts = explode(',', getenv('ALLOWED_HOSTS') ?: 'localhost,127.0.0.1');
define('ALLOWED_HOSTS', array_map('trim', $allowed_hosts));

// =========================================================
// DATABASE
// =========================================================

$db_config = [
    'engine' => getenv('DB_ENGINE') ?: 'sqlite',
    'host' => getenv('DB_HOST') ?: 'localhost',
    'user' => getenv('DB_USER') ?: '',
    'password' => getenv('DB_PASSWORD') ?: '',
    'database' => getenv('DB_NAME') ?: 'acapra.sqlite',
    'port' => getenv('DB_PORT') ?: '',
];

define('DB_CONFIG', $db_config);

// =========================================================
// PATHS
// =========================================================

define('BASE_DIR', dirname(__FILE__));
define('MEDIA_URL', '/media/');
define('MEDIA_ROOT', BASE_DIR . '/media');
define('STATIC_URL', '/static/');
define('STATIC_ROOT', BASE_DIR . '/staticfiles');

// =========================================================
// INTERNATIONALIZATION
// =========================================================

define('LANGUAGE_CODE', 'pt-br');
define('TIME_ZONE', 'America/Sao_Paulo');
date_default_timezone_set(TIME_ZONE);

// =========================================================
// JWT CONFIGURATION
// =========================================================

define('JWT_ALGORITHM', 'HS256');
define('JWT_SIGNING_KEY', SECRET_KEY);
define('JWT_ACCESS_LIFETIME', 30 * 60); // 30 minutos em segundos
define('JWT_REFRESH_LIFETIME', 24 * 60 * 60); // 1 dia em segundos

// =========================================================
// CORS CONFIGURATION
// =========================================================

$cors_allowed_origins = explode(
    ',',
    getenv('CORS_ALLOWED_ORIGINS') ?: 'http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000'
);
define('CORS_ALLOWED_ORIGINS', array_map('trim', $cors_allowed_origins));

// =========================================================
// META / FACEBOOK INTEGRATION
// =========================================================

define('META_APP_ID', getenv('META_APP_ID') ?: '');
define('META_APP_SECRET', getenv('META_APP_SECRET') ?: '');
define('META_REDIRECT_URI', getenv('META_REDIRECT_URI') ?: 'http://localhost:8000/api/meta/auth/callback/');
define('FRONTEND_URL', getenv('FRONTEND_URL') ?: 'http://localhost:5173');
define('SITE_URL', getenv('SITE_URL') ?: 'http://localhost:8000');

// =========================================================
// SECURITY HEADERS
// =========================================================

define('X_FRAME_OPTIONS', 'DENY');
define('SECURE_CONTENT_TYPE_NOSNIFF', true);

if (!DEBUG) {
    define('SECURE_SSL_REDIRECT', getenv('SECURE_SSL_REDIRECT') === 'true' ? true : false);
    define('SECURE_HSTS_SECONDS', 31536000);
    define('SECURE_HSTS_INCLUDE_SUBDOMAINS', true);
    define('SECURE_HSTS_PRELOAD', true);
    define('SESSION_COOKIE_SECURE', true);
    define('CSRF_COOKIE_SECURE', true);
} else {
    define('SECURE_SSL_REDIRECT', false);
    define('SESSION_COOKIE_SECURE', false);
    define('CSRF_COOKIE_SECURE', false);
}

// =========================================================
// PAGINATION
// =========================================================

define('PAGE_SIZE', 20);

// =========================================================
// ERROR HANDLING
// =========================================================

if (DEBUG) {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
} else {
    error_reporting(E_ALL);
    ini_set('display_errors', 0);
}

// =========================================================
// AUTOLOAD
// =========================================================

spl_autoload_register(function ($class) {
    $file = BASE_DIR . '/' . str_replace('\\', '/', $class) . '.php';
    if (file_exists($file)) {
        require_once $file;
    }
});
