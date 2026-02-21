# 🚀 Guia de Deploy — Pegasus em VPS (Docker)

Guia completo e validado para colocar o Pegasus em produção usando Docker e Docker Compose.

> **Versão:** 21/02/2026 — Validado em produção (Ubuntu + Docker Compose v2)

---

## 📋 Requisitos

| Item | Mínimo |
|------|--------|
| **OS** | Ubuntu 22.04 ou 24.04 LTS |
| **RAM** | 2 GB (recomendado 4 GB) |
| **Disco** | 20 GB livres |
| **Acesso** | SSH com usuário `root` ou `sudo` |

---

## 1. Atualizar o sistema

```bash
sudo apt update && sudo apt upgrade -y
```

---

## 2. Instalar Docker e Docker Compose

```bash
# Instalar dependências
sudo apt install -y ca-certificates curl gnupg lsb-release

# Adicionar chave GPG oficial do Docker
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# Adicionar repositório
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Instalar Docker Engine + Compose plugin
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Verificar instalação
docker --version
docker compose version
```

---

## 3. Configurar Firewall (UFW)

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

> [!WARNING]
> A porta `3306` do MySQL **não** é exposta externamente. A comunicação entre app e banco ocorre apenas pela rede interna Docker.

---

## 4. Enviar o projeto para a VPS

**Opção A — Via SCP (arquivo ZIP):**

```bash
# Na sua máquina local (PowerShell):
scp Pegasus.zip root@SEU_IP:/home/

# Na VPS:
cd /home
unzip Pegasus.zip -d pegasus
cd pegasus
```

**Opção B — Via Git:**

```bash
cd /home
git clone https://github.com/SEU_USUARIO/Pegasus.git pegasus
cd pegasus
```

---

## 5. Configurar variáveis de ambiente

```bash
cp .env.example .env
nano .env
```

Preencha os valores obrigatórios:

```env
# ⚠️  ATENÇÃO: o host DEVE ser "db" — NUNCA use "localhost"!
# Dentro do container Docker, "localhost" refere ao próprio container do app,
# não ao MySQL. O MySQL roda no serviço chamado "db".
DATABASE_URL=mysql://pegasus:SuaSenhaForte123@db:3306/pegasus

MYSQL_ROOT_PASSWORD=SenhaRootForte456
MYSQL_DATABASE=pegasus
MYSQL_USER=pegasus
MYSQL_PASSWORD=SuaSenhaForte123

# Gere com: openssl rand -hex 32
JWT_SECRET=gere-uma-string-aleatoria-com-64-caracteres

NODE_ENV=production
PORT=3000
```

> [!IMPORTANT]
> Na `DATABASE_URL`, o host **obrigatoriamente deve ser `db`** (nome do serviço Docker Compose).
> Usar `localhost` fará com que o app não consiga conectar ao MySQL.

> [!TIP]
> Gere um JWT_SECRET seguro com: `openssl rand -hex 32`

---

## 6. Build e inicialização

```bash
# Build da imagem (primeira vez demora ~5–10 min pela compilação nativa do 'canvas')
docker compose build

# Iniciar os serviços em background
docker compose up -d

# Acompanhar os logs
docker compose logs -f app
```

### Saída esperada nos logs:

```
[Entrypoint] Iniciando Pegasus...
[Entrypoint] Aguardando MySQL em db:3306...
[Entrypoint] MySQL disponível!
[Entrypoint] Aplicando migrations...
[Migrations] Aplicando migrations pendentes...
[Migrations] ✓ Concluído com sucesso!
[Entrypoint] Iniciando servidor...
[Auth] Initialized with local JWT authentication
Server running on http://localhost:3000/
[Seed] Admin criado: pegasus@lan7.com.br
[Scheduler] Scheduler ativo
```

> [!NOTE]
> As migrations são aplicadas **automaticamente** pelo `entrypoint.sh` a cada startup.
> Não é necessário rodar nenhum comando manual de migration.

---

## 7. Verificar funcionamento

```bash
# A aplicação deve responder na porta 3000
curl http://localhost:3000
```

