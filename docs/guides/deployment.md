# Deploying BlackPear CRM

This guide covers deploying BlackPear CRM to a production environment using Coolify and Docker Compose.

## Architecture

The application runs as four Docker containers:

- **app** -- the Express API server (Node.js)
- **worker** -- the background job processor (same image as app, different entry point)
- **client** -- the React frontend served by nginx
- **postgres** -- PostgreSQL 16 database
- **redis** -- Redis 7 for job queues and caching

The client container talks to the app container over an internal Docker network. The client nginx configuration proxies `/api` requests to the app service, so only port 80 on the client container needs to be exposed publicly.

## Deploying with Coolify

Coolify handles building the images from your repository and managing the containers.

### 1. Create a new application in Coolify

- Go to your Coolify dashboard
- Create a new application from a Git repository
- Select the BlackPear CRM repository
- Set the build type to Docker Compose and point it at `docker-compose.yml`

### 2. Configure environment variables

In the Coolify application settings, add the following environment variables:

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string, e.g. `postgresql://user:pass@postgres:5432/blackbear` |
| `REDIS_URL` | Yes | Redis connection string, e.g. `redis://redis:6379` |
| `JWT_SECRET` | Yes | A long random string used to sign tokens. Use at least 32 characters. |
| `JWT_EXPIRY` | No | How long access tokens last. Defaults to `15m`. |
| `JWT_REFRESH_EXPIRY` | No | How long refresh tokens last. Defaults to `7d`. |
| `CORS_ORIGIN` | Yes | The public URL of the frontend, e.g. `http://crm.yourdomain.com` |
| `ADMIN_EMAIL` | No | Email for the default admin account created on first migration. |
| `ADMIN_PASSWORD` | No | Password for the default admin account. Min 8 characters. |
| `NODE_ENV` | Yes | Set to `production`. |
| `PORT` | No | Port the API server listens on. Defaults to `3000`. |
| `DB_PASSWORD` | No | Passed to the postgres container. Defaults to `blackbear` -- change this in production. |

### 3. Set the public domain

In Coolify, set the domain for the client container. The app and worker containers do not need public domains as they communicate over the internal network.

If you are using Cloudflare in front of Coolify, configure the domain as `http://` in Coolify and let Cloudflare handle the HTTPS termination.

### 4. Run migrations on first deploy

After the first successful deploy, open a terminal into the app container and run:

```bash
npx knex migrate:latest
```

Coolify provides a terminal tab on the container view, or you can use `docker exec` on the host.

Subsequent deployments do not require this step unless a new migration was added. You may want to add the migration command to the app's startup script for automated runs.

### 5. Deploy

Trigger a deploy from Coolify. The build process will:

1. Install dependencies for both packages
2. Compile the server TypeScript
3. Build the React client
4. Start all containers

## DNS Setup

Point your domain at the server running Coolify. If you are using Cloudflare:

1. Create an A record pointing your domain to the server IP
2. Enable the Cloudflare proxy (orange cloud)
3. Set the SSL/TLS mode to Full in Cloudflare
4. In Coolify, configure the domain as `http://` (not https) since Cloudflare terminates TLS

If you are not using Cloudflare, Coolify can provision a Let's Encrypt certificate automatically when you set the domain to `https://`.

## Updating

To deploy a new version:

1. Push your changes to the repository branch that Coolify is watching
2. Coolify will detect the push and trigger a new build and deploy automatically, or you can trigger it manually from the dashboard

If the update includes database migrations, you will need to run them after the new containers are live (unless you have automated it in the startup command).

## Monitoring

The app exposes a health check endpoint at `/api/health-check` that returns the status of the database and Redis connections. Coolify can poll this endpoint to determine container health.

You can also check logs directly in the Coolify dashboard under the Logs tab for each container.
