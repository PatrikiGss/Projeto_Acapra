# Documentação da API - Acapra

## Novos Módulos Implementados

Este documento descreve os três novos módulos de backend implementados para o projeto Acapra: **Doações**, **Voluntariado** e **Vendas**.

---

## 1. Módulo de Doações (Pix)

### Descrição
Permite que usuários acessem informações sobre como fazer doações via Pix, incluindo QR Code e chave Pix copiável.

### Endpoints

#### GET `/api/doacoes/pix/`
Lista todos os dados de Pix ativos para doação.

**Permissões:** Público (AllowAny)

**Resposta (200 OK):**
```json
[
  {
    "id": 1,
    "chave_pix": "12345678901234",
    "qr_code": "http://localhost:8000/media/qr_codes/qr_code.png",
    "descricao": "Chave Pix da organização Acapra"
  }
]
```

#### GET `/api/doacoes/pix/<id>/`
Retorna detalhes de um dado Pix específico.

**Permissões:** Público (AllowAny)

**Resposta (200 OK):**
```json
{
  "id": 1,
  "chave_pix": "12345678901234",
  "qr_code": "http://localhost:8000/media/qr_codes/qr_code.png",
  "descricao": "Chave Pix da organização Acapra"
}
```

### Modelo DadosPix
- `id`: Identificador único
- `chave_pix`: Chave Pix (CPF, CNPJ, email, telefone ou chave aleatória)
- `qr_code`: Imagem do QR Code
- `descricao`: Descrição opcional
- `ativo`: Status ativo/inativo
- `created_at`: Data de criação
- `updated_at`: Data de atualização

---

## 2. Módulo de Voluntariado

### Descrição
Permite que pessoas se cadastrem como voluntárias fornecendo nome, telefone, idade e motivo de interesse.

### Endpoints

#### GET `/api/voluntariado/voluntarios/`
Lista todos os voluntários cadastrados.

**Permissões:** Autenticado (IsAuthenticated)

**Resposta (200 OK):**
```json
[
  {
    "id": 1,
    "nome": "João Silva",
    "telefone": "+5511999999999",
    "idade": 25,
    "motivo": "Quero ajudar animais em situação de risco",
    "email": "joao@example.com",
    "created_at": "2026-05-22T10:30:00Z"
  }
]
```

#### POST `/api/voluntariado/voluntarios/`
Cria um novo cadastro de voluntário.

**Permissões:** Público (AllowAny)

**Corpo da Requisição:**
```json
{
  "nome": "João Silva",
  "telefone": "+5511999999999",
  "idade": 25,
  "motivo": "Quero ajudar animais em situação de risco",
  "email": "joao@example.com"
}
```

**Resposta (201 Created):**
```json
{
  "detail": "Obrigado por se voluntariar! Entraremos em contato em breve.",
  "id": 1,
  "nome": "João Silva"
}
```

#### GET `/api/voluntariado/voluntarios/<id>/`
Retorna detalhes de um voluntário específico.

**Permissões:** Autenticado (IsAuthenticated)

**Resposta (200 OK):**
```json
{
  "id": 1,
  "nome": "João Silva",
  "telefone": "+5511999999999",
  "idade": 25,
  "motivo": "Quero ajudar animais em situação de risco",
  "email": "joao@example.com",
  "created_at": "2026-05-22T10:30:00Z"
}
```

#### PATCH `/api/voluntariado/voluntarios/<id>/`
Atualiza dados de um voluntário.

**Permissões:** Autenticado (IsAuthenticated)

**Corpo da Requisição (parcial):**
```json
{
  "email": "novo_email@example.com"
}
```

**Resposta (200 OK):**
```json
{
  "id": 1,
  "nome": "João Silva",
  "telefone": "+5511999999999",
  "idade": 25,
  "motivo": "Quero ajudar animais em situação de risco",
  "email": "novo_email@example.com",
  "ativo": true
}
```

