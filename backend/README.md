# 📼 MixTape — Digital Cassette Creator

> *Rewind to the golden age of mixtapes. Curate your perfect playlist, design your cassette, and share it with a single code — no Spotify required.*

MixTape is a full-stack nostalgia engine. It lets you hand-pick songs, choose a cassette shell design (TDK black, retro amber, crystal clear, pink glitter), and generate a shareable tape that anyone can add to their own shelf using a unique `MX-XXXX` code. A built-in Walkman player streams 30-second previews so the vibe is always on.

---

## ✨ Features

- 🎨 **Four cassette designs** — TDK Black, Retro Orange, Crystal Clear, Pink Glitter
- 🔍 **Real music search** — powered by the iTunes Search API (no API key required)
- 💾 **Persistent shelf** — save tapes to MongoDB, retrieve them anywhere
- 🔗 **Shareable codes** — every tape gets a unique `MX-XXXX` identifier
- 📼 **Walkman player** — animated reels, LCD track display, 30-sec iTunes previews
- 🖼️ **Image export** — download your tape as a square (1:1) or Story (9:16) PNG
- 📋 **Liner card** — handwritten-style tracklist that updates live as you build

---

## 🗂️ Project Architecture

This project is organized as a **monorepo** with a clean separation between the UI layer and the server layer.

```
mixtape/
│
├── frontend/
│   └── index.html          # Entire SPA — HTML, CSS, and JS in one file
│                           # Served as a static asset by Express
│
└── backend/
    ├── server.js           # Express entry point
    ├── Procfile            # Railway / Heroku process declaration
    ├── .env                # Secret config (never committed)
    ├── .env.example        # Safe template for onboarding
    │
    ├── config/
    │   └── db.js           # MongoDB Atlas connection via Mongoose
    │
    ├── models/
    │   ├── Mixtape.js      # Schema: tape design, tracklist, share code
    │   └── Collection.js   # Schema: per-user shelf of collected tapes
    │
    ├── routes/
    │   ├── health.js       # GET  /api/health
    │   ├── search.js       # GET  /api/search  (iTunes proxy)
    │   ├── tapes.js        # CRUD /api/tapes
    │   ├── collections.js  # CRUD /api/collections
    │   └── exports.js      # POST /api/exports  (image storage)
    │
    ├── middleware/
    │   ├── errorHandler.js # Global error formatting
    │   └── rateLimiter.js  # express-rate-limit (100 req / 15 min)
    │
    └── utils/
        └── codeGenerator.js # Unique MX-XXXX collision-safe generator
```

### Why a monorepo?

The frontend is a single `index.html` file — no build step, no bundler. Express serves it directly via `express.static('../frontend')`, which means one deploy target, zero CORS configuration in production, and a dead-simple mental model for an MVP.

---

## 🛠️ Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Frontend | Vanilla HTML / CSS / JS | No build tooling needed for MVP; ships instantly |
| Backend | Node.js + Express | Matches JS frontend; fast to iterate |
| Database | MongoDB Atlas + Mongoose | Flexible document model fits tape JSON naturally |
| Music API | **iTunes Search API** | Free, keyless, returns metadata + 30-sec preview URLs |
| Fonts | Google Fonts (Caveat, Special Elite) | Handwritten and typewriter aesthetics |
| Security | Helmet.js + express-rate-limit | CSP headers + basic abuse protection |
| Hosting | Railway.app | Free-tier Node.js deploy, one-command CLI |

> **A note on the music API:** This project was originally scoped with the Spotify Web API. During development we pivoted to the **iTunes Search API** — it requires zero authentication (no `CLIENT_ID`, no OAuth flow, no token refresh), returns identical metadata (track name, artist, album art, preview URL), and has no usage dashboard to manage. For an MVP focused on UX rather than auth plumbing, it's the right call.

---

## 📡 API Reference

Base URL (local): `http://localhost:3001`

---

### `GET /api/health`

Server and database status check.

**Response**
```json
{
  "success": true,
  "status": "ok",
  "db": "connected",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "env": "development"
}
```

