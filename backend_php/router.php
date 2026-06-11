<?php
/**
 * Router para o servidor PHP built-in
 * Redireciona todas as requisições para index.php
 */

$requested_file = __DIR__ . $_SERVER["REQUEST_URI"];

// Se for um arquivo real (CSS, JS, imagens, etc), serve
if (is_file($requested_file) && file_exists($requested_file)) {
    return false;
}

// Se for uma pasta, serve o index.html se existir
if (is_dir($requested_file) && file_exists($requested_file . '/index.html')) {
    return false;
}

// Caso contrário, redireciona para index.php
require_once __DIR__ . '/index.php';
