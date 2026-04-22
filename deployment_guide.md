# ZenXplor Production Deployment Guide

> [!IMPORTANT]
> You are on **Render free tier** (512 MB RAM, sleeps after 15 min inactivity) and **Vercel hobby tier**. This guide is optimised to stay within those limits.

---

## Part 1 — Host the Desktop Agent on GitHub Releases

GitHub Releases gives you a free, permanent download URL that survives repo renames.

### Steps

1. **Go to your repo** → `https://github.com/Servesh21/file_search1`
2. Click **Releases → Draft a new release**
3. Tag: `v1.0.0`, Title: `ZenXplor Desktop Agent v1.0.0`
4. Drag `zenxplor-agent\dist\zenxplor-agent.exe` into the assets section
5. Click **Publish release**

After publishing, the permanent download URL will be:
```
https://github.com/Servesh21/file_search1/releases/latest/download/zenxplor-agent.exe
```

> [!NOTE]
> The download button on the homepage already points to this URL — no code change needed after publishing!

---

## Part 2 — Deploy Backend on Render

### 2.1 PostgreSQL (Render managed DB)

1. Go to [render.com](https://render.com) → **New → PostgreSQL**
2. Name: `zenxplor-db`, Plan: **Free**
3. Note the **Internal Database URL** for the next step

### 2.2 Elasticsearch (Bonsai Free Tier)

Render doesn't offer Elasticsearch natively. Use **Bonsai** (free: 125 MB, 1 index shard):

1. Sign up at [bonsai.io](https://bonsai.io) → Create cluster
2. Copy your cluster URL (looks like `https://user:pass@cluster.bonsai.io`)

### 2.3 Web Service

1. Go to Render → **New → Web Service**
2. Connect your GitHub repo `Servesh21/file_search1`
3. Settings:

| Field | Value |
|-------|-------|
| **Root directory** | `backend` |
| **Runtime** | Python 3 |
| **Build command** | `pip install -r requirements.txt` |
| **Start command** | `gunicorn app:app --workers 2 --threads 4 --timeout 60 --bind 0.0.0.0:$PORT` |
| **Plan** | Free |

4. **Environment Variables** — click "Add Environment Variable":

| Key | Value |
|-----|-------|
| `FLASK_ENV` | `production` |
| `SECRET_KEY` | *(click "Generate" for a random value)* |
| `DATABASE_URL` | *(paste Internal DB URL from step 2.1)* |
| `ELASTICSEARCH_URL` | *(paste Bonsai cluster URL from step 2.2)* |
| `FRONTEND_URL` | *(your Vercel URL — fill in after Part 3)* |
| `DROPBOX_CLIENT_ID` | *(from your .env)* |
| `DROPBOX_CLIENT_SECRET` | *(from your .env)* |
| `CLIENT_ID` | *(Google OAuth client ID)* |
| `CLIENT_SECRET` | *(Google OAuth client secret)* |
| `GITHUB_CLIENT_ID` | *(from your .env)* |
| `GITHUB_CLIENT_SECRET` | *(from your .env)* |

5. Click **Deploy**

> [!TIP]
> Render gives you a URL like `https://zenxplor-backend.onrender.com`. **Save this — you need it for Step 3.**

### 2.4 Run database migrations

After the first deploy, open the Render Shell for your service and run:
```bash
flask db upgrade
```

### 2.5 Create the Elasticsearch index (first time only)

In the Render Shell:
```bash
python - <<'EOF'
from app import app
from file_search import es
with app.app_context():
    if not es.indices.exists(index="file_index"):
        es.indices.create(index="file_index", body={
          "settings": {"number_of_shards": 1, "number_of_replicas": 0},
          "mappings": {"properties": {
            "filename": {"type": "text"},
            "filename_ngram": {"type": "text"},
            "filepath": {"type": "keyword"},
            "filetype": {"type": "keyword"},
            "storage_type": {"type": "keyword"},
            "user_id": {"type": "integer"},
            "is_folder": {"type": "boolean"},
            "is_favorite": {"type": "boolean"}
          }}
        })
        print("Index created!")
    else:
        print("Index already exists.")
EOF
```

---

## Part 3 — Deploy Frontend on Vercel

### 3.1 Connect repo

1. Go to [vercel.com](https://vercel.com) → **New Project**
2. Import `Servesh21/file_search1`
3. **Framework preset**: Vite
4. **Root directory**: `frontend`

### 3.2 Environment Variables

In Vercel project settings → **Environment Variables**, add:

| Key | Value |
|-----|-------|
| `VITE_BACKEND_URL` | `https://zenxplor-backend.onrender.com` *(your Render URL)* |
| `VITE_CLERK_PUBLISHABLE_KEY` | *(from your .env)* |
| `VITE_GOOGLE_CLIENT_ID` | *(from your .env)* |
| `VITE_GOOGLE_API_KEY` | *(from your .env)* |
| `VITE_DROPBOX_CLIENT_ID` | *(from your .env)* |

> [!IMPORTANT]
> After adding the env vars, **redeploy** once (Vercel only bakes them in at build time, not at runtime).

### 3.3 Update CORS on Render

Go back to Render → your backend service → Environment Variables:
- Set `FRONTEND_URL` = `https://your-app.vercel.app` *(your actual Vercel URL)*
- Render will redeploy automatically.

### 3.4 Update OAuth redirect URIs

**Google Cloud Console:**
- Authorized origins: add `https://your-app.vercel.app`
- Authorized redirect URIs: add `https://zenxplor-backend.onrender.com/auth/authorize/google`

**GitHub OAuth App:**
- Homepage URL: `https://your-app.vercel.app`
- Callback URL: `https://zenxplor-backend.onrender.com/auth/authorize/github`

---

## Part 4 — Configure the Desktop Agent for Production

When a user logs in from the production frontend, the `App.tsx` `syncAgent()` function automatically pushes the correct `backend_url` (`https://zenxplor-backend.onrender.com`) to the agent's config — **no manual agent configuration needed by end users.**

---

## Part 5 — Free Tier Tips (Preventing Crashes)

### Render free tier gotchas

| Problem | Solution |
|---------|----------|
| Service **sleeps after 15 min** | Use [UptimeRobot](https://uptimerobot.com) (free) to ping `https://zenxplor-backend.onrender.com/health` every 10 min |
| **Cold start takes 30–60 s** | First request after sleep may time out — agent retries automatically |
| **512 MB RAM** | Already handled: pool_size=5, 3 sync workers max, 300-file batches |
| **ES 125 MB limit** | Only store `filename`, `filepath`, `filetype` in ES — no content. Already done |
| **PostgreSQL 100 connections** | Already handled: pool_size=5, max_overflow=10 |

### Agent indexing won't crash Render

The agent runs **on the user's PC**, not on Render. Render only receives HTTP POSTs of 300-file batches (≈ 50 KB each). The semaphore limits concurrent batch processing to 3, so peak RAM usage from the sync endpoint is under 100 MB.

### Vercel deployment checklist

- [ ] `VITE_BACKEND_URL` env var set correctly
- [ ] All OAuth redirect URIs updated to use production URLs
- [ ] Vercel project root directory set to `frontend`
- [ ] Re-deployed after adding env vars

---

## Quick Links

| Service | URL |
|---------|-----|
| Your frontend | `https://your-app.vercel.app` |
| Your backend | `https://zenxplor-backend.onrender.com` |
| Backend health | `https://zenxplor-backend.onrender.com/health` |
| Agent download | `https://github.com/Servesh21/file_search1/releases/latest/download/zenxplor-agent.exe` |
| UptimeRobot | `https://uptimerobot.com` (set 10-min ping on `/health`) |
| Bonsai ES | `https://bonsai.io` |