---

### `GET /api/search?q={query}`

Search for songs by title or artist. Proxies the public **iTunes Search API** — no API key required. Originally designed as a Spotify endpoint (`/api/spotify/search`), this was refactored to `/api/search` during the iTunes pivot.

**Query Parameters**

| Param | Type | Required | Description |
|---|---|---|---|
| `q` | string | ✅ | Search term (song title, artist name) |
| `limit` | number | ❌ | Results to return. Default `10`, max `25` |

**Example Request**
```
GET /api/search?q=kate+bush&limit=5
```

**Example Response**
```json
{
  "success": true,
  "results": [
    {
      "id": "203709340",
      "itunesTrackId": 203709340,
      "title": "Running Up That Hill",
      "artist": "Kate Bush",
      "album": "Hounds of Love",
      "albumArtUrl": "https://is1-ssl.mzstatic.com/image/thumb/...300x300bb.jpg",
      "previewUrl": "https://audio-ssl.itunes.apple.com/...preview.m4a",
      "trackViewUrl": "https://music.apple.com/us/album/...",
      "durationMs": 300000
    }
  ]
}
```

**Error Responses**

| Status | Reason |
|---|---|
| `400` | Missing or empty `q` parameter |
| `400` | Query exceeds 100 characters |
| `504` | iTunes API timed out (8s timeout) |

---

### `POST /api/tapes`

Save a finished mixtape to the database. Returns the tape object with its generated `MX-XXXX` share code.

**Request Body**
```json
{
  "title": "Awesome Mix Vol. 1",
  "design": "tdk",
  "sides": 2,
  "tracksA": [
    {
      "itunesTrackId": 203709340,
      "title": "Running Up That Hill",
      "artist": "Kate Bush",
      "album": "Hounds of Love",
      "albumArtUrl": "https://...",
      "previewUrl": "https://...",
      "durationMs": 300000
    }
  ],
  "tracksB": [],
  "createdBy": "user_abc123"
}
```

**Design values:** `"tdk"` · `"retro"` · `"clear"` · `"glitter"`

**Validation rules:**
- `title` is required, max 60 characters
- `tracksA` must have at least 1 track, max 10
- `tracksB` max 10 tracks
- `sides` must be `1` or `2`

**Example Response** `201 Created`
```json
{
  "success": true,
  "tape": {
    "_id": "64f1a2b3c4d5e6f7a8b9c0d1",
    "code": "MX-4F2K",
    "title": "Awesome Mix Vol. 1",
    "design": "tdk",
    "sides": 2,
    "tracksA": [...],
    "tracksB": [],
    "createdBy": "user_abc123",
    "playCount": 0,
    "isPublic": true,
    "createdAt": "2025-01-15T10:30:00.000Z"
  }
}
```

---

### `GET /api/tapes/:code`

Fetch a tape by its share code. Used when redeeming a code someone sent you.

**Example Request**
```
GET /api/tapes/MX-4F2K
```

**Example Response** `200 OK`
```json
{
  "success": true,
  "tape": {
    "code": "MX-4F2K",
    "title": "Awesome Mix Vol. 1",
    "tracksA": [...],
    "playCount": 12,
    ...
  }
}
```

**Error Responses**

| Status | Reason |
|---|---|
| `404` | No public tape found with that code |

---

### `PATCH /api/tapes/:code/play`

Increment the play count for a tape. Called automatically by the frontend Walkman player each time a tape is loaded.

**Example Request**
```
PATCH /api/tapes/MX-4F2K/play
```

**Example Response** `200 OK`
```json
{
  "success": true,
  "playCount": 13
}
```

---

### `DELETE /api/tapes/:code`

Permanently delete a tape. The requesting `userId` must match `tape.createdBy`.

**Request Body**
```json
{ "userId": "user_abc123" }
```

| Status | Reason |
|---|---|
| `200` | Deleted successfully |
| `403` | `userId` does not match tape owner |
| `404` | Tape not found |

