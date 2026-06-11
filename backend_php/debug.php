<?php
header('Content-Type: application/json');

$debug = [
    'method' => $_SERVER['REQUEST_METHOD'],
    'uri' => $_SERVER['REQUEST_URI'],
    'php_self' => $_SERVER['PHP_SELF'],
    'script_filename' => $_SERVER['SCRIPT_FILENAME'],
    'config_loaded' => file_exists(__DIR__ . '/config.php'),
    'env_loaded' => file_exists(__DIR__ . '/.env'),
];

echo json_encode($debug, JSON_PRETTY_PRINT);
?>
