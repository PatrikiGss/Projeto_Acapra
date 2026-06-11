# Índice Completo - Backend PHP Acapra

Bem-vindo ao backend Acapra convertido para **PHP puro**. Este índice ajuda a navegar por toda a documentação e código.

## 📚 Documentação

### Começar
1. **[README.md](README.md)** - Guia de introdução e início rápido
   - Características principais
   - Requisitos
   - Exemplos de uso
   - Troubleshooting básico

### Aprofundamento
2. **[CONVERSAO.md](CONVERSAO.md)** - Documentação técnica completa
   - Estrutura de pastas
   - Mapeamento Django → PHP
   - Configuração detalhada
   - Banco de dados e SQL
   - API endpoints completos
   - Diferenças e avisos importantes
   - Segurança implementada
   - Performance

3. **[CONVERSAO_RESUMO.md](CONVERSAO_RESUMO.md)** - Resumo executivo da conversão
   - Estatísticas da conversão
   - Componentes convertidos
   - Mapeamento tabular
   - Estrutura de arquivos
   - Funcionalidades implementadas vs. não implementadas
   - Próximas etapas

### Deploy
4. **[HOSTING.md](HOSTING.md)** - Guia completo de deploy
   - cPanel (HostGator, Bluehost, etc)
   - Plesk
   - DirectAdmin
   - Cloud (AWS, DigitalOcean)
   - HTTPS/SSL
   - Troubleshooting específico
   - Performance e monitoramento

## 🗂️ Estrutura de Código

### Core Framework (`core/`)
Estas classes formam a base do framework PHP:

- **[config.php](config.php)** - Configuração principal
  - Carregamento de variáveis de ambiente
  - Definição de constantes
  - Autoload de classes
  - Configuração do timezone

- **[core/Database.php](core/Database.php)** - Camada de banco de dados
  - Conexão PDO (SQLite/MySQL)
  - Métodos CRUD básicos
  - Transações
  - Query builder abstrato

- **[core/Model.php](core/Model.php)** - Classe base para modelos
  - Atributos e preenchimento de dados
  - Save/Update/Delete
  - Conversão para array/JSON
  - Finders estáticos

- **[core/QueryBuilder.php](core/QueryBuilder.php)** - Construtor de queries
  - WHERE conditions
  - ORDER BY, LIMIT, OFFSET
  - Paginação
  - Count, exists
  - Update/delete múltiplos

- **[core/JWT.php](core/JWT.php)** - Autenticação JWT
  - Criação de tokens
  - Verificação de tokens
  - Access token + refresh token
  - HS256 HMAC-SHA256

- **[core/Validator.php](core/Validator.php)** - Validação de dados
  - Regras: required, email, min/max, numeric, etc
  - Mensagens customizadas
  - Validação de telefone
  - Validação de data

- **[core/Response.php](core/Response.php)** - Respostas HTTP
  - Respostas de sucesso/erro
  - Validação de erros
  - Paginação
  - Respostas 401/403/404

- **[core/Controller.php](core/Controller.php)** - Classe base para controllers
  - Parse de requisição HTTP
  - Autenticação JWT
  - Permissões (requireAuth, requireMaster, etc)
  - Headers de segurança
  - CORS

- **[core/Router.php](core/Router.php)** - Roteador de URLs
  - Registro de rotas
  - Dispatching de requisições
  - Pattern matching com regex
  - GET/POST/PUT/PATCH/DELETE

### Autenticação & Gerenciamento (`gerenciamento/`)

- **[gerenciamento/Usuario.php](gerenciamento/Usuario.php)** - Modelo de usuário
  - Hash bcrypt de senha
  - Validação de senha
  - Find by email
  - Create user/superuser

- **[gerenciamento/PerfilAdministrativo.php](gerenciamento/PerfilAdministrativo.php)** - Perfil administrativo
  - Níveis: usuario, admin, doacoes, financeiro, master
  - Módulos por nível
  - Controle de permissões
  - Get ou create perfil

- **[gerenciamento/AuthController.php](gerenciamento/AuthController.php)** - Autenticação
  - Registro (POST /auth/register/)
  - Login (POST /auth/login/)
  - Refresh token (POST /auth/refresh/)
  - Logout (POST /auth/logout/)

- **[gerenciamento/UserController.php](gerenciamento/UserController.php)** - Gerenciam do usuário
  - Obter dados (GET /user/me/)
  - Atualizar perfil (PATCH /user/me/)
  - Alterar senha (POST /user/change-password/)

### Publicações/Notícias (`noticias/`)

- **[noticias/Publicacao.php](noticias/Publicacao.php)** - Modelo de publicação
  - Categorias: noticias, resgates, campanhas, desaparecidos
  - Status ativo/inativo
  - Timestamps auto (created_at, updated_at)
  - Upload/delete de foto

- **[noticias/PublicacaoController.php](noticias/PublicacaoController.php)** - API de publicações
  - Listar (GET /publicacoes/)
  - Criar (POST /publicacoes/)
  - Detalhe (GET /publicacoes/<id>/)
  - Atualizar (PATCH /publicacoes/<id>/)
  - Deletar (DELETE /publicacoes/<id>/)
  - Filtro por categoria
  - Upload de imagem

### Contatos (`contato/`)

- **[contato/ContatoAcapra.php](contato/ContatoAcapra.php)** - Modelo de contato
  - Singleton (apenas 1 registro)
  - WhatsApps por módulo
  - Redes sociais
  - Email

