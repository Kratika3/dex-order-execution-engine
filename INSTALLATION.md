# Installation & Verification Guide

## 📦 Complete Installation Steps

### 1. Install Dependencies
```bash
npm install
```

This will install:
- **fastify** (v4.28.1) - Web server
- **@fastify/websocket** (v10.0.1) - WebSocket support
- **prisma** (v5.22.0) - Database ORM
- **@prisma/client** (v5.22.0) - Prisma client
- **bullmq** (v5.15.0) - Queue management
- **ioredis** (v5.4.1) - Redis client
- **zod** (v3.23.8) - Validation library

Dev dependencies:
- **typescript** (v5.7.2)
- **tsx** (v4.19.2) - TypeScript executor
- **jest** (v29.7.0) - Testing framework
- **@types/node** (v22.10.1) - Node.js type definitions

### 2. Environment Setup
```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your credentials
nano .env  # or vim, code, etc.
```

Required variables:
```env
DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"
REDIS_URL="redis://default:[PASSWORD]@[HOST]:6379"
PORT=3000
NODE_ENV=development
```

### 3. Database Setup
```bash
# Generate Prisma Client
npm run db:generate

# Push schema to database
npm run db:push
```

You should see:
```
✔ Generated Prisma Client
✔ The database is now in sync with the Prisma schema
```

### 4. Verify Installation
```bash
# Check if TypeScript compiles
npm run build

# Should create dist/ directory with compiled JavaScript
```

---

## ✅ Verification Checklist

### Step 1: Start the Server
```bash
npm run dev
```

**Expected output:**
```
🚀 Starting Solana Order Execution Engine...
✅ Database connected (Supabase)
✅ Redis connected (Upstash)
✅ Routes registered
[Worker] Order worker initialized with 10 concurrent jobs, 100/min rate limit
🎉 Server listening at http://0.0.0.0:3000
📊 HTTP API: http://0.0.0.0:3000/api/orders
🔌 WebSocket: ws://localhost:3000/ws/orders/:orderId
```

### Step 2: Health Check
In a new terminal:
```bash
curl http://localhost:3000/health
```

**Expected response:**
```json
{
  "status": "ok",
  "timestamp": "2025-12-12T...",
  "services": {
    "database": "connected",
    "redis": "connected"
  }
}
```

### Step 3: Create an Order
```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "pair": "SOL-USDC",
    "amount": 10.5,
    "direction": "BUY"
  }'
```

**Expected response:**
```json
{
  "orderId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "status": "PENDING",
  "message": "Order created and queued for processing"
}
```

**Server logs should show:**
```
[Worker] Processing order a1b2c3d4-... - BUY 10.5 SOL-USDC
[Worker] ✅ Order a1b2c3d4-... completed successfully
```

### Step 4: Check Order Status
```bash
# Replace ORDER_ID with actual orderId from step 3
curl http://localhost:3000/api/orders/ORDER_ID
```

**Expected response:**
```json
{
  "id": "a1b2c3d4-...",
  "pair": "SOL-USDC",
  "amount": 10.5,
  "direction": "BUY",
  "status": "CONFIRMED",
  "logs": [
    {
      "message": "Fetching quotes from Raydium and Meteora",
      "timestamp": "2025-12-12T..."
    },
    {
      "message": "Raydium quote: $148.5 (fee: 0.3%)",
      "timestamp": "2025-12-12T..."
    },
    {
      "message": "Meteora quote: $149.2 (fee: 0.2%)",
      "timestamp": "2025-12-12T..."
    },
    {
      "message": "Selected Raydium with effective price: $148.95",
      "timestamp": "2025-12-12T..."
    },
    {
      "message": "Building transaction on Raydium",
      "timestamp": "2025-12-12T..."
    },
    {
      "message": "Transaction submitted with hash: 5J7K8L...",
      "timestamp": "2025-12-12T..."
    },
    {
      "message": "Order confirmed! Final price: $148.93 on Raydium",
      "timestamp": "2025-12-12T..."
    }
  ],
  "txHash": "5J7K8L9M...",
  "executionPrice": 148.93,
  "createdAt": "2025-12-12T...",
  "updatedAt": "2025-12-12T..."
}
```

### Step 5: Test WebSocket Updates

**Option A: Use HTML Test Client**
1. Open `websocket-test.html` in a browser
2. Click "Create Order"
3. Watch real-time status updates appear

**Option B: Use wscat (CLI)**
```bash
# Install wscat
npm install -g wscat

# Create an order first, get ORDER_ID
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{"pair":"SOL-USDC","amount":5,"direction":"BUY"}' | jq -r '.orderId'

# Connect to WebSocket (replace ORDER_ID)
wscat -c ws://localhost:3000/ws/orders/ORDER_ID
```

