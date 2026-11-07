# Defense Guide

A short demo plan and simple answers to questions the panel may ask.

## Before the defense

1. Start MySQL (XAMPP Control Panel, click **Start** next to MySQL).
2. In the project folder run `npm run dev`.
3. Open http://localhost:3000/api/health and confirm `"ok": true`.
4. Have one account ready, or be ready to register a new one live.

## Demo plan (about 5 minutes)

| # | Show | Say |
|---|------|-----|
| 1 | http://localhost:3000/api/health | "This proves our API is connected to the MySQL database." |
| 2 | Register a new account | "The form calls `POST /api/register`. The password is saved as a bcrypt hash." |
| 3 | Quick add a task in the sidebar, press Enter | "This sends `POST /api/tasks`. The API checks the login, validates the data, and saves it." |
| 4 | **+ Add Task** with subject, due date and High priority | "Same endpoint, more fields. The task appears on the calendar on its due date." |
| 5 | Submit a form with the name empty | "Validation happens in the browser and again on the server with Zod." |
| 6 | Edit the task, then click the circle to finish it | "Edit uses `PUT`, finishing uses `PATCH /api/tasks/:id`." |
| 7 | **+ Add Event** | "`POST /api/events`. The end time must be after the start time." |
| 8 | **+ Log study time** | "`POST /api/study-sessions`. The Progress box updates from the database." |
| 9 | Open http://localhost:3000/api/tasks in a new tab | "This is the raw JSON our API returns." |
| 10 | Open phpMyAdmin or `npx prisma studio` | "Here are the same rows saved in the database." |
| 11 | Log out, then open http://localhost:3000/api/tasks | "Without a login the API answers `401 Not signed in`." |

## Questions you may be asked

**What is an API?**
A set of URLs that a program can call to send or get data. Our front end calls our own
API (for example `POST /api/tasks`) and gets JSON back.

**What is REST? Is your API RESTful?**
REST means using URLs for things (resources) and HTTP methods for actions.
We use `GET` to read, `POST` to create, `PUT` to edit, `PATCH` to change one field,
and `DELETE` to remove, all on `/api/tasks`.

**Where is the API in your code?**
In `app/api`. Each folder is a URL and each `route.js` exports functions named after the
HTTP method, like `export async function POST(request)`.

**How does the front end talk to the API?**
Through one helper, `lib/callApi.js`. It uses `fetch()`, sends JSON, and returns
`{ ok, data }` so every form handles success and errors the same way.

**How does the API talk to the database?**
Through Prisma (`lib/db.js`). Instead of writing SQL by hand, we call functions like
`prisma.task.create({ data })`, and Prisma sends safe SQL to MySQL.

**Why use JSON?**
It is the standard text format for APIs. JavaScript can read and write it directly.

**What does each status code mean?**
`200` OK, `201` created, `400` bad data, `401` not logged in, `404` not found,
`409` email already used, `500` server problem. See `docs/4-api-reference.md`.

**How do you validate input?**
Twice. The browser does quick checks so the user gets fast feedback.
The server checks again with Zod (`lib/validators.js`) because a request can be sent
without using our forms, so the server must never trust the browser.

**How are passwords stored?**
As a bcrypt hash with cost 12 (`app/api/register/route.js`). A hash cannot be turned back
into the password. At login we use `bcrypt.compare` to check it.

**How does the app remember who is logged in?**
Auth.js puts a signed cookie (JWT) in the browser after login. Every request sends it back.
The server reads it with `auth()` and gets the user id.

**Can a user see or change another user's tasks?**
No. The user id always comes from the login cookie, and every database query includes
`userId`. If someone tries another person's task id, they get `404`.

**What happens if the database is off?**
The API catches the error, logs it in the terminal, and answers
`500 Something went wrong. Try again.` The health check shows `"database": "not reachable"`.

**What is a migration?**
A SQL file that creates or changes tables. Running `npx prisma migrate deploy` applies them,
so every teammate gets the exact same tables.

**Why is the dashboard not calling the API to load data?**
The dashboard page runs on the server, so it can read the database directly with Prisma.
That is faster and simpler. The API is used for actions from the browser.
The same data is also available as JSON at `GET /api/tasks` and `GET /api/events`.

**What is the `.env` file?**
It holds private settings: the database address and the login secret. It is ignored
by Git, so secrets are never uploaded. `.env.example` shows what it should contain.

**Is Google Calendar connected?**
Not yet. The "Synced with Google Calendar" badge, the sync bar, the Resource Center items,
and the "Connected" labels in Settings are design previews. The database already has
tables and columns ready (`events.googleEventId`, `sync_states`, `resources`, `accounts`)
so it can be added next.

## Limitations and next steps

- Connect Google login and Google Calendar sync using the tables that are already prepared.
- Make the Resource Center save real links and files in the `resources` table.
- Save the Settings switches to the `users` table.
- Add editing and deleting for calendar events (only adding exists now).
- Put the app online (for example on Vercel with a hosted MySQL database).
