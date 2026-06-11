# Guia de Deploy em Hospedagem Compartilhada

Este guia detalha como fazer o deploy da API Acapra em diferentes tipos de hospedagem compartilhada.

## 🔧 Hospedagem com cPanel (HostGator, Bluehost, etc)

### 1. Upload dos Arquivos

**Via FTP:**
1. Use FileZilla ou WinSCP
2. Conecte aos servidores FTP fornecidos
3. Navegue até `public_html/`
4. Crie uma pasta `api` ou `backend_php`
5. Upload dos arquivos

**Via Git (se suportado):**
```bash
ssh user@seu-host.com
cd public_html
git clone <seu-repo> backend_php
cd backend_php
```

### 2. Configurar Banco de Dados

**Via cPanel:**
1. Acesse cPanel → MySQL Databases
2. Crie um novo banco `acapra`
3. Crie um novo usuário `acapra_user` com senha forte
4. Adicione o usuário ao banco com permissões
5. Anote os dados: `host:port` (geralmente localhost:3306)

### 3. Criar Arquivo .env

Conecte via SSH ou FTP e crie `.env`:

```env
# Em public_html/backend_php/.env
SECRET_KEY=sua-chave-muito-forte-aqui
DEBUG=false
DB_ENGINE=mysql
DB_HOST=localhost
DB_USER=acapra_user
DB_PASSWORD=sua_senha_forte
DB_NAME=acapra
CORS_ALLOWED_ORIGINS=https://seu-dominio.com,https://www.seu-dominio.com
FRONTEND_URL=https://seu-dominio.com
SITE_URL=https://seu-dominio.com/backend_php
```

### 4. Executar Migrations

**Via SSH:**
```bash
cd public_html/backend_php
mysql -u acapra_user -p acapra < migrations.sql
# Digite a senha quando solicitado
```

**Via phpMyAdmin:**
1. Acesse cPanel → phpMyAdmin
2. Selecione banco `acapra`
3. Clique em "SQL"
4. Cole o conteúdo de `migrations.sql`
5. Clique em "Executar"

### 5. Configurar Permissões

**Via SSH:**
```bash
cd public_html/backend_php
find . -type d -exec chmod 755 {} \;
find . -type f -exec chmod 644 {} \;
chmod 644 .htaccess
chmod 755 media/
chmod 755 staticfiles/
```

**Via FTP:**
- Clique direito na pasta → Properties
- Linux Permissions
- Pastas: 755
- Arquivos: 644

### 6. Testar

```bash
# Via cURL
curl https://seu-dominio.com/backend_php/api/contato/

# Ou via navegador
# https://seu-dominio.com/backend_php/api/contato/
```

## 🔧 Hospedagem com Plesk

### 1. Upload dos Arquivos

**Via FTP:**
Similar ao cPanel, usando Plesk FTP

**Via Plesk File Manager:**
1. Acesse Plesk → Files
2. Navegue até `httpdocs/`
3. Crie pasta `backend_php`
4. Upload dos arquivos

### 2. Configurar Banco de Dados

**Via Plesk:**
1. Acesse Plesk → Databases
2. Crie novo banco `acapra`
3. Crie usuário `acapra_user`
4. Selecione host (geralmente localhost)

### 3. Resto Similar ao cPanel

Os passos 3-6 são idênticos ao cPanel.

## 🔧 Hospedagem com DirectAdmin

### 1. Upload

Via FTP ou SSH (similar ao cPanel)

### 2. Banco de Dados

**Via DirectAdmin:**
1. Acesse DirectAdmin → MySQL Management
2. Crie banco e usuário
3. Anote credenciais

### 3. Resto Similar ao cPanel

## 🚀 Hospedagem com Cloud (AWS Lightsail, DigitalOcean)

### 1. SSH ao VPS

```bash
ssh -i sua-chave.pem ubuntu@seu-ip
```

### 2. Instalar PHP

```bash
sudo apt update
sudo apt install php php-cli php-mysql php-pdo php-json php-mbstring
php -v
```

### 3. Criar Banco de Dados

```bash
# Instalar MySQL
sudo apt install mysql-server
sudo mysql_secure_installation

# Criar banco
mysql -u root -p
CREATE DATABASE acapra;
CREATE USER 'acapra_user'@'localhost' IDENTIFIED BY 'senha_forte';
GRANT ALL PRIVILEGES ON acapra.* TO 'acapra_user'@'localhost';
FLUSH PRIVILEGES;
```

### 4. Clonar Repositório

```bash
cd /var/www/html
git clone <seu-repo> backend_php
cd backend_php
```

### 5. Configurar Nginx

```nginx
# /etc/nginx/sites-available/seu-dominio
server {
    listen 80;
    server_name seu-dominio.com;
    root /var/www/html/backend_php;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.1-fpm.sock;
        fastcgi_index index.php;
        include fastcgi_params;
    }

    location ~ /\.ht {
        deny all;
    }
}
```

### 6. Ativar Site

