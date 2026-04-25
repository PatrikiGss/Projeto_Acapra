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

Depois, entre na pasta do projeto:

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

Abra o terminal interativo do Python com:

```bash
python
```

Depois execute:

```python
from django.core.management.utils import get_random_secret_key
print(get_random_secret_key())
```

Copie a chave gerada.

Para sair do terminal Python:

```python
exit()
```

---

### 7. Configure o arquivo `.env`

Cole a chave gerada após o sinal de `=` no campo correspondente.

Exemplo:

```env
SECRET_KEY=sua_secret_key_aqui
DEBUG=True
ALLOWED_HOSTS=127.0.0.1,localhost
```

---

### 8. Rode as migrations

```bash
python manage.py migrate
```

Sempre que houver alteração em models, rode também:

```bash
python manage.py makemigrations
python manage.py migrate
```

---

### 9. Criar superusuário 

```bash
python manage.py createsuperuser
```

Depois siga as instruções para definir:

* username
* email
* senha

Isso permitirá acessar o painel administrativo do Django em:

```text
http://127.0.0.1:8000/admin/
```

---

### 10. Inicie o servidor

```bash
python manage.py runserver
```

---

## Acesso local

Após iniciar o servidor, acesse:

```text
http://127.0.0.1:8000/
```

Admin Django:

```text
http://127.0.0.1:8000/admin/
```

---

## Criação da sua branch

Após tudo configurado, para criar sua branch de desenvolvimento, rode os seguintes comandos:

---

### 1. Carregar as branches do repositório

```bash
git fetch
```

---

### 2. Mudar para a branch `develop`

```bash
git checkout develop
```

---

### 3. Atualizar a branch `develop`

```bash
git pull origin develop
```

---

### 4. Criar sua própria branch

Utilize o seguinte padrão:

```bash
git checkout -b seunome
```

---

### 5. Enviar sua branch para o GitHub

```bash
git push -u origin feature/seunome-funcionalidade
```

---

## Fluxo recomendado de trabalho

* Nunca trabalhar diretamente na `main`
* Utilizar sempre a branch `develop` como base
* Criar sua própria branch 
* Após finalizar, abrir Pull Request para revisão

---

## Estrutura do projeto

Cada módulo principal foi separado em sua própria app Django:

* adocao
* denuncias
* doacoes
* gerenciamento
* resgates
* transparencia
* vendas
* core

Cada app possui sua própria organização de:

* models
* views
* serializers
* urls

---

## Observação final

Se algo não funcionar:

1. Verifique se a venv está ativada
2. Confirme se o `.env` foi criado corretamente
3. Rode novamente as migrations
4. Confira se está na branch correta

(Em caso de dúvidas, não me chame.

Att., Patriki)
