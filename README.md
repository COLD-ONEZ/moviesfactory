# 🎬 Cineflix

A production-ready Netflix-style movie & series streaming/download platform.  
**Auto-syncs with BuzzHeavier** · TMDB & TVMaze metadata · Full Admin Panel · Vercel-ready.

---

## ✨ Features

- 🔄 **Auto BuzzHeavier sync** — scans folders, parses filenames, populates DB
- 🎬 **Movies & Series** — multi-language, multi-quality download links
- 🗑 **Auto-deletion sync** — removes files/episodes/seasons/titles when deleted from BuzzHeavier
- 🔍 **Search** — across movies, series, genres
- 📋 **Content requests** — users can request new content
- 🛡 **Admin panel** — dashboard, movie/series management, sync logs, request management
- 🌐 **TMDB + TVMaze** — automatic metadata fetching
- 📱 **Responsive** — mobile-first Netflix-style dark UI

---

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/yourusername/cineflix.git
cd cineflix
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/cineflix
JWT_SECRET=your-super-secret-key-min-32-chars
BUZZHEAVIER_API_KEY=your-buzzheavier-api-key
BUZZHEAVIER_FOLDER_ID=folder_id_1,folder_id_2
TMDB_API_KEY=your-tmdb-v3-api-key
CRON_SECRET=your-random-cron-secret
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Seed Admin User

```bash
MONGODB_URI="your-uri" npx ts-node scripts/seed-admin.ts
```

Default credentials:
- **Email:** admin@cineflix.com
- **Password:** Admin@123456
- ⚠️ Change after first login!

### 4. Run Dev Server

```bash
npm run dev
```

Visit `http://localhost:3000`  
Admin panel: `http://localhost:3000/admin`

---

## 📁 Project Structure

```
cineflix/
├── src/
│   ├── app/
│   │   ├── api/              # All API routes
│   │   │   ├── movies/       # Public movie endpoints
│   │   │   ├── series/       # Public series endpoints
│   │   │   ├── featured/     # Featured content for hero
│   │   │   ├── search/       # Search endpoint
│   │   │   ├── sync/         # Cron-triggered sync
│   │   │   ├── requests/     # User content requests
│   │   │   ├── cron/         # Vercel cron handler
│   │   │   └── admin/        # Protected admin endpoints
│   │   ├── admin/            # Admin panel pages
│   │   │   ├── login/
│   │   │   ├── movies/
│   │   │   ├── series/
│   │   │   ├── sync/
│   │   │   └── requests/
│   │   ├── layout.tsx
│   │   ├── page.tsx          # Home (SSR)
│   │   └── globals.css
│   ├── components/
│   │   └── CineflixClient.tsx  # Full client UI
│   ├── lib/
│   │   ├── db/connect.ts     # MongoDB connection
│   │   ├── services/
│   │   │   ├── syncEngine.ts       # BuzzHeavier sync logic
│   │   │   ├── buzzheavier.ts      # BuzzHeavier API client
│   │   │   ├── filenameParser.ts   # Smart filename parser
│   │   │   ├── tmdb.ts             # TMDB API client
│   │   │   └── tvmaze.ts           # TVMaze API client
│   │   └── utils/auth.ts     # JWT auth helpers
│   ├── models/               # Mongoose models
│   │   ├── Movie.ts
│   │   ├── Series.ts
│   │   ├── File.ts
│   │   └── Admin.ts          # Admin + SyncLog + ContentRequest
│   └── types/index.ts
├── scripts/seed-admin.ts
├── vercel.json               # Cron config
├── .env.example
└── next.config.ts
```

---

## 🔧 Environment Variables

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Secret for JWT signing (min 32 chars) |
| `BUZZHEAVIER_API_KEY` | Your BuzzHeavier API key |
| `BUZZHEAVIER_FOLDER_ID` | Comma-separated folder IDs to sync |
| `TMDB_API_KEY` | TMDB v3 API key (free at themoviedb.org) |
| `CRON_SECRET` | Random secret to protect cron endpoint |
| `NEXT_PUBLIC_APP_URL` | Your app URL (for SSR fetches) |

