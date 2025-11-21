# KU Volunteer - Detailed Instructions

Complete setup guide, troubleshooting, and useful commands.

---

## Table of Contents

1. [Environment Configuration](#environment-configuration)
2. [Local Development (Without Docker)](#local-development-without-docker)
3. [Common Issues & Solutions](#common-issues--solutions)
4. [Useful Docker Commands](#useful-docker-commands)
5. [Testing](#testing)

---

## Environment Configuration

### Required Environment Variables

Copy the template file:
```bash
cp backend/.env.example backend/.env
```

### 1. Django Secret Key (Required)

Generate a secure random key:

```bash
python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'
```

Or:
```bash
openssl rand -base64 50
```

Add to `.env`:
```
SECRET_KEY=your_generated_key_here
```

### 2. Database Configuration (Required)

Set secure passwords:
```
DB_NAME=ku_volunteer_db
DB_USER=ku_user
DB_PASSWORD=your_secure_password_here
DB_HOST=db
DB_PORT=5432

POSTGRES_DB=ku_volunteer_db
POSTGRES_USER=ku_user
POSTGRES_PASSWORD=your_secure_password_here
```

### 3. Google OAuth (Optional)

For social login functionality:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure consent screen if prompted
6. Choose **Web application**
7. Add authorized redirect URIs:
   - `http://localhost:8000/api/auth/google/callback/`
8. Copy credentials to `.env`:
   ```
   GOOGLE_CLIENT_ID=your_client_id_here
   GOOGLE_CLIENT_SECRET=your_client_secret_here
   GOOGLE_REDIRECT_URL=http://localhost:8000/api/auth/google/callback/
   CLIENT_URL_DEV=http://localhost:3000
   ```

**Without OAuth:** Users can still register with email/password.

### 4. Email Configuration (Optional)

For password reset functionality:

#### Using Gmail:

1. Enable 2-Step Verification on your Google Account
2. Generate an [App Password](https://myaccount.google.com/apppasswords)
3. Add to `.env`:
   ```
   EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USE_TLS=True
   EMAIL_HOST_USER=your-email@gmail.com
   EMAIL_HOST_PASSWORD=your-16-char-app-password
   DEFAULT_FROM_EMAIL=noreply@ku-volunteer.com
   ```

#### For Development (Console Output):
```
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
```

Emails will print to console logs instead of sending.

---

## Local Development (Without Docker)

### Backend Setup

1. **Create virtual environment**
   ```bash
   cd backend
   python -m venv .venv
   ```

2. **Activate virtual environment**
   - macOS/Linux:
     ```bash
     source .venv/bin/activate
     ```
   - Windows:
     ```bash
     .venv\Scripts\Activate
     ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up PostgreSQL locally**
   - Install PostgreSQL 16
   - Create database and user matching your `.env` settings

5. **Run migrations**
   ```bash
   python manage.py migrate
   python manage.py seed_data
   ```

6. **Start development server**
   ```bash
   python manage.py runserver
   ```

Backend will be available at http://localhost:8000

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

Frontend will be available at http://localhost:3000

---

## Common Issues & Solutions

### 1. Database Errors

**Error:** `relation "users_user" does not exist`

**Solution:** Run migrations
```bash
docker compose exec backend python manage.py migrate
```

---

### 2. Empty Database

**Error:** No users or activities after starting

**Solution:** Seed the database
```bash
docker compose exec backend python manage.py seed_data
```

---

### 3. Google OAuth Errors

**Error:** `redirect_uri_mismatch`

**Solution:** 
- Verify Google Console has Authorized redirect URI: `http://localhost:8000/api/auth/google/callback/`
- Check `.env` has correct `GOOGLE_REDIRECT_URL`

---

### 4. Docker Container Not Starting

**Check logs:**
```bash
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f db
```

**Restart containers:**
```bash
docker compose restart
```

**Rebuild if needed:**
```bash
docker compose down
docker compose up -d --build
```

---

### 5. Port Already in Use

**Error:** `port is already allocated`

**Solution:**

Stop all containers:
```bash
docker compose down
```

Check what's using the port:
- macOS/Linux:
  ```bash
  lsof -i :8000  # Backend
  lsof -i :3000  # Frontend
  lsof -i :5432  # PostgreSQL
  ```
- Windows:
  ```bash
  netstat -ano | findstr :8000
  ```

Kill the process or change ports in `docker-compose.yml`

---

### 6. Permission Denied (Linux)

**Error:** Permission denied when running Docker commands

**Solution:** Add your user to docker group
```bash
sudo usermod -aG docker $USER
newgrp docker
```

---

## Useful Docker Commands

### Container Management

**Start all services:**
```bash
docker compose up -d
```

**Stop all services:**
```bash
docker compose down
```

**View running containers:**
```bash
docker compose ps
```

**Restart specific service:**
```bash
docker compose restart backend
docker compose restart frontend
```

---

### Rebuild & Update

**Rebuild after code changes:**
```bash
docker compose up -d --build
```

**Rebuild specific service:**
```bash
docker compose build backend
docker compose up -d backend
```

**Pull latest images:**
```bash
docker compose pull
```

---

### Database Management

**Reset database completely:**
```bash
# Stop and remove volumes
docker compose down -v

# Start fresh
docker compose up -d
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py seed_data
```

**Create database backup:**
```bash
docker compose exec db pg_dump -U ku_user ku_volunteer_db > backup.sql
```

**Restore database:**
```bash
docker compose exec -T db psql -U ku_user ku_volunteer_db < backup.sql
```

**Access PostgreSQL shell:**
```bash
docker compose exec db psql -U ku_user -d ku_volunteer_db
```

---

### Logs & Debugging

**View all logs:**
```bash
docker compose logs -f
```

**View specific service logs:**
```bash
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f db
```

**View last 50 lines:**
```bash
docker compose logs --tail=50 backend
```

---

### Running Django Commands

**Create superuser:**
```bash
docker compose exec backend python manage.py createsuperuser
```

**Run migrations:**
```bash
docker compose exec backend python manage.py migrate
```

**Collect static files:**
```bash
docker compose exec backend python manage.py collectstatic --noinput
```

**Django shell:**
```bash
docker compose exec backend python manage.py shell
```

**Custom management command:**
```bash
docker compose exec backend python manage.py <your_command>
```

---

## Testing

### Run All Tests

```bash
docker compose exec backend python manage.py test
```

### Run Specific App Tests

```bash
docker compose exec backend python manage.py test users
docker compose exec backend python manage.py test activities
docker compose exec backend python manage.py test applications
```

### Run Specific Test Class

```bash
docker compose exec backend python manage.py test users.tests.UserModelTests
```

### Run with Coverage

```bash
docker compose exec backend coverage run --source='.' manage.py test
docker compose exec backend coverage report
docker compose exec backend coverage html
```

View coverage report at `backend/htmlcov/index.html`

---

## Monitoring & Metrics

### Prometheus

Access metrics at:
- Prometheus UI: http://localhost:9090
- Django metrics: http://localhost:8000/metrics
- PostgreSQL metrics: http://localhost:9187/metrics

### Grafana

1. Access Grafana at http://localhost:3001
2. Default credentials: `admin` / `admin`
3. Pre-configured dashboards available in `grafana/provisioning/`

### Add Custom Prometheus Target

Edit `prometheus.yml`:
```yaml
scrape_configs:
  - job_name: 'my-service'
    static_configs:
      - targets: ['my-service:8080']
```

Restart Prometheus:
```bash
docker compose restart prometheus
```

---

## Production Deployment Notes

### Security Checklist

- [ ] Set `DEBUG=False` in production
- [ ] Use strong `SECRET_KEY`
- [ ] Configure proper CORS settings
- [ ] Use HTTPS for all endpoints
- [ ] Set up proper firewall rules
- [ ] Use environment-specific `.env` files
- [ ] Enable database backups
- [ ] Configure proper logging
- [ ] Set up monitoring alerts
- [ ] Review all exposed ports

### Performance Optimization

- Use PgBouncer for connection pooling (already configured)
- Configure Redis for caching
- Set up CDN for static files
- Enable Gzip compression
- Optimize database indexes
- Configure proper worker/thread counts

---

## Getting Help

- **Issues:** [GitHub Issues](https://github.com/natawipa/ku-volunteer/issues)
- **Jira Board:** [Project Management](https://ku-team-f030w3d7.atlassian.net/jira/software/projects/KV/boards/35/backlog)
- **Documentation:** Check inline code comments and docstrings

---

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write/update tests
5. Submit a pull request

---

## Additional Resources

- [Django Documentation](https://docs.djangoproject.com/)
- [Django REST Framework](https://www.django-rest-framework.org/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)