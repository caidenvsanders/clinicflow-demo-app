# ClinicFlow

## GCP Deployment

This repo includes a simple Docker + NGINX deployment path for a single GCP VM.

### Files

- `Dockerfile`: builds the Next.js app container
- `docker-compose.gcp.yml`: runs the app, PostgreSQL, and appointment scheduler
- `.env.gcp.example`: example environment file for the server
- `deploy/nginx/clinicflow.conf`: NGINX reverse proxy example

### Important note

The seeded ClinicFlow dataset is fictional and intended for demo use. If you want this exact demo data on a GCP server, treat that server as a demo environment rather than a production environment.

### Server setup steps

On your GCP VM:

1. Clone the repo
2. Create `.env.gcp` from `.env.gcp.example`
3. Build the app image
4. Start PostgreSQL and the scheduler
5. Run the demo schema + seed reset once
6. Start the app container
7. Point NGINX at `127.0.0.1:3000`

### Example commands

```bash
git clone <your-repo-url>
cd Sprint2-CPTS451

cp .env.gcp.example .env.gcp
nano .env.gcp

docker compose -f docker-compose.gcp.yml build app
docker compose -f docker-compose.gcp.yml up -d postgres appointment-scheduler

# Demo-only initialization
docker compose -f docker-compose.gcp.yml run --rm -e NODE_ENV=development app node scripts/reset-db.mjs

docker compose -f docker-compose.gcp.yml up -d app
```

### NGINX setup

Copy `deploy/nginx/clinicflow.conf` to your server's NGINX sites config, replace `your-domain-here`, then enable and reload:

```bash
sudo cp deploy/nginx/clinicflow.conf /etc/nginx/sites-available/clinicflow
sudo nano /etc/nginx/sites-available/clinicflow
sudo ln -s /etc/nginx/sites-available/clinicflow /etc/nginx/sites-enabled/clinicflow
sudo nginx -t
sudo systemctl reload nginx
```

If you already use a different NGINX layout, just copy the `server` block contents into your existing config.

### Updating after future changes

```bash
git pull
docker compose -f docker-compose.gcp.yml build app
docker compose -f docker-compose.gcp.yml up -d app
```

### Demo credentials

- `Admin`: `admin@hospital.com` / `hash5`
- `Patient`: `john.doe@email.com` / `hash1`
- `Provider`: `alice.brown@email.com` / `hash3`

## Database Browser

ClinicFlow uses PostgreSQL locally through Docker Compose, and this repo includes a local-only Adminer service for inspecting tables, columns, and development data from a browser.

### Start PostgreSQL

```bash
npm run db:up
```

This starts PostgreSQL and the local appointment scheduler. The scheduler runs a database function every minute so overdue `Scheduled` appointments are automatically marked `Completed` in the local demo database.

### Start the database browser

```bash
npm run db:browser
```

Open:

- [http://localhost:8080](http://localhost:8080)

### Connect to the local database

Use these local development values in Adminer:

- `System`: `PostgreSQL`
- `Server`: `postgres`
- `Username`: `healthcare`
- `Password`: `healthcare`
- `Database`: `healthcare_scheduling`

If you are connecting from a desktop SQL client instead of Adminer, use `localhost:5433` with the same username, password, and database name.

### Stop the database browser

```bash
npm run db:browser:down
```

### Reset schema and seed data

If you want the local database restored to the app's expected development state:

```bash
npm run db:reset
```

## Seed Data

ClinicFlow includes a local/demo seed workflow that clears existing development data and repopulates the PostgreSQL database with a polished fictional clinic scheduling dataset.

### What it does

- Clears existing local/demo application data
- Recreates realistic fictional departments, providers, patients, appointments, availability, and audit logs
- Preserves the expected demo login accounts used by the app

### Commands

Reset schema and reseed everything:

```bash
npm run db:reset:seed
```

Reseed against the existing schema only:

```bash
npm run db:seed
```

Warning: these commands clear local/demo data before reseeding.

### Demo credentials

- `Admin`: `admin@hospital.com` / `hash5`
- `Patient`: `john.doe@email.com` / `hash1`
- `Provider`: `alice.brown@email.com` / `hash3`

### Notes

- All seed data is fictional and intended for local development/demo use only.
- The seed and reset scripts refuse to run when `NODE_ENV=production`.
- The seed and reset scripts also refuse to run if `DATABASE_URL` does not look like a local/demo database target.
- New and rescheduled appointments must start at least 24 hours in advance.
- Overdue appointments are automatically marked `Completed` by a local database-side scheduler service.

### Security note

This database browser is for local development only. Do not expose it publicly or connect it to production without proper security controls.
