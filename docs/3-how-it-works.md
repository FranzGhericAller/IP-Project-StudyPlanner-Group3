# How the App Works

## 1. Big picture

```
Browser (React pages/forms)
   |   fetch() w/ JSON, see lib/callApi.js
   v
API routes (app/api/.../route.js)
   |   1) logged in?      getUserId()   in lib/apiHelpers.js
   |   2) read the body   readJson()    in lib/apiHelpers.js
   |   3) valid data?     zod schemas   in lib/validators.js
   |   4) save / read     prisma        in lib/db.js
   v
MySQL database "studyplanner" (tables are in prisma/schema.prisma)
```

## 2. Two ways data moves

### A. Showing a page (reading)

Pages like the Dashboard run **on the server first**. `app/(app)/page.js` reads the
database with Prisma, then passes the results to the `Dashboard` component that the
browser shows. The page arrives already filled with data, so it's faster.

### B. Changing data (writing through the API)

When the user submits a form or clicks a button:

1. The form calls `callApi("/api/tasks", "POST", { ...data })` (from `lib/callApi.js`).
2. The API route checks the login, reads the body, and validates it with Zod.
3. If something's wrong it answers with an error code + messages, for example
   `400 { errors: { title: "Task name is required." } }`. The form shows the message under the field.
4. If it's fine, Prisma saves it to MySQL and the API answers `201 { ok: true, task }`.
5. The page calls `router.refresh()`, which reloads the data (way A) so the change shows up.

## 3. Example: adding a task

| Step | File | What happens |
|------|------|--------------|
| 1 | `components/forms/TaskForm.js` | User fills in the form and clicks **Save Task** |
| 2 | `components/forms/TaskForm.js` | Quick check that the task name isn't empty |
| 3 | `lib/callApi.js` | Sends `POST /api/tasks` with the form data as JSON |
| 4 | `app/api/tasks/route.js` | `getUserId()` gets the user from the login cookie. No user = `401` |
| 5 | `app/api/tasks/route.js` | `readJson()` reads the body. Broken JSON = `400` |
| 6 | `lib/validators.js` | `taskSchema` checks the title, priority, date and lengths |
| 7 | `lib/subjects.js` | Finds the subject by name, or creates it if it's new |
| 8 | `app/api/tasks/route.js` | `prisma.task.create(...)` inserts a row in the `tasks` table |
| 9 | `app/api/tasks/route.js` | Answers `201` with the new task as JSON |
| 10 | `components/forms/TaskForm.js` | Goes back to the dashboard and refreshes the data |

## 4. Login

**Register:** `app/(auth)/register/page.js` calls `POST /api/register`

1. The API validates the name, email and password.
2. It checks the email isn't taken yet.
3. It turns the password into a **bcrypt hash** and saves the user. The real password is never stored.
4. The page logs the user in right after.

**Log in:** `app/(auth)/login/page.js` calls Auth.js, which runs `lib/auth.js`

1. The page calls `signIn("credentials", { email, password })`.
2. Auth.js runs `authorize()` in `lib/auth.js`. It finds the user by email and checks the
   password against the saved hash with `bcrypt.compare`.
3. If it matches, Auth.js sets a **signed cookie (JWT)** that says who the user is.

**Protecting pages and the API**

- Pages in `app/(app)/` check `auth()` and send logged out users to `/login`.
- Every API route calls `getUserId()`. Nobody logged in = `401 Not signed in`.

## 5. Security (simple version)

| Risk | What we do |
|------|------------|
| Stolen passwords | Only bcrypt hashes are saved |
| Pretending to be another user | The user id always comes from the login cookie, never from the request body |
| Editing someone else's task | Every query includes `userId`, so it only finds your own rows |
| Bad input | Zod checks every request. Prisma builds safe queries (no SQL injection) |
| Leaking secrets | The db password and login secret are in `.env`, which isn't uploaded to GitHub |

## 6. Folder guide

```
app/
  layout.js                  outer html for every page
  globals.css                global colors + Tailwind
  (auth)/                    pages for logged out users
    layout.js                logged in? go to the dashboard
    login/page.js
    register/page.js
  (app)/                     pages for logged in users only
    layout.js                not logged in? go to /login
    page.js                  dashboard (reads data on the server)
    tasks/new/page.js        add task
    tasks/[id]/edit/page.js  edit task
    events/new/page.js       add event
    study/new/page.js        log study time
    resources/page.js        resource center (sample items for now)
    settings/page.js         profile + settings
  api/                       the API (back end)
    health/route.js          GET  db connection check
    register/route.js        POST create account
    auth/[...nextauth]/      login, logout, session (Auth.js)
    tasks/route.js           GET list, POST add
    tasks/[id]/route.js      PATCH done/not done, PUT edit, DELETE
    events/route.js          GET list, POST add
    study-sessions/route.js  POST log study time

components/
  dashboard/                 main screen
    Dashboard.js             layout, top bar, progress, calendar controls
    TaskList.js              task manager box (add, complete, delete)
    Calendar.js              weekly + monthly calendar
    SyncBar.js               Google sync bar (design only for now)
  forms/                     add/edit pages
    FormPage.js              shared layout for the forms
    Field.js                 label + input + error msg
    TaskForm.js, EventForm.js, StudyForm.js
  auth/                      only used by login + register
    AuthLayout.js, GoogleButton.js, PasswordInput.js
  common/                    used all over
    Alert.js                 red/blue msg box
    BackLink.js              "Back to Dashboard" top bar
    UserAvatar.js            profile pic or first letter
    Providers.js             gives login info to client components

lib/
  callApi.js                 browser side: calls our API
  apiHelpers.js              server side: helpers for the API routes
  validators.js              all the zod rules
  auth.js                    Auth.js login setup
  db.js                      connects Prisma to MySQL
  subjects.js                finds or creates a subject by name
  calendar.js                date helpers for the calendar
  ui.js                      shared styles + priority labels

prisma/
  schema.prisma              db design (tables + relations)
  migrations/                SQL that creates the tables

prisma.config.ts             tells Prisma where the schema is + which db to use
.env.example                 template for your own .env
```
