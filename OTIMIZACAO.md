# Otimização e limpeza do projeto

Documento das alterações de otimização/limpeza (peso do projeto, dependências,
código morto, compressão e minificação). Atualizado em 2026-06-27.

## 1. Artefatos de build removidos do versionamento (~34 MB)

Estavam **commitados no Git** três pacotes de build/deploy, somando ~33,7 MB —
a maior fatia do peso do repositório:

| Arquivo | Tamanho |
|---|---|
| `frontend/dist.zip` | ~11,2 MB |
| `frontend/kluska-site-frontend.zip` | ~11,2 MB |
| `frontend/dist.rar` | ~10,6 MB |

São saídas recriáveis com `npm run build`. Foram removidos do versionamento
(`git rm`) e o `frontend/.gitignore` passou a ignorar `*.zip` e `*.rar` para que
não voltem ao repositório.

> Observação (não alterado): há ~10 MB de uploads de usuários em
> `backend/media/` que foram commitados antes da regra `media/` do `.gitignore`.
> Como é conteúdo de usuário (e não artefato de build), **não** foi removido aqui.
> Recomendação futura: `git rm -r --cached backend/media` para parar de versioná-los
> (mantendo os arquivos em disco), já que o `.gitignore` raiz já ignora `media/`.

## 2. Dependências órfãs removidas (`frontend/package.json`)

Removidas 4 devDependencies que não eram referenciadas em nenhum lugar do código
nem da configuração (`vite.config.js` usa apenas `@vitejs/plugin-react`, sem o
React Compiler/Babel; não há testes Playwright):

- `@rolldown/plugin-babel`
- `babel-plugin-react-compiler`
- `@babel/core`
- `playwright`

O `npm run build` foi reexecutado após a remoção e gerou **bundle idêntico**
(JS 430,64 kB / 125,78 kB gzip), confirmando que eram inertes.

## 3. CSS órfão removido

Após a padronização do gerenciamento de imagens (ver seção 5), várias classes
ficaram sem nenhuma referência em JSX e foram removidas:

- `frontend/src/pages/AdocaoView/Adocao.css`: `.product-form-gallery`,
  `.product-form-gallery-title`, `.product-form-preview-grid`,
  `.product-form-preview-item` (+ `img`).
- `frontend/src/pages/VendasView/Vendas.css`: as mesmas acima +
  `.product-form-upload`, `.product-form-preview` (+ `img`).
- `frontend/src/components/NewsForm/NewsForm.css`: `.news-form-image-zone`,
  `.news-form-image-placeholder`, `.news-form-extra` (+ `-head`, `-grid`,
  `-item`) e as referências correspondentes na media query.

Efeito mensurável no bundle: CSS caiu de **103,63 kB → 101,91 kB**
(gzip 16,37 kB → 16,18 kB).

## 4. Estratégia de compressão/minificação — auditoria

Tudo verificado e **funcionando corretamente**; não havia defeito a corrigir:

- **Imagens (backend):** `core/images.py` recomprime todo upload para WebP
  (lado máximo 1600 px, qualidade 82, reorientação por EXIF) via
  `CompressImageOnSaveMixin`, cobrindo API e admin. Evita que fotos de celular
  com vários MB ocupem disco e pesem no carregamento.
- **JS/CSS (frontend):** `vite build` aplica minificação (esbuild) por padrão na
  build de produção. Resultado atual: JS 430,64 kB → **125,78 kB gzip**;
  CSS 101,91 kB → **16,18 kB gzip**.
- **Gzip/Brotli em trânsito:** é responsabilidade do servidor (Apache/cPanel),
  não do código da aplicação — fora do escopo de alteração no repositório.

## 5. Correção de bug relacionada (fotos adicionais)

Durante a padronização do upload de imagens foram corrigidos bugs pré-existentes
que também impactavam peso/UX (detalhes na implementação da “edição de imagens”):

- **Vendas** enviava as fotos adicionais com a chave `fotos[]`, que o backend não
  lê (`request.FILES.getlist("fotos")`) — as imagens adicionais de produto eram
  silenciosamente descartadas. Corrigido para `fotos`.
- As views de **adoção** e **vendas** não passavam `context={"request": request}`
  ao serializer no create/update, o que também fazia o backend ignorar as fotos
  adicionais. Corrigido.
- O `DELETE` de **adoção** e **vendas** passou a apagar os arquivos de imagem do
  storage (como já fazia notícias), evitando mídia órfã acumulando em disco.

## Como validar

- Backend: `python manage.py test` (195 testes, OK) e `python manage.py check`.
- Frontend: `npm run build` (171 módulos, OK) e `npm test` (OK).
