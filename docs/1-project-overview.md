# Project Overview

## What is the Study Planner?

The Study Planner is a web app that helps a student plan their study week in one place.
A student can:

- create an account and log in
- add tasks with a subject, due date and priority (High, Med, Low)
- mark tasks as done, edit them, or delete them
- add calendar events such as exams or meetings
- see tasks and events on a weekly or monthly calendar
- log how many minutes they studied
- see their progress (hours studied, tasks completed, deadlines this week)

## What is the main goal?

The goal of this project is to **build a working API connection**:

1. **Front end to back end.** The pages in the browser send requests to our own API
   (for example `POST /api/tasks`) and get JSON back.
2. **Back end to database.** The API checks the request, then saves or reads the data
   in a MySQL database using Prisma.

```
Browser (React pages)  -->  API routes (app/api)  -->  Prisma  -->  MySQL
```

Every feature that changes data (register, add task, edit task, log study time...)
goes through this path.

## What works now and what is planned

| Feature | Status | Notes |
|---------|--------|-------|
| Register, log in, log out | Working | Email and password, saved with a bcrypt hash |
| Add, edit, complete, delete tasks | Working | Through `/api/tasks` |
| Weekly and monthly calendar | Working | Shows due tasks and events |
| Add calendar events | Working | Through `/api/events` |
| Log study time | Working | Through `/api/study-sessions` |
| Progress box | Working | Counted live from the database |
| Health check | Working | `/api/health` proves the API can reach the database |
| Google login | Planned | The button shows "not connected yet" |
| Google Calendar sync | Planned | The green "Synced" badge and the bottom sync bar are design previews |
| Resource Center (Drive, Notion, files) | Planned | Shows sample items. The `resources` table is ready |
| Saving the Settings switches | Planned | The switches only change on screen. The columns exist in `users` |

The database already has tables for the planned features, so they can be added later
without redesigning the database.

## Technologies used

| Part | Technology | What it does for us |
|------|-----------|---------------------|
| Framework | **Next.js 16** (App Router) | Pages and the API live in one project |
| User interface | **React 19** | Builds the screens from components |
| Styling | **Tailwind CSS 4** | Styles written as class names, for example `bg-white` |
| Login | **Auth.js (NextAuth v5)** | Handles login, logout and the login cookie |
| Password safety | **bcryptjs** | Turns passwords into hashes before saving |
| Input checking | **Zod** | Checks that data sent to the API is valid |
| Database access | **Prisma 7** | Lets us write `prisma.task.create(...)` instead of raw SQL |
| Database | **MySQL / MariaDB** | Stores users, tasks, events and study sessions |

## Why we chose these

- **Next.js** lets one project hold both the pages and the API, so there is only one app to run.
- **Prisma** keeps the database design in one readable file (`prisma/schema.prisma`)
  and protects against SQL injection because it builds the queries for us.
- **Zod** gives clear error messages that we can show right under each form field.
- **Auth.js** is the standard login library for Next.js, so we did not write session handling by hand.
- **MySQL** is what we learned in class and it runs locally with XAMPP.