Se tudo estiver correto, você verá o HTML da aplicação.

> [!NOTE]
> **Credenciais do administrador padrão** (criadas automaticamente no primeiro startup):
> - **E-mail:** `pegasus@lan7.com.br`
> - **Senha:** `g08120812`
>
> Troque a senha após o primeiro acesso.

---

## 8. Configurar Nginx como Reverse Proxy

```bash
sudo apt install -y nginx
```

Crie o arquivo de configuração:

```bash
sudo nano /etc/nginx/sites-available/pegasus
```

Conteúdo:

```nginx
server {
    listen 80;
    server_name seu-dominio.com.br;

    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_send_timeout 300s;
    }
}
```

Ativar o site:

```bash
sudo ln -s /etc/nginx/sites-available/pegasus /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

---

## 9. Configurar HTTPS com Let's Encrypt

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d seu-dominio.com.br

# Renovação automática (já configurada pelo certbot)
sudo certbot renew --dry-run
```

---

## 🔧 Manutenção

### Ver logs da aplicação

```bash
docker compose logs -f app
```

### Reiniciar serviços

```bash
docker compose restart
```

### Atualizar a aplicação

```bash
cd /home/pegasus

# Se via Git:
git pull origin main

# Se via ZIP: substituir os arquivos do projeto via SCP, depois:
docker compose build
docker compose up -d
# As migrations são aplicadas automaticamente no startup!
```

### Backup do banco de dados

```bash
# Criar backup
MYSQL_ROOT=$(grep ^MYSQL_ROOT_PASSWORD .env | cut -d= -f2)
docker compose exec db mysqldump -u root -p"$MYSQL_ROOT" pegasus > backup_$(date +%Y%m%d_%H%M%S).sql

# Restaurar backup
MYSQL_ROOT=$(grep ^MYSQL_ROOT_PASSWORD .env | cut -d= -f2)
cat backup_XXXXXXXX_XXXXXX.sql | docker compose exec -T db mysql -u root -p"$MYSQL_ROOT" pegasus
```

### Backup dos arquivos gerados (XMLs, PDFs, ZIPs)

```bash
# Copiar volume para arquivo tar
docker run --rm -v pegasus_pegasus_storage:/data -v $(pwd):/backup alpine \
  tar czf /backup/pegasus_storage_$(date +%Y%m%d).tar.gz -C /data .
```

> [!NOTE]
> O prefixo do volume pode variar. Verifique com: `docker volume ls`

### Agendar backup automático (cron)

```bash
mkdir -p /home/pegasus/backups
crontab -e
```

Adicione (backup diário às 3h):

```
0 3 * * * cd /home/pegasus && docker compose exec -T db mysqldump -u root -p$(grep MYSQL_ROOT_PASSWORD .env | cut -d= -f2) pegasus > /home/pegasus/backups/backup_$(date +\%Y\%m\%d).sql 2>/dev/null
```

### Limpar imagens Docker não utilizadas

```bash
docker system prune -af
```

---

## ❓ Resolução de Problemas

| Problema | Solução |
|----------|---------|
| App não conecta ao MySQL (`ECONNREFUSED`) | Verifique se `DATABASE_URL` usa `db` como host, **não** `localhost` |
| Container do app em loop de restart | Execute `docker compose logs app` — geralmente é `DATABASE_URL` incorreto |
| Migrations não aplicadas | Verifique os logs do entrypoint: `docker compose logs app \| grep Migrations` |
| Login com admin não funciona | Verifique se o seed rodou: `docker compose logs app \| grep Seed` |
| `JWSSignatureVerificationFailed` nos logs | Normal ao trocar `JWT_SECRET` — basta fazer logout/login no navegador |
| Build falha no `canvas` | Verifique se as libs nativas estão no Dockerfile: `cairo-dev`, `pango-dev`, etc. |
| Arquivos gerados não persistem após restart | Verifique se o volume `pegasus_storage` está montado: `docker volume ls` |
| Erro de permissão | `sudo chown -R $USER:$USER /home/pegasus` |