- **[contato/ContatoController.php](contato/ContatoController.php)** - API de contato
  - Obter contato (GET /contato/)
  - Atualizar (PATCH /contato/ - master only)

### Adoção (`adocao/`)

- **[adocao/Animal.php](adocao/Animal.php)** - Modelo de animal
  - Nome, doador, telefone
  - Espécie (cachorro, gato, outros)
  - Sexo (macho, fêmea)
  - Foto e descrição
  - Relacionamento com imagens

- **[adocao/AnimalImagem.php](adocao/AnimalImagem.php)** - Imagens de animal
  - Múltiplas fotos por animal
  - Ordenação
  - Timestamp de criação

### Doações (`doacoes/`)

- **[doacoes/DadosPix.php](doacoes/DadosPix.php)** - Dados PIX
  - Chave PIX única
  - QR Code
  - Dados bancários
  - Status ativo/inativo
  - Timestamps

## 📁 Arquivos de Configuração

- **[.env.example](.env.example)** - Template de variáveis de ambiente
  - Copie para `.env`
  - Preencha com seus valores

- **[.htaccess](.htaccess)** - Configuração Apache
  - Rewrite rules para roteamento
  - Headers de segurança
  - Compressão gzip
  - Cache

- **[migrations.sql](migrations.sql)** - Schema do banco de dados
  - Tabelas SQL completas
  - Índices
  - Foreign keys
  - Inserts opcionais

- **[config.php](config.php)** - Configuração PHP principal
  - Carregamento de `.env`
  - Constantes globais
  - Autoload de classes
  - Timezone

- **[index.php](index.php)** - Ponto de entrada da aplicação
  - Carregamento de config
  - Roteamento de requisições
  - Tratamento de erros

## 🔗 Fluxo de Requisição

```
Requisição HTTP
    ↓
[.htaccess] Rewrite rule
    ↓
[index.php] Carrega config
    ↓
[core/Router.php] Encontra rota
    ↓
[Controller] Executa ação
    ├─ Autentica via JWT (core/JWT.php)
    ├─ Verifica permissões (core/Controller.php)
    ├─ Valida dados (core/Validator.php)
    ├─ Interage com modelos (core/Model.php)
    └─ Retorna resposta (core/Response.php)
    ↓
Response JSON
```

## 📊 Diagrama de Modelos

```
Usuario (1)
    ├─ PerfilAdministrativo (1:1)
    └─ MetaOAuthState (1:N)

Publicacao (1:N)
    ├─ Categoria
    └─ Foto

Animal (1:N)
    └─ AnimalImagem (1:N)

DadosPix (1:N)

ContatoAcapra (Singleton)
```

## 🔐 Endpoints Mapeados

### Autenticação
```
POST   /api/gerenciamento/auth/register/          → Registrar
POST   /api/gerenciamento/auth/login/             → Login
POST   /api/gerenciamento/auth/refresh/           → Renovar token
POST   /api/gerenciamento/auth/logout/            → Logout
```

### Usuário
```
GET    /api/gerenciamento/user/me/                → Obter dados
PATCH  /api/gerenciamento/user/me/                → Atualizar dados
POST   /api/gerenciamento/user/change-password/   → Alterar senha
```

### Publicações
```
GET    /api/noticias/publicacoes/                 → Listar
POST   /api/noticias/publicacoes/                 → Criar
GET    /api/noticias/publicacoes/<id>/            → Detalhe
PATCH  /api/noticias/publicacoes/<id>/            → Atualizar
DELETE /api/noticias/publicacoes/<id>/            → Deletar
```

### Contato
```
GET    /api/contato/                              → Obter contato
PATCH  /api/contato/                              → Atualizar (master)
```

## 🚀 Como Começar

1. **Ler documentação**
   - Comece com [README.md](README.md)
   - Depois leia [CONVERSAO.md](CONVERSAO.md) para entender completamente

2. **Configurar localmente**
   ```bash
   cp .env.example .env
   # Edite .env com valores locais
   php -S localhost:8000
   ```

3. **Explorar código**
   - Comece com [core/Database.php](core/Database.php)
   - Depois [core/Model.php](core/Model.php)
   - Depois um controller: [gerenciamento/AuthController.php](gerenciamento/AuthController.php)

4. **Deploy**
   - Leia [HOSTING.md](HOSTING.md) para seu tipo de hospedagem
   - Siga o checklist

## 📖 Referências Rápidas

### Criar um novo modelo
```php
// namespace app/Exemplo;
class Exemplo extends Model {
    protected $table = 'exemplos';
    protected $fillable = ['campo1', 'campo2'];
}
```

### Criar um novo controller
```php
// namespace app\ExemploController;
class ExemploController extends Controller {
    public function get_list() {
        $this->requireAuth();
        $exemplos = Exemplo::all();
        Response::success($exemplos)->send();
    }
}
```

### Registrar uma rota
```php
// em Router::registerRoutes()
$this->get('/api/exemplo/', 'app\ExemploController', 'list');
```

### Fazer uma requisição
```bash
curl -X GET http://localhost:8000/api/contato/ \
  -H "Content-Type: application/json"
```

## 🎯 Próximas Ações

- [ ] Ler README.md
- [ ] Configurar .env
- [ ] Executar migrations.sql
- [ ] Testar endpoints
- [ ] Ler CONVERSAO.md
- [ ] Entender core/
- [ ] Explorar controllers
- [ ] Configurar deploy com HOSTING.md
- [ ] Deploy em produção
- [ ] Monitorar performance

---

**Versão**: 1.0 MVP
**Status**: Production-ready
**Última atualização**: 2024
