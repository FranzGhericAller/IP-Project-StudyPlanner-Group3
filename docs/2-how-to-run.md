# How to Run the Study Planner (any device)

The app runs on your own computer. It works on **Windows, macOS and Linux**.
You need three things: **Node.js**, **Git**, and a **MySQL database** (XAMPP's MariaDB works too).

---

## Step 1. Install the tools

| Tool | Version | Why we need it |
|------|---------|----------------|
| Node.js | 22 LTS or 24 LTS (at least 20.19) | Runs the app |
| Git | any | Downloads the code |
| MySQL or MariaDB | MySQL 8 or MariaDB 10.4+ | Stores the data |

### Windows

1. **Node.js**: download the LTS installer from https://nodejs.org, or run:
   ```powershell
   winget install OpenJS.NodeJS.LTS
   ```
2. **Git**: download from https://git-scm.com, or run:
   ```powershell
   winget install Git.Git
   ```
3. **MySQL**: the easiest way is **XAMPP** (https://www.apachefriends.org).
   Install it, open the **XAMPP Control Panel**, and click **Start** next to **MySQL**.

### macOS

Using Homebrew (https://brew.sh):

```bash
brew install node git mysql
brew services start mysql
```

You can also use XAMPP for macOS instead of Homebrew MySQL.

### Linux (Ubuntu / Debian)

```bash
sudo apt update
sudo apt install git mysql-server
sudo systemctl start mysql
```

For Node.js, the version from `apt` is often too old. Install the LTS version from https://nodejs.org
or with nvm (https://github.com/nvm-sh/nvm):

```bash
nvm install --lts
```

### Check that everything is installed

Open a new terminal and run:

```bash
node -v
npm -v
git --version
```

`node -v` should print v20.19 or newer (v22 or v24 is best).

---

## Step 2. Download the code

```bash
git clone https://github.com/FranzGhericAller/IP-Project-StudyPlanner-Group3.git
cd IP-Project-StudyPlanner-Group3
```

---

## Step 3. Install the packages

```bash
npm install
```

This downloads everything listed in `package.json` into the `node_modules` folder.
It also runs `prisma generate`, which creates the database client in `lib/generated`.

---

## Step 4. Create an empty database

Create a database named **studyplanner**. Pick one way:

**Option A: phpMyAdmin (XAMPP)**
Open http://localhost/phpmyadmin, click **New**, type `studyplanner`, and click **Create**.

**Option B: command line**

```bash
mysql -u root -p -e "CREATE DATABASE studyplanner;"
```

On Windows with XAMPP, the command is in `C:\xampp\mysql\bin`:

```powershell
C:\xampp\mysql\bin\mysql.exe -u root -e "CREATE DATABASE studyplanner;"
```

> **Linux note:** on Ubuntu, the MySQL root user can only log in with `sudo`.
> Create a separate user for the app:
> ```bash
> sudo mysql -e "CREATE DATABASE studyplanner; CREATE USER 'planner'@'localhost' IDENTIFIED BY 'planner123'; GRANT ALL ON studyplanner.* TO 'planner'@'localhost';"
> ```
> Then use `mysql://planner:planner123@localhost:3306/studyplanner` in the next step.

---

## Step 5. Create the `.env` file

The `.env` file holds your private settings. It is never uploaded to GitHub.
Copy the example file:

| System | Command |
|--------|---------|
| Windows (PowerShell) | `Copy-Item .env.example .env` |
| Windows (Command Prompt) | `copy .env.example .env` |
| macOS / Linux | `cp .env.example .env` |

Open `.env` in any text editor and fill in two values:

**1. `DATABASE_URL`**, the address of your database. The format is
`mysql://USER:PASSWORD@HOST:PORT/DATABASE`.

| Your setup | Value |
|------------|-------|
| XAMPP (user root, no password) | `mysql://root:@localhost:3306/studyplanner` |
| MySQL with a root password | `mysql://root:YOURPASSWORD@localhost:3306/studyplanner` |
| Linux user from Step 4 | `mysql://planner:planner123@localhost:3306/studyplanner` |

If the password has special characters, replace them (for example `@` becomes `%40`).

**2. `AUTH_SECRET`**, a random secret used to protect the login cookie. Generate one:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Copy the printed text and paste it after `AUTH_SECRET=`.

Your `.env` should look like this (your secret will be different):

```
DATABASE_URL="mysql://root:@localhost:3306/studyplanner"
AUTH_SECRET="pasteTheGeneratedTextHere"
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
```

---

## Step 6. Create the tables

```bash
npx prisma migrate deploy
```

This runs the SQL files in `prisma/migrations` and creates all the tables in `studyplanner`.
You should see **"All migrations have been successfully applied."**

---

## Step 7. Start the app

```bash
npm run dev
```

Open **http://localhost:3000** in your browser.

To confirm the API can reach the database, open **http://localhost:3000/api/health**.
You should see:

```json
{ "ok": true, "database": "connected", "users": 0 }
```

Click **Register**, create an account, and you will land on the dashboard.

To stop the app, press **Ctrl + C** in the terminal.

---

## Every time after the first setup

1. Start MySQL (XAMPP Control Panel, `brew services start mysql`, or `sudo systemctl start mysql`).
2. Open a terminal in the project folder.
3. Run `npm run dev`.
4. Open http://localhost:3000.

---

## Useful commands

| Command | What it does |
|---------|--------------|
| `npm run dev` | Starts the app in development mode |
| `npm run build` then `npm start` | Builds and runs the faster production version |
| `npm run lint` | Checks the code for mistakes |
| `npx prisma migrate deploy` | Creates or updates the tables |
| `npx prisma studio` | Opens a simple website to view and edit the tables |

---

## Problems and fixes

| Problem | Fix |
|---------|-----|
| `/api/health` shows `"database": "not reachable"` | MySQL is not running, or `DATABASE_URL` in `.env` is wrong. |
| `Unknown database 'studyplanner'` | Do Step 4 (create the database). |
| `Table '...' doesn't exist` | Do Step 6 (`npx prisma migrate deploy`). |
| Login does nothing or shows a "MissingSecret" error | `AUTH_SECRET` is empty in `.env`. Fill it in and restart `npm run dev`. |
| `Cannot find module '@/lib/generated/prisma/client'` | Run `npx prisma generate`. |
| `Port 3000 is in use` | Run `npm run dev -- --port 3001` and open http://localhost:3001. |
| Windows Security blocks the dev server, or it is very slow | Run `npx next dev --webpack` instead of `npm run dev`. |
| `Access denied for user 'root'@'localhost'` | The user or password in `DATABASE_URL` is wrong. |
| Terminal shows `[auth][error] CredentialsSignin` | This is normal. It only means someone typed a wrong password. |
| You changed `.env` but nothing changed | Stop the app (Ctrl + C) and run `npm run dev` again. |
