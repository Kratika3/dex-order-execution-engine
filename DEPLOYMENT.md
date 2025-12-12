# Deployment Guide

## Overview
This guide covers deploying the Solana Order Execution Engine to production using free tier services.

## Prerequisites
- GitHub account
- Supabase account (database)
- Upstash account (Redis)
- Railway/Render account (hosting)

---

## Option 1: Deploy to Railway (Recommended)

### Step 1: Prepare Repository
```bash
# Ensure all files are committed
git add .
git commit -m "Ready for deployment"
git push origin main
```

### Step 2: Create Railway Project
1. Go to https://railway.app
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository
5. Railway will auto-detect Node.js

### Step 3: Configure Environment Variables
In Railway dashboard, add these variables:
```
DATABASE_URL=your-supabase-connection-string
REDIS_URL=your-upstash-redis-url
NODE_ENV=production
PORT=3000
```

### Step 4: Configure Build Settings
Railway auto-detects from `package.json`:
- Build Command: `npm run build`
- Start Command: `npm start`

### Step 5: Deploy
1. Railway automatically deploys on push
2. Wait for build to complete (~2-3 minutes)
3. Get your public URL from Railway dashboard

### Step 6: Setup Database
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link to project
railway link

# Run database migrations
railway run npm run db:push
```

### Step 7: Verify Deployment
```bash
# Check health
curl https://your-app.railway.app/health

# Create test order
curl -X POST https://your-app.railway.app/api/orders \
  -H "Content-Type: application/json" \
  -d '{"pair":"SOL-USDC","amount":10,"direction":"BUY"}'
```

---

## Option 2: Deploy to Render

### Step 1: Create Web Service
1. Go to https://render.com
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: solana-order-engine
   - **Environment**: Node
   - **Build Command**: `npm install && npm run build && npm run db:push`
   - **Start Command**: `npm start`

### Step 2: Add Environment Variables
In Render dashboard, add:
```
DATABASE_URL
REDIS_URL
NODE_ENV=production
```

### Step 3: Deploy
1. Click "Create Web Service"
2. Wait for initial deployment (~5 minutes)
3. Get your public URL: `https://your-app.onrender.com`

### Step 4: Verify
```bash
curl https://your-app.onrender.com/health
```

---

## Option 3: Deploy to Fly.io

### Step 1: Install Fly CLI
```bash
curl -L https://fly.io/install.sh | sh
```

### Step 2: Login and Initialize
```bash
fly auth login
fly launch
```

Answer the prompts:
- App name: `solana-order-engine`
- Region: Choose closest to your Supabase
- PostgreSQL: No (using Supabase)
- Redis: No (using Upstash)

### Step 3: Set Environment Variables
```bash
fly secrets set DATABASE_URL="your-supabase-url"
fly secrets set REDIS_URL="your-upstash-url"
fly secrets set NODE_ENV="production"
```

### Step 4: Deploy
```bash
fly deploy
```

### Step 5: Setup Database
```bash
fly ssh console
npm run db:push
exit
```

---

## Post-Deployment Checklist

### 1. Verify All Services
```bash
# Health check
curl https://your-app-url/health

# Create order
curl -X POST https://your-app-url/api/orders \
  -H "Content-Type: application/json" \
  -d '{"pair":"SOL-USDC","amount":5,"direction":"BUY"}'

# Get order (replace ORDER_ID)
curl https://your-app-url/api/orders/ORDER_ID
```

### 2. Test WebSocket
Update `websocket-test.html`:
```javascript
// Change API URL to production
document.getElementById('apiUrl').value = 'https://your-app-url';
```

### 3. Monitor Logs
**Railway:**
```bash
railway logs
```

**Render:**
Check logs in dashboard

**Fly.io:**
```bash
fly logs
```

### 4. Test Concurrent Orders
Use the HTML client to submit 5+ orders simultaneously and verify:
- All orders process correctly
- WebSocket updates work
- Queue handles concurrency
- Database saves all orders

---

## Environment Configuration

### Supabase Setup
1. Create project at https://supabase.com
2. Go to Settings → Database
3. Copy connection string (Transaction pooler mode)
4. Format: `postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres`

### Upstash Redis Setup
1. Create database at https://upstash.com
2. Select same region as Supabase
3. Copy Redis URL from dashboard
4. Format: `redis://default:[password]@[host].upstash.io:[port]`

---

## Troubleshooting

