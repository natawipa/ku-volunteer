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
  - **COMPLETE** (2 activities): Ended 30 days ago, 100% filled (16 approved students each)
  - **DURING** (2 activities): Currently happening, 100% filled (21 approved students each)
  - **UPCOMING** (2 activities): Starts in 3 days, 50% filled + pending applications
  - **OPEN** (2 activities): Starts in 20 days, 30% filled + pending applications
  - **FULL** (2 activities): Starts in 10 days, 100% filled (15 approved students each), no more applications allowed
- **150+ Student Applications** across all activities with proper status distribution

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

**Missing participants in activity detail page**
- If you see fewer participants than expected, check the pagination settings in `backend/config/pagination.py`
- Default `page_size` is set to 100 to accommodate activities with many participants
- For activities with 100+ participants, consider increasing this value or implementing proper pagination UI

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

## License

This project is licensed under the MIT License — see the `LICENSE` file for details.

## Acknowledgments

- Inspired by volunteer/activity platforms in higher education
- Thanks to the maintainers of Django, DRF, Next.js, and social-auth
