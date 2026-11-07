# API Reference

All endpoints live under `http://localhost:3000/api`. They send and receive **JSON**.
Except for `/api/health` and `/api/register`, you must be **logged in**.
The login is read from the cookie that the browser sends automatically.

## Summary

| Method | URL | What it does | Login needed |
|--------|-----|--------------|:------------:|
| GET | `/api/health` | Checks the database connection | No |
| POST | `/api/register` | Creates an account | No |
| GET / POST | `/api/auth/...` | Login, logout, session (handled by Auth.js) | No |
| GET | `/api/tasks` | Lists your tasks | Yes |
| POST | `/api/tasks` | Creates a task | Yes |
| PATCH | `/api/tasks/:id` | Marks a task done or not done | Yes |
| PUT | `/api/tasks/:id` | Edits a task | Yes |
| DELETE | `/api/tasks/:id` | Deletes a task | Yes |
| GET | `/api/events` | Lists your calendar events | Yes |
| POST | `/api/events` | Creates a calendar event | Yes |
| POST | `/api/study-sessions` | Logs study time | Yes |

## Status codes we use

| Code | Meaning | Example |
|------|---------|---------|
| 200 | OK | The list or update worked |
| 201 | Created | A new task, event, account or study session was saved |
| 400 | Bad request | Missing title, end time before start, broken JSON |
| 401 | Not signed in | Calling `/api/tasks` while logged out |
| 404 | Not found | The task does not exist or is not yours |
| 409 | Conflict | The email is already registered |
| 500 | Server error | The database is down |

When a field is wrong, the answer looks like this, so the form can show each message
under the right input:

```json
{ "errors": { "title": "Task name is required." } }
```

Other errors look like this:

```json
{ "message": "Not signed in." }
```

---

## How to test the API yourself

**GET requests:** log in, then open the URL in the browser, for example
http://localhost:3000/api/tasks.

**Other requests:** log in, press **F12**, open the **Console** tab, and paste:

```js
await fetch("/api/tasks", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ title: "Test from console", priority: "HIGH" }),
}).then((r) => r.json());
```

Refresh the dashboard and the new task appears.

---

## GET `/api/health`

Checks that the API can talk to the database.

**Response 200**
```json
{ "ok": true, "database": "connected", "users": 3 }
```

**Response 500**
```json
{ "ok": false, "database": "not reachable", "message": "Check DATABASE_URL in .env and that MySQL is running." }
```

---

## POST `/api/register`

Creates a new account. The password is saved only as a bcrypt hash.

**Body**
```json
{ "name": "Juan Dela Cruz", "email": "juan@school.edu", "password": "secret123" }
```

| Field | Rule |
|-------|------|
| name | required, up to 80 characters |
| email | must look like an email, saved in lowercase |
| password | 8 to 72 characters |

**Responses:** `201 { "ok": true }`, `400` (invalid fields), `409` (email already used).

---

## `/api/auth/...` (Auth.js)

These are created by Auth.js in `app/api/auth/[...nextauth]/route.js`. We do not call them
by hand. The pages use `signIn()` and `signOut()` from `next-auth/react`, which call:

| URL | Used for |
|-----|----------|
| `POST /api/auth/callback/credentials` | Logging in with email and password |
| `GET /api/auth/session` | Getting the logged-in user |
| `POST /api/auth/signout` | Logging out |

---

## GET `/api/tasks`

Lists all your tasks, newest first, with the subject name.

**Response 200**
```json
{
  "tasks": [
    {
      "id": "cmw670ndu0003u0v4f5d900ek",
      "title": "Finish API documentation",
      "notes": "Explain each endpoint.",
      "priority": "HIGH",
      "status": "TODO",
      "dueAt": "2026-11-09T02:00:00.000Z",
      "subject": { "name": "Integrative Programming" }
    }
  ]
}
```

---

## POST `/api/tasks`

Creates a task.

**Body**
```json
{
  "title": "Finish API documentation",
  "subject": "Integrative Programming",
  "dueAt": "2026-11-09T02:00:00.000Z",
  "priority": "HIGH",
  "notes": "Explain each endpoint."
}
```

| Field | Rule |
|-------|------|
| title | required, up to 191 characters |
| priority | `HIGH`, `MED` or `LOW` |
| subject | optional, up to 60 characters. A new subject is created if it does not exist yet |
| dueAt | optional ISO date, or `""` for no due date |
| notes | optional, up to 5000 characters |

**Responses:** `201 { "ok": true, "task": { ... } }`, `400`, `401`.

---

## PATCH `/api/tasks/:id`

Marks a task done or not done. `completedAt` is set to now when it becomes done.

**Body**
```json
{ "status": "DONE" }
```

`status` must be `TODO` or `DONE`.

**Responses:** `200 { "ok": true }`, `400`, `401`, `404`.

---

## PUT `/api/tasks/:id`

Edits a task. The body is the same as **POST `/api/tasks`**.

**Responses:** `200 { "ok": true }`, `400`, `401`, `404`.

---

## DELETE `/api/tasks/:id`

Deletes a task. No body.

**Responses:** `200 { "ok": true }`, `401`, `404`.

> For PATCH, PUT and DELETE, the query always includes your user id.
> If the id belongs to someone else, the answer is `404`, as if the task did not exist.

---

## GET `/api/events`

Lists your calendar events, earliest first.

**Response 200**
```json
{
  "events": [
    {
      "id": "cmw670yxe0004u0v4clcd9lxs",
      "title": "Project Defense",
      "startAt": "2026-11-07T01:00:00.000Z",
      "endAt": "2026-11-07T03:00:00.000Z",
      "source": "LOCAL"
    }
  ]
}
```

---

## POST `/api/events`

Creates a calendar event.

**Body**
```json
{
  "title": "Project Defense",
  "subject": "Integrative Programming",
  "description": "Room 301",
  "startAt": "2026-11-07T01:00:00.000Z",
  "endAt": "2026-11-07T03:00:00.000Z"
}
```

| Field | Rule |
|-------|------|
| title | required, up to 191 characters |
| startAt, endAt | required dates. `endAt` must be after `startAt` |
| subject | optional, up to 60 characters |
| description | optional, up to 5000 characters |

**Responses:** `201 { "ok": true, "event": { ... } }`, `400`, `401`.

---

## POST `/api/study-sessions`

Logs time spent studying.

**Body**
```json
{ "minutes": 90, "subject": "", "taskId": "cmw670ndu0003u0v4f5d900ek", "startedAt": "" }
```

| Field | Rule |
|-------|------|
| minutes | required whole number from 1 to 1440 |
| startedAt | optional ISO date. Empty means "now" |
| taskId | optional. Must be one of your own tasks |
| subject | optional. If empty, the linked task's subject is used |

The server works out `endedAt = startedAt + minutes`.

**Responses:** `201 { "ok": true, "session": { ... } }`, `400`, `401`.
