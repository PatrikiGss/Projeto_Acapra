# 🚀 Iniciar Backend com Apache XAMPP

O servidor PHP built-in não suporta rewrite rules. Use **Apache** para desenvolvimento local.

## ✅ Passo 1: Copiar Arquivo Backend

```powershell
# Cópia para pasta htdocs do XAMPP
Copy-Item -Recurse "C:\Users\Kaue Kluska\Documents\Projeto da Acapra\Projeto_Acapra2\Projeto_Acapra\backend_php" "C:\xampp\htdocs\api"
```

## ✅ Passo 2: Abrir XAMPP Control Panel

1. Execute: `C:\xampp\xampp-control.exe`
2. Clique em "Start" em **Apache**
3. Clique em "Start" em **MySQL** (se quiser)

Você verá:
```
Apache    [Running on Port 80]
MySQL     [Running on Port 3306]
```

## ✅ Passo 3: Acessar a Aplicação

Abra seu navegador ou terminal e teste:

```powershell
# Teste 1: Obter contatos
curl http://localhost/api/api/contato/

# Teste 2: Registrar usuário
curl -X POST http://localhost/api/api/gerenciamento/auth/register/ `
  -H "Content-Type: application/json" `
  -d '{
    "nome": "João Silva",
    "email": "joao@example.com",
    "telefone": "11987654321",
    "password": "senha123456"
  }'
```

## 📍 URLs Disponíveis

Como você copiou para `C:\xampp\htdocs\api`, as URLs serão:

```
GET    http://localhost/api/api/contato/
POST   http://localhost/api/api/gerenciamento/auth/register/
POST   http://localhost/api/api/gerenciamento/auth/login/
GET    http://localhost/api/api/gerenciamento/user/me/
GET    http://localhost/api/api/noticias/publicacoes/
```

## 🎯 Alternativa: Criar Virtual Host

Para URLs mais limpas, crie um virtual host:

### 1. Edite `C:\xampp\apache\conf\extra\httpd-vhosts.conf`

Adicione no final:

```apache
<VirtualHost *:80>
    ServerName acapra.local
    ServerAlias www.acapra.local
    DocumentRoot "C:\xampp\htdocs\api"

    <Directory "C:\xampp\htdocs\api">
        Options +Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    ErrorLog "logs/acapra-error.log"
    CustomLog "logs/acapra-access.log" combined
</VirtualHost>
```

### 2. Edite `C:\Windows\System32\drivers\etc\hosts`

Adicione:
```
127.0.0.1 acapra.local
127.0.0.1 www.acapra.local
```

### 3. Reinicie Apache

No XAMPP Control Panel, clique "Stop" e depois "Start" em Apache.

### 4. Acesse

```
http://acapra.local/api/contato/
```

## ✅ Verificar se Funcionou

```powershell
# Teste a API
$response = Invoke-WebRequest -Uri "http://localhost/api/api/contato/" -Method GET
$response.Content | ConvertFrom-Json | ConvertTo-Json
```

Deve retornar JSON com os dados de contato.

## 🆘 Erros Comuns

### "Object not found"
- Verifique se Apache está rodando
- Verifique se pasta `api` está em `C:\xampp\htdocs\api`
- Verifique se `.htaccess` tem permissão de leitura

### "500 Internal Server Error"
- Verifique arquivo `php_error_log` em `C:\xampp\apache\logs\`
- Verifique se `.env` existe e está configurado
- Verifique se `acapra.sqlite` foi criado

### "403 Forbidden"
- Verifique permissões da pasta (clique direito → Properties)
- AllowOverride em httpd-vhosts.conf deve ser "All"

## 📝 Próximos Passos

1. ✅ Banco de dados criado (acapra.sqlite)
2. ✅ Arquivos no lugar (`C:\xampp\htdocs\api`)
3. ✅ Apache rodando
4. ✅ Testar endpoints

---

**Backend Acapra está pronto! 🎉**

Acesse em:
- `http://localhost/api/api/contato/` (sem virtual host)
- `http://acapra.local/api/contato/` (com virtual host)

Usuário padrão:
- **Email**: admin@acapra.com
- **Senha**: admin123456
