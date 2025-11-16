# KU Volunteer

KU Volunteer is a web application for Kasetsart University students to discover, apply for, and track volunteer activities while enabling staff to manage and verify participation. It consists of a Django backend and a Next.js frontend, with optional Google OAuth login and JWT-based API authentication.

---
## 📌 Project Links
- 🎬 **Sprint Review Videos**
  - Playlist : [Playlists](https://youtube.com/playlist?list=PL-agTHiNrXJK620Vo5P6VZCPbh5BCq6Qu&si=EKEUJKmh41vWM9dX)
    - Sprint 1: [Watch on YouTube](https://www.youtube.com/watch?v=TEeooISUzhA)
    - Sprint 2: [Watch on Youtube](https://youtu.be/Qx_UI-_u6G8)
    - Sprint 3: [Watch on Youtube](https://www.youtube.com/watch?v=0Lb2iRNIzEw&list=PL-agTHiNrXJK620Vo5P6VZCPbh5BCq6Qu&index=3)
    - Sprint 4: [Watch on Youtube](https://www.youtube.com/watch?v=FWr_dzA1gAQ&list=PL-agTHiNrXJK620Vo5P6VZCPbh5BCq6Qu&index=4)
- 📋 **Project Proposal:** [Google Docs](https://docs.google.com/document/d/1dSgomn033W_DnCxLYvI9i7PCp6DdOQVSv9pmEwO-aZQ/edit?usp=sharing)
- 📊 **Project Management:** [Jira Board](https://ku-team-f030w3d7.atlassian.net/jira/software/projects/KV/boards/35/backlog)
- 🎨 **UI/UX Design:** [Figma Design](https://www.figma.com/design/xlDIr7uXlz8cMf5fttJkrg/KU-Volunteer?node-id=0-1&p=f&t=nzDc8F16H0CUbju9-0)
- 📚 **GitHub Repository:** [KU-Volunteer](https://github.com/natawipa/ku-volunteer)
---

## Getting Started

### Dependencies
- Docker Desktop (recommended) or
- Python 3.11, Node.js 20, PostgreSQL 16
- macOS, Linux, or Windows 10+

### Installing (Docker)

#### 1. Clone the repository
```bash
git clone https://github.com/natawipa/ku-volunteer.git
cd ku-volunteer
```

#### 2. Build and start the Docker containers
```bash
docker compose up -d --build
```
This will start:
- Backend (Django): http://localhost:8000
- Frontend (Next.js): http://localhost:3000
- PostgreSQL database
- Prometheus (metrics): http://localhost:9090
- Grafana** (dashboards): http://localhost:3001
- PostgreSQL Exporter (database metrics): http://localhost:9187

#### 3. Apply database migrations (first time only)
```bash
docker compose exec backend python manage.py migrate
```
#### 4. Seed the database with sample data 
```bash
docker compose exec backend python manage.py seed_data
```
This creates:
- **1 Admin account**: Full system access
- **25 Student accounts**: For testing applications and activity participation
- **3 Organizer accounts**: 2 from the same organization (Green Earth Foundation), 1 from a different organization (Tech For Good)
- **10 Activities total** (5 per organization) with varied statuses:
  - **COMPLETE** (2 activities): Ended 30 days ago
  - **DURING** (2 activities): Currently happening
  - **UPCOMING** (2 activities): Starts in 3 days
  - **OPEN** (2 activities): Starts in 20 days
  - **FULL** (2 activities): Starts in 10 days
**Sample Login Credentials:**
- **Admin**: 
  - Email: `admin@ku.th`
  - Password: `admin123`
- **Students**: 
  - Email: `student1@ku.th` to `student25@ku.th`
  - Password: `student123` (same for all students)
- **Organizers**:
  - **Green Earth Foundation - Organizer 1 (John Green)**:
    - Email: `john.green@greenearth.org`
    - Password: `organizer123`
  - **Green Earth Foundation - Organizer 2 (Sarah Eco)**:
    - Email: `sarah.eco@greenearth.org`
    - Password: `organizer123`
  - **Tech For Good - Organizer 3 (David Tech)**:
    - Email: `david@techforgood.org`
    - Password: `organizer123`

#### 5. (Optional) Create a custom admin account
```bash
docker compose exec backend python manage.py createsuperuser
```

#### 6. Access the application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **Admin Panel**: http://localhost:8000/admin/
- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3001 (default credentials: admin/admin)
- **Metrics Endpoint**: http://localhost:8000/metrics

#### 7. Stop the stack
```bash
docker compose down
```
---

### Executing program (local without Docker)

Backend (Django)
- Create/activate virtualenv
	- macOS/Linux: 
      ```
      source .venv/bin/activate
      ```
	- Windows: 
      ```
      .venv\\Scripts\\Activate.ps1
      ```
- Install deps: 
  ```
  pip install -r backend/requirements.txt
  ```
- Run server from `backend/`: 
  ```
  python manage.py runserver
  ```

Frontend (Next.js)
- From `frontend/`: 
  ```
  npm install
  npm run dev
  ```


Frontend: http://localhost:3000  
Backend: http://localhost:8000

## Help

### Common Issues

**Database errors** (e.g., `relation "users_user" does not exist`)
```bash
# Run migrations
docker compose exec backend python manage.py migrate
```

**Empty database / No users or activities**
```bash
# Seed the database with sample data
docker compose exec backend python manage.py seed_data
```
**Google OAuth redirect_uri_mismatch**
- Ensure Google Console has Authorized redirect URI: `http://localhost:8000/api/auth/google/callback/`

**Docker container not starting**
```bash
# Check logs
docker compose logs -f backend
docker compose logs -f frontend

# Restart containers
docker compose restart
```

**Port already in use**
```bash
# Stop all containers
docker compose down

# Check what's using the port
# macOS/Linux:
lsof -i :8000  # or :3000 for frontend
# Windows:
netstat -ano | findstr :8000
```

### Useful Commands

**Rebuild containers** (after dependency changes)
```bash
# Rebuild and restart
docker compose up -d --build

# Or rebuild specific service
docker compose build backend
docker compose build frontend
docker compose up -d
```

**Reset database completely**
```bash
# Stop containers
docker compose down

# Remove volumes (deletes all data)
docker compose down -v

# Start fresh
docker compose up -d
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py seed_data
```

**View logs**
```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f backend
docker compose logs -f frontend
```

**Run Django management commands**
```bash
docker compose exec backend python manage.py <command>
```

**Run tests**
```bash
# All tests
docker compose exec backend python manage.py test

# Specific app tests
docker compose exec backend python manage.py test users
docker compose exec backend python manage.py test activities
```

---

## Monitoring and Observability

### Prometheus + Grafana Integration

The application includes comprehensive system monitoring using Prometheus and Grafana.

**Accessing Monitoring Tools:**
- **Prometheus**: http://localhost:9090 - Metrics collection and querying
- **Grafana**: http://localhost:3001 - Visualization dashboards (admin/admin)
- **Django Metrics**: http://localhost:8000/metrics - Application metrics endpoint

**Available Metrics:**
- HTTP request rates and response codes
- Request latency by endpoint
- Database query performance
- PostgreSQL connections and cache hit ratio
- Application-level metrics

**Pre-configured Dashboard:**
The Grafana instance includes a pre-configured "KU Volunteer - System Metrics" dashboard with:
- HTTP request rate by method
- HTTP response rate by status code
- Request latency gauges
- Database query counts
- PostgreSQL active connections
- Database cache hit ratios

**Viewing Metrics:**
1. Access Grafana at http://localhost:3001
2. Login with username: `admin`, password: `admin`
3. Navigate to Dashboards → KU Volunteer - System Metrics
4. Metrics refresh every 10 seconds by default

**Querying Custom Metrics:**
Visit Prometheus at http://localhost:9090 to run custom PromQL queries:
```promql
# Request rate
rate(django_http_requests_total_by_method_total[5m])

# Response status distribution
django_http_responses_total_by_status_total

# Database connections
pg_stat_database_numbackends
```

---

## License

This project is licensed under the MIT License — see the `LICENSE` file for details.

## Acknowledgments

- Inspired by volunteer/activity platforms in higher education
- Thanks to the maintainers of Django, DRF, Next.js, and social-auth
