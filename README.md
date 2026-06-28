# Task Tracker — MERN Stack

A full-stack Task Tracker application built with MongoDB, Express.js, React, and Node.js.

---

## Project Structure

```
task-tracker/
├── backend/
│   ├── models/Task.js        # Mongoose schema
│   ├── routes/tasks.js       # REST API routes
│   ├── server.js             # Express entry point
│   ├── .env.example          # Environment variable template
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── TaskForm.jsx   # Create / Edit form
    │   │   ├── TaskCard.jsx   # Task display card
    │   │   └── FilterBar.jsx  # Status & priority filters
    │   ├── App.jsx            # Root component
    │   ├── main.jsx           # React entry point
    │   └── index.css          # Global styles
    ├── index.html
    ├── vite.config.js         # Includes /api proxy for dev
    ├── .env                   # VITE_API_URL=/api (included)
    ├── .env.example
    └── package.json
```

---

## Features

- ✅ Full CRUD — Create, Read, Update, Delete tasks
- ✅ Form validation (frontend + Mongoose schema)
- ✅ REST API with proper HTTP status codes
- ✅ MongoDB integration via Mongoose
- ✅ Responsive UI (mobile + desktop)
- ✅ Dynamic updates without page refresh (axios + React state)
- ✅ Filter tasks by status and priority
- ✅ Toast notifications
- ✅ Overdue task detection (timezone-aware for IST)
- ✅ Priority color indicators
- ✅ Global error-handling middleware
- ✅ ObjectId validation on all routes

---

## API Endpoints

| Method | Endpoint              | Description                          |
|--------|-----------------------|--------------------------------------|
| GET    | /api/tasks            | Get all tasks (supports filters)     |
| GET    | /api/tasks/:id        | Get single task                      |
| POST   | /api/tasks            | Create new task                      |
| PUT    | /api/tasks/:id        | Update task                          |
| DELETE | /api/tasks/:id        | Delete task                          |

Query params for GET /api/tasks: `?status=pending&priority=high`

---

## Local Setup (One-Go)

### Prerequisites
- Node.js v18+
- MongoDB Atlas account (free tier works)

### Step 1 — MongoDB Atlas
1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free cluster
3. Database Access → add a user with username + password
4. Network Access → Add IP `0.0.0.0/0`
5. Connect → Drivers → copy connection string

### Step 2 — Backend
```bash
cd backend
npm install
# The .env is already configured — replace MONGO_URI with your Atlas URI
# FRONTEND_URL defaults to http://localhost:5173 (no change needed for local dev)
npm run dev
```
Backend runs on http://localhost:5000

### Step 3 — Frontend
```bash
cd frontend
npm install
# .env is already set to VITE_API_URL=/api
# Vite proxy forwards /api → http://localhost:5000 automatically — no CORS issues
npm run dev
```
Frontend runs on http://localhost:5173

Open http://localhost:5173 — everything works in one go! ✅

---

## Deployment

### Backend → Render
1. Push `backend/` to GitHub
2. New Web Service on https://render.com
3. Build Command: `npm install`
4. Start Command: `npm start`
5. Add env vars:
   - `MONGO_URI` = your Atlas URI
   - `FRONTEND_URL` = your Vercel frontend URL (e.g. https://task-tracker.vercel.app)
6. Copy the live URL (e.g. https://task-tracker-api.onrender.com)

### Frontend → Vercel
1. Push `frontend/` to GitHub
2. New Project on https://vercel.com
3. Framework: Vite | Root: `frontend`
4. Add env var: `VITE_API_URL` = `https://your-render-url.onrender.com/api`
5. Deploy

---

## Bug Fixes Applied

| # | Location | Bug | Fix |
|---|----------|-----|-----|
| 1 | backend/server.js | No global error-handling middleware; DB crash silently hung | Added `app.use(err, req, res, next)` middleware + `process.exit(1)` on DB fail |
| 2 | backend/server.js | `process.exit` missing on fatal DB connection error | Fixed |
| 3 | backend/routes/tasks.js | Invalid MongoDB ObjectId caused unhandled CastError → 500 | Added `mongoose.Types.ObjectId.isValid()` guard on all `:id` routes |
| 4 | frontend/App.jsx | Catch blocks swallowed actual errors; no console logging | Added `console.error()` and surfaced `err.response?.data?.message` |
| 5 | frontend/App.jsx | Filter change left stale tasks visible until fetch completed | Added `setTasks([])` at start of `fetchTasks` |
| 6 | frontend/TaskForm.jsx | `INITIAL` was a shared object ref; same-task re-edit didn't reset form | Changed to `getInitial()` function + fixed `useEffect` deps |
| 7 | frontend/TaskCard.jsx | Date comparison was UTC vs local time — tasks due today showed as overdue in IST | Switched to `YYYY-MM-DD` string comparison; added `timeZone: 'Asia/Kolkata'` to `formatDate` |
| 8 | frontend/vite.config.js | No dev proxy — required backend CORS workaround | Added `server.proxy` for `/api` → `localhost:5000` |
| 9 | backend/server.js | `cors()` with no options allowed all origins | Restricted to `FRONTEND_URL` env variable |
| 10 | frontend/App.jsx | Deleting a task being edited left stale `editTask` in state | Added check in `handleDelete` to clear `editTask` if it matches deleted id |
| 11 | frontend/ | No `.env` file shipped, only `.env.example` | Added `.env` with `VITE_API_URL=/api` |
| 12 | backend/routes/tasks.js | PUT passed raw `req.body` including `_id` → Mongoose ImmutableField error | Destructured and stripped `_id`, `__v`, timestamps before update |

---

## Tech Stack

| Layer     | Technology          |
|-----------|---------------------|
| Frontend  | React 18 + Vite     |
| Backend   | Node.js + Express   |
| Database  | MongoDB + Mongoose  |
| HTTP      | Axios               |
| Deploy    | Render + Vercel     |