### Issue: Build Fails
**Solution:**
- Check Node.js version (18+)
- Verify `package.json` has all dependencies
- Check build logs for specific errors

### Issue: Database Connection Fails
**Solution:**
- Verify DATABASE_URL is correct
- Check Supabase IP allowlist (allow all for serverless)
- Test connection: `psql $DATABASE_URL`

### Issue: Redis Connection Fails
**Solution:**
- Verify REDIS_URL format
- Check Upstash dashboard for status
- Ensure no firewall blocking

### Issue: WebSocket Disconnects
**Solution:**
- Check platform supports WebSockets (Railway/Render do)
- Verify no proxy/load balancer stripping WS headers
- Add ping/pong keepalive (already implemented)

### Issue: Orders Stuck in PENDING
**Solution:**
- Check worker started (logs show "Worker initialized")
- Verify Redis connection for BullMQ
- Check for errors in worker logs

---

## Performance Optimization

### 1. Database Connection Pooling
Prisma automatically handles this, but for better performance:
```javascript
// In prisma.ts, add connection pool settings
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DIRECT_URL") // Optional: for migrations
}
```

### 2. Redis Connection Pooling
```typescript
// In redis.ts, configure connection pool
export const redis = new Redis(config.redis.url, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  lazyConnect: false,
  keepAlive: 30000,
  connectionName: 'bullmq-connection'
});
```

### 3. Worker Scaling
To handle more load, adjust in `orderWorker.ts`:
```typescript
concurrency: 20, // Increase from 10
limiter: {
  max: 200, // Increase from 100
  duration: 60000,
}
```

---

## Monitoring & Logging

### Add Logging Service (Optional)
```bash
npm install pino pino-pretty
```

Update Fastify logger:
```typescript
const fastify = Fastify({
  logger: {
    level: 'info',
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    },
  },
});
```

### Add Error Tracking (Optional)
```bash
npm install @sentry/node
```

Initialize in `index.ts`:
```typescript
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: config.server.environment,
});
```

---

## Scaling Considerations

### Horizontal Scaling
The architecture supports multiple instances:
- **HTTP/WebSocket servers**: Scale horizontally (load balancer)
- **BullMQ workers**: Multiple instances share queue
- **Redis Pub/Sub**: All WebSocket servers receive updates

### Vertical Scaling
For single instance optimization:
- Increase worker concurrency
- Add more memory for Redis caching
- Use faster Supabase tier

### Database Indexing
Already included in schema:
```prisma
@@index([status])
@@index([createdAt])
```

---

## Security Checklist

- [ ] Environment variables not committed to git
- [ ] HTTPS enabled (automatic on Railway/Render)
- [ ] Database credentials rotated regularly
- [ ] Rate limiting configured (already done with BullMQ)
- [ ] Input validation with Zod (already implemented)
- [ ] CORS configured if needed
- [ ] Supabase Row Level Security enabled
- [ ] Redis AUTH enabled (Upstash default)

---

## Backup Strategy

### Database Backups
Supabase automatically backs up daily. For manual backup:
```bash
pg_dump $DATABASE_URL > backup.sql
```

### Restore
```bash
psql $DATABASE_URL < backup.sql
```

---

## Cost Estimate (Free Tiers)

| Service | Free Tier | Paid Starts At |
|---------|-----------|----------------|
| Railway | $5 credit/month | $5/month |
| Render | 750 hours/month | $7/month |
| Fly.io | 3 VMs shared | $1.94/month |
| Supabase | 500MB DB, 1GB transfer | $25/month |
| Upstash | 10K commands/day | $0.20/100K |

**Total Free**: Fully functional for development/demo
**Production**: ~$15-20/month for small scale

---

## Update Deployment

```bash
# Make changes locally
git add .
git commit -m "Update: description"
git push origin main

# Railway: Auto-deploys
# Render: Auto-deploys
# Fly.io: Manual deploy
fly deploy
```

---

## Rollback

**Railway:**
```bash
railway rollback
```

**Render:**
Dashboard → Deploys → Rollback to previous

**Fly.io:**
```bash
fly releases
fly releases rollback <version>
```

---

## Support & Resources

- Railway Docs: https://docs.railway.app
- Render Docs: https://render.com/docs
- Fly.io Docs: https://fly.io/docs
- Supabase Docs: https://supabase.com/docs
- Upstash Docs: https://docs.upstash.com
