# Contexto do Projeto ACAPRA

Documento de **handoff**: visão geral do projeto, arquitetura, particularidades do
deploy e o histórico das alterações feitas nesta rodada de trabalho. Serve para
qualquer pessoa (ou IA) retomar o projeto sem precisar redescobrir tudo.

---

## 1. O que é

Site da **ACAPRA — Associação Catarinense de Proteção aos Animais** (São Joaquim/SC).
Aplicação web com:

- **Backend**: Django 6 + Django REST Framework + Simple JWT.
- **Frontend**: React 19 + Vite + React Router.
- **Banco**: SQLite (local e **também em produção**).
- **Deploy**: cPanel + Phusion Passenger (hospedagem compartilhada), domínio `acapra.org.br`.

Funcionalidades: adoção de animais, produtos (loja solidária), notícias
(+ subtópicos: resgates, campanhas, desaparecidos), transparência (indicadores +
documentos), doações (PIX + ofertas de itens), denúncias, voluntariado, lares
temporários, contato, integração com Meta (Facebook/Instagram) e painel admin.

---

## 2. Estrutura

```
Projeto_Acapra/
├── backend/                 # Django
│   ├── Acapra/              # settings, urls, wsgi
│   ├── adocao/  vendas/  noticias/  transparencia/  doacoes/
│   ├── denuncias/  voluntariado/  lares/  contato/
│   ├── gerenciamento/       # usuários, auth JWT, permissões por módulo
│   ├── meta_integration/    # Facebook/Instagram
│   ├── auditoria/  core/    # utilidades (uploads, imagens, validators, throttling)
│   ├── passenger_wsgi.py    # entrypoint do Passenger (ver seção 3)
│   ├── manage.py  requirements*.txt  db.sqlite3  media/
│   └── acapra-backend-deploy.zip   # gerado para deploy (não versionar)
└── frontend/                # React + Vite
    ├── src/pages/  src/components/  src/hooks/  src/services/api.js
    └── public/              # imagens estáticas (otimizadas em WebP)
```

- **venv**: fica na **raiz** de `Projeto_Acapra` (`venv/`), não em `backend/`.
  Rodar de dentro de `backend/`: `"../venv/Scripts/python.exe" manage.py ...`
- **Gate de verificação**: backend → `manage.py check` + testes; frontend → `npm run build`.

---

## 3. Deploy (cPanel + Passenger) — PARTICULARIDADES IMPORTANTES

A app roda em `/home/acapra/acapra_api/` e é montada no **sub-URI `/api`**
(PassengerBaseURI). Isso muda tudo:

- **Tudo do backend fica sob `/api`**: API, admin e estáticos. O
  `passenger_wsgi.py` reinjeta o prefixo `/api` no `PATH_INFO` (o Passenger o
  move para `SCRIPT_NAME`), então `urls.py` precisa ter `api/...` em tudo.
- `urls.py`: admin em **`api/admin/`**; mídia em produção via
  `re_path(r"^api/media/...")` (`SERVE_MEDIA=True`); apps em `api/<app>/`.
- **`STATIC_URL = "/api/static/"`** (WhiteNoise serve os estáticos do admin/DRF).
- **Mídia**: `MEDIA_URL="/media/"`, mas a URL pública real é
  `https://acapra.org.br/api/media/...`. O frontend monta com
  `VITE_MEDIA_BASE_URL=https://acapra.org.br/api`.
- **Banco**: SQLite em `/home/acapra/acapra_api/db.sqlite3`. **Sempre fazer
  backup antes de `migrate`.**
- Reiniciar a app: `touch tmp/restart.txt`.

### Passo a passo (resumo)
```bash
# no cPanel Terminal (Setup Python App → Enter to the virtual environment)
source /home/acapra/virtualenv/acapra_api/3.12/bin/activate && cd /home/acapra/acapra_api
cp db.sqlite3 db.sqlite3.bak-$(date +%F)            # backup
# (subir os arquivos via File Manager: Upload do zip + Extract, ou arquivos avulsos)
python -m py_compile <arquivos alterados> && echo OK
python manage.py check
python manage.py migrate                            # se houver migrations
python manage.py collectstatic --noinput            # se estáticos mudaram
touch tmp/restart.txt
curl -s -o /dev/null -w "%{http_code}\n" https://acapra.org.br/api/adocao/animais/   # 200
```
Guia detalhado: `backend/DEPLOY_CPANEL.md`. Gerar o zip de deploy exclui
`.env`, `db.sqlite3`, `media/`, `__pycache__`, `venv`, `staticfiles`.