#### DELETE `/api/voluntariado/voluntarios/<id>/`
Remove um voluntário do sistema.

**Permissões:** Autenticado (IsAuthenticated)

**Resposta (204 No Content)**

### Validações
- **Idade:** Deve estar entre 0 e 150 anos
- **Motivo:** Deve ter no mínimo 10 caracteres

### Modelo Voluntario
- `id`: Identificador único
- `nome`: Nome completo
- `telefone`: Telefone para contato (PhoneNumberField)
- `idade`: Idade do voluntário
- `motivo`: Motivo de interesse em se voluntariar
- `email`: Email (opcional)
- `ativo`: Status ativo/inativo
- `created_at`: Data de criação
- `updated_at`: Data de atualização

---

## 3. Módulo de Vendas (Vestuário)

### Descrição
Gerencia produtos de vestuário para humanos e pets. Permite listagem pública e gerenciamento administrativo.

### Endpoints

#### GET `/api/vendas/produtos/`
Lista todos os produtos ativos.

**Permissões:** Público (AllowAny)

**Resposta (200 OK):**
```json
[
  {
    "id": 1,
    "nome": "Camiseta Acapra",
    "descricao": "Camiseta oficial da organização",
    "tipo": "humano",
    "tipo_display": "Vestuário Humano",
    "preco": "49.90",
    "foto": "http://localhost:8000/media/produtos/2026/05/22/camiseta.jpg",
    "estoque": 50,
    "created_at": "2026-05-22T10:30:00Z"
  },
  {
    "id": 2,
    "nome": "Coleira Reforçada",
    "descricao": "Coleira para cães de grande porte",
    "tipo": "pet",
    "tipo_display": "Vestuário para Pet",
    "preco": "29.90",
    "foto": "http://localhost:8000/media/produtos/2026/05/22/coleira.jpg",
    "estoque": 30,
    "created_at": "2026-05-22T10:30:00Z"
  }
]
```

#### GET `/api/vendas/produtos/<id>/`
Retorna detalhes de um produto específico.

**Permissões:** Público (AllowAny)

**Resposta (200 OK):**
```json
{
  "id": 1,
  "nome": "Camiseta Acapra",
  "descricao": "Camiseta oficial da organização",
  "tipo": "humano",
  "tipo_display": "Vestuário Humano",
  "preco": "49.90",
  "foto": "http://localhost:8000/media/produtos/2026/05/22/camiseta.jpg",
  "estoque": 50,
  "created_at": "2026-05-22T10:30:00Z"
}
```

#### GET `/api/vendas/produtos/tipo/<tipo>/`
Lista produtos filtrados por tipo (humano ou pet).

**Permissões:** Público (AllowAny)

**Parâmetros:**
- `tipo`: "humano" ou "pet"

**Resposta (200 OK):**
```json
[
  {
    "id": 1,
    "nome": "Camiseta Acapra",
    "descricao": "Camiseta oficial da organização",
    "tipo": "humano",
    "tipo_display": "Vestuário Humano",
    "preco": "49.90",
    "foto": "http://localhost:8000/media/produtos/2026/05/22/camiseta.jpg",
    "estoque": 50,
    "created_at": "2026-05-22T10:30:00Z"
  }
]
```

#### POST `/api/vendas/produtos/`
Cria um novo produto.

**Permissões:** Autenticado (IsAuthenticated)

**Corpo da Requisição:**
```json
{
  "nome": "Camiseta Acapra",
  "descricao": "Camiseta oficial da organização",
  "tipo": "humano",
  "preco": "49.90",
  "estoque": 50,
  "foto": "<arquivo de imagem>"
}
```

**Resposta (201 Created):**
```json
{
  "id": 1,
  "nome": "Camiseta Acapra",
  "descricao": "Camiseta oficial da organização",
  "tipo": "humano",
  "tipo_display": "Vestuário Humano",
  "preco": "49.90",
  "foto": "http://localhost:8000/media/produtos/2026/05/22/camiseta.jpg",
  "estoque": 50,
  "created_at": "2026-05-22T10:30:00Z"
}
```

