# 🚀 Getting Started (5 Minutes)

This is the **fastest** way to get the Solana Order Execution Engine running locally.

## Prerequisites (1 minute)
- ✅ Node.js 18+ installed ([download](https://nodejs.org))
- ✅ Supabase account ([free signup](https://supabase.com))
- ✅ Upstash account ([free signup](https://upstash.com))

---

## Step 1: Get Your Credentials (2 minutes)

### Supabase (PostgreSQL)
1. Create project at https://supabase.com
2. Go to **Settings → Database**
3. Copy **Connection String** (Transaction pooler)
4. Save for later: `postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres`

### Upstash (Redis)
1. Create database at https://upstash.com
2. Choose region closest to Supabase
3. Copy **Redis URL** from dashboard
4. Save for later: `redis://default:[PASSWORD]@[HOST]:6379`

---

## Step 2: Clone & Install (1 minute)

```bash
# Clone repository
git clone <your-repo-url>
cd Kratika

# Install dependencies
npm install
```

---

## Step 3: Configure Environment (30 seconds)

```bash
# Create .env file
cp .env.example .env

# Edit .env with your editor
nano .env  # or: code .env, vim .env
```

**Paste your credentials:**
```env
DATABASE_URL="your-supabase-url-here"
REDIS_URL="your-upstash-url-here"
PORT=3000
NODE_ENV=development
```

Save and close.

---

## Step 4: Setup Database (30 seconds)

```bash
# Generate Prisma Client
npm run db:generate

# Push schema to database
npm run db:push
```

**Expected output:**
```
✔ Generated Prisma Client
✔ The database is now in sync with the Prisma schema
```

---

## Step 5: Start Server (10 seconds)

```bash
npm run dev
```

**Expected output:**
```
🚀 Starting Solana Order Execution Engine...
✅ Database connected (Supabase)
✅ Redis connected (Upstash)
✅ Routes registered
[Worker] Order worker initialized
🎉 Server listening at http://0.0.0.0:3000
```

**🎉 You're running!**

---

## Quick Test (1 minute)

### Test 1: Health Check
```bash
curl http://localhost:3000/health
```

**Expected:**
```json
{"status":"ok","timestamp":"...","services":{"database":"connected","redis":"connected"}}
```

### Test 2: Create Order
```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{"pair":"SOL-USDC","amount":10.5,"direction":"BUY"}'
```

**Expected:**
```json
{"orderId":"a1b2c3d4-...","status":"PENDING","message":"Order created and queued for processing"}
```

### Test 3: Visual Test (Easiest!)
1. Open `websocket-test.html` in your browser
2. Click "Create Order"
3. Watch real-time updates! ✨

---

## What Just Happened?

When you created an order:

1. **API validated** your input with Zod
2. **Database saved** order with PENDING status
3. **Queue added** job to BullMQ
4. **Worker picked up** the order
5. **DEX router** fetched quotes from Raydium and Meteora
6. **Best price selected** and transaction built
7. **Swap executed** (simulated, 2-3 seconds)
8. **Database updated** with txHash and execution price
9. **WebSocket pushed** updates at each step

**Total time:** ~4 seconds from submission to confirmation!

---

## Next Steps

### Explore the API
```bash
# Get order details (replace ORDER_ID)
curl http://localhost:3000/api/orders/ORDER_ID

# List all orders
curl http://localhost:3000/api/orders

# Filter by status
curl http://localhost:3000/api/orders?status=CONFIRMED
```

### Test Concurrent Orders
```bash
# Submit 5 orders at once
for i in {1..5}; do
  curl -X POST http://localhost:3000/api/orders \
    -H "Content-Type: application/json" \
    -d '{"pair":"SOL-USDC","amount":5,"direction":"BUY"}' &
done
wait

# Check they all processed
curl http://localhost:3000/api/orders?limit=5
```

### Use Postman
1. Import `postman_collection.json`
2. Run "Create Order" request
3. Try "Get Order by ID"
4. Test concurrent creation (Run Collection)

### Run Tests
```bash
npm test
```

---

## Troubleshooting

### "DATABASE_URL is required"
**Fix:** Check your `.env` file exists and has the correct format

### "Cannot find module 'fastify'"
**Fix:** Run `npm install` again

### "Port 3000 already in use"
**Fix:** Change PORT in `.env` to 3001 or kill the process: `lsof -ti:3000 | xargs kill`

### Orders stuck in PENDING
**Fix:** Check server logs for errors, verify Redis URL is correct

---

## File Structure Overview

```
Kratika/
├── src/
│   ├── index.ts                  ← Server entry point
│   ├── config/env.ts             ← Environment validation
│   ├── modules/orders/           ← Order logic
│   │   ├── MockDexRouter.ts      ← DEX simulation
│   │   ├── order.controller.ts   ← HTTP handlers
│   │   └── order.queue.ts        ← BullMQ setup
│   └── workers/orderWorker.ts    ← Background processing
├── prisma/schema.prisma          ← Database schema
├── websocket-test.html           ← Visual test client
├── postman_collection.json       ← API testing
└── README.md                     ← Full documentation
```

---

## Key Concepts

### Market Orders
- Execute immediately at current market price
- No waiting for specific price
- Fastest order type

### DEX Routing
```
Order → Query Both DEXs → Compare Prices → Choose Best → Execute
         (Raydium)         (Meteora)
```

### Status Flow
```
PENDING → ROUTING → BUILDING → SUBMITTED → CONFIRMED
```

### Concurrency
- 10 orders process simultaneously
- 100 orders per minute max
- BullMQ handles the queue

---

## Learn More

- **Full Documentation:** See `README.md`
- **Architecture:** See `ARCHITECTURE.md`
- **Deployment:** See `DEPLOYMENT.md`
- **Complete Guide:** See `INSTALLATION.md`
- **npm Commands:** See `NPM_SCRIPTS.md`

---

## Summary

**What you built:**
- ✅ High-performance order execution engine
- ✅ DEX routing (Raydium vs Meteora)
- ✅ Real-time WebSocket updates
- ✅ Concurrent order processing
- ✅ Retry logic with exponential backoff
- ✅ Full TypeScript type safety

**Time to production:**
- Setup: 5 minutes (you just did this!)
- Deploy: 10 minutes (see DEPLOYMENT.md)
- Total: 15 minutes from zero to live! 🚀

---

**Need Help?**
- Check `INSTALLATION.md` for detailed setup
- See `QUICKSTART.md` for common issues
- Review `CHECKLIST.md` for verification

**Ready to Deploy?**
See `DEPLOYMENT.md` for Railway/Render/Fly.io instructions

---

🎉 **Congratulations!** You now have a fully functional Solana Order Execution Engine running locally.

Next: Record a demo video and deploy to production!
