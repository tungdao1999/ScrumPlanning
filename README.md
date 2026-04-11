# Scrum Planning Poker

A real-time Planning Poker app for agile teams, built with the MERN stack and Socket.IO.

---

## Features

- **Create or join sessions** with a shareable 6-character code
- **Roles**: Scrum Master (SM) and Developer — multiple admins supported
- **Real-time voting** — cards are hidden until the SM reveals them
- **Lucky Round** — randomly pick a developer when the team can't decide; SM is excluded
- **Quick Assign (⚡ Assign)** — SM/admin can directly set story points and owner without a vote
- **Story management** — add, edit, delete, and reorder user stories; stories marked done only when both points and owner are set
- **Notes panel** — shared session notes visible to all members
- **Team panel** — live online/offline status for all participants
- **Persistent identity** — user name and last session stored in `localStorage`

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite 5, React Router 6, Socket.IO-client 4, Axios |
| Backend | Node.js, Express 4, Socket.IO 4 |
| Database | MongoDB + Mongoose 8 |

---

## Project Structure

```
/
├── client/                  # React frontend (Vite)
│   ├── src/
│   │   ├── components/      # poker, userstory, team, notes, luckyround, common
│   │   ├── context/         # SessionContext, SocketContext
│   │   ├── pages/           # Home, JoinSession, Session, NotFound
│   │   └── services/        # api.js (Axios)
│   ├── .env                 # local overrides (gitignored)
│   ├── .env.development     # dev values (gitignored)
│   ├── .env.production      # prod values — fill before build (gitignored)
│   └── .env.example         # template — safe to commit
└── server/                  # Express + Socket.IO backend
    ├── src/
    │   ├── config/          # database connection
    │   ├── controllers/     # session, story controllers
    │   ├── middleware/       # error handler
    │   ├── models/          # Session, UserStory schemas
    │   ├── routes/          # /api/sessions, /api/stories
    │   └── socket/          # socketHandler (all real-time events)
    ├── .env                 # secrets (gitignored)
    ├── .env.example         # template — safe to commit
    └── server.js            # entry point
```

---

## Getting Started (Local Development)

### Prerequisites

- Node.js 18+
- MongoDB running locally on port `27017`

### 1. Clone the repo

```bash
git clone <repo-url>
cd Srumplanning
```

### 2. Set up the server

```bash
cd server
cp .env.example .env   # then edit .env if needed
npm install
npm run dev            # starts on http://localhost:5000
```

Default server `.env`:

```
PORT=5000
MONGO_URI=mongodb://localhost:27017/scrumplanning
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

### 3. Set up the client

```bash
cd client
npm install
npm run dev            # starts on http://localhost:5173
```

`.env.development` is loaded automatically — no changes needed for local dev.

---

## Environment Variables

### Server (`server/.env`)

| Variable | Default | Description |
|---|---|---|
| `PORT` | `5000` | Port the Express server listens on |
| `MONGO_URI` | `mongodb://localhost:27017/scrumplanning` | MongoDB connection string |
| `CLIENT_URL` | `http://localhost:5173` | Frontend origin (for CORS) |
| `NODE_ENV` | `development` | `development` or `production` |

### Client (`client/.env.development` / `client/.env.production`)

| Variable | Description |
|---|---|
| `VITE_SERVER_URL` | Socket.IO server URL |
| `VITE_API_BASE_URL` | REST API base URL (e.g. `https://your-backend.railway.app/api`) |

---

## Deployment (Railway + Vercel + MongoDB Atlas)

### 1. Database — MongoDB Atlas

1. Create a free cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Add a database user and whitelist `0.0.0.0/0`
3. Copy the connection string — you'll need it for the server env

### 2. Backend — Railway

1. Push the repo to GitHub
2. Create a new Railway project → **Deploy from GitHub repo**
3. Set the root directory to `server/`
4. Add environment variables in Railway:
   ```
   NODE_ENV=production
   PORT=5000
   MONGO_URI=<your Atlas connection string>
   CLIENT_URL=https://your-frontend.vercel.app
   ```
5. Railway auto-detects Node.js and runs `npm start`

### 3. Frontend — Vercel

1. Create a new Vercel project → import the same GitHub repo
2. Set the root directory to `client/`
3. Add environment variables in Vercel:
   ```
   VITE_SERVER_URL=https://your-backend.railway.app
   VITE_API_BASE_URL=https://your-backend.railway.app/api
   ```
4. Vercel runs `npm run build` automatically

> The `client/.env.production` file in the repo contains placeholder URLs. Real values are set via your hosting provider's env var UI — never commit secrets.

---

## Scripts

### Server

| Command | Description |
|---|---|
| `npm run dev` | Start with nodemon (auto-reload) |
| `npm start` | Start without nodemon |
| `npm run prod` | Start in production mode |

### Client

| Command | Description |
|---|---|
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview the production build locally |
