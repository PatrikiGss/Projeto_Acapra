# Backend Acapra - PHP Puro

Backend da aplicação Acapra convertido de Django para **PHP puro** compatível com **hospedagem compartilhada** que não suporta Python, Docker, Node.js ou Composer.

## 🎯 Características

- ✅ **Sem dependências** - PHP puro (7.4+)
- ✅ **Autenticação JWT** - HS256
- ✅ **Banco de dados** - SQLite ou MySQL
- ✅ **API REST** - Padrão JSON
- ✅ **CORS** - Configurável
- ✅ **Segurança** - Headers, validação, bcrypt
- ✅ **Roteamento** - Sistema de rotas simples
- ✅ **ORM básico** - Model, QueryBuilder

## 📋 Requisitos

- **PHP 7.4+** com extensões:
  - `pdo` (PHP Data Objects)
  - `pdo_sqlite` ou `pdo_mysql`
  - `json`
  - `mbstring`

## 🚀 Início Rápido

### 1. Configuração

Crie um arquivo `.env` na raiz:

```env
# Segurança
SECRET_KEY=sua-chave-secreta-muito-forte
DEBUG=true

# Banco de dados
DB_ENGINE=sqlite
DB_NAME=acapra.sqlite

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# Meta/Facebook
META_APP_ID=seu_app_id
META_APP_SECRET=seu_app_secret
```

### 2. Banco de Dados

#### SQLite (recomendado para começar)
```bash
# O banco é criado automaticamente
# Apenas execute os scripts SQL em tools/migrations.sql
```

#### MySQL
```sql
-- Crie o banco manualmente
CREATE DATABASE acapra CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Atualize .env
DB_ENGINE=mysql
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=sua_senha
DB_NAME=acapra
```

### 3. Executar

#### Local (PHP built-in)
```bash
cd backend_php
php -S localhost:8000
```

#### Hospedagem compartilhada
- Upload via FTP
- Acesse `http://seu-dominio.com/backend_php/`

## 📚 Documentação