### `.env` de produção (pontos-chave)
`DEBUG=False`, `ALLOWED_HOSTS=acapra.org.br,www...`, `SERVE_MEDIA=True`,
`NUM_PROXIES=1`, `SECURE_SSL_REDIRECT=True`, `SITE_URL=https://acapra.org.br`,
`FRONTEND_URL=https://acapra.org.br`. **`EMAIL_BACKEND` ainda é `console`** →
e-mails (reset de senha) NÃO são entregues em produção até configurar SMTP.

---

## 4. Convenções e "pegadinhas"

- **Fotos comprimidas no upload**: todo `ImageField` novo é convertido para
  **WebP** (reduzido a ≤1600px, q82) via `CompressImageOnSaveMixin`
  (`core/images.py`), no `save()` do model. Cobre API e admin.
- **Multi-foto (até 4)**: adoção, produtos e notícias aceitam foto principal +
  adicionais (modelos filhos `AnimalImagem`, `ProdutoImagem`, `PublicacaoImagem`).
  Limite de 4 validado no backend (`validar_limite_fotos`) e no frontend.
- **Filtros/busca/paginação são client-side** nessas listas (o backend devolve a
  lista inteira). Paginação = 12/tela (`usePaginacao` + `Paginacao`).
- **Permissões**: `require_module("<app>")` no backend + `useAdminAccess` no
  frontend. GET público em várias listas (adoção, produtos, notícias, PIX,
  ofertas POST). `HEAD` numa lista pública dá 401 (só `GET` é liberado) — normal.
- **Sem CAPTCHA**: o Turnstile foi removido por completo (front e back).

---

## 5. Alterações feitas nesta rodada (histórico)

### Conteúdo / Transparência
- Texto dos **Resgates** reescrito (era genérico "ChatGPT").
- **Financeiro removido** da Transparência (models `Categoria`/`Movimento`,
  serializers, views, urls, admin, testes + migration de remoção). Mantidos
  Indicadores e Documentos.
- **Parcerias removida** da Transparência (era só frontend).

### Imagens estáticas
- Otimização em **WebP** (ex.: `cachorro.png` 7,7 MB → `cachorro.webp` 61 KB).
- **Limpeza de órfãos** (~21 MB): fotos não usadas em `public/`, `src/assets`
  duplicados e a pasta stale `frontend/build/` (do antigo create-react-app).
- **Hero da Home**: trocado de colagem para **imagem única** (`hero-acapra.webp`)
  + título "Associação Catarinense de Proteção aos Animais".

### Upload de fotos + compressão
- `core/images.py`: `compress_uploaded_image`, `CompressImageOnSaveMixin`,
  `validar_limite_fotos` (+ helpers de galeria/remoção adicionados depois).
- Aplicado em Animal, Produto, Publicação e nos modelos `*Imagem`.
- **Notícias** ganhou multi-foto (novo `PublicacaoImagem` + galeria no detalhe).

### Doações
- Novo formulário público **"Quero doar algo"** (model `OfertaDoacao`,
  endpoint `POST /api/doacoes/ofertas/` público com rate-limit, GET/PATCH/DELETE
  admin). Admin gerencia em `/api/admin/` e na página **Apoie**.
- **Apoie/Doe** reorganizada em **abas**: "Contribuir com PIX", "Doar um item" e
  "Doações recebidas" (admin) — esta última reaproveita `DoacoesOfertas`
  (`embedded`), antes só acessível pelo dashboard.

### Segurança / Auth
- **CAPTCHA (Turnstile) removido** do registro (front `Register.jsx` +
  componentes/utils, back `gerenciamento/views.py`, `core/captcha.py`,
  `settings.py`). Proteção do registro segue via rate-limit por IP.
- **`core/captcha.py`** mantém só `get_client_ip`/`_num_proxies` (usados por
  auditoria/throttling).

### Paginação
- `hooks/usePaginacao.js` + `components/ui/Paginacao.jsx` (12/tela).
- Aplicada em Produtos, Animais e Notícias (cobre resgates/campanhas/
  desaparecidos via `NewsFeed`).

### Correções de integridade
- **`voluntariado`**: ordenação `['-created_at', '-id']` (desempate
  determinístico; corrigia teste flaky).
- **`requirements.txt`** da raiz estava incompleto: adicionados
  `django-phonenumber-field`, `phonenumbers`, `requests`, `whitenoise`.

### "Esqueci a senha"
- Diagnóstico: e-mail não chegava porque `EMAIL_BACKEND` é **console** em prod
  (sem SMTP no `.env`).
