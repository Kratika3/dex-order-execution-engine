# System Flow Diagram

## Complete Order Execution Flow

```
┌─────────────┐
│   Client    │
│  (Browser/  │
│  Postman)   │
└──────┬──────┘
       │
       │ 1. POST /api/orders
       │    { pair, amount, direction }
       ▼
┌─────────────────────────────────────────┐
│         Fastify HTTP Server             │
│                                         │
│  ┌───────────────────────────────┐    │
│  │   order.controller.ts         │    │
│  │   - Validate with Zod         │    │
│  │   - Create Order (PENDING)    │    │
│  │   - Add to BullMQ Queue       │    │
│  └───────────┬───────────────────┘    │
└──────────────┼──────────────────────────┘
               │
               │ 2. Returns orderId
               ▼
        ┌─────────────┐
        │   Client    │
        │  Upgrades   │
        │     to      │
        │  WebSocket  │
        └──────┬──────┘
               │
               │ 3. WS: /ws/orders/:orderId
               ▼
┌─────────────────────────────────────────┐
│      WebSocket Handler                  │
│                                         │
│  ┌───────────────────────────────┐    │
│  │  websocket.routes.ts          │    │
│  │  - Connect to Redis Pub/Sub   │    │
│  │  - Subscribe to channel        │    │
│  │    "order-updates:{orderId}"  │    │
│  └───────────────────────────────┘    │
└─────────────────────────────────────────┘
               │
               │ Listening for updates...
               │
     ┌─────────┴─────────┐
     │                   │
     ▼                   │
┌──────────────────┐     │
│   Redis Pub/Sub  │     │
│   (Upstash)      │     │
│                  │     │
│  Channel:        │     │
│  order-updates:  │     │
│  {orderId}       │     │
└────────▲─────────┘     │
         │               │
         │ Publishes     │ Receives
         │ Updates       │ Updates
         │               │
    ┌────┴──────┐        │
    │           │        │
    ▼           │        ▼
┌─────────────────────────────────────────┐
│        BullMQ Worker                    │
│        (orderWorker.ts)                 │
│                                         │
│  Concurrency: 10                        │
│  Rate Limit: 100/min                    │
│                                         │
│  ┌───────────────────────────────┐    │
│  │  State Machine:               │    │
│  │                               │    │
│  │  1. PENDING                   │    │
│  │     ↓ Publish update          │    │
│  │                               │    │
│  │  2. ROUTING                   │    │
│  │     - Fetch Raydium quote     │    │
│  │     - Fetch Meteora quote     │    │
│  │     - Compare prices          │    │
│  │     - Select best DEX         │    │
│  │     ↓ Publish update          │    │
│  │                               │    │
│  │  3. BUILDING                  │    │
│  │     - Prepare transaction     │    │
│  │     ↓ Publish update          │    │
│  │                               │    │
│  │  4. SUBMITTED                 │    │
│  │     - Execute swap (2-3s)     │    │
│  │     - Generate txHash         │    │
│  │     ↓ Publish update          │    │
│  │                               │    │
│  │  5. CONFIRMED                 │    │
│  │     - Save txHash             │    │
│  │     - Save execution price    │    │
│  │     ↓ Publish update          │    │
│  │                               │    │
│  │  6. FAILED (if error)         │    │
│  │     - Log error               │    │
│  │     - Retry (exponential)     │    │
│  │     ↓ Publish update          │    │
│  └───────────────────────────────┘    │
└─────────────┬───────────────────────────┘
              │
              │ All state changes saved
              ▼
┌─────────────────────────────────────────┐
│        PostgreSQL Database              │
│        (Supabase)                       │
│                                         │
│  ┌───────────────────────────────┐    │
│  │  Order Table                  │    │
│  │  - id (UUID)                  │    │
│  │  - pair (SOL-USDC)            │    │
│  │  - amount (10.5)              │    │
│  │  - direction (BUY/SELL)       │    │
│  │  - status (CONFIRMED)         │    │
│  │  - logs (JSON array)          │    │
│  │  - txHash                     │    │
│  │  - executionPrice             │    │
│  │  - createdAt                  │    │
│  └───────────────────────────────┘    │
└─────────────────────────────────────────┘
```

## Data Flow Example

### Request:
```json
POST /api/orders
{
  "pair": "SOL-USDC",
  "amount": 10.5,
  "direction": "BUY"
}
```

### Response:
```json
{
  "orderId": "a1b2c3d4-...",
  "status": "PENDING",
  "message": "Order created and queued for processing"
}
```

### WebSocket Updates (Real-time):

