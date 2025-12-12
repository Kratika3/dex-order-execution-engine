# 🗺️ Project Map

Navigate the Solana Order Execution Engine documentation and codebase with this visual guide.

---

## 📖 Documentation Map

```
┌─────────────────────────────────────────────────────┐
│              DOCUMENTATION HIERARCHY                │
└─────────────────────────────────────────────────────┘

START HERE ──► GETTING_STARTED.md (5-minute setup)
                        │
                        ▼
                  First Time Setup?
                    │         │
              YES ──┘         └── NO
               │                   │
               ▼                   ▼
       QUICKSTART.md        README.md (Overview)
               │                   │
               │                   │
               └───────┬───────────┘
                       │
              Need More Details?
                       │
         ┌─────────────┼─────────────┐
         ▼             ▼             ▼
   INSTALLATION.md  ARCHITECTURE.md  DEPLOYMENT.md
   (Detailed Setup) (Design Docs)   (Production)
         │             │             │
         │             │             │
         └─────────────┼─────────────┘
                       │
              Additional Resources
                       │
         ┌─────────────┼─────────────┬─────────────┐
         ▼             ▼             ▼             ▼
   SYSTEM_FLOW.md  NPM_SCRIPTS.md CHECKLIST.md  COMPLETE_SUMMARY.md
   (Diagrams)      (Commands)     (Verify)      (Everything)
```

---

## 📁 Source Code Map

```
src/
│
├── 🎯 ENTRY POINT
│   └── index.ts ◄──────────────── Start server here
│
├── ⚙️ CONFIGURATION
│   └── config/
│       └── env.ts ◄─────────────── Environment validation
│
├── 🔧 SHARED UTILITIES
│   └── lib/
│       ├── prisma.ts ◄──────────── Database client
│       ├── redis.ts ◄───────────── Redis connections
│       └── utils.ts ◄───────────── Helper functions
│
├── 📦 FEATURE MODULES
│   └── modules/
│       │
│       ├── orders/ ◄─────────────── Order Management
│       │   ├── MockDexRouter.ts ◄── DEX simulation
│       │   ├── order.controller.ts ◄ HTTP handlers
│       │   ├── order.queue.ts ◄──── BullMQ setup
│       │   ├── order.routes.ts ◄─── Route config
│       │   └── order.validation.ts ◄ Input validation
│       │
│       └── websocket/ ◄──────────── WebSocket
│           └── websocket.routes.ts ◄ WS handlers
│
├── 👷 BACKGROUND JOBS
│   └── workers/
│       └── orderWorker.ts ◄──────── BullMQ worker
│
└── 🧪 TESTS
    └── tests/
        ├── MockDexRouter.test.ts ◄── Unit tests (DEX)
        ├── order.validation.test.ts ◄ Unit tests (Validation)
        └── integration.test.ts ◄──── Integration tests
```

---

## 🔀 Request Flow Map

```
┌──────────┐
│  Client  │
└────┬─────┘
     │
     │ POST /api/orders
     ▼
┌─────────────────────┐
│  order.controller   │ ◄─── src/modules/orders/order.controller.ts
│  - Validate (Zod)   │
│  - Create in DB     │
│  - Add to Queue     │
└────┬────────────────┘
     │
     │ Returns orderId
     ▼
┌──────────┐
│  Client  │
└────┬─────┘
     │
     │ WS: /ws/orders/:id
     ▼
┌───────────────────────┐
│  websocket.routes     │ ◄─── src/modules/websocket/websocket.routes.ts
│  - Subscribe Redis    │
│  - Forward updates    │
└────┬──────────────────┘
     │
     │ Listening...
     ▼
┌───────────────────────┐
│  Redis Pub/Sub        │ ◄─── src/lib/redis.ts
│  Channel: order-      │
│  updates:{orderId}    │
└────▲──────────────────┘
     │
     │ Publishes updates
     │
┌────┴──────────────────┐
│  orderWorker          │ ◄─── src/workers/orderWorker.ts
│  - Fetch DEX quotes   │
│  - Select best price  │
│  - Execute swap       │
│  - Update DB          │
│  - Publish to Redis   │
└───────────────────────┘
     │
     │ Uses
     ▼
┌───────────────────────┐
│  MockDexRouter        │ ◄─── src/modules/orders/MockDexRouter.ts
│  - getRaydiumQuote()  │
│  - getMeteorQuote()   │
│  - selectBestQuote()  │
│  - executeSwap()      │
└───────────────────────┘
```

