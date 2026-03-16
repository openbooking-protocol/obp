# Self-Hosting Guide

This guide covers deploying the OBP reference server in production.

## Requirements

- Docker 24+ and Docker Compose v2
- A domain name with HTTPS (required for federation)
- At least 1 vCPU and 512 MB RAM

## Deployment with Docker Compose

### 1. Clone the repository

```bash
git clone https://github.com/openbooking-protocol/obp.git
cd obp
```

### 2. Configure environment

```bash
cp server/.env.example server/.env
```

Edit `server/.env`:

```env
NODE_ENV=production
PORT=3000

# PostgreSQL (use a strong password)
DATABASE_URL=postgresql://obp:STRONG_PASSWORD@postgres:5432/obp

# Redis
REDIS_URL=redis://redis:6379

# Security — generate with: openssl rand -hex 32
API_KEY_SECRET=<64-char-hex>
JWT_SECRET=<64-char-hex>

# Your server's public URL
OBP_SERVER_URL=https://obp.yourdomain.com
OBP_SERVER_NAME=Your Business Name

# Federation
FEDERATION_ENABLED=true

# Email (optional)
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@yourdomain.com
SMTP_PASS=your-smtp-password
SMTP_FROM=noreply@yourdomain.com
```

### 3. Start services

```bash
docker compose -f docker-compose.prod.yml up -d
```

### 4. Run migrations and seed

```bash
docker compose -f docker-compose.prod.yml exec server npm run db:migrate
docker compose -f docker-compose.prod.yml exec server npm run db:seed
```

### 5. Set up a reverse proxy (Nginx example)

```nginx
server {
    listen 443 ssl http2;
    server_name obp.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/obp.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/obp.yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Get an SSL certificate with Certbot:
```bash
certbot --nginx -d obp.yourdomain.com
```

### 6. Verify deployment

```bash
curl https://obp.yourdomain.com/.well-known/obp
```

Run the OBP compliance validator:
```bash
npx @obp/validator https://obp.yourdomain.com
```

## Updating

```bash
git pull
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml exec server npm run db:migrate
```

## Backups

Set up automated PostgreSQL backups:

```bash
# Daily backup cron job
0 3 * * * docker exec obp-postgres-1 pg_dump -U obp obp | gzip > /backups/obp-$(date +%Y%m%d).sql.gz
```

## Security checklist

- [ ] Change all default passwords and secrets
- [ ] Enable HTTPS with a valid certificate
- [ ] Configure a firewall (only expose 80/443)
- [ ] Set up log monitoring
- [ ] Configure automated backups
- [ ] Review rate limiting settings in `server/.env`
- [ ] Enable audit logging for admin actions

## Environment variables reference

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `REDIS_URL` | Yes | Redis connection string |
| `API_KEY_SECRET` | Yes | HMAC secret for API key generation |
| `JWT_SECRET` | Yes | Secret for JWT signing |
| `OBP_SERVER_URL` | Yes | Public HTTPS URL of the server |
| `OBP_SERVER_NAME` | No | Display name for discovery |
| `FEDERATION_ENABLED` | No | Enable/disable federation (default: true) |
| `SMTP_HOST` | No | SMTP server for email notifications |
| `PORT` | No | HTTP port (default: 3000) |
