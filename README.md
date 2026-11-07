# Study Planner

A web app for planning a student's study week: tasks with priorities and due dates,
calendar events, study time logging, and progress tracking.
Built for our **Integrative Programming** project, with a focus on connecting the
front end, our own REST API, and a MySQL database.

```
Browser (React pages)  -->  API routes (app/api)  -->  Prisma  -->  MySQL
```

## Features

- Register, log in and log out (passwords saved as bcrypt hashes)
- Add, edit, complete and delete tasks
- Weekly and monthly calendar of due tasks and events
- Add calendar events
- Log study time and see progress
- `GET /api/health` to check the database connection

Google login, Google Calendar sync, and the Resource Center are planned. Their screens are
design previews and the database tables are already prepared. See
[docs/1-project-overview.md](docs/1-project-overview.md).

## Tech stack

Next.js 16, React 19, Tailwind CSS 4, Auth.js (NextAuth v5), Zod, Prisma 7, MySQL / MariaDB

## Run it on your computer (Windows, macOS, Linux)

**You need:** Node.js 22 or 24 LTS (at least 20.19), Git, and MySQL or MariaDB
(XAMPP is the easiest on Windows). Full step by step guide with fixes for common problems:
**[docs/2-how-to-run.md](docs/2-how-to-run.md)**

1. **Get the code and install packages**
   ```bash
   git clone https://github.com/FranzGhericAller/IP-Project-StudyPlanner-Group3.git
   cd IP-Project-StudyPlanner-Group3
   npm install
   ```

2. **Start MySQL and create an empty database named `studyplanner`**
   (XAMPP: start MySQL, open phpMyAdmin, click New, name it `studyplanner`), or:
   ```bash
   mysql -u root -p -e "CREATE DATABASE studyplanner;"
   ```

3. **Create your `.env` file** from the example

   | System | Command |
   |--------|---------|
   | Windows (PowerShell) | `Copy-Item .env.example .env` |
   | macOS / Linux | `cp .env.example .env` |

   Then open `.env` and set:
   - `DATABASE_URL`, for XAMPP: `mysql://root:@localhost:3306/studyplanner`
   - `AUTH_SECRET`, paste the output of:
     ```bash
     node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
     ```

4. **Create the tables**
   ```bash
   npx prisma migrate deploy
   ```

5. **Start the app**
   ```bash
   npm run dev
   ```
   Open http://localhost:3000 and register an account.
   Check http://localhost:3000/api/health, it should say `"ok": true`.

## Project structure

```
app/
  (auth)/      Login and register pages (logged-out users)
  (app)/       Dashboard and other pages (logged-in users only)
  api/         The REST API: health, register, auth, tasks, events, study-sessions
components/    UI pieces, grouped into dashboard/, forms/, auth/ and common/
lib/           Shared code: API helpers, validation rules, login setup, database client
prisma/        Database design (schema.prisma) and migrations
docs/          Project documentation
```

## Documentation

| Document | What it covers |
|----------|----------------|
| [Project Overview](docs/1-project-overview.md) | What the app does and the technologies used |
| [How to Run](docs/2-how-to-run.md) | Full setup for any device, and troubleshooting |
| [How It Works](docs/3-how-it-works.md) | Request flow, login, security, folder guide |
| [API Reference](docs/4-api-reference.md) | Every endpoint with examples |
| [Database](docs/5-database.md) | Tables, relationships, migrations |
| [Defense Guide](docs/6-defense-guide.md) | Demo plan and likely questions |

## Scripts

| Command | What it does |
|---------|--------------|
| `npm run dev` | Start the app for development |
| `npm run build` / `npm start` | Build and run the production version |
| `npm run lint` | Check the code for mistakes |
| `npm run db:deploy` | Apply database migrations |
| `npm run db:studio` | Browse the database in the browser |
