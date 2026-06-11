# Conversão Django → PHP Puro

Este documento descreve a conversão do backend Django para PHP puro compatível com hospedagem compartilhada.

## Estrutura de Pastas

```
backend_php/
├── core/              # Classes base e utilitários
│   ├── Database.php   # Gerenciador de BD (PDO)
│   ├── Model.php      # Classe base para modelos
│   ├── QueryBuilder.php # Construtor de queries
│   ├── JWT.php        # Gerenciador de tokens JWT
│   ├── Validator.php  # Validação de dados
│   ├── Response.php   # Respostas HTTP
│   ├── Controller.php # Classe base para controllers
│   └── Router.php     # Roteador de URLs
│
├── gerenciamento/     # Autenticação e usuários
│   ├── Usuario.php    # Modelo de usuário
│   ├── PerfilAdministrativo.php # Modelo de perfil
│   ├── AuthController.php # Autenticação
│   └── UserController.php # Gerenciam usuário
│
├── noticias/          # Publicações
│   ├── Publicacao.php # Modelo
│   └── PublicacaoController.php # Controller
│
├── contato/           # Contatos
│   ├── ContatoAcapra.php # Modelo
│   └── ContatoController.php # Controller
│
├── adocao/            # Adoções
│   ├── Animal.php
│   └── AnimalImagem.php
│
├── doacoes/           # Doações
│   └── DadosPix.php
│
├── config.php         # Configuração principal
├── index.php          # Ponto de entrada
└── .htaccess          # Rewrite rules Apache
```

## Mapeamento Django → PHP

### Models
- `models.py` → `ModelClass.php` (estende `core\Model`)
- `AbstractUser` → `Usuario` (com hash de senha)
- `choices` → Constantes de classe
- `queryset.filter()` → `Model::where()->get()`
- `queryset.count()` → `Model::where()->count()`
- `save()` → Mesmo comportamento

### Views (APIView)
- `APIView` → `Controller` (estende `core\Controller`)
- `def get()` → `public function get_`
- `def post()` → `public function post_`
- `def patch()` → `public function patch_`
- `@permission_classes` → `requireAuth()`, `requireModuleAccess()`
- `Response()` → `Response::success()`, `Response::error()`

### Serializers
- Validação → `core\Validator`
- `ModelSerializer` → Método `serialize*()` nos controllers

### URLs
- `path()` → Registrado em `Router::registerRoutes()`
- Namespaces → Namespace PHP
- Regex patterns → Preg patterns

### Autenticação
- `TokenObtainPairView` → `AuthController::login()`
- `TokenRefreshView` → `AuthController::refresh()`
- `TokenBlacklistView` → `AuthController::logout()`
- `JWTAuthentication` → `Controller::authenticate()`
- `IsAuthenticated` → `requireAuth()`

### Permissões
- `PermissionClasses` → `requireModuleAccess()`, `requireMaster()`
- `has_permission()` → Métodos em `PerfilAdministrativo`

## Configuração

### .env
```env
SECRET_KEY=sua-chave-secreta
DEBUG=true
ALLOWED_HOSTS=localhost,127.0.0.1

DB_ENGINE=sqlite
DB_NAME=/path/to/acapra.sqlite
# ou MySQL:
# DB_ENGINE=mysql
# DB_HOST=localhost
# DB_USER=root
# DB_PASSWORD=senha
# DB_NAME=acapra
```

### Hospedagem Compartilhada
1. Upload dos arquivos via FTP
2. Configure as permissões de pasta:
   - `media/` → 755
   - `staticfiles/` → 755
3. Crie o arquivo `.env` fora da pasta web (se possível)
4. Carregue-o em `config.php`

## Banco de Dados

### Criar tabelas

```sql
-- Usuários
CREATE TABLE usuarios (
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

-- Perfis Administrativos
CREATE TABLE perfis_administrativos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL UNIQUE,
    nivel VARCHAR(20) DEFAULT 'usuario',
    cargo VARCHAR(100),
    setor VARCHAR(100),
    ativo BOOLEAN DEFAULT 1,
    observacoes TEXT,
    data_promocao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    promovido_por INTEGER,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    FOREIGN KEY (promovido_por) REFERENCES usuarios(id)
);

-- Publicações
CREATE TABLE publicacoes (
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

-- Contatos
CREATE TABLE contatos_acapra (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    whatsapp_castracoes VARCHAR(20),
    whatsapp_doacoes VARCHAR(20),
    whatsapp_financeiro VARCHAR(20),
    instagram VARCHAR(255),
    facebook VARCHAR(255),
    email VARCHAR(255)
);

-- Dados PIX
CREATE TABLE dados_pix (
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

-- Animais
CREATE TABLE animais (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome_animal VARCHAR(30) NOT NULL,
    nome_doador VARCHAR(30) NOT NULL,
    telefone VARCHAR(20) NOT NULL,
    especie VARCHAR(10) NOT NULL,
    sexo VARCHAR(10) NOT NULL,
    foto VARCHAR(255),
    descricao TEXT
);

-- Imagens de Animais
CREATE TABLE animais_imagens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    animal_id INTEGER NOT NULL,
    imagem VARCHAR(255) NOT NULL,
    ordem INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (animal_id) REFERENCES animais(id)
);
```

