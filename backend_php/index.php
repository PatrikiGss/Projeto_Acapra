<?php

/**
 * Arquivo principal da API Acapra
 * Equivalente ao manage.py + wsgi.py do Django
 */

// Carrega a configuração
require_once __DIR__ . '/config.php';

use core\Router;
use core\Response;

// Trata requisições OPTIONS (CORS preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    http_response_code(200);
    exit;
}

try {
    // Inicializa o roteador
    $router = new Router();

    // Processa a requisição
    $method = $_SERVER['REQUEST_METHOD'];
    $uri = $_SERVER['REQUEST_URI'];

    $router->dispatch($method, $uri);
} catch (\Exception $e) {
    if (DEBUG) {
        Response::error($e->getMessage(), 500)->send();
    } else {
        Response::error('Erro interno do servidor', 500)->send();
    }
}