---

## 🗄️ Database Map

```
┌────────────────────────┐
│    Supabase (PG)       │
└────────────────────────┘
          │
          │ Defined by
          ▼
┌────────────────────────┐
│   schema.prisma        │ ◄─── prisma/schema.prisma
│                        │
│  model Order {         │
│    id: UUID            │ ◄─── Primary key
│    pair: String        │ ◄─── "SOL-USDC"
│    amount: Float       │ ◄─── Trade amount
│    direction: String   │ ◄─── "BUY" or "SELL"
│    status: Enum        │ ◄─── Order lifecycle
│    logs: JSON          │ ◄─── Routing decisions
│    txHash: String?     │ ◄─── Transaction hash
│    executionPrice:     │ ◄─── Final price
│      Float?            │
│    createdAt: DateTime │ ◄─── Timestamp
│  }                     │
└────────────────────────┘
          │
          │ Accessed via
          ▼
┌────────────────────────┐
│   Prisma Client        │ ◄─── src/lib/prisma.ts
│   - prisma.order.*     │
└────────────────────────┘
```

---

## 🔄 State Machine Map

```
Order Lifecycle States:

   START
     │
     ▼
┌─────────┐
│ PENDING │ ◄─── Order created, queued
└────┬────┘
     │
     ▼
┌─────────┐
│ ROUTING │ ◄─── Fetching DEX quotes
└────┬────┘      (Raydium + Meteora)
     │
     ▼
┌──────────┐
│ BUILDING │ ◄─── Creating transaction
└────┬─────┘      for best DEX
     │
     ▼
┌───────────┐
│ SUBMITTED │ ◄─── Executing swap
└────┬──────┘      (2-3 second wait)
     │
     ├─── Success ──►┌───────────┐
     │               │ CONFIRMED │ ◄─── END (Happy Path)
     │               └───────────┘
     │
     └─── Failure ──►┌────────┐
                     │ FAILED │ ◄─── END (Error Path)
                     └────────┘      (Retry if attempts < 3)
```

---

## 🧪 Testing Map

```
Testing Hierarchy:

┌─────────────────────────────────┐
│       Unit Tests (Local)        │
├─────────────────────────────────┤
│ MockDexRouter.test.ts           │ ◄─── DEX logic
│ order.validation.test.ts        │ ◄─── Input validation
│                                 │
│ Run: npm test                   │
└─────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────┐
│   Integration Tests (DB+Redis)  │
├─────────────────────────────────┤
│ integration.test.ts             │ ◄─── Full flow
│                                 │
│ Run: npm test                   │
└─────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────┐
│    API Tests (HTTP/WS)          │
├─────────────────────────────────┤
│ postman_collection.json         │ ◄─── API testing
│ websocket-test.html             │ ◄─── WebSocket UI
│                                 │
│ Use: Postman or Browser         │
└─────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────┐
│    Manual Testing               │
├─────────────────────────────────┤
│ - Create 5+ orders              │
│ - Check WebSocket updates       │
│ - Verify DEX routing            │
│ - Test concurrent processing    │
└─────────────────────────────────┘
```

---

## 🚀 Deployment Map

```
Deployment Options:

Local Dev ──► npm run dev
   │
   │ Ready for Production?
   │
   ├──► Railway ◄──────── Recommended
   │    - Auto-deploy from GitHub
   │    - Free tier
   │    - HTTPS auto
   │
   ├──► Render
   │    - Free 750 hours/month
   │    - Auto-deploy
   │    - Built-in backups
   │
   └──► Fly.io
        - Global edge network
        - 3 VMs free
        - CLI deploy

All Options Need:
├─ DATABASE_URL (Supabase)
├─ REDIS_URL (Upstash)
└─ NODE_ENV=production
```

