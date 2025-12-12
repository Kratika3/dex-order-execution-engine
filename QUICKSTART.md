# Quick Start Guide

## Prerequisites
- Node.js 18+
- Supabase account (free tier: https://supabase.com)
- Upstash Redis account (free tier: https://upstash.com)

## Step-by-Step Setup

### 1. Get Supabase Database URL
1. Go to https://supabase.com and create a project
2. Navigate to Settings → Database
3. Copy the Connection String (URI format)
4. Should look like: `postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres`

### 2. Get Upstash Redis URL
1. Go to https://upstash.com and create a database
2. Select the region closest to your Supabase region
3. Copy the Redis URL from the dashboard
4. Should look like: `redis://default:[PASSWORD]@[HOST]:6379`

### 3. Clone and Install
```bash
git clone <your-repo-url>
cd Kratika
npm install
```

### 4. Configure Environment
Create `.env` file:
```env
DATABASE_URL="your-supabase-url-here"
REDIS_URL="your-upstash-redis-url-here"
PORT=3000
NODE_ENV=development
```

### 5. Setup Database
```bash
# Generate Prisma Client
npm run db:generate

# Push schema to Supabase
npm run db:push
```

### 6. Start Development Server
```bash
npm run dev
```

You should see:
```
🚀 Starting Solana Order Execution Engine...
✅ Database connected (Supabase)
✅ Redis connected (Upstash)
✅ Routes registered
🎉 Server listening at http://localhost:3000
```

## Testing the System

### Option 1: HTML Test Client (Easiest)
1. Open `websocket-test.html` in your browser
2. Click "Create Order" to submit a single order
3. Click "Create 5 Orders" to test concurrency
4. Watch real-time status updates flow in

### Option 2: Postman Collection
1. Import `postman_collection.json` into Postman
2. Test individual endpoints:
   - Health Check
   - Create Order
   - Get Order by ID
   - List Orders

### Option 3: cURL Commands
```bash
# Create an order
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "pair": "SOL-USDC",
    "amount": 10.5,
    "direction": "BUY"
  }'

# Get order details (replace ORDER_ID)
curl http://localhost:3000/api/orders/ORDER_ID

# List all orders
curl http://localhost:3000/api/orders
```

### Option 4: WebSocket Client (Node.js)
```javascript
const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:3000/ws/orders/ORDER_ID');

ws.on('message', (data) => {
  console.log('Update:', JSON.parse(data));
});
```

## Verify Everything Works

### 1. Submit 5 Orders Simultaneously
Use the HTML client or run this script:

```javascript
// test-concurrent.js
async function testConcurrent() {
  const promises = [];
  for (let i = 0; i < 5; i++) {
    promises.push(
      fetch('http://localhost:3000/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pair: 'SOL-USDC',
          amount: Math.random() * 10 + 1,
          direction: Math.random() > 0.5 ? 'BUY' : 'SELL'
        })
      })
    );
  }
  const results = await Promise.all(promises);
  console.log('Created', results.length, 'orders');
}

testConcurrent();
```

### 2. Check Order Status Changes
You should see these transitions in the WebSocket:
```
PENDING    → Order queued
ROUTING    → Comparing Raydium vs Meteora
BUILDING   → Creating transaction
SUBMITTED  → Sending to blockchain
CONFIRMED  → Complete with txHash
```

### 3. Verify DEX Routing
Check the order logs in the database or API response:
```json
{
  "logs": [
    { "message": "Fetching quotes from Raydium and Meteora", "timestamp": "..." },
    { "message": "Raydium quote: $148.5 (fee: 0.3%)", "timestamp": "..." },
    { "message": "Meteora quote: $149.2 (fee: 0.2%)", "timestamp": "..." },
    { "message": "Selected Raydium with effective price: $148.95", "timestamp": "..." }
  ]
}
```

## Troubleshooting

### Error: "DATABASE_URL is required"
- Check your `.env` file exists
- Verify the Supabase connection string is correct
- Make sure there are no quotes around the URL in `.env`

### Error: "REDIS_URL is required"
- Verify your Upstash Redis URL is correct
- Check that the Redis instance is active in Upstash dashboard

### Error: "Port 3000 already in use"
- Change the PORT in `.env` to another port (e.g., 3001)
- Or stop the process using port 3000

### WebSocket Connection Failed
- Make sure the server is running
- Check that you're using `ws://` not `wss://` for localhost
- Verify the orderId exists by checking the API first

### Orders Stuck in PENDING
- Check that the worker started (look for "Order worker initialized" log)
- Verify Redis connection is working
- Check server logs for errors

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm test -- --coverage
```

## Deployment

### Deploy to Railway
1. Push code to GitHub
2. Go to https://railway.app
3. Create new project from GitHub repo
4. Add environment variables
5. Deploy!

### Deploy to Render
1. Push code to GitHub
2. Go to https://render.com
3. Create new Web Service
4. Connect GitHub repo
5. Add environment variables
6. Deploy!

## Next Steps

1. **Add More Tests**: Implement the remaining 10+ unit tests
2. **Create Demo Video**: Record 1-2 min demo showing all features
3. **Deploy**: Push to production with Railway/Render
4. **Monitor**: Add logging/monitoring in production

## Support

For issues or questions:
- Check the README.md for architecture details
- Review ARCHITECTURE.md for system design
- Check the logs in the terminal
- Verify all environment variables are set correctly
