# Projeto Acapra

[![CI](https://github.com/PatrikiGss/Projeto_Acapra/actions/workflows/ci.yml/badge.svg)](https://github.com/PatrikiGss/Projeto_Acapra/actions/workflows/ci.yml)

Sistema web desenvolvido para a **Acapra**, composto por uma API backend em Django e uma aplicação frontend em React.

**Aplicação:** [acapra.org.br](https://acapra.org.br)

> O código-fonte deste projeto é público, mas o software **não é open source**. A Acapra possui autorização gratuita para utilização do sistema. Consulte a seção [Licença](#licença) antes de reutilizar qualquer parte do projeto.

## Tecnologias

### Backend

* Python
* Django
* Django REST Framework
* Django CORS Headers
* Simple JWT
* SQLite para desenvolvimento
* PostgreSQL para produção

### Frontend

* React
* React Router DOM
* React Scripts
* Testing Library

## Estrutura do projeto

```text
Projeto_Acapra/
├── backend/                 # API Django e aplicações do sistema
│   ├── Acapra/              # Configurações principais do Django
│   ├── adocao/
│   ├── core/
│   ├── doacoes/
│   ├── gerenciamento/
│   ├── resgates/
│   ├── transparencia/
│   ├── vendas/
│   ├── manage.py
│   └── .env.example
├── frontend/                # Aplicação React
│   ├── public/
│   ├── src/
│   └── package.json
├── requirements.txt         # Dependências Python
└── README.md
```

## Pré-requisitos

Antes de iniciar o projeto, certifique-se de ter instalado:

* [Python](https://www.python.org/)
* [Node.js](https://nodejs.org/) e npm
* [Git](https://git-scm.com/)

## Configuração do backend

Na raiz do projeto, crie um ambiente virtual:

```bash
python -m venv venv
```

No Windows, ative o ambiente:

```bash
venv\Scripts\activate
```

Instale as dependências:

```bash
pip install -r requirements.txt
```

Crie o arquivo `.env` utilizando o `.env.example` como referência:

```env
SECRET_KEY=sua_secret_key_aqui
DEBUG=True
ALLOWED_HOSTS=127.0.0.1,localhost
CORS_ALLOWED_ORIGINS=http://localhost:3000
DB_ENGINE=django.db.backends.sqlite3
DB_NAME=db.sqlite3
VITE_API_BASE_URL=http://127.0.0.1:8000
VITE_MEDIA_BASE_URL=http://127.0.0.1:8000
```

Para gerar uma `SECRET_KEY` segura:

```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

Acesse a pasta do backend e execute as migrations:

```bash
cd backend
python manage.py migrate
```

Inicie o servidor:

```bash
python manage.py runserver
```

A API ficará disponível em:

```text
http://127.0.0.1:8000/
```

O painel administrativo estará disponível em:

```text
http://127.0.0.1:8000/admin/
```

Para criar um usuário administrador:

```bash
python manage.py createsuperuser
```

## Configuração do frontend

Em outro terminal, acesse a pasta do frontend:

```bash
cd frontend
```

Instale as dependências:

```bash
npm install
```

Inicie a aplicação:

```bash
npm start
```

O frontend ficará disponível em:

```text
http://localhost:3000
```

## Executando o projeto

Durante o desenvolvimento, mantenha os dois serviços em execução:

| Serviço  | Endereço                 |
| -------- | ------------------------ |
| Backend  | `http://127.0.0.1:8000/` |
| Frontend | `http://localhost:3000`  |

O frontend utiliza a API disponibilizada pelo backend, portanto os dois serviços precisam estar ativos para o funcionamento completo da aplicação.

## Comandos úteis

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

## Fluxo de desenvolvimento

Para manter o histórico do projeto organizado, o desenvolvimento deve seguir o fluxo de branches definido pela equipe:

* `main` — versão principal do projeto;
* `develop` — base para desenvolvimento e integração de novas funcionalidades;
* branches específicas — utilizadas para cada tarefa ou alteração.

Evite realizar alterações diretamente na `main`. Para iniciar uma nova tarefa:

```bash
git fetch
git checkout develop
git pull origin develop
git checkout -b sua-feature
```

Após concluir o trabalho, abra um Pull Request para revisão e integração.

## Documentação

Cada parte do sistema possui documentação própria:

* **Backend:** `backend/README.md`
* **Frontend:** `frontend/README.md`

## Banco de dados

O ambiente de desenvolvimento utiliza SQLite por padrão.

Para produção, o projeto possui suporte a PostgreSQL por meio de variáveis de ambiente:

```env
DB_ENGINE=django.db.backends.postgresql
DB_NAME=acapra
DB_USER=acapra
DB_PASSWORD=senha_forte
DB_HOST=localhost
DB_PORT=5432
```

Após configurar o banco de dados, execute as migrations:

```bash
python manage.py migrate
```

Em um ambiente de produção, também devem ser configurados adequadamente `SECRET_KEY`, `ALLOWED_HOSTS` e `CORS_ALLOWED_ORIGINS`.

## Licença

Este projeto **não é open source**.

Copyright © 2026 Patriki de Oliveira Góss, Kauê Kluska e Iago Amaral. Todos os direitos reservados.

O código-fonte é disponibilizado publicamente por motivos de transparência e portfólio. A Acapra possui uma **licença gratuita para utilização do sistema em suas atividades institucionais**.

A publicação do repositório não concede, por si só, autorização para terceiros utilizarem, copiarem, modificarem, redistribuírem, comercializarem ou disponibilizarem o sistema como serviço (SaaS).

Qualquer utilização por terceiros depende de autorização dos titulares dos direitos autorais.

Para informações sobre licenciamento comercial, entre em contato pelo e-mail:

**[patrikigss321@gmail.com](mailto:patrikigss321@gmail.com)**

Os termos completos estão disponíveis no arquivo [LICENSE.md](LICENSE.md).
