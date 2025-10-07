# KU Volunteer
KU Volunteer is a web application for Kasetsart University students to discover, apply for, and track volunteer activities while enabling staff to manage and verify participation. It consists of a Django backend and a Next.js frontend, with optional Google OAuth login and JWT-based API authentication.
---

## 📌 Project Links
- 🎬 **Sprint Review Videos**
  - Playlist : [Playlists](https://youtube.com/playlist?list=PL-agTHiNrXJK620Vo5P6VZCPbh5BCq6Qu&si=EKEUJKmh41vWM9dX)
    - Sprint 1: [Watch on YouTube](https://www.youtube.com/watch?v=TEeooISUzhA)
    - Sprint 2: [Watch on Youtube](https://youtu.be/Qx_UI-_u6G8)
    - Sprint 3: [Watch on Youtube](https://www.youtube.com/watch?v=0Lb2iRNIzEw&list=PL-agTHiNrXJK620Vo5P6VZCPbh5BCq6Qu&index=3)
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
1. Clone the repository
2. Start the stack
```
cd ku-volunteer
docker compose up -d
```
3. Apply migrations (first time)
```
docker compose exec backend python manage.py makemigrations users
docker compose exec backend python manage.py migrate
```
4. (Optional) Create admin and open admin site
```
docker compose exec backend python manage.py createsuperuser
```
Admin: http://localhost:8000/admin/

### Executing program (local without Docker)

Backend (Django)
- Create/activate virtualenv
	- macOS/Linux: `source .venv/bin/activate`
	- Windows: `.venv\\Scripts\\Activate.ps1`
- Install deps: `pip install -r backend/requirements.txt`
- Run server from `backend/`: `python manage.py runserver`

Frontend (Next.js)
- From `frontend/`: `npm install` then `npm run dev`

Frontend: http://localhost:3000
Backend: http://localhost:8000

## Help

Common issues:
- Database errors like relation "users_user" does not exist → run migrations as above.
- Google OAuth redirect_uri_mismatch → ensure Google Console has Authorized redirect URI:
	`http://localhost:8000/api/auth/google/callback/`

## License

This project is licensed under the MIT License — see the `LICENSE` file for details.

## Acknowledgments

- Inspired by volunteer/activity platforms in higher education
- Thanks to the maintainers of Django, DRF, Next.js, and social-auth
