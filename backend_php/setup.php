<?php
/**
 * Script de Setup - Criar Banco de Dados
 * Execute: php setup.php
 */

echo "🚀 Iniciando setup do banco de dados...\n\n";

try {
    // Criar banco de dados SQLite
    $db = new PDO('sqlite:acapra.sqlite');
    echo "✅ Conexão com banco estabelecida\n";

    // Ler arquivo de migrations
    $sql = file_get_contents('migrations.sql');

    if (!$sql) {
        echo "❌ Erro: Arquivo migrations.sql não encontrado\n";
        exit(1);
    }

    // Executar todas as migrations
    $db->exec($sql);
    echo "✅ Migrations executadas com sucesso\n\n";

    // Listar tabelas criadas
    echo "📋 Tabelas criadas:\n";
    $result = $db->query("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
    $count = 0;
    while ($row = $result->fetch(PDO::FETCH_ASSOC)) {
        echo "  ✓ " . $row['name'] . "\n";
        $count++;
    }

    echo "\n📊 Total de tabelas: $count\n\n";

    // Criar um usuário admin padrão para teste
    echo "👤 Criando usuário admin para teste...\n";

    $adminData = [
        'nome' => 'Administrador',
        'email' => 'admin@acapra.com',
        'telefone' => '11987654321',
        'password' => password_hash('admin123456', PASSWORD_BCRYPT),
        'is_staff' => 1,
        'is_superuser' => 1,
        'is_active' => 1,
        'date_joined' => date('Y-m-d H:i:s')
    ];

    $insertAdmin = $db->prepare("
        INSERT INTO usuarios (nome, email, telefone, password, is_staff, is_superuser, is_active, date_joined)
        VALUES (:nome, :email, :telefone, :password, :is_staff, :is_superuser, :is_active, :date_joined)
    ");

    try {
        $insertAdmin->execute($adminData);
        $adminId = $db->lastInsertId();
        echo "✅ Usuário admin criado (ID: $adminId)\n";
        echo "   Email: admin@acapra.com\n";
        echo "   Senha: admin123456\n\n";

        // Criar perfil administrativo para o admin
        $db->exec("
            INSERT INTO perfis_administrativos (usuario_id, nivel, ativo, data_promocao)
            VALUES ($adminId, 'master', 1, datetime('now'))
        ");
        echo "✅ Perfil master criado para admin\n\n";
    } catch (Exception $e) {
        echo "⚠️  Usuário admin já existe (ou erro ao criar)\n\n";
    }

    // Criar contato padrão
    try {
        $db->exec("INSERT INTO contatos_acapra (id) VALUES (1)");
        echo "✅ Registro de contato criado\n\n";
    } catch (Exception $e) {
        echo "⚠️  Registro de contato já existe\n\n";
    }

    echo "═══════════════════════════════════════════════════════\n";
    echo "🎉 SETUP CONCLUÍDO COM SUCESSO!\n";
    echo "═══════════════════════════════════════════════════════\n\n";

    echo "📝 Próximos passos:\n";
    echo "1. Verificar arquivo .env:\n";
    echo "   - DB_ENGINE=sqlite\n";
    echo "   - DB_NAME=acapra.sqlite\n\n";

    echo "2. Iniciar o servidor:\n";
    echo "   C:\\xampp\\php\\php.exe -S localhost:8000\n\n";

    echo "3. Testar endpoints:\n";
    echo "   curl http://localhost:8000/api/contato/\n\n";

    echo "4. Login com usuário admin:\n";
    echo "   Email: admin@acapra.com\n";
    echo "   Senha: admin123456\n\n";

    echo "📦 Arquivo de banco de dados: acapra.sqlite\n";
    echo "   (salvo na pasta backend_php/)\n\n";

} catch (Exception $e) {
    echo "❌ ERRO: " . $e->getMessage() . "\n";
    exit(1);
}
?>