```bash
sudo ln -s /etc/nginx/sites-available/seu-dominio /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 🔒 HTTPS/SSL

### Via cPanel (Let's Encrypt)
1. cPanel → AutoSSL
2. Ativa automáticamente (geralmente)
3. Ou manual: cPanel → SSL/TLS

### Via Plesk
1. Plesk → SSL/TLS Certificates
2. "Add SSL/TLS Certificate"
3. Let's Encrypt gratuito

### Via DigitalOcean/AWS
```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx

# Gerar certificado
sudo certbot certonly --nginx -d seu-dominio.com

# Renovação automática
sudo systemctl enable certbot.timer
```

## 🐛 Troubleshooting Comum

### Erro: "404 Not Found"

**Causa**: URLs não estão sendo reescritas para index.php

**Solução**:
1. Verifique `.htaccess` existe na raiz
2. Verifique `mod_rewrite` está ativado em Apache
3. Ative via `.htaccess`:
```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^(.*)$ index.php [QSA,L]
</IfModule>
```

### Erro: "Database connection error"

**Causa**: Conexão ao banco falhou

**Solução**:
1. Verifique credenciais em `.env`
2. Verifique banco existe: `SHOW DATABASES;`
3. Verifique tabelas: `USE acapra; SHOW TABLES;`
4. Verifique usuário tem permissões: `SHOW GRANTS FOR 'user'@'localhost';`

### Erro: "Fatal error: Class 'Exception' not found"

**Causa**: Namespace ou autoload incorreto

**Solução**:
1. Verifique path correto: `namespace core;`
2. Verifique `require_once __DIR__ . '/config.php';` em `index.php`
3. Verifique spl_autoload_register em config.php

### Erro: "CORS error"

**Causa**: Origins não permitidas

**Solução**:
1. Verifique `.env`: `CORS_ALLOWED_ORIGINS`
2. Atualize para incluir seu domínio
3. Reinicie servidor ou atualize cache

### Erro: "Token invalid"

**Causa**: SECRET_KEY mudou

**Solução**:
1. Use mesma SECRET_KEY em `.env`
2. Fiel não pode mudar entre requisições
3. Se mudou, tokens antigos são inválidos

### PHP retorna código HTML

**Causa**: PHP não está interpretando

**Solução**:
1. Verifique extensão `.php` é processada
2. Verifique Apache tem `php_module` ativado
3. Teste com `<?php phpinfo(); ?>`

### Upload de arquivo falha

**Causa**: Permissões incorretas

**Solução**:
1. Verifique pasta `media/` existe
2. Verifique permissões: `chmod 755 media/`
3. Verifique `php.ini` tem `upload_max_filesize` suficiente

## 📊 Monitoramento

### Via SSH

```bash
# Ver uso de memória
free -h

# Ver uso de disco
du -sh /var/www/html/backend_php

# Ver logs PHP
tail -f /var/log/php*.log

# Ver logs Apache/Nginx
tail -f /var/log/apache2/error.log
# ou
tail -f /var/log/nginx/error.log
```

### Via cPanel

1. Acesse cPanel
2. Clique em "Metrics"
3. Monitore CPU, Memória, Tráfego

## 🔄 Atualizações

### Via Git

```bash
cd /path/to/backend_php
git pull origin main
```

### Via FTP

1. Download dos novos arquivos
2. Upload substituindo os antigos
3. Não substitua `.env`

## ⚡ Performance

### Otimizações

1. **Habilitar gzip** (.htaccess)
```apache
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/plain text/xml text/javascript application/json
</IfModule>
```

2. **Cache headers** (.htaccess)
```apache
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType text/css "access plus 1 month"
</IfModule>
```

3. **Índices no banco**

Já feito em `migrations.sql`, nada a fazer.

4. **Limpar logs**

```bash
# Para arquivo de log
find /path/to/logs -name "*.log" -mtime +30 -delete
```

## 📋 Checklist de Deploy

- [ ] Arquivo `.env` criado com valores corretos
- [ ] Banco de dados criado e migrations executadas
- [ ] Arquivo `.htaccess` presente e mod_rewrite ativado
- [ ] Permissões configuradas (755 pastas, 644 arquivos)
- [ ] SSL/HTTPS ativado
- [ ] CORS_ALLOWED_ORIGINS configurado
- [ ] SECRET_KEY é forte e único
- [ ] DEBUG=false em produção
- [ ] Teste de endpoint `/api/contato/`
- [ ] Teste de login
- [ ] Teste de criação de publicação
- [ ] Monitore logs de erro

## 🆘 Suporte

Se encontrar problemas:

1. Verifique logs:
   - `error.log` do servidor
   - Respostas de erro da API
   - `.env` está correto

2. Teste localmente primeiro:
   ```bash
   php -S localhost:8000
   curl http://localhost:8000/api/contato/
   ```

3. Consulte documentação:
   - [README.md](README.md)
   - [CONVERSAO.md](CONVERSAO.md)
   - [CONVERSAO_RESUMO.md](CONVERSAO_RESUMO.md)

---

**Última atualização**: 2024
