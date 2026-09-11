# Guia de Deploy do Backend ACAPRA no cPanel (via Git)

Guia passo a passo, do zero, para colocar o backend Django no ar usando o
**Git Version Control** + **Setup Python App (Passenger)** do cPanel.
Tudo é feito pela **interface web** — não precisa de SSH.

---

## 0. Antes de começar — conceitos rápidos

| Termo | O que é |
|---|---|
| **Passenger** | Servidor que roda apps Python (Django) no cPanel. |
| **Setup Python App** | Tela do cPanel que cria o ambiente Python (a "venv") e liga o Passenger. |
| **venv (virtualenv)** | Pasta isolada com o Python e as bibliotecas do projeto. O cPanel cria pra você. |
| **Git Version Control** | Tela do cPanel que clona seu repositório do GitHub e roda o deploy. |
| **`.cpanel.yml`** | Receita de deploy. A cada deploy o cPanel executa os comandos dele (já está pronto no projeto). |
| **`.env`** | Arquivo com as configurações secretas (senhas, domínio). Fica **só no servidor**. |
| **Application root** | A pasta onde o app vive no servidor (ex.: `/home/SEU_USUARIO/acapra_backend`). |

**O que você vai precisar ter em mãos:**
- Login no cPanel.
- O domínio (ou subdomínio) onde o backend vai responder. Ex.: `api.acapra.org.br`.
- O domínio do frontend (pra liberar o CORS). Ex.: `https://acapra.org.br`.
- (Opcional) Conta Gmail + App Password, se quiser envio de e-mail.
- (Opcional) Chaves do Cloudflare Turnstile, se quiser captcha.

---

## 1. Confirme o que já está pronto no código

Estes arquivos já foram criados e commitados (branch `deploy/cpanel-backend`):

- `.cpanel.yml` (na raiz do repositório) — a receita de deploy.
- `backend/passenger_wsgi.py` — o ponto de entrada do Passenger.
- `backend/requirements.prod.txt` — as dependências de produção.
- `backend/.env.producao` — **modelo** do `.env` (com campos `TODO` pra preencher).

Você **não** precisa enviar nenhum `.zip`. Com Git, o cPanel baixa o código sozinho.

---

## 2. Envie o código pro GitHub

O cPanel clona do GitHub, então o código (com o `.cpanel.yml`) precisa estar lá.

Opção A — colocar na branch `main` (mais simples):
```bash
git checkout main
git merge deploy/cpanel-backend
git push origin main
```

Opção B — manter em branch separada e abrir Pull Request:
```bash
git push -u origin deploy/cpanel-backend
```
(Se usar a opção B, no Passo 6 você aponta o cPanel para a branch `deploy/cpanel-backend`.)

---

## 3. Repositório público ou privado?

- **Público:** nada a fazer. O cPanel clona pela URL `https://github.com/.../Projeto_Acapra.git`.
- **Privado:** o cPanel precisa de permissão. Caminho mais fácil:
  1. No cPanel → **Git Version Control** → ele mostra uma **chave pública SSH** do servidor
     (ou você gera uma em *SSH Access*).
  2. Copie essa chave.
  3. No GitHub → repositório → **Settings → Deploy keys → Add deploy key** → cole a chave
     (só leitura já basta).
  4. Aí use a URL **SSH** do repo (`git@github.com:.../Projeto_Acapra.git`) ao clonar no cPanel.

---

## 4. Crie o app em "Setup Python App"

No cPanel, abra **Setup Python App** → **Create Application** e preencha:

| Campo | Valor |
|---|---|
| **Python version** | 3.11 ou superior |
| **Application root** | `acapra_backend` (vira `/home/SEU_USUARIO/acapra_backend`) |
| **Application URL** | o domínio/subdomínio do backend (ex.: `api.acapra.org.br`) |
| **Application startup file** | `passenger_wsgi.py` |
| **Application Entry point** | `application` |

Clique **Create**.

> ⚠️ **IMPORTANTE:** depois de criar, a tela mostra uma linha como:
> `source /home/SEU_USUARIO/virtualenv/acapra_backend/3.11/bin/activate && cd ...`
> **Anote essa linha** — o pedaço até antes de `/bin/activate` é o caminho da venv,
> que vamos usar no Passo 5.