## API Endpoints

### Autenticação
- `POST /api/gerenciamento/auth/register/` - Registra novo usuário
- `POST /api/gerenciamento/auth/login/` - Login (retorna tokens)
- `POST /api/gerenciamento/auth/refresh/` - Renova access token
- `POST /api/gerenciamento/auth/logout/` - Logout

### Usuário
- `GET /api/gerenciamento/user/me/` - Dados do usuário logado
- `PATCH /api/gerenciamento/user/me/` - Atualiza dados
- `POST /api/gerenciamento/user/change-password/` - Altera senha

### Publicações
- `GET /api/noticias/publicacoes/` - Lista publicações
- `POST /api/noticias/publicacoes/` - Cria publicação
- `GET /api/noticias/publicacoes/<id>/` - Obtém publicação
- `PATCH /api/noticias/publicacoes/<id>/` - Atualiza publicação
- `DELETE /api/noticias/publicacoes/<id>/` - Deleta publicação

### Contato
- `GET /api/contato/` - Obtém dados de contato
- `PATCH /api/contato/` - Atualiza dados (master only)

## Diferenças Importantes

### 1. Middleware de Segurança
Django usa middleware automático. Em PHP, adicione headers manualmente:
```php
$controller->setSecurityHeaders();
$controller->setCorsHeaders();
```

### 2. Signals/Hooks
Django usa signals para criar perfil automaticamente. Em PHP, chame explicitamente:
```php
PerfilAdministrativo::getOrCreateForUser($user);
```

### 3. Admin Django
Não há equivalente. Use phpMyAdmin ou adminer.php para gerenciar dados.

### 4. Migrations
Não há migrations automáticas. Execute manualmente os scripts SQL.

### 5. Internacionalização (i18n)
Django usa i18n automático. Em PHP, use constantes:
```php
define('LANGUAGE_CODE', 'pt-br');
define('TIME_ZONE', 'America/Sao_Paulo');
```

### 6. Cache
Django tem sistema de cache. Para implementar:
```php
// Adicione cache em QueryBuilder ou use Redis/Memcached
```

### 7. Email
Para enviar emails em hospedagem compartilhada, use `mail()` ou SMTP:
```php
mail($to, $subject, $message, $headers);
```

## Segurança

### Implementadas
✅ Autenticação JWT com HS256
✅ Hash de senha com bcrypt
✅ Validação de entrada (Validator)
✅ Headers de segurança (CSP, X-Frame-Options, etc.)
✅ CORS configurável
✅ SQL Injection protection (PDO prepared statements)

### A Implementar
⚠️ Rate limiting (implementar em Router/Controller)
⚠️ Token blacklist (implementar com arquivo JSON ou BD)
⚠️ 2FA (adicionar novo modelo)
⚠️ Logging de requisições (implementar middleware)

## Performance

### Otimizações
- Lazy loading em QueryBuilder
- Paginação padrão (20 itens)
- Índices no BD (criar via SQL)
- Caching de headers HTTP
- Compressão gzip (.htaccess)

### Melhorias Futuras
- Implementar cache com Redis
- Query caching
- Índices em campos frequentemente consultados
- Armazenar assets em CDN

## Deploy em Hospedagem Compartilhada

1. **Preparação**
   ```bash
   # Criar arquivo .env com credenciais
   cp .env.example .env
   ```

2. **Upload**
   - Use FTP/SFTP para enviar arquivos
   - Ou git push se houver suporte

3. **Permissões**
   ```bash
   chmod 755 media/
   chmod 755 staticfiles/
   chmod 644 *.php
   chmod 644 .htaccess
   ```

4. **Banco de Dados**
   - cPanel: phpMyAdmin
   - Plesk: MySQL manager
   - Execute scripts SQL fornecidos

5. **Configuração**
   - Edite `.env` com credenciais do BD
   - Verifique `SECRET_KEY` é forte

## Troubleshooting

### Erro: "Fatal error: Class not found"
- Verifique namespace está correto
- Verifique arquivo existe em pasta correta

### Erro: "CORS error"
- Configure `CORS_ALLOWED_ORIGINS` em config.php
- Verifique headers CORS em `.htaccess`

### Erro: "Database connection"
- Verifique credenciais em `.env`
- Verifique banco de dados existe
- Verifique tabelas foram criadas

### Erro: "Token expired"
- Implemente refresh token flow
- Aumente `JWT_ACCESS_LIFETIME` se necessário

## Próximas Etapas

1. Implementar modelos e controllers restantes
2. Adicionar endpoints para outros modules
3. Implementar rate limiting
4. Configurar logging
5. Adicionar validações customizadas
6. Implementar webhooks para Meta/Facebook
7. Testes e otimização

---

**Nota**: Este é um MVP (Minimum Viable Product). Para produção, considere:
- Adicionar sistema de logging
- Implementar caching
- Melhorar tratamento de erros
- Adicionar rate limiting
- Implementar token blacklist
- Adicionar duas autenticação