- Corrigido no código: link usa **`settings.FRONTEND_URL`** (antes usava a URL do
  backend → link quebrado) e `send_mail` deixou de ser `fail_silently=True`
  (agora loga a falha). Template SMTP comentado adicionado ao `.env` local.

### Deploy (regressões corrigidas durante o deploy real)
- `passenger_wsgi.py`: **reinjeta o prefixo `/api`** no PATH_INFO (a versão local
  simples quebrava tudo com 404).
- `urls.py`: `admin/` → **`api/admin/`**; mídia de produção `^media/` →
  **`^api/media/`** (imagens/admin quebravam sob o mount `/api`).
- `settings.py`: `STATIC_URL` `"static/"` → **`"/api/static/"`** (CSS do admin
  não carregava).

### Integração Meta (Facebook/Instagram) — `meta_integration/services.py`
- **Diagnóstico do problema do Instagram** (fotos iam pro Facebook, mas no
  Instagram "umas iam, outras não" com imagens idênticas): **não era formato de
  imagem** e sim **código**:
  1. Faltava **aguardar o container ficar `FINISHED`** antes de publicar (o
     Instagram processa de forma assíncrona) → corrida → falha intermitente.
     Corrigido com `_esperar_container_pronto` (polling do `status_code`).
  2. A **URL da foto** era montada sem `/api` → o Instagram baixava o HTML do SPA
     em vez do JPEG. Corrigido para `https://acapra.org.br/api/media/...`.
  (O Facebook nunca sofreu porque envia os bytes direto, sem baixar por URL.)
- **`MetaPostLog`** (novo model): grava **só falhas/pulados** de cada publicação,
  com a mensagem de erro, visível no admin (**Meta_Integration → Logs de
  publicação**). Token é redigido (`access_token=REDACTED`). **Poda automática**
  para as últimas 200 linhas (impacto mínimo no SQLite). Sucessos vão só pro log
  do servidor.
- **Story + Notícias** (esta rodada): `services.py` foi generalizado para
  publicar **feed + story** no **Facebook e Instagram**, para **animais e
  notícias**. Funções: `_ig_feed`/`_ig_story`, `_fb_feed_photo`/`_fb_story`,
  orquestrador `_publicar`, e `auto_post_animal` / **`auto_post_publicacao`**.
  A criação de notícia (`PublicacoesView.post`) agora chama `auto_post_publicacao`
  (não-fatal).
- **Destinos selecionáveis**: os formulários de **adoção** e de **notícias**
  têm checkboxes **Feed** e **Story** (ambos marcados por padrão) sob o
  "Publicar no Facebook / Instagram". O payload envia `publicar_redes`,
  `publicar_feed` e `publicar_story`; o backend lê com
  `services.flags_publicacao(request.data)` e repassa para
  `auto_post_*(feed=..., story=...)`. Desmarcar os dois não publica nada.

### Footer
- Lista de desenvolvedores reduzida a **Kaue, Patriki e Iago**.

---

## 6. Pendências / recomendações

- **E-mail em produção**: configurar SMTP no `.env` do servidor (bloco comentado
  já existe no `.env` local) para o "esqueci a senha" funcionar de verdade.
- **Publicação nas redes é síncrona**: `auto_post_*` roda dentro do request de
  cadastro (adiciona alguns segundos, ainda mais com o polling). Ideal migrar
  para tarefa em segundo plano (Celery/RQ/cron) no futuro.
- **Facebook Story** (`photo_stories`) exige permissão/recurso habilitado na
  Página; é chamado de forma tolerante (falha só gera log, não quebra o resto).
- **Frontend media**: depende de `VITE_MEDIA_BASE_URL=https://acapra.org.br/api`
  no build de produção.
- **Aspect ratio do Instagram**: fotos muito verticais (>4:5) podem ser cortadas;
  se quiser controle total, padronizar a proporção na versão moldurada.
- `DOCUMENTACAO.md` / `DOCUMENTACAO_API.md` podem ter trechos legados (captcha,
  financeiro); use este arquivo como fonte da verdade recente.

---

## 7. Comandos úteis

```bash
# Backend (de dentro de backend/, venv na raiz do projeto)
"../venv/Scripts/python.exe" manage.py check
"../venv/Scripts/python.exe" manage.py migrate
"../venv/Scripts/python.exe" manage.py test <app>
"../venv/Scripts/python.exe" manage.py runserver

# Frontend
npm run build      # gate de verificação
npm run dev
```
