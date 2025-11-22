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
    - Sprint 5: [Watch on Youtube](https://youtu.be/KwegxIw0AKE?si=0-jX-mQj4y5vTg6p)
- 📋 **Project Proposal:** [Google Docs](https://docs.google.com/document/d/1dSgomn033W_DnCxLYvI9i7PCp6DdOQVSv9pmEwO-aZQ/edit?usp=sharing)
- 📊 **Project Management:** [Jira Board](https://ku-team-f030w3d7.atlassian.net/jira/software/projects/KV/boards/35/backlog)
- 🎨 **UI/UX Design:** [Figma Design](https://www.figma.com/design/xlDIr7uXlz8cMf5fttJkrg/KU-Volunteer?node-id=0-1&p=f&t=nzDc8F16H0CUbju9-0)
- 📚 **GitHub Repository:** [KU-Volunteer](https://github.com/natawipa/ku-volunteer)

---

## Quick Start

### Prerequisites

- Docker Desktop installed
- Git

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/natawipa/ku-volunteer.git
   cd ku-volunteer
   ```

2. **Set up environment variables**

   ```bash
   cp backend/.env.example backend/.env
   ```

   _Edit `backend/.env` and add your credentials (see [INSTRUCTIONS.md](INSTRUCTIONS.md) for details)_

3. **Start the application**

   ```bash
   docker compose up -d --build
   ```

4. **Initialize database**

   ```bash
   docker compose exec backend python manage.py migrate
   docker compose exec backend python manage.py seed_data
   ```

5. **Access the application**
   - **Frontend**: http://localhost:3000
   - **Backend API**: http://localhost:8000
   - **Admin Panel**: http://localhost:8000/admin/
   - **Grafana**: http://localhost:3001 (admin/admin)

---

## Default Accounts

**Admin**:

- Email: `admin@ku.th`
- Password: `admin123`

**Students** (`student1@ku.th` to `student25@ku.th`):

- Password: `student123`

**Organizers**:

- `john.g@greenearth.org` / `organizer123`
- `sarah.eco@greenearth.org` / `organizer123`
- `david@techforgood.org` / `organizer123`

---

## 📚 Documentation

- **[INSTRUCTIONS.md](INSTRUCTIONS.md)** - Detailed setup, troubleshooting, and commands
- **[API Documentation](https://docs.google.com/document/d/1EYyMPAh4I3LV47YKbkOp3ewQJoTx76ASV5QLOMi7BZU/edit?usp=sharing)** - Api Documentation
- **[User Documentation](https://docs.google.com/document/d/1mT6Xu9jrClPeGfwpMMHFyUPP6TRqxMiwI_RDF3Dx3Vg/edit?usp=sharing)** - Comprehensive guide for end-users
- **[Development Process Documentation](https://docs.google.com/document/d/1frED7RGdj4E18k61whuCNE-hhicmRII5QyD4uZLQa54/edit?usp=sharing)** - Sprint progress, development journey, and challenges encountered

---

## License

This project is licensed under the MIT License — see the `LICENSE` file for details.

## Acknowledgments

- Inspired by volunteer/activity platforms in higher education
- Thanks to the maintainers of Django, DRF, Next.js, and social-auth
