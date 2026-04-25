# Configuração inicial do projeto ACAPRA

## Pré-requisitos

* Python na versão mais recente estável
* Git instalado
* VS Code (recomendado)

---

## Passo a passo para rodar o projeto

### 1. Clone o repositório

No terminal, navegue até a pasta onde deseja salvar o projeto e execute:

```bash
git clone https://github.com/PatrikiGss/Projeto_Acapra.git
```

Depois entre na pasta do projeto:

```bash
cd Projeto_Acapra
```

---

### 2. Crie o ambiente virtual (venv)

```bash
python -m venv venv
```

---

### 3. Ative a venv

### Windows

```bash
venv\Scripts\activate
```

---

### 4. Instale as dependências do projeto

```bash
pip install -r requirements.txt
```

---

### 5. Crie o arquivo `.env`

Na raiz do projeto, crie um arquivo chamado:

```text
.env
```

---

### 6. Gere uma nova SECRET_KEY

Execute no terminal Python:

```python
from django.core.management.utils import get_random_secret_key
print(get_random_secret_key())
```

Copie a chave gerada.

---

### 7. Configure o `.env`

Cole a chave gerada apos o =

---

### 8. Rode as migrations

```bash
python manage.py migrate
```

---

### 9. Inicie o servidor

```bash
python manage.py runserver
```

---

## Acesso local

Após iniciar, acesse:

```text
http://127.0.0.1:8000/
```

Admin Django:

```text
http://127.0.0.1:8000/admin/
```
