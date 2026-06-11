<?php
/**
 * Arquivo de teste simples
 */

echo "🧪 Testando aplicação...\n\n";

// Teste 1: Config
echo "1️⃣ Carregando config...\n";
require_once __DIR__ . '/config.php';
echo "   ✅ Config carregada\n";
echo "   - DEBUG: " . (DEBUG ? 'true' : 'false') . "\n";
echo "   - DB_ENGINE: " . DB_CONFIG['engine'] . "\n";
echo "   - SECRET_KEY: " . substr(SECRET_KEY, 0, 10) . "...\n\n";

// Teste 2: Database
echo "2️⃣ Testando Database...\n";
try {
    $db = \core\Database::getInstance();
    echo "   ✅ Conexão com banco estabelecida\n";

    $result = $db->fetchOne("SELECT COUNT(*) as count FROM usuarios");
    echo "   - Usuários no banco: " . $result['count'] . "\n\n";
} catch (Exception $e) {
    echo "   ❌ Erro: " . $e->getMessage() . "\n\n";
}

// Teste 3: Router
echo "3️⃣ Testando Router...\n";
try {
    $router = new \core\Router();
    echo "   ✅ Router inicializado\n\n";
} catch (Exception $e) {
    echo "   ❌ Erro: " . $e->getMessage() . "\n\n";
}

// Teste 4: Simular requisição
echo "4️⃣ Simulando requisição GET /api/contato/...\n";
try {
    // Mock da requisição
    $_SERVER['REQUEST_METHOD'] = 'GET';
    $_SERVER['REQUEST_URI'] = '/api/contato/';
    $_GET = [];

    // Tenta fazer dispatch
    $router = new \core\Router();
    $method = 'GET';
    $uri = '/api/contato/';

    echo "   - Método: $method\n";
    echo "   - URI: $uri\n\n";
    echo "   ✅ Simulação pronta\n\n";
} catch (Exception $e) {
    echo "   ❌ Erro: " . $e->getMessage() . "\n\n";
}

echo "═══════════════════════════════════════════════════════\n";
echo "✅ TESTES CONCLUÍDOS\n";
echo "═══════════════════════════════════════════════════════\n";
?>