```javascript
// Update 1: Order queued
{
  "orderId": "a1b2c3d4-...",
  "status": "PENDING",
  "timestamp": "2025-12-12T10:00:00.000Z"
}

// Update 2: Fetching quotes
{
  "orderId": "a1b2c3d4-...",
  "status": "ROUTING",
  "timestamp": "2025-12-12T10:00:01.000Z"
}

// Update 3: Transaction building
{
  "orderId": "a1b2c3d4-...",
  "status": "BUILDING",
  "executionPrice": 148.95,
  "timestamp": "2025-12-12T10:00:01.500Z"
}

// Update 4: Transaction submitted
{
  "orderId": "a1b2c3d4-...",
  "status": "SUBMITTED",
  "timestamp": "2025-12-12T10:00:02.000Z"
}

// Update 5: Execution confirmed
{
  "orderId": "a1b2c3d4-...",
  "status": "CONFIRMED",
  "txHash": "5J7K8L9M...",
  "executionPrice": 148.93,
  "timestamp": "2025-12-12T10:00:04.500Z"
}
```

## Component Interaction

```
┌──────────────┐
│   Fastify    │──────┐
│   Server     │      │
└──────────────┘      │
                      │
┌──────────────┐      │    ┌──────────────┐
│   Prisma     │◄─────┼───►│  Supabase    │
│   Client     │      │    │  PostgreSQL  │
└──────────────┘      │    └──────────────┘
                      │
┌──────────────┐      │    ┌──────────────┐
│   BullMQ     │◄─────┼───►│   Upstash    │
│   Queue      │      │    │   Redis      │
└──────────────┘      │    └──────────────┘
                      │
┌──────────────┐      │
│  WebSocket   │◄─────┘
│  Handler     │
└──────────────┘
        │
        │ Pub/Sub
        ▼
┌──────────────┐
│    Redis     │
│   Pub/Sub    │
└──────────────┘
```

## Concurrency Model

```
Client 1 ──┐
Client 2 ──┤
Client 3 ──┤
Client 4 ──┤    ┌─────────────────────┐
Client 5 ──┼───►│   BullMQ Queue      │
Client 6 ──┤    │   (Async)           │
Client 7 ──┤    └──────────┬──────────┘
Client 8 ──┤               │
Client 9 ──┤               │ Rate: 100/min
Client 10 ─┘               │
                           ▼
            ┌──────────────────────────────┐
            │   Worker Pool (10 Workers)   │
            ├──────────────────────────────┤
            │ Worker 1 │ Processing Order A│
            │ Worker 2 │ Processing Order B│
            │ Worker 3 │ Processing Order C│
            │ Worker 4 │ Processing Order D│
            │ Worker 5 │ Processing Order E│
            │ Worker 6 │ Processing Order F│
            │ Worker 7 │ Processing Order G│
            │ Worker 8 │ Processing Order H│
            │ Worker 9 │ Processing Order I│
            │ Worker 10│ Processing Order J│
            └──────────────────────────────┘
                      │
                      │ Each takes 3-4s
                      ▼
            ┌──────────────────┐
            │  Database        │
            │  Redis Pub/Sub   │
            └──────────────────┘
```

## Retry Logic Flow

```
Order Processing
       │
       ▼
   Attempt 1
       │
       ├─ Success ──► CONFIRMED
       │
       └─ Failure
           │
           ▼ Wait 2s
       Attempt 2
           │
           ├─ Success ──► CONFIRMED
           │
           └─ Failure
               │
               ▼ Wait 4s
           Attempt 3
               │
               ├─ Success ──► CONFIRMED
               │
               └─ Failure ──► FAILED
                               (Logged)
```

## Technology Stack

```
┌────────────────────────────────────┐
│         Application Layer          │
│                                    │
│  ┌──────────┐  ┌──────────────┐  │
│  │ Fastify  │  │  TypeScript  │  │
│  └──────────┘  └──────────────┘  │
└────────────────────────────────────┘
              │
              ▼
┌────────────────────────────────────┐
│         Business Logic             │
│                                    │
│  ┌──────────┐  ┌──────────────┐  │
│  │ BullMQ   │  │ MockDexRouter│  │
│  └──────────┘  └──────────────┘  │
└────────────────────────────────────┘
              │
              ▼
┌────────────────────────────────────┐
│         Data Layer                 │
│                                    │
│  ┌──────────┐  ┌──────────────┐  │
│  │ Prisma   │  │     Zod      │  │
│  └──────────┘  └──────────────┘  │
└────────────────────────────────────┘
              │
              ▼
┌────────────────────────────────────┐
│      Infrastructure Layer          │
│                                    │
│  ┌──────────┐  ┌──────────────┐  │
│  │ Supabase │  │   Upstash    │  │
│  │   (PG)   │  │   (Redis)    │  │
│  └──────────┘  └──────────────┘  │
└────────────────────────────────────┘
```