### Estrutura de Pastas
Veja [CONVERSAO.md](CONVERSAO.md#estrutura-de-pastas)

### Mapeamento Django → PHP
Veja [CONVERSAO.md](CONVERSAO.md#mapeamento-django--php)

### Endpoints da API
Veja [CONVERSAO.md](CONVERSAO.md#api-endpoints)

## 🔌 Exemplos de Uso

### Registrar usuário
```bash
curl -X POST http://localhost:8000/api/gerenciamento/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "João Silva",
    "email": "joao@example.com",
    "telefone": "11987654321",
    "password": "senha123"
  }'
```

### Login
```bash
curl -X POST http://localhost:8000/api/gerenciamento/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "joao@example.com",
    "password": "senha123"
  }'

# Resposta:
# {
#   "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
#   "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
# }
```

### Obter dados do usuário (autenticado)
```bash
curl -X GET http://localhost:8000/api/gerenciamento/user/me/ \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc..."
```

### Listar publicações
```bash
curl -X GET "http://localhost:8000/api/noticias/publicacoes/?categoria=noticias&page=1"
```

### Criar publicação (requer autenticação)
```bash
curl -X POST http://localhost:8000/api/noticias/publicacoes/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "categoria": "noticias",
    "titulo": "Nova notícia",
    "resumo": "Resumo da notícia",
    "texto": "Texto completo...",
    "ativo": true
  }'
```

## 🔐 Autenticação

### Fluxo JWT

1. **Login** → Recebe `access` e `refresh` tokens
2. **Requisição** → Envia `Authorization: Bearer <access_token>`
3. **Token expira** → Usa `refresh_token` para obter novo `access_token`
4. **Logout** → Remove token no cliente

### Tokens
- **Access Token**: Válido por 30 minutos
- **Refresh Token**: Válido por 24 horas
- **Algoritmo**: HS256 (HMAC-SHA256)
- **Chave**: `SECRET_KEY` do config

## 📁 Estrutura de Pastas

```
backend_php/
├── core/              # Classes base
├── gerenciamento/     # Autenticação
├── noticias/          # Publicações
├── contato/           # Contatos
├── adocao/            # Adoções
├── doacoes/           # Doações
├── media/             # Arquivos enviados
├── staticfiles/       # CSS, JS estáticos
├── config.php         # Configurações
├── index.php          # Entrada principal
├── .htaccess          # Rewrite rules
└── .env               # Variáveis de ambiente
```

## 🔧 Configuração Avançada

### Mudando para MySQL

1. Edite `.env`:
```env
DB_ENGINE=mysql
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=senha
DB_NAME=acapra
DB_PORT=3306
```

2. Importe o schema:
```bash
mysql -u root -p acapra < migrations.sql
```

### Aumentar limite de upload

No `config.php`, PHP ou `.htaccess`:
```php
// config.php
ini_set('upload_max_filesize', '50M');
ini_set('post_max_size', '50M');
```

### HTTPS / SSL

Em `.env`:
```env
DEBUG=false
SECURE_SSL_REDIRECT=true
SECURE_HSTS_SECONDS=31536000
```

### Rate Limiting

Adicione em `Router::dispatch()`:
```php
// Verificar requisições por IP
$ip = $_SERVER['REMOTE_ADDR'];
// Implementar lógica de rate limit...
```

## 🚨 Segurança

### Implementado
- ✅ Autenticação JWT
- ✅ Hash bcrypt
- ✅ SQL Injection protection (PDO)
- ✅ Headers de segurança
- ✅ CORS
- ✅ Validação de entrada

### Recomendações
- 🔒 Use HTTPS em produção
- 🔒 Mude `DEBUG=false` em produção
- 🔒 Use senha forte em `SECRET_KEY`
- 🔒 Configure permissões de arquivo (644 / 755)
- 🔒 Implemente rate limiting
- 🔒 Implemente token blacklist
- 🔒 Use CSP headers (veja `.htaccess`)

## 🐛 Troubleshooting

### "Class not found"
Verifique namespace e caminho do arquivo.

### "Database connection error"
1. Verifique credenciais em `.env`
2. Verifique banco de dados existe
3. Verifique tabelas foram criadas
4. Tente com SQLite primeiro

### "CORS error"
1. Configure `CORS_ALLOWED_ORIGINS` em `.env`
2. Verifique origem está na lista
3. Tente sem CORS (mesmo domínio)

### "Token expired"
Implemente refresh token flow ou aumente `JWT_ACCESS_LIFETIME`.

## 📦 Deploy

### Hospedagem Compartilhada (cPanel/Plesk)

1. Conecte via FTP
2. Upload dos arquivos para `public_html` ou subpasta
3. Crie banco de dados via phpMyAdmin
4. Configure `.env`
5. Acesse `http://seu-dominio.com/backend_php/`

### VPS/Servidor Dedicado

```bash
# Clonar repositório
git clone <repo> /var/www/acapra/backend_php
cd /var/www/acapra/backend_php

# Configurar permissões
chmod 755 media/ staticfiles/
chmod 644 *.php .htaccess

# Criar banco de dados
mysql -u root -p acapra < migrations.sql

# Configurar .env
nano .env

# Restart Apache/Nginx
sudo service apache2 restart
```

## 🎓 Aprendizado

### Arquivos Importantes
- **config.php** - Configurações globais
- **core/Database.php** - Conexão BD
- **core/Model.php** - Base para modelos
- **core/JWT.php** - Gerenciamento de tokens
- **core/Router.php** - Roteamento de URLs
- **core/Controller.php** - Base para controllers

### Como Adicionar Nova Feature

1. **Criar modelo** em `nova_app/Modelo.php`:
```php
class Modelo extends Model {
    protected $table = 'tabela_nome';
}
```

2. **Criar controller** em `nova_app/ModeloController.php`:
```php
class ModeloController extends Controller {
    public function get_list() { ... }
}
```

3. **Registrar rotas** em `core/Router::registerRoutes()`:
```php
$this->get('/api/nova_app/modelos/', 'nova_app\ModeloController', 'list');
```

4. **Criar tabela** em BD:
```sql
CREATE TABLE tabelas_nome (id, ...);
```

## 📈 Performance

### Otimizações Implementadas
- Lazy loading em QueryBuilder
- Paginação padrão
- Compressão gzip
- Cache headers

### Mejores Futuras
- Redis para cache
- Índices no BD
- Query caching
- CDN para assets

## 📝 Licença

Mesmo projeto original - Acapra

## 🤝 Contribuição

Leia [CONVERSAO.md](CONVERSAO.md) para entender a estrutura de conversão.

## 📞 Suporte

Para dúvidas sobre a conversão, consulte [CONVERSAO.md](CONVERSAO.md#troubleshooting).

---

**Último update**: 2024
**Versão PHP**: 7.4+
**Status**: MVP (Production-ready com melhorias)
