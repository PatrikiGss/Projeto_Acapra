# Documentação Técnica — Projeto Acapra

> Guia de arquitetura e funcionamento do código, para dar suporte e entender o
> projeto como um todo. Para **instalar e rodar**, veja o [README.md](README.md).
> Este documento explica **como o sistema funciona por dentro**.

> ⚠️ **Atualizações recentes:** este documento contém trechos legados. Para o
> estado atual e o histórico das últimas mudanças, use o **[context.md](context.md)**
> como fonte da verdade. Mudanças que ainda **não** estão refletidas abaixo:
> - **CAPTCHA (Turnstile) foi REMOVIDO** por completo (front e back) — ignore as
>   seções de captcha/Turnstile. Proteção do registro é só rate-limit por IP.
> - **Transparência não tem mais Financeiro (`Categoria`/`Movimento`) nem
>   Parcerias** — só Indicadores e Documentos.
> - **Fotos** são comprimidas para WebP no upload; adoção/produtos/notícias
>   aceitam **até 4 fotos**; listas têm **paginação (12/tela)**.
> - **Doações** têm formulário público de oferta de itens (`OfertaDoacao`).
> - **Meta**: publica **feed + story** (FB/IG) para animais **e notícias**, com
>   log de falhas (`MetaPostLog`). Em produção a app roda sob **`/api`** (admin em
>   `api/admin/`, mídia em `api/media/`, estáticos em `/api/static/`).

---

## Sumário

