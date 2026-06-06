# Frontend - Projeto Acapra

Interface web do Projeto Acapra, desenvolvida com React e Vite. A aplicacao usa React Router para organizar as rotas e consome a API local do backend em `http://localhost:8000/`.

## Tecnologias

- React
- React DOM
- React Router DOM
- Vite
- Testing Library

## Estrutura

```text
frontend/
+-- public/                  # Arquivos publicos da aplicacao
+-- src/
|   +-- components/          # Componentes reutilizaveis
|   |   +-- footer/
|   |   +-- header/
|   +-- layouts/             # Layout base das paginas
|   +-- pages/               # Telas da aplicacao
|   |   +-- HomeView/
|   +-- App.jsx              # Definicao das rotas
|   +-- main.jsx             # Ponto de entrada do React
+-- index.html               # HTML usado pelo Vite
+-- package.json
+-- package-lock.json
+-- vite.config.js
```

## Como executar

Entre na pasta do frontend:

```bash
cd frontend
```

Instale as dependencias:

```bash
npm install
```

Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

A aplicacao ficara disponivel em:

```text
http://localhost:5173
```

Para gerar a versao de producao:

```bash
npm run build
```

Para visualizar a build de producao localmente:

```bash
npm run preview
```

## Integracao com o backend

A pagina inicial faz uma requisicao para:

```text
http://localhost:8000/
```

Antes de testar a integracao completa, mantenha o backend rodando nessa porta.

## Scripts disponiveis

```bash
npm run dev
```

Executa o app em modo de desenvolvimento com Vite.

```bash
npm run build
```

Gera a versao de producao na pasta `dist/`.

```bash
npm run preview
```

Executa um servidor local para visualizar a build de producao.

```bash
npm run lint
```

Executa a verificacao de lint do projeto.

## Padrao de desenvolvimento

- Crie novas telas em `src/pages/`.
- Crie componentes reutilizaveis em `src/components/`.
- Mantenha estilos junto ao componente ou pagina correspondente.
- Adicione novas rotas em `src/App.jsx`.