---

### `GET /api/collections/:userId`

Return all tapes in a user's shelf, with full tape data hydrated.

---

### `POST /api/collections/:userId/add`

Add a tape to a user's shelf by share code.

**Request Body**
```json
{ "tapeCode": "MX-4F2K" }
```

| Status | Reason |
|---|---|
| `201` | Added to shelf |
| `404` | Code doesn't exist or tape is private |
| `409` | Already in this user's collection |

---

### `DELETE /api/collections/:userId/:code`

Remove a tape from a shelf. Does **not** delete the tape from the database — only removes it from this user's view.

---

## ⚙️ Setup & Installation

### Prerequisites

- Node.js `>= 18.0.0`
- A [MongoDB Atlas](https://www.mongodb.com/atlas) account (free tier works)
- No other accounts or API keys required

---

### 1. Clone the repository

```bash
git clone https://github.com/your-username/mixtape.git
cd mixtape
```

### 2. Install backend dependencies

```bash
cd backend
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in your values:

```bash
PORT=3001
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/mixtape
FRONTEND_URL=http://localhost:3001
NODE_ENV=development
```

> **Getting your `MONGODB_URI`:** In MongoDB Atlas → your cluster → **Connect** → **Drivers** → copy the connection string. Replace `<password>` with your database user's password.

### 4. Run the development server

```bash
npm run dev
```

The server starts on `http://localhost:3001`. Express serves both the API and the frontend from a single process — open your browser to that address and the app loads immediately.

### 5. Verify everything is working

```bash
curl http://localhost:3001/api/health
# → { "status": "ok", "db": "connected" }

curl "http://localhost:3001/api/search?q=david+bowie"
# → { "success": true, "results": [...] }
```

---

## 🌐 Deployment (Railway)

```bash
# Install Railway CLI
npm install -g @railway/cli

# From /backend
railway login
railway init
railway up
```

Then in the Railway dashboard → **Variables**, add:

```
PORT            = 3001
MONGODB_URI     = mongodb+srv://...
FRONTEND_URL    = https://your-app.up.railway.app
NODE_ENV        = production
```

Finally, in **MongoDB Atlas → Network Access**, allow `0.0.0.0/0` so Railway's dynamic IPs can connect.

---

## 🗺️ Roadmap

The following features are planned for future iterations:

### 🎵 Spotify Playlist Export
Allow users to export any saved mixtape directly to a Spotify playlist. The track metadata (artist + title) is already stored — the implementation requires Spotify's Authorization Code OAuth flow so the app can call `POST /v1/playlists` on the user's behalf.

### 🖼️ Server-Side Image Sharing (Puppeteer)
Generate high-fidelity shareable images on the backend using Puppeteer. A headless browser renders the cassette HTML/CSS at 2× resolution and outputs a PNG, enabling proper Open Graph preview images when a tape link is shared on social media. This replaces the current `html2canvas` client-side approach for production quality and consistency across devices.

### 🔐 User Authentication
Integrate [Clerk.dev](https://clerk.dev) for social login (Google, Apple). Replaces the current `"anonymous"` `createdBy` value with real user identities, enabling private tapes, creator attribution, and per-user shelf persistence across devices.

### 🌍 Public Tape Feed
A browsable gallery of public tapes, sortable by play count, date, or design. Endpoint: `GET /api/tapes?sort=popular&page=1`.

### 🎨 Tape Customization
Custom label colors, sticker overlays, handwritten notes, and transparent/glow-in-the-dark shell variants — all handled client-side with CSS variables and canvas compositing, no backend changes required.

---

## 📁 Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `PORT` | ❌ | Server port. Defaults to `3001` |
| `MONGODB_URI` | ✅ | MongoDB Atlas connection string |
| `FRONTEND_URL` | ✅ | Allowed CORS origin (`http://localhost:3001` in dev) |
| `NODE_ENV` | ❌ | `development` or `production` |

---

## 📄 License

MIT — do whatever you want with it. Make someone a mixtape.