1. [Visão geral](#1-visão-geral)
2. [Stack e estrutura de pastas](#2-stack-e-estrutura-de-pastas)
3. [Backend — visão geral](#3-backend--visão-geral)
4. [Autenticação e autorização](#4-autenticação-e-autorização)
5. [Apps do backend (um a um)](#5-apps-do-backend-um-a-um)
6. [Segurança](#6-segurança)
7. [Auditoria](#7-auditoria)
8. [Frontend](#8-frontend)
9. [Fluxos importantes](#9-fluxos-importantes)
10. [Variáveis de ambiente](#10-variáveis-de-ambiente)
11. [Testes](#11-testes)
12. [Dicas de manutenção](#12-dicas-de-manutenção)

---

## 1. Visão geral

A Acapra é uma associação de proteção animal. O sistema é dividido em:

- **Backend** — API REST em **Django + Django REST Framework (DRF)**, autenticada
  por **JWT**, organizada em apps por domínio (adoção, doações, notícias, etc.).
- **Frontend** — SPA em **React + Vite**, que consome a API.

O site tem uma **parte pública** (qualquer visitante vê adoções, doações,
notícias, transparência e pode enviar denúncias) e uma **parte administrativa**
(o painel/dashboard), onde usuários com perfil administrativo gerenciam o
conteúdo conforme o nível de acesso.

---

## 2. Stack e estrutura de pastas

```text
Projeto_Acapra/
├── backend/              # API Django
│   ├── Acapra/           # settings.py, urls.py, wsgi/asgi (configuração central)
│   ├── core/             # utilidades compartilhadas (sem domínio próprio)
│   ├── auditoria/        # trilha de auditoria imutável
│   ├── gerenciamento/    # usuários, autenticação, níveis, dashboard
│   ├── adocao/           # animais para adoção
│   ├── doacoes/          # dados PIX / bancários para doação
│   ├── denuncias/        # denúncias públicas
│   ├── noticias/         # publicações (notícias, resgates, campanhas, desaparecidos)
│   ├── resgates/         # (sem models próprios — usa Publicacao categoria "resgates")
│   ├── transparencia/    # movimentos financeiros, documentos, indicadores
│   ├── vendas/           # loja solidária (produtos)
│   ├── voluntariado/     # cadastro de voluntários
│   ├── lares/            # lares voluntários (acolhimento temporário)
│   ├── contato/          # informações de contato (singleton)
│   ├── meta_integration/ # integração Facebook/Instagram (auto-post)
│   └── manage.py
├── frontend/             # SPA React (Vite)
│   └── src/
│       ├── pages/        # telas (uma pasta por view)
│       ├── components/   # componentes reutilizáveis
│       ├── hooks/        # hooks (ex.: useAdminAccess)
│       ├── utils/        # auth, permissions, captcha, logger, url, upload, phone
│       ├── services/     # api.js (axios + interceptors JWT)
│       ├── App.jsx       # rotas
│       └── main.jsx      # bootstrap React
├── DOCUMENTACAO.md       # este arquivo
└── README.md             # instalação e execução
```

**Tecnologias:** Python/Django/DRF, Simple JWT, django-cors-headers,
phonenumber_field, python-decouple (config via `.env`), cryptography (campos
criptografados). Frontend: React 19, React Router, Axios, Vite, Vitest.

---

## 3. Backend — visão geral

- **Configuração:** [backend/Acapra/settings.py](backend/Acapra/settings.py).
  Lê variáveis do `.env` via `python-decouple` (`config(...)`). Banco padrão é
  SQLite (`db.sqlite3`); produção pode usar PostgreSQL via variáveis `DB_*`.
- **Rotas raiz:** [backend/Acapra/urls.py](backend/Acapra/urls.py) — cada app é
  incluído sob um prefixo `api/<app>/`. Ex.: `api/gerenciamento/`, `api/doacoes/`.
- **Modelo de usuário:** customizado — `AUTH_USER_MODEL = 'gerenciamento.Usuario'`
  (login por e-mail, não por username).
- **DRF (em `REST_FRAMEWORK`):**
  - Autenticação padrão: **JWT** (`rest_framework_simplejwt`).
  - Permissão padrão: `IsAuthenticated` (a API é **fechada por padrão**; cada
    endpoint público libera explicitamente com `AllowAny`).
  - Paginação: `PageNumberPagination`, `PAGE_SIZE = 20`.
  - Throttling (rate limiting): global + escopos específicos (ver [Segurança](#6-segurança)).
  - Handler de exceções: `core.exceptions.custom_exception_handler` (nunca vaza
    stack trace).

**Padrão das views:** a maioria das views é `APIView` com `get_permissions()`
que libera `GET` público (`AllowAny`) e exige `IsAuthenticated` + módulo para
escrita. Há dois serializers por recurso: um de **leitura** (`Get...`/`...Read`,
expõe campos públicos) e um de **escrita** (`...Write`, aceita campos editáveis).

---

## 4. Autenticação e autorização

### Autenticação (JWT)

- **Registro:** `POST /api/gerenciamento/auth/register/` (público; protegido por
  CAPTCHA e rate limit).
- **Login:** `POST /api/gerenciamento/auth/login/` → retorna `access` + `refresh`.
- **Refresh:** `POST /api/gerenciamento/auth/refresh/`.
- **Logout:** `POST /api/gerenciamento/auth/logout/` → coloca o refresh token na
  blacklist.

Um **signal** ([gerenciamento/signals.py](backend/gerenciamento/signals.py))
cria automaticamente um `PerfilAdministrativo` para todo novo usuário, com nível
inicial **`USUARIO`** (sem acesso administrativo).

### Autorização — níveis de perfil

Definidos em `PerfilAdministrativo.Nivel`
([gerenciamento/models.py](backend/gerenciamento/models.py)). Hierarquia, do
maior para o menor acesso:

| Nível | Valor no banco | O que gerencia |
|---|---|---|
| **Diretor Acapra** | `diretor_acapra` | tudo + gerenciamento de usuários |
| **Tesoureiro** | `tesoureiro` | tudo, exceto gerenciar usuários (mantém doações/financeiro) |
| **Administrador** | `admin` | operação geral, **sem** doações/financeiro, sem usuários |
| **Auxiliar Geral** | `auxiliar_geral` | só módulos operacionais do dia a dia |
| **Usuário** | `usuario` | **sem** acesso administrativo |

O mapa **nível → módulos** está em `MODULOS_POR_NIVEL`
([gerenciamento/permissions.py](backend/gerenciamento/permissions.py)). As views
de cada app protegem a escrita com `require_module("<modulo>")`, que verifica se
o nível do usuário pode gerenciar aquele módulo.

Funções/classes-chave em `permissions.py`:

- `get_nivel_usuario(user)` — nível efetivo (`USUARIO` se anônimo ou perfil inativo).
- `usuario_pode_gerenciar_modulo(user, modulo)` / `get_modulos_usuario(user)`.
- `require_module("doacoes")` — fábrica de `BasePermission` por módulo.
- `IsDiretor` — acesso exclusivo do Diretor (gestão de usuários, auditoria).
- `TemAcessoDashboard` — qualquer autenticado (o conteúdo do painel é filtrado por nível).

> ⚠️ O frontend espelha essa matriz em
> [frontend/src/utils/permissions.js](frontend/src/utils/permissions.js). Ao
> mudar um nível ou módulo no backend, **atualize os dois lados**.

### Gestão de usuários (só Diretor)

- `GET /api/gerenciamento/admin/usuarios/` — lista usuários e seus perfis.
- `PATCH /api/gerenciamento/admin/usuarios/<id>/perfil/` — altera nível/cargo/setor.
  Toda mudança aqui é **auditada** (ver [Auditoria](#7-auditoria)).

---

## 5. Apps do backend (um a um)

### gerenciamento
Núcleo de identidade e acesso. Models: `Usuario` (login por e-mail,
`UsuarioManager` customizado) e `PerfilAdministrativo` (nível, ativo, cargo,
setor, quem promoveu). Contém: autenticação JWT (com views throttled), troca de
senha (invalida todos os tokens), `DashboardView` (estatísticas filtradas por
módulos do usuário) e a gestão de usuários do Diretor.

### auditoria
Trilha imutável de ações sensíveis. Detalhado na seção [7](#7-auditoria).

### core
Utilitários compartilhados, **sem domínio próprio**:
- `throttling.py` — classes de rate limit por IP.
- `captcha.py` — verificação do Cloudflare Turnstile.
- `validators.py` — `validate_image_upload`, `validate_document_upload`.
- `uploads.py` — funções `upload_to` (caminhos de mídia por app).
- `fields.py` — `EncryptedTextField` (criptografa dados em repouso).
- `exceptions.py` — handler global de exceções da API.
- `urls.py`/`views.py` — endpoint `home` simples em `/api/core/`.

### adocao
`Animal` (nome, doador, telefone, espécie, sexo, foto, `disponivel`) e
`AnimalImagem` (galeria). GET público; escrita exige módulo `adocao`. Ao cadastrar
um animal, pode disparar auto-post nas redes via `meta_integration`
(signal em [adocao/signals.py](backend/adocao/signals.py)).

### doacoes
`DadosPix` — chave PIX e dados bancários (banco, agência, conta, CNPJ,
favorecido, QR code) para doação. **GET é público** (o doador precisa ver os
dados); escrita exige módulo `doacoes` (Diretor e Tesoureiro). Todas as escritas
são **auditadas**. Dois serializers: `GetDadosPixSerializer` (público, esconde a
flag interna `ativo`) e `DadosPixWriteSerializer`.

### denuncias
`Denuncia` (título, descrição, gravidade, status, denunciante opcional, foto). A
**criação é pública e anônima** (qualquer um denuncia); listagem/gestão exige o
módulo `denuncias`.

### noticias
`Publicacao` com `categoria` (notícias, resgates, campanhas, desaparecidos).
Uma única tabela serve a quatro seções do site. GET público; escrita exige
módulo `noticias`. O app **resgates** não tem models próprios — a seção
"Resgates" são `Publicacao` com `categoria="resgates"`.

### transparencia
Transparência financeira: `Categoria` (entrada/saída), `Movimento` (descrição,
**valor R$**, data, comprovante), `DocumentoInstitucional` (arquivos oficiais) e
`Indicador` (contadores de impacto: animais resgatados, castrações, adoções).
GET público; escrita exige módulo `transparencia`. **Movimentos e documentos são
auditados.**

### vendas
Loja solidária: `Produto` (nome, tipo humano/pet, preço, estoque, foto) e
`ProdutoImagem`. GET público; escrita exige módulo `vendas`.

### voluntariado
`Voluntario` (nome, telefone, idade, motivo, e-mail, `ativo`). **Cadastro
público** (formulário "Faça Parte"); a listagem é restrita a admins (por isso o
serializer de leitura expõe `ativo`, útil para gestão).

### lares
`LarVoluntario` — lares que acolhem animais temporariamente (responsável,
cidade, tipos de animais, capacidade). Escrita ligada ao módulo `voluntariado`.

### contato
`ContatoAcapra` — **singleton** (sempre `pk=1`) com WhatsApps, redes e e-mail.
GET público; **só o Diretor edita** (`PATCH`).

### meta_integration
Integração OAuth com Facebook/Instagram para publicar automaticamente. Models:
`MetaOAuthState` (estado do fluxo OAuth) e `MetaConnection` (página + tokens).
Os tokens são guardados em `EncryptedTextField` (**criptografados em repouso**,
com chave dedicada `FIELD_ENCRYPTION_KEY`).

---

## 6. Segurança

Mecanismos já implementados:

- **JWT com blacklist:** logout e troca de senha invalidam os refresh tokens.
- **Rate limiting por IP** ([core/throttling.py](backend/core/throttling.py) +
  `DEFAULT_THROTTLE_RATES` no settings):
  - `login` 5/min · `register` 3/min **+** `register_day` 20/dia · `refresh`
    10/min · `password_reset` 3/min · `public_form` 20/min · `anon` 120/min.
  - O registro combina **dois** limites (rajada por minuto + teto diário).
- **CAPTCHA (Cloudflare Turnstile)** no registro ([core/captcha.py](backend/core/captcha.py)):
  desligado por padrão (`CAPTCHA_ENABLED=False`), ligado em produção com as chaves.
- **Validação de upload:** imagens e documentos passam por
  `validate_image_upload` / `validate_document_upload` (extensão + MIME + tamanho).
- **Campos criptografados:** tokens da Meta usam `EncryptedTextField`.
- **API fechada por padrão:** `DEFAULT_PERMISSION_CLASSES = [IsAuthenticated]`.
- **CORS** restrito por `CORS_ALLOWED_ORIGINS` (sem wildcards).
- **Handler de exceções** que não vaza detalhes internos.
- **No frontend:** sanitização de URLs (anti-XSS/open-redirect), validação de
  upload no cliente e redação de tokens em logs (`utils/url.js`, `utils/logger.js`).

---

## 7. Auditoria

App: [backend/auditoria/](backend/auditoria/). Objetivo: registrar **quem fez o
quê e quando** nas operações sensíveis, de forma **imutável** e **enxuta**.

### Model — `RegistroAuditoria`
Campos: `acao` (criado/editado/excluído), `modelo`, `objeto_id`, `descricao`,
`alteracoes` (JSON opcional: campos alterados ou de→para), `usuario` (FK) +
`usuario_email` (snapshot que sobrevive à exclusão do usuário) e `data_hora`
(data + horário). É **imutável**: `save()` bloqueia updates e `delete()` bloqueia
exclusão; no admin é totalmente **somente leitura**.

### Como é alimentada
Pelo helper `registrar_auditoria(request, instancia, acao, descricao=None,
alteracoes=None)` ([auditoria/services.py](backend/auditoria/services.py)),
chamado nas views após a operação. O helper é **resiliente**: se a auditoria
falhar, ela apenas registra no log e **nunca derruba** a operação principal.

### O que é auditado hoje
- **doacoes / `DadosPix`** — criar, editar (com campos editados) e excluir.
- **gerenciamento / mudança de permissão** — `PATCH` no perfil registra nível e
  `ativo` de→para, e por quem.
- **transparencia / `Movimento`** (movimentações financeiras) — criar/editar/excluir.
- **transparencia / `DocumentoInstitucional`** — criar/editar/excluir.

> Conteúdo de alto volume e baixo risco (notícias, adoção, vendas, voluntários)
> **não** é auditado, de propósito, para a tabela não crescer demais.

### Consulta
- **API (só Diretor):** `GET /api/auditoria/registros/` (paginado), com filtros
  `?modelo=DadosPix` e `?acao=editado`.
- **Tela:** `/auditoria` no frontend (botão no dashboard, visível só ao Diretor).
- **Admin Django:** somente leitura.

### Como auditar um novo ponto
Em qualquer view com `request`, basta uma linha:

```python
from auditoria.models import RegistroAuditoria
from auditoria.services import registrar_auditoria

registrar_auditoria(request, objeto, RegistroAuditoria.Acao.CRIADO)
```

---

## 8. Frontend

SPA em **React + Vite**. Entrada: `src/main.jsx`; rotas em
[src/App.jsx](frontend/src/App.jsx) (React Router, todas dentro de um `Layout`
com header/footer).

### Camadas principais
- **`services/api.js`** — instância Axios com `baseURL` por env
  (`VITE_API_BASE_URL`). **Interceptors** anexam o `access` token e, em `401`,
  tentam **refresh automático** do token; se falhar, limpam a sessão e mandam pro
  login. Também exporta `getMediaURL()` para resolver caminhos de mídia.
- **`utils/auth.js`** — sessão no `localStorage` (access/refresh/user), expiração
  de JWT, eventos de mudança de auth.
- **`utils/permissions.js`** — espelha a matriz de níveis/módulos do backend.
  Funções: `getUserNivel`, `podeGerenciar(modulo)`, `isDiretor`,
  `temAcessoDashboard`. **Mantenha sincronizado com o backend.**
- **`utils/captcha.js`** + **`components/Turnstile/`** — widget Turnstile (só
  aparece se `VITE_TURNSTILE_SITE_KEY` existir).
- **`hooks/useAdminAccess(modulo)`** — diz se o usuário logado pode editar um
  módulo; usado nas telas para mostrar/ocultar botões de edição.
- **`components/ProtectedRoute`** — exige login para acessar a rota.

### Telas (pages)
Cada pasta em `src/pages/` é uma tela: Home, Login, Register, Adocao, Doe,
Noticias/Resgates/Campanhas/Desaparecidos, Vendas (Produtos), Voluntariado,
Denuncias, Transparencia, Contato, **Dashboard**, **Auditoria**, MetaConfig, etc.
As partes de edição aparecem só para quem tem permissão (via `useAdminAccess` /
`isDiretor`).

---

## 9. Fluxos importantes

**Registro:** Register.jsx valida senha + CAPTCHA → `POST auth/register/` → o
backend verifica CAPTCHA e rate limit → cria `Usuario` (e o signal cria o
`PerfilAdministrativo` como `USUARIO`).

**Login e sessão:** Login → recebe `access`/`refresh` → guardados no
localStorage. As chamadas seguintes anexam o `access`; quando expira, o
interceptor usa o `refresh` para renovar de forma transparente.

**Promoção de usuário:** Diretor abre o Dashboard → seção "Gerenciamento de
vínculos" → altera o nível → `PATCH .../perfil/` → **auditado**.

**Doação (PIX):** público vê os dados em `/doe` (GET público). Diretor/Tesoureiro
criam/editam em `DadosPix` → **auditado**.

**Auditoria:** Diretor clica em "Ver registros de auditoria" no dashboard →
tela `/auditoria` consome `GET /api/auditoria/registros/`.

---

## 10. Variáveis de ambiente

Baseie-se em [.env.example](.env.example). Principais:

| Variável | Função |
|---|---|
| `SECRET_KEY` | chave do Django (assinatura) |
| `FIELD_ENCRYPTION_KEY` | chave dedicada para criptografar tokens da Meta |
| `DEBUG` | `False` em produção |
| `ALLOWED_HOSTS` / `CORS_ALLOWED_ORIGINS` | hosts e origens permitidas |
| `DB_*` | banco (SQLite local / PostgreSQL em produção) |
| `CAPTCHA_ENABLED` / `TURNSTILE_SECRET_KEY` / `TURNSTILE_SITE_KEY` | CAPTCHA (backend) |
| `VITE_API_BASE_URL` / `VITE_MEDIA_BASE_URL` | base da API/mídia (frontend) |
| `VITE_TURNSTILE_SITE_KEY` | site key do CAPTCHA (frontend) |
| `META_APP_ID` / `META_APP_SECRET` / `META_REDIRECT_URI` | integração Facebook/Instagram |

---

## 11. Testes

- **Backend:** `cd backend && python manage.py test` (suíte em `*/tests.py`).
  Cobre permissões, auditoria (imutabilidade + acesso), serializers e views dos
  apps principais.
- **Frontend:** `cd frontend && npm test` (Vitest) — utilitários de segurança.
- **Lint frontend:** `npx eslint src`.

---

## 12. Dicas de manutenção

- **Mudou níveis/módulos?** Atualize **backend** (`permissions.py` + `models.py`)
  **e** o **frontend** (`utils/permissions.js`) juntos.
- **Novo endpoint que escreve dado sensível?** Adicione `registrar_auditoria(...)`
  na view (1 linha).
- **Migrations:** o projeto consolida cada app em um único `0001_initial`. Ao
  mudar um model, gere a migration e valide com
  `python manage.py makemigrations --check`.
- **Endpoint público novo?** Lembre que a API é fechada por padrão: libere com
  `AllowAny` só o que deve ser público, e prefira proteger escrita com
  `require_module(...)`.
- **CAPTCHA em produção:** `CAPTCHA_ENABLED=True` + chaves do Turnstile; teste
  enviando um `POST` de registro sem token válido — deve voltar `400`.
- **Dois serializers por recurso:** mantenha o de leitura sem expor flags
  internas (ex.: `ativo`) em endpoints públicos.
```