> Observação: o cPanel pode criar um `passenger_wsgi.py` de exemplo nessa pasta.
> Tudo bem — o nosso deploy vai sobrescrever pelo correto.

---

## 5. Ajuste o `.cpanel.yml` com os caminhos reais

Abra o arquivo `.cpanel.yml` (na raiz do projeto) e edite as duas primeiras linhas
das tarefas, trocando `SEU_USUARIO` e a versão do Python pelo que apareceu no Passo 4:

```yaml
    - export DEPLOYPATH=/home/SEU_USUARIO/acapra_backend
    - export VENVPATH=/home/SEU_USUARIO/virtualenv/acapra_backend/3.11
```

- `DEPLOYPATH` = a **Application root** do Passo 4.
- `VENVPATH` = a linha da venv que você anotou, **até antes** de `/bin/activate`.

Depois de editar, faça commit e push de novo:
```bash
git add .cpanel.yml
git commit -m "chore(deploy): ajusta caminhos do cPanel"
git push
```

---

## 6. Crie o arquivo `.env` no servidor (File Manager)

O `.env` **não vai pelo git** (segurança). Você cria ele direto no servidor:

1. cPanel → **File Manager** → entre em `/home/SEU_USUARIO/acapra_backend`.
   (Marque *Settings → Show Hidden Files* pra ver arquivos que começam com ponto.)
2. **+ File** → nome: `.env`.
3. Selecione o `.env` → **Edit** → cole o conteúdo abaixo, preenchendo os `TODO`.

Use `backend/.env.producao` como base. Campos que **você precisa preencher**:

| Variável | O que pôr |
|---|---|
| `ALLOWED_HOSTS` | domínio do backend, sem `https://` (ex.: `api.acapra.org.br`) |
| `CORS_ALLOWED_ORIGINS` | URL do frontend (ex.: `https://acapra.org.br,https://www.acapra.org.br`) |
| `FRONTEND_URL` | URL do frontend (ex.: `https://acapra.org.br`) |
| `SITE_URL` | `https://` + domínio do backend |
| `META_REDIRECT_URI` | `https://DOMINIO_BACKEND/api/meta/auth/callback/` |
| `TURNSTILE_SECRET_KEY` / `TURNSTILE_SITE_KEY` | chaves do Cloudflare Turnstile — **ou** ponha `CAPTCHA_ENABLED=False` se não for usar agora |
| `EMAIL_HOST_USER` / `EMAIL_HOST_PASSWORD` | Gmail + App Password — só se for usar envio de e-mail |

Campos que já vêm prontos no modelo (não mexa, a menos que saiba o que faz):
`SECRET_KEY`, `FIELD_ENCRYPTION_KEY`, `DEBUG=False`, `DB_ENGINE` (SQLite),
`SECURE_SSL_REDIRECT=True`, `NUM_PROXIES=1`.

4. **Save Changes.**

> Se o servidor **ainda não tem SSL/HTTPS** configurado no domínio, coloque
> `SECURE_SSL_REDIRECT=False` temporariamente, senão o site entra em loop de redirecionamento.
> Volte pra `True` depois que o SSL estiver ativo (Passo 9).

---

## 7. Configure o Git Version Control e faça o Deploy

1. cPanel → **Git Version Control** → **Create**.
2. Marque **Clone a Repository**.
3. **Clone URL**: a URL do seu repo (`https://...` se público, `git@github.com:...` se privado com deploy key).
4. **Repository Path**: deixe o sugerido (ex.: `/home/SEU_USUARIO/repositories/Projeto_Acapra`).
5. Clique **Create** — o cPanel clona o repositório.
6. Entre no repositório criado → aba **Pull or Deploy**.
7. Em **Checked-Out Branch**, selecione a branch certa (`main` ou `deploy/cpanel-backend`).
8. Clique **Update from Remote** (puxa o que está no GitHub) e depois **Deploy HEAD Commit**.

A partir daí o `.cpanel.yml` roda sozinho.

---

## 8. O que o Deploy faz automaticamente

A cada **Deploy HEAD Commit**, o cPanel executa (sem você fazer nada):

