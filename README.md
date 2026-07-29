# AS-Teamet Backend

A simple Node.js + Express + MongoDB (Atlas) backend with JWT auth, and
CRUD for users, clients, and tasks.

## 1. Install Node.js

You need Node.js installed (v18 or newer). Check with:
```
node -v
```
If you don't have it, download from https://nodejs.org (LTS version).

## 2. Install dependencies

Open a terminal in this folder and run:
```
npm install
```
This reads `package.json` and downloads express, mongoose, jsonwebtoken, etc.
into a `node_modules` folder.

## 3. Set up your environment variables

Copy the example file:
```
cp .env.example .env
```
Then open `.env` in a text editor and fill in:

- `MONGO_URI` — your Atlas connection string, with `<db_password>` replaced
  by your real database user password. Example:
  ```
  mongodb+srv://admin-shimanto:YourRealPassword@as-teamet-cluster.pdf1k8h.mongodb.net/as-teamet?appName=AS-Teamet-Cluster
  ```
  Note the `/as-teamet` before the `?` — that names the database. Without
  it, MongoDB will use a database called `test`.
- `JWT_SECRET` — any long random string, used to sign login tokens. Generate
  one with:
  ```
  node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
  ```
- `SEED_ADMIN_*` — the first admin account's login details (change the
  default password!).

**Important:** never commit `.env` to git or share it. It's already listed
in `.gitignore`.

## 4. Import your existing data (optional)

If you want your existing `users`, `tasks`, and `clients` JSON files loaded
into Atlas, use `mongoimport` (comes with MongoDB tools) or MongoDB
Compass's "Import Data" button, pointing at the same database name you put
in `MONGO_URI`.

Two things to note about your existing data:
- Your `users.json` employees don't have a `password` field yet (only the
  admin does). You'll set passwords for them using the signup route below,
  or add a `password` field manually before importing.
- Your `tasks.json` doesn't have `startDate`/`endDate` fields, which this
  backend needs for the "tasks in a month/range" feature and for the
  employee-editable fields you asked for. Add those fields to each task
  document before importing, or just create new tasks through the API.

## 5. Create the first admin account

```
npm run seed:admin
```
This creates one admin user using the `SEED_ADMIN_*` values from your `.env`.
You only need to run this once. After that, this admin can create every
other user through the API.

## 6. Start the server

```
npm start
```
or, if you installed `nodemon` and want it to auto-restart on file changes:
```
npm run dev
```
You should see:
```
MongoDB connected: ...
Server running on port 5000
```
Visit `http://localhost:5000` in a browser — you should see a small JSON
message confirming the API is running.

## 7. Test it with curl (or Postman/Insomnia)

### Log in as admin
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"employeeId":"ADM001","password":"ChangeMe123!"}'
```
Copy the `token` from the response — you'll pass it as
`Authorization: Bearer <token>` on every request below.

### Create an employee (admin only)
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -d '{"name":"John Larsen","employeeId":"EMP001","role":"employee","speciality":"Moving & Transport","address":"Sidevej 5, 2000 Frederiksberg","phone":"+45 87654321","password":"Welcome123!"}'
```

### Employee logs in
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"employeeId":"EMP001","password":"Welcome123!"}'
```

### Create a client (admin only)
```bash
curl -X POST http://localhost:5000/api/clients \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -d '{"name":"IKEA Denmark","address":"Tåstrupvej 10, 2630 Taastrup","phone":"+45 70123456"}'
```
Copy the returned `_id` — you'll use it as the `client` field on tasks.

### Create a task (admin only)
```bash
curl -X POST http://localhost:5000/api/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -d '{
    "taskType":"cleaning",
    "numEmployees":2,
    "description":"Deep clean office after renovation. 400 sqm.",
    "client":"<CLIENT_ID>",
    "assignedEmployees":["<EMPLOYEE_MONGO_ID>"],
    "startDate":"2026-07-28",
    "endDate":"2026-07-29",
    "status":"pending"
  }'
```

### Get tasks for a month
```bash
curl "http://localhost:5000/api/tasks?month=2026-07" \
  -H "Authorization: Bearer <TOKEN>"
```

### Get tasks in a date range
```bash
curl "http://localhost:5000/api/tasks?startDate=2026-07-01&endDate=2026-07-15" \
  -H "Authorization: Bearer <TOKEN>"
```

### Get only my assigned tasks
```bash
curl "http://localhost:5000/api/tasks?mine=true" \
  -H "Authorization: Bearer <EMPLOYEE_TOKEN>"
```

### Employee updates only start/end/status on their assigned task
```bash
curl -X PATCH http://localhost:5000/api/tasks/<TASK_ID>/progress \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <EMPLOYEE_TOKEN>" \
  -d '{"status":"completed"}'
```
If the employee tries to change `taskType`, `client`, etc. through this
route, those fields are silently ignored (the route only reads
`startDate`, `endDate`, `status` from the body).

### Any user updates their own profile
```bash
curl -X PATCH http://localhost:5000/api/users/me \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"phone":"+45 00000000","address":"New address 1, 1000 København"}'
```

## API summary

| Method | Route | Who | Purpose |
|---|---|---|---|
| POST | /api/auth/login | anyone | log in, get JWT |
| POST | /api/auth/signup | admin | create a new user |
| GET | /api/users | admin | list all users |
| GET | /api/users/me | any logged-in user | view own profile |
| PATCH | /api/users/me | any logged-in user | edit own profile |
| GET/PATCH/DELETE | /api/users/:id | admin | manage any user |
| POST/GET/PATCH/DELETE | /api/clients | admin write, any logged-in user read | manage clients |
| POST | /api/tasks | admin | create task |
| GET | /api/tasks | any logged-in user | list tasks, filter by `month`, `startDate`+`endDate`, `status`, `mine` |
| GET | /api/tasks/:id | any logged-in user | task detail |
| PATCH | /api/tasks/:id | admin | full task update |
| PATCH | /api/tasks/:id/progress | assigned employee or admin | update only `startDate`, `endDate`, `status` |
| POST | /api/tasks/:id/hours | assigned employee or admin | log worked hours |
| POST | /api/tasks/:id/photos | assigned employee or admin | attach a photo URL |
| DELETE | /api/tasks/:id | admin | delete task |

## Things worth adding later (not included yet, kept this MVP simple)

- **Photo uploads**: right now `/api/tasks/:id/photos` just stores a URL
  string you already have (e.g. from a file host). Real file uploads from
  a phone/browser would need something like `multer` + cloud storage (S3,
  Cloudinary) — happy to add this next.
- **Password reset / forgot password** flow (currently only an admin can
  reset a user's password via `PATCH /api/users/:id`).
- **Rate limiting** and **helmet** for basic production hardening.
- **Input validation library** (e.g. `zod` or `joi`) for stricter checks
  than the manual ones here.
- **Refresh tokens** — right now the JWT just expires after `JWT_EXPIRES_IN`
  and the user has to log in again.
- **Pagination** on `GET /api/tasks` and `GET /api/users` once your data
  grows.