---

## 📂 Filename Format

The parser auto-detects movie/series from filename:

**Movies:**
```
John.Wick.4.2023.1080p.Hindi.mkv
Dune.Part.Two.2024.720p.English.mp4
Oppenheimer.2023.4K.Multi.Audio.mkv
```

**Series:**
```
Daredevil.Born.Again.S01E01.1080p.Hindi.mkv
Loki.S02E03.720p.English.mp4
Breaking.Bad.S01E05.480p.Tamil.mkv
```

**Supported Qualities:** 480p · 720p · 1080p · 2160p · 4K  
**Supported Languages:** English · Hindi · Tamil · Malayalam · Telugu · Kannada · Multi Audio

---

## 🌐 Deploying to Vercel

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/youruser/cineflix.git
git push -u origin main
```

### 2. Import to Vercel

1. Go to [vercel.com](https://vercel.com) → New Project
2. Import your GitHub repo
3. Add all environment variables from `.env.example`
4. Set `NEXT_PUBLIC_APP_URL` to your Vercel URL (e.g. `https://cineflix.vercel.app`)
5. Deploy

### 3. Verify Cron

In Vercel dashboard → your project → **Cron Jobs** tab.  
You should see `/api/cron` running every 6 hours.

---

## 🗄 MongoDB Setup

1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create free cluster
3. Create database user
4. Whitelist `0.0.0.0/0` (or Vercel IPs)
5. Get connection string → paste in `MONGODB_URI`

**Recommended indexes** (auto-created by Mongoose schemas):
- `Movie`: title text, rating, createdAt, isFeatured
- `Series`: title text, rating, createdAt, isFeatured
- `File`: buzzHeavierFileId (unique), folderId, contentId

---

## 🔑 API Reference

### Public

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/movies` | List movies (page, limit, genre, sort) |
| GET | `/api/movies/:id` | Single movie by id or slug |
| GET | `/api/series` | List series |
| GET | `/api/series/:id` | Single series |
| GET | `/api/featured` | Featured content for hero banner |
| GET | `/api/search?q=...` | Search movies & series |
| POST | `/api/requests` | Submit content request |

### Admin (Bearer JWT required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/admin/login` | Login → returns JWT |
| GET | `/api/admin/stats` | Dashboard stats |
| GET/POST | `/api/admin/movies` | List / create movie |
| PUT/DELETE | `/api/admin/movies/:id` | Update / delete movie |
| GET/POST | `/api/admin/series` | List / create series |
| PUT/DELETE | `/api/admin/series/:id` | Update / delete series |
| GET/POST | `/api/admin/sync` | Get logs / trigger sync |
| GET | `/api/admin/requests` | List content requests |
| PUT/DELETE | `/api/admin/requests/:id` | Update / delete request |

---

## ⚙️ How Sync Works

1. **Trigger**: Cron job runs every 6h, or manually from admin panel
2. **Scan**: Lists all files in configured BuzzHeavier folders
3. **Parse**: Extracts title, year, season, episode, quality, language from filename
4. **Match**: Fetches metadata from TMDB (movies) / TMDB+TVMaze (series)
5. **Create/Update**: Creates Movie or Series + File records in MongoDB
6. **Delete**: Removes File records for files no longer on BuzzHeavier, cascades to empty episodes/seasons/titles

---

## 🔒 Security

- Admin routes protected by JWT (cookie + Bearer header)
- Rate limiting on content requests (5 per IP per 24h)
- API security headers (X-Content-Type-Options, X-Frame-Options)
- Cron endpoint protected by `CRON_SECRET`
- Passwords hashed with bcrypt (12 rounds)

---

## 📄 License

MIT — use freely, attribution appreciated.