1. Copia `backend/*` para a Application root (**preservando** `.env`, `db.sqlite3`,
   `media/` e `staticfiles/` — não apaga seus dados).
2. Instala as dependências (`pip install -r requirements.prod.txt`).
3. Roda as migrações do banco (`migrate`).
4. Coleta os arquivos estáticos (`collectstatic`).
5. Reinicia o app (toca em `tmp/restart.txt`).

> ⚠️ Se o `pip install` demorar demais e o deploy falhar por tempo limite (comum em
> hospedagem compartilhada): use o botão **"Run Pip Install"** na tela do Setup Python App
> (aponte pra `requirements.prod.txt`) e me avise que eu removo o `pip install` do `.cpanel.yml`.

---

## 9. Domínio e SSL (HTTPS)

- Garanta que o domínio/subdomínio do backend aponta pra essa hospedagem
  (em *Domains* / *Subdomains* do cPanel, ou no DNS do seu registrador).
- Ative o **SSL**: cPanel → **SSL/TLS Status** → **Run AutoSSL** (gratuito).
- Com SSL ativo, mantenha `SECURE_SSL_REDIRECT=True` no `.env`.

---

## 10. Criar o usuário administrador (sem SSH)

Como não há terminal, criamos o superusuário do Django assim:

1. No `.env` (File Manager), adicione temporariamente:
   ```env
   DJANGO_SUPERUSER_USERNAME=admin
   DJANGO_SUPERUSER_EMAIL=seu-email@exemplo.com
   DJANGO_SUPERUSER_PASSWORD=uma-senha-forte
   ```
2. Me avise — eu adiciono **uma tarefa temporária** no `.cpanel.yml` que roda
   `createsuperuser --noinput` no próximo deploy.
3. Você faz **Deploy HEAD Commit**.
4. Depois removemos a tarefa e essas 3 linhas do `.env` (por segurança).

Aí o admin fica acessível em `https://DOMINIO_BACKEND/admin/`.

---

## 11. Estáticos do /admin/ (cosmético)

Sem `whitenoise`, o painel `/admin/` pode aparecer **sem CSS**. A API funciona normalmente;
é só visual. Para corrigir, dá pra adicionar o `whitenoise` (recomendado) — me avise que eu faço.

---

## 12. Verificação e solução de problemas

- Teste a API: `https://DOMINIO_BACKEND/admin/` deve abrir a tela de login.
- **Logs de erro:** ficam no arquivo `stderr.log` dentro da Application root (veja no File Manager).
- Erros comuns:
  - **500 / DisallowedHost** → falta o domínio em `ALLOWED_HOSTS` no `.env`.
  - **Loop de redirecionamento** → SSL ainda não ativo; ponha `SECURE_SSL_REDIRECT=False`.
  - **CORS bloqueado no frontend** → ajuste `CORS_ALLOWED_ORIGINS`.
  - **Erro de permissão no banco** → a pasta precisa de permissão de escrita (SQLite).
  - Sempre que mudar o `.env`, **reinicie** o app (Setup Python App → Restart).

---

## 13. Atualizações futuras (deploys seguintes)

Para publicar novas mudanças do backend depois:
1. `git push` das alterações pro GitHub.
2. cPanel → Git Version Control → **Update from Remote** → **Deploy HEAD Commit**.

Pronto — migrações e estáticos são reaplicados automaticamente.

---

## 14. Checklist final

- [ ] Código com `.cpanel.yml` enviado pro GitHub (Passo 2)
- [ ] Repo acessível pelo cPanel (público, ou deploy key) (Passo 3)
- [ ] App criado no Setup Python App + caminho da venv anotado (Passo 4)
- [ ] `.cpanel.yml` ajustado com `DEPLOYPATH` e `VENVPATH` reais (Passo 5)
- [ ] `.env` criado no servidor com os domínios preenchidos (Passo 6)
- [ ] Repositório clonado no Git Version Control e **Deploy** feito (Passo 7)
- [ ] Domínio apontando + SSL ativo (Passo 9)
- [ ] Superusuário criado (Passo 10)
- [ ] `/admin/` abrindo em HTTPS (Passo 12)