#### PATCH `/api/vendas/produtos/<id>/`
Atualiza dados de um produto.

**Permissões:** Autenticado (IsAuthenticated)

**Corpo da Requisição (parcial):**
```json
{
  "estoque": 45,
  "preco": "54.90"
}
```

**Resposta (200 OK):**
```json
{
  "id": 1,
  "nome": "Camiseta Acapra",
  "descricao": "Camiseta oficial da organização",
  "tipo": "humano",
  "tipo_display": "Vestuário Humano",
  "preco": "54.90",
  "foto": "http://localhost:8000/media/produtos/2026/05/22/camiseta.jpg",
  "estoque": 45,
  "ativo": true
}
```

#### DELETE `/api/vendas/produtos/<id>/`
Remove um produto do sistema.

**Permissões:** Autenticado (IsAuthenticated)

**Resposta (204 No Content)**

### Modelo Produto
- `id`: Identificador único
- `nome`: Nome do produto
- `descricao`: Descrição detalhada
- `tipo`: Tipo de vestuário ("humano" ou "pet")
- `preco`: Preço do produto (DecimalField)
- `foto`: Imagem do produto
- `estoque`: Quantidade em estoque
- `ativo`: Status ativo/inativo
- `created_at`: Data de criação
- `updated_at`: Data de atualização

---

## Autenticação

Os endpoints que requerem autenticação utilizam **JWT (JSON Web Token)**.

### Obter Token
```bash
POST /api/gerenciamento/auth/login/
Content-Type: application/json

{
  "email": "usuario@example.com",
  "password": "senha123"
}
```

### Usar Token
Adicione o token no header da requisição:
```
Authorization: Bearer <seu_token_aqui>
```

---

## Códigos de Status HTTP

- **200 OK:** Requisição bem-sucedida
- **201 Created:** Recurso criado com sucesso
- **204 No Content:** Recurso deletado com sucesso
- **400 Bad Request:** Dados inválidos
- **401 Unauthorized:** Autenticação necessária
- **404 Not Found:** Recurso não encontrado
- **500 Internal Server Error:** Erro no servidor

---

## Notas Importantes

1. **Doações:** Apenas dados com `ativo=True` são retornados publicamente
2. **Voluntariado:** Cadastros públicos, mas listagem requer autenticação
3. **Vendas:** Listagem pública, mas criação/edição/deleção requer autenticação
4. **Imagens:** Todas as imagens são servidas através de `/media/`
5. **Paginação:** Padrão de 20 itens por página (configurável)

---

## Exemplos de Uso

### Exemplo 1: Listar dados de Pix
```bash
curl -X GET http://localhost:8000/api/doacoes/pix/
```

### Exemplo 2: Cadastrar como voluntário
```bash
curl -X POST http://localhost:8000/api/voluntariado/voluntarios/ \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "João Silva",
    "telefone": "+5511999999999",
    "idade": 25,
    "motivo": "Quero ajudar animais em situação de risco",
    "email": "joao@example.com"
  }'
```

### Exemplo 3: Listar produtos de vestuário humano
```bash
curl -X GET http://localhost:8000/api/vendas/produtos/tipo/humano/
```

### Exemplo 4: Criar novo produto (autenticado)
```bash
curl -X POST http://localhost:8000/api/vendas/produtos/ \
  -H "Authorization: Bearer <seu_token>" \
  -H "Content-Type: multipart/form-data" \
  -F "nome=Camiseta Acapra" \
  -F "descricao=Camiseta oficial da organização" \
  -F "tipo=humano" \
  -F "preco=49.90" \
  -F "estoque=50" \
  -F "foto=@camiseta.jpg"
```

---

## Suporte

Para dúvidas ou problemas, entre em contato com a equipe de desenvolvimento.
