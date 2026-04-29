# Projeto Acapra

Sistema web da Acapra, organizado em uma API backend com Django e uma interface frontend com React.

## Tecnologias

### Backend

- Python
- Django
- Django REST Framework
- Django CORS Headers
- Simple JWT
- SQLite em ambiente local

### Frontend

- React
- React Router DOM
- React Scripts
- Testing Library

## Estrutura do projeto

```text
Projeto_Acapra/
+-- backend/                 # API Django e apps do sistema
|   +-- Acapra/              # Configuracoes principais do Django
|   +-- adocao/
|   +-- core/
|   +-- denuncias/
|   +-- doacoes/
|   +-- gerenciamento/
|   +-- resgates/
|   +-- transparencia/
|   +-- vendas/
|   +-- manage.py
|   +-- .env.example
+-- frontend/                # Interface React
|   +-- public/
|   +-- src/
|   +-- package.json
+-- requirements.txt         # Dependencias Python
+-- README.md
```

## Pre-requisitos

- Python instalado
- Node.js e npm instalados
- Git instalado

## Configuracao do backend

Entre na pasta do projeto e crie o ambiente virtual:

```bash
python -m venv venv
```

Ative o ambiente virtual no Windows:

```bash
venv\Scripts\activate
```

Instale as dependencias Python:

```bash
pip install -r requirements.txt
```

Crie o arquivo `.env` na raiz do projeto ou na pasta usada pela configuracao local. Use `backend/.env.example` como referencia:

```env
SECRET_KEY=sua_secret_key_aqui
DEBUG=True
ALLOWED_HOSTS=127.0.0.1,localhost
CORS_ALLOWED_ORIGINS=http://localhost:3000
DB_ENGINE=django.db.backends.sqlite3
DB_NAME=db.sqlite3
```

Para gerar uma `SECRET_KEY`, execute:

```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

Rode as migrations:

```bash
cd backend
python manage.py migrate
```

Inicie o backend:

```bash
python manage.py runserver
```

O backend ficara disponivel em:

```text
http://127.0.0.1:8000/
```

O painel administrativo ficara disponivel em:

```text
http://127.0.0.1:8000/admin/
```

Para criar um superusuario:

```bash
python manage.py createsuperuser
```

## Configuracao do frontend

Em outro terminal, entre na pasta do frontend:

```bash
cd frontend
```

Instale as dependencias:

```bash
npm install
```

Inicie a aplicacao React:

```bash
npm start
```

O frontend ficara disponivel em:

```text
http://localhost:3000
```

## Rodando o projeto completo

Para testar a aplicacao completa, mantenha dois terminais abertos:

1. Backend rodando em `http://127.0.0.1:8000/`
2. Frontend rodando em `http://localhost:3000`

O frontend consome a API local do backend, entao os dois servicos precisam estar ativos durante o desenvolvimento.

## Scripts e comandos uteis

### Backend

```bash
python manage.py runserver
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
```

### Frontend

```bash
npm start
npm test
npm run build
```

## Fluxo recomendado de trabalho

- Use a branch `develop` como base para novas tarefas.
- Crie uma branch propria para cada alteracao.
- Evite trabalhar diretamente na `main`.
- Abra um Pull Request ao finalizar uma entrega.

Exemplo:

```bash
git fetch
git checkout develop
git pull origin develop
git checkout -b seu-nome-ou-feature
```

## Documentacao por modulo

- Backend: `backend/README.md`
- Frontend: `frontend/README.md`
