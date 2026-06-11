-- Migrations para Acapra Backend PHP
-- Execute este arquivo no seu banco de dados (SQLite ou MySQL)

-- =========================================================
-- USUÁRIOS E AUTENTICAÇÃO
-- =========================================================

CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    telefone VARCHAR(20) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    is_staff BOOLEAN DEFAULT 0,
    is_superuser BOOLEAN DEFAULT 0,
    is_active BOOLEAN DEFAULT 1,
    date_joined TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_telefone ON usuarios(telefone);

-- =========================================================
-- PERFIL ADMINISTRATIVO
-- =========================================================

CREATE TABLE IF NOT EXISTS perfis_administrativos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL UNIQUE,
    nivel VARCHAR(20) DEFAULT 'usuario',
    cargo VARCHAR(100),
    setor VARCHAR(100),
    ativo BOOLEAN DEFAULT 1,
    observacoes TEXT,
    data_promocao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    promovido_por INTEGER,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (promovido_por) REFERENCES usuarios(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_perfis_nivel ON perfis_administrativos(nivel);
CREATE INDEX IF NOT EXISTS idx_perfis_ativo ON perfis_administrativos(ativo);

-- =========================================================
-- NOTÍCIAS / PUBLICAÇÕES
-- =========================================================

CREATE TABLE IF NOT EXISTS publicacoes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    categoria VARCHAR(20) NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    resumo VARCHAR(280) DEFAULT '',
    foto VARCHAR(255),
    texto TEXT NOT NULL,
    ativo BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_publicacoes_categoria ON publicacoes(categoria);
CREATE INDEX IF NOT EXISTS idx_publicacoes_ativo ON publicacoes(ativo);
CREATE INDEX IF NOT EXISTS idx_publicacoes_created_at ON publicacoes(created_at);

-- =========================================================
-- CONTATOS
-- =========================================================

CREATE TABLE IF NOT EXISTS contatos_acapra (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    whatsapp_castracoes VARCHAR(20),
    whatsapp_doacoes VARCHAR(20),
    whatsapp_financeiro VARCHAR(20),
    instagram VARCHAR(255),
    facebook VARCHAR(255),
    email VARCHAR(255)
);

-- =========================================================
-- DOAÇÕES / PIX
-- =========================================================

CREATE TABLE IF NOT EXISTS dados_pix (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chave_pix VARCHAR(255) UNIQUE NOT NULL,
    qr_code VARCHAR(255),
    descricao TEXT,
    banco VARCHAR(80),
    agencia VARCHAR(20),
    conta VARCHAR(30),
    tipo_conta VARCHAR(40),
    cnpj VARCHAR(20),
    favorecido VARCHAR(120),
    ativo BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_dados_pix_ativo ON dados_pix(ativo);

-- =========================================================
-- ADOÇÃO / ANIMAIS
-- =========================================================

CREATE TABLE IF NOT EXISTS animais (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome_animal VARCHAR(30) NOT NULL,
    nome_doador VARCHAR(30) NOT NULL,
    telefone VARCHAR(20) NOT NULL,
    especie VARCHAR(10) NOT NULL,
    sexo VARCHAR(10) NOT NULL,
    foto VARCHAR(255),
    descricao TEXT,
    disponivel BOOLEAN DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_animais_especie ON animais(especie);
CREATE INDEX IF NOT EXISTS idx_animais_sexo ON animais(sexo);

-- =========================================================
-- IMAGENS DE ANIMAIS
-- =========================================================

CREATE TABLE IF NOT EXISTS animais_imagens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    animal_id INTEGER NOT NULL,
    imagem VARCHAR(255) NOT NULL,
    ordem INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (animal_id) REFERENCES animais(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_animais_imagens_animal_id ON animais_imagens(animal_id);
CREATE INDEX IF NOT EXISTS idx_animais_imagens_ordem ON animais_imagens(ordem);

-- =========================================================
-- VENDAS / PRODUTOS
-- =========================================================

CREATE TABLE IF NOT EXISTS produtos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome VARCHAR(200) NOT NULL,
    descricao TEXT,
    tipo VARCHAR(10) NOT NULL,
    preco DECIMAL(10,2) NOT NULL,
    foto VARCHAR(255),
    estoque INTEGER DEFAULT 0,
    ativo BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_produtos_tipo ON produtos(tipo);
CREATE INDEX IF NOT EXISTS idx_produtos_ativo ON produtos(ativo);

CREATE TABLE IF NOT EXISTS produtos_imagens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    produto_id INTEGER NOT NULL,
    imagem VARCHAR(255) NOT NULL,
    ordem INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_produtos_imagens_produto_id ON produtos_imagens(produto_id);
CREATE INDEX IF NOT EXISTS idx_produtos_imagens_ordem ON produtos_imagens(ordem);

-- =========================================================
-- VOLUNTARIADO
-- =========================================================

CREATE TABLE IF NOT EXISTS voluntarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome VARCHAR(200) NOT NULL,
    telefone VARCHAR(20) NOT NULL,
    idade INTEGER NOT NULL,
    motivo TEXT NOT NULL,
    email VARCHAR(255),
    ativo BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_voluntarios_ativo ON voluntarios(ativo);

-- =========================================================
-- DENÚNCIAS
-- =========================================================

CREATE TABLE IF NOT EXISTS denuncias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo VARCHAR(100) NOT NULL,
    descricao TEXT NOT NULL,
    gravidade VARCHAR(20) NOT NULL,
    nome VARCHAR(100) DEFAULT '',
    telefone VARCHAR(20),
    foto VARCHAR(255),
    status VARCHAR(20) DEFAULT 'pendente',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_denuncias_status ON denuncias(status);
CREATE INDEX IF NOT EXISTS idx_denuncias_gravidade ON denuncias(gravidade);

-- =========================================================
-- TRANSPARÊNCIA
-- =========================================================

CREATE TABLE IF NOT EXISTS transparencia_categorias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome VARCHAR(100) NOT NULL,
    tipo VARCHAR(10) NOT NULL,
    ativo BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_transparencia_categorias_tipo ON transparencia_categorias(tipo);

CREATE TABLE IF NOT EXISTS transparencia_movimentos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    categoria_id INTEGER NOT NULL,
    descricao VARCHAR(300) NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    data DATE NOT NULL,
    comprovante VARCHAR(255),
    ativo BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (categoria_id) REFERENCES transparencia_categorias(id)
);

CREATE INDEX IF NOT EXISTS idx_transparencia_movimentos_categoria_id ON transparencia_movimentos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_transparencia_movimentos_ativo ON transparencia_movimentos(ativo);

CREATE TABLE IF NOT EXISTS transparencia_documentos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome VARCHAR(200) NOT NULL,
    descricao VARCHAR(300) DEFAULT '',
    arquivo VARCHAR(255),
    ativo BOOLEAN DEFAULT 1,
    ordem INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_transparencia_documentos_ativo ON transparencia_documentos(ativo);
CREATE INDEX IF NOT EXISTS idx_transparencia_documentos_ordem ON transparencia_documentos(ordem);

CREATE TABLE IF NOT EXISTS transparencia_indicadores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chave VARCHAR(30) UNIQUE NOT NULL,
    valor INTEGER DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- LARES VOLUNTÁRIOS
-- =========================================================

CREATE TABLE IF NOT EXISTS lares_voluntarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome_responsavel VARCHAR(200) NOT NULL,
    telefone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    cidade VARCHAR(100) NOT NULL,
    tipos_animais VARCHAR(20) NOT NULL DEFAULT 'todos',
    capacidade INTEGER NOT NULL,
    descricao TEXT NOT NULL,
    ativo BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_lares_voluntarios_ativo ON lares_voluntarios(ativo);
CREATE INDEX IF NOT EXISTS idx_lares_voluntarios_cidade ON lares_voluntarios(cidade);

-- =========================================================
-- TOKEN BLACKLIST (Optional - para logout)
-- =========================================================

CREATE TABLE IF NOT EXISTS token_blacklist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    token_jti VARCHAR(255) UNIQUE NOT NULL,
    usuario_id INTEGER NOT NULL,
    blacklisted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_token_blacklist_usuario_id ON token_blacklist(usuario_id);

-- =========================================================
-- META / FACEBOOK INTEGRATION
-- =========================================================

CREATE TABLE IF NOT EXISTS meta_oauth_states (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    state VARCHAR(36) UNIQUE NOT NULL,
    usuario_id INTEGER NOT NULL,
    user_access_token TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_meta_oauth_states_usuario_id ON meta_oauth_states(usuario_id);
CREATE INDEX IF NOT EXISTS idx_meta_oauth_states_created_at ON meta_oauth_states(created_at);

-- =========================================================

CREATE TABLE IF NOT EXISTS meta_connections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    page_id VARCHAR(50) NOT NULL,
    page_name VARCHAR(100) NOT NULL,
    page_access_token TEXT NOT NULL,
    instagram_id VARCHAR(50),
    is_active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    UNIQUE(usuario_id, page_id)
);

CREATE INDEX IF NOT EXISTS idx_meta_connections_usuario_id ON meta_connections(usuario_id);
CREATE INDEX IF NOT EXISTS idx_meta_connections_is_active ON meta_connections(is_active);

-- =========================================================
-- INSERTS INICIAIS (Opcional)
-- =========================================================

-- Criar usuário admin padrão (senha: admin123)
-- Descomente para usar
-- INSERT OR IGNORE INTO usuarios (nome, email, telefone, password, is_staff, is_superuser, is_active)
-- VALUES ('Administrador', 'admin@acapra.com', '11987654321',
--         '$2y$10$...', 1, 1, 1);

-- Criar perfil admin padrão
-- INSERT OR IGNORE INTO perfis_administrativos (usuario_id, nivel, ativo)
-- VALUES (1, 'master', 1);

-- Criar contato padrão
-- INSERT OR IGNORE INTO contatos_acapra (id)
-- VALUES (1);

-- =========================================================
-- LIMPEZA (para resetar tudo)
-- =========================================================

-- Para resetar completamente, descomente:
-- DROP TABLE IF EXISTS meta_connections;
-- DROP TABLE IF EXISTS meta_oauth_states;
-- DROP TABLE IF EXISTS token_blacklist;
-- DROP TABLE IF EXISTS animais_imagens;
-- DROP TABLE IF EXISTS animais;
-- DROP TABLE IF EXISTS dados_pix;
-- DROP TABLE IF EXISTS publicacoes;
-- DROP TABLE IF EXISTS contatos_acapra;
-- DROP TABLE IF EXISTS perfis_administrativos;
-- DROP TABLE IF EXISTS usuarios;
