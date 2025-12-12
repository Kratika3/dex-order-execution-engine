# Folder Structure

```
Kratika/
├── prisma/
│   └── schema.prisma           # Database schema with Order model
├── src/
│   ├── config/
│   │   └── env.ts              # Environment validation with Zod
│   ├── lib/
│   │   ├── prisma.ts           # Prisma client singleton
│   │   ├── redis.ts            # Redis clients (BullMQ + Pub/Sub)
│   │   └── utils.ts            # Helper functions (sleep, txHash generator)
│   ├── modules/
│   │   ├── orders/
│   │   │   ├── MockDexRouter.ts      # DEX simulation (Raydium/Meteora)
│   │   │   ├── order.controller.ts   # HTTP endpoint handlers
│   │   │   ├── order.queue.ts        # BullMQ queue configuration
│   │   │   ├── order.routes.ts       # Route registration
│   │   │   └── order.validation.ts   # Zod validation schemas
│   │   └── websocket/
│   │       └── websocket.routes.ts   # WebSocket handlers
│   ├── tests/
│   │   ├── MockDexRouter.test.ts     # Unit tests for DEX router
│   │   └── order.validation.test.ts  # Unit tests for validation
│   ├── workers/
│   │   └── orderWorker.ts      # BullMQ worker with state machine
│   └── index.ts                # Server entry point
├── .env.example                # Environment variables template
├── .gitignore                  # Git ignore rules
├── jest.config.js              # Jest test configuration
├── package.json                # Dependencies and scripts
├── Procfile                    # Deployment configuration
├── postman_collection.json     # Postman API collection
├── README.md                   # Project documentation
├── setup.sh                    # Setup script
├── tsconfig.json               # TypeScript configuration
└── websocket-test.html         # WebSocket testing UI
```

## Key Components

### Phase 1: Configuration & Infrastructure
- **env.ts**: Validates DATABASE_URL and REDIS_URL with Zod
- **schema.prisma**: Order model with status enum and JSON logs
- **Redis setup**: Separate clients for BullMQ and Pub/Sub

### Phase 2: Core Logic
- **MockDexRouter.ts**: Simulates Raydium/Meteora with realistic delays
  - `getRaydiumQuote()`: ±2% variance, 200ms delay
  - `getMeteorQuote()`: ±3-5% variance, 200ms delay
  - `executeSwap()`: 2-3s confirmation delay
  
- **orderWorker.ts**: BullMQ worker processing orders
  - Concurrency: 10 jobs
  - Rate limit: 100/minute
  - State machine: PENDING → ROUTING → BUILDING → SUBMITTED → CONFIRMED
  - Redis Pub/Sub: Publishes updates at each state change

### Phase 3: API & WebSocket
- **order.controller.ts**: HTTP endpoints
  - POST /api/orders (create order)
  - GET /api/orders/:orderId (get order details)
  - GET /api/orders (list orders with filters)

- **websocket.routes.ts**: WebSocket endpoint
  - /ws/orders/:orderId
  - Subscribes to Redis channel
  - Real-time status streaming

### Phase 4: Testing & Deployment
- **Unit tests**: MockDexRouter, validation logic
- **Postman collection**: API testing
- **HTML test client**: WebSocket testing
- **Deployment**: Railway/Render ready (Procfile)

## Architecture Benefits

1. **Vertical Slice**: Features grouped by domain, not layer
2. **Scalability**: Redis Pub/Sub allows multiple WebSocket servers
3. **Resilience**: BullMQ retry with exponential backoff
4. **Observability**: Comprehensive logging at each state
5. **Type Safety**: Full TypeScript with strict mode