**Expected WebSocket messages:**
```json
{"type":"connected","orderId":"...","message":"WebSocket connection established","timestamp":"..."}
{"orderId":"...","status":"PENDING","timestamp":"..."}
{"orderId":"...","status":"ROUTING","timestamp":"..."}
{"orderId":"...","status":"BUILDING","executionPrice":148.95,"timestamp":"..."}
{"orderId":"...","status":"SUBMITTED","timestamp":"..."}
{"orderId":"...","status":"CONFIRMED","txHash":"...","executionPrice":148.93,"timestamp":"..."}
```

### Step 6: Test Concurrent Orders
```bash
# Create 5 orders simultaneously
for i in {1..5}; do
  curl -X POST http://localhost:3000/api/orders \
    -H "Content-Type: application/json" \
    -d "{\"pair\":\"SOL-USDC\",\"amount\":$((RANDOM % 10 + 1)),\"direction\":\"BUY\"}" &
done
wait

# Check all orders completed
curl http://localhost:3000/api/orders?limit=5
```

**Expected:** All 5 orders should show `CONFIRMED` status

### Step 7: Run Tests
```bash
npm test
```

**Expected output:**
```
PASS  src/tests/MockDexRouter.test.ts
  MockDexRouter
    Quote Fetching
      ✓ should return Raydium quote with price variance
      ✓ should return Meteora quote with price variance
      ✓ should fetch quotes from both DEXs in parallel
    Best Quote Selection
      ✓ should select lowest price for BUY orders
      ✓ should select highest price for SELL orders
    Swap Execution
      ✓ should execute swap with transaction hash
      ✓ should simulate blockchain confirmation delay
      ✓ should apply slippage to execution price

PASS  src/tests/order.validation.test.ts
  Order Validation
    ✓ should validate a valid BUY order
    ✓ should reject invalid inputs

Test Suites: 2 passed, 2 total
Tests:       10 passed, 10 total
```

---

## 🐛 Troubleshooting

### Issue: "DATABASE_URL is required"
**Cause:** Missing or invalid .env file

**Solution:**
```bash
# Check if .env exists
ls -la .env

# Verify contents
cat .env

# Ensure no quotes around values
# ✓ Correct: DATABASE_URL=postgresql://...
# ✗ Wrong: DATABASE_URL="postgresql://..."
```

### Issue: "Cannot find module 'fastify'"
**Cause:** Dependencies not installed

**Solution:**
```bash
# Remove node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

### Issue: "Redis connection refused"
**Cause:** Invalid REDIS_URL or Upstash instance not running

**Solution:**
1. Check Upstash dashboard
2. Verify Redis URL format
3. Test connection: `redis-cli -u $REDIS_URL PING`

### Issue: "Prisma Client not generated"
**Cause:** Forgot to run db:generate

**Solution:**
```bash
npm run db:generate
```

### Issue: "Port 3000 already in use"
**Cause:** Another process using port 3000

**Solution:**
```bash
# Option 1: Kill process on port 3000
lsof -ti:3000 | xargs kill

# Option 2: Use different port
# In .env: PORT=3001
```

### Issue: Orders stuck in PENDING
**Cause:** Worker not started or Redis not connected

**Solution:**
1. Check logs for "Worker initialized"
2. Verify Redis connection
3. Restart server

---

## 📊 Database Verification

### Check Database Tables
```bash
# Connect to Supabase
psql $DATABASE_URL

# List tables
\dt

# Should show: Order

# Check Order structure
\d "Order"

# Query orders
SELECT id, pair, status, "createdAt" FROM "Order" LIMIT 5;

# Exit
\q
```

### Check Redis Queue
```bash
# Connect to Redis
redis-cli -u $REDIS_URL

# Check queue length
LLEN bull:order-processing:wait

# Check active jobs
LLEN bull:order-processing:active

# Check completed jobs
ZCARD bull:order-processing:completed

# Exit
exit
```

---

## 🎉 Success Indicators

You've successfully installed and verified the system if:

- ✅ Server starts without errors
- ✅ Health check returns "ok"
- ✅ Can create orders via API
- ✅ Orders transition through all states (PENDING → CONFIRMED)
- ✅ WebSocket receives real-time updates
- ✅ 5 concurrent orders all complete successfully
- ✅ All unit tests pass
- ✅ Database contains order records
- ✅ DEX routing logic visible in logs
- ✅ Transaction hashes generated

---

## 🚀 Next Steps

1. **Import Postman Collection**
   - Open Postman
   - Import `postman_collection.json`
   - Test all endpoints

2. **Record Demo Video**
   - Use HTML test client
   - Submit 5+ orders
   - Show WebSocket updates
   - Display logs

3. **Deploy to Production**
   - Follow DEPLOYMENT.md
   - Push to Railway/Render
   - Verify production URL

4. **Add More Tests**
   - Implement remaining integration tests
   - Add E2E tests with supertest
   - Test error scenarios

---

## 📞 Support

If you encounter issues not covered here:
1. Check server logs for detailed errors
2. Verify all environment variables
3. Ensure Supabase and Upstash are active
4. Review QUICKSTART.md for detailed setup
5. Check ARCHITECTURE.md for system design

---

**Installation Guide Version:** 1.0.0  
**Last Updated:** December 12, 2025