---

## 📋 Dependency Map

```
Tech Stack Dependencies:

Application Layer
├─ fastify ◄────────────────── HTTP + WebSocket server
└─ @fastify/websocket ◄─────── WebSocket plugin

Business Logic
├─ bullmq ◄─────────────────── Queue management
└─ zod ◄────────────────────── Input validation

Data Layer
├─ prisma ◄─────────────────── ORM
├─ @prisma/client ◄─────────── Database client
└─ ioredis ◄────────────────── Redis client

Development
├─ typescript ◄─────────────── Type safety
├─ tsx ◄────────────────────── TS executor
└─ jest ◄───────────────────── Testing

External Services
├─ Supabase ◄───────────────── PostgreSQL
└─ Upstash ◄────────────────── Redis
```

---

## 🎯 Quick Links by Task

### I want to...

**Setup the project**
→ [GETTING_STARTED.md](GETTING_STARTED.md)

**Understand the architecture**
→ [ARCHITECTURE.md](ARCHITECTURE.md)

**Deploy to production**
→ [DEPLOYMENT.md](DEPLOYMENT.md)

**Test the API**
→ `postman_collection.json` or `websocket-test.html`

**Run tests**
→ `npm test` or see [NPM_SCRIPTS.md](NPM_SCRIPTS.md)

**Modify DEX logic**
→ [src/modules/orders/MockDexRouter.ts](src/modules/orders/MockDexRouter.ts)

**Change order states**
→ [src/workers/orderWorker.ts](src/workers/orderWorker.ts)

**Add new endpoints**
→ [src/modules/orders/order.controller.ts](src/modules/orders/order.controller.ts)

**Update database schema**
→ [prisma/schema.prisma](prisma/schema.prisma) → `npm run db:push`

**Configure environment**
→ [src/config/env.ts](src/config/env.ts)

**Check project status**
→ [CHECKLIST.md](CHECKLIST.md)

**See everything at once**
→ [COMPLETE_SUMMARY.md](COMPLETE_SUMMARY.md)

---

## 📊 File Categories

```
By Purpose:

📖 Documentation (11 files)
   ├─ README.md
   ├─ GETTING_STARTED.md
   ├─ QUICKSTART.md
   ├─ INSTALLATION.md
   ├─ ARCHITECTURE.md
   ├─ DEPLOYMENT.md
   ├─ SYSTEM_FLOW.md
   ├─ NPM_SCRIPTS.md
   ├─ CHECKLIST.md
   ├─ COMPLETE_SUMMARY.md
   └─ PROJECT_MAP.md (this file)

💻 Source Code (15 files)
   ├─ Entry: index.ts
   ├─ Config: env.ts
   ├─ Lib: prisma.ts, redis.ts, utils.ts
   ├─ Orders: 5 files
   ├─ WebSocket: 1 file
   ├─ Workers: 1 file
   ├─ Database: schema.prisma
   └─ Utils: websocket-test.html, setup.sh

🧪 Tests (3 files)
   ├─ MockDexRouter.test.ts
   ├─ order.validation.test.ts
   └─ integration.test.ts

⚙️ Configuration (6 files)
   ├─ package.json
   ├─ tsconfig.json
   ├─ jest.config.js
   ├─ .env.example
   ├─ .gitignore
   └─ Procfile
```

---

## 🎓 Learning Path

```
Beginner Path:
1. GETTING_STARTED.md (5 min)
2. README.md (10 min)
3. Run locally and test
4. Explore with Postman

Intermediate Path:
1. ARCHITECTURE.md (15 min)
2. Read source code
3. Run tests
4. Modify and experiment

Advanced Path:
1. SYSTEM_FLOW.md (deep dive)
2. Study worker.ts state machine
3. Implement custom features
4. Deploy to production

Complete Path:
1. Follow all guides in order
2. Understand every component
3. Deploy and monitor
4. Create demo video
```

---

**Map Version:** 1.0.0  
**Last Updated:** December 12, 2025

**Navigate:** Use this map to quickly find what you need in the project!
