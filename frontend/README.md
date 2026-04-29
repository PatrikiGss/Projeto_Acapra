# Frontend - Projeto Acapra

Interface web do Projeto Acapra, desenvolvida com React e Create React App. A aplicacao usa React Router para organizar as rotas e consome a API local do backend em `http://localhost:8000/`.

## Tecnologias

- React
- React DOM
- React Router DOM
- React Scripts
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
|   +-- App.js               # Definicao das rotas
|   +-- index.js             # Ponto de entrada do React
+-- package.json
+-- package-lock.json
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
npm start
```

A aplicacao ficara disponivel em:

```text
http://localhost:3000
```

## Integracao com o backend

A pagina inicial faz uma requisicao para:

```text
http://localhost:8000/
```

Antes de testar a integracao completa, mantenha o backend rodando nessa porta.

## Scripts disponiveis

```bash
npm start
```

Executa o app em modo de desenvolvimento.

```bash
npm test
```

Executa os testes em modo interativo.

```bash
npm run build
```

Gera a versao de producao na pasta `build/`.

```bash
npm run eject
```

Expoe as configuracoes internas do Create React App. Use apenas se for realmente necessario, pois essa acao nao pode ser desfeita automaticamente.

## Padrao de desenvolvimento

- Crie novas telas em `src/pages/`.
- Crie componentes reutilizaveis em `src/components/`.
- Mantenha estilos junto ao componente ou pagina correspondente.
- Adicione novas rotas em `src/App.js`.
