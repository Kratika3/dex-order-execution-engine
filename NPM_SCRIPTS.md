# npm Scripts Reference

## Available Commands

### Development
```bash
# Start development server with hot reload
npm run dev
```
- Uses `tsx watch` for automatic reload on file changes
- Best for local development
- Shows detailed logs

### Production Build
```bash
# Compile TypeScript to JavaScript
npm run build
```
- Compiles `src/` → `dist/`
- Generates type declarations
- Creates source maps

```bash
# Start production server
npm start
```
- Runs compiled JavaScript from `dist/`
- Use after `npm run build`
- Optimized for production

### Database Commands
```bash
# Generate Prisma Client
npm run db:generate
```
- Generates TypeScript types from schema
- Required after schema changes
- Creates `@prisma/client`

```bash
# Push schema to database (development)
npm run db:push
```
- Syncs schema with database
- No migration files created
- Fast for prototyping

```bash
# Create migration (production)
npm run db:migrate
```
- Creates migration files
- Version controlled
- Safe for production

### Testing
```bash
# Run all tests once
npm test
```
- Runs Jest test suite
- Generates coverage report
- Exits after completion

```bash
# Run tests in watch mode
npm run test:watch
```
- Re-runs tests on file changes
- Best for TDD workflow
- Shows only changed tests

---

## Complete Command Reference

| Command | Description | When to Use |
|---------|-------------|-------------|
| `npm install` | Install all dependencies | First setup, after pulling changes |
| `npm run dev` | Start dev server | Local development |
| `npm run build` | Compile TypeScript | Before production deploy |
| `npm start` | Run production server | Production environment |
| `npm run db:generate` | Generate Prisma Client | After schema changes |
| `npm run db:push` | Sync schema to DB | Development sync |
| `npm run db:migrate` | Create migration | Production changes |
| `npm test` | Run tests once | CI/CD, verification |
| `npm run test:watch` | Watch mode tests | Test-driven development |

---

## Common Workflows

### Initial Setup
```bash
npm install
npm run db:generate
npm run db:push
npm run dev
```

### After Schema Changes
```bash
npm run db:generate
npm run db:push
# Restart server (Ctrl+C then npm run dev)
```

### Before Committing
```bash
npm test
npm run build
# If both pass, safe to commit
```

### Deploying to Production
```bash
npm run build
npm run db:migrate  # If schema changed
npm start
```

### Running Tests While Developing
```bash
# Terminal 1: Run server
npm run dev

# Terminal 2: Run tests in watch mode
npm run test:watch
```

---

## Environment-Specific Commands

### Development Environment
```bash
NODE_ENV=development npm run dev
```

### Production Environment
```bash
NODE_ENV=production npm start
```

### Test Environment
```bash
NODE_ENV=test npm test
```

---

## Debugging Commands

### Check TypeScript Compilation
```bash
# Compile without running
npm run build

# Check for type errors
npx tsc --noEmit
```

### Verify Database Connection
```bash
# Using Prisma CLI
npx prisma studio

# Opens database GUI at http://localhost:5555
```

### Check Prisma Schema
```bash
# Validate schema
npx prisma validate

# Format schema
npx prisma format
```

### View Generated Client
```bash
# Location of generated types
ls node_modules/.prisma/client
```

---

## Advanced Commands

### Database Seeding (Optional)
Create `prisma/seed.ts` then:
```bash
npx prisma db seed
```

### Reset Database (CAUTION!)
```bash
# Drops all data and recreates schema
npx prisma db push --force-reset
```

### View Database Schema
```bash
# Open Prisma Studio
npx prisma studio
```

### Generate Migration (Production)
```bash
# Create named migration
npx prisma migrate dev --name add_new_field
```

### Deploy Migrations (Production)
```bash
# Apply pending migrations
npx prisma migrate deploy
```

---

## CI/CD Pipeline Commands

### GitHub Actions / Railway / Render
```yaml
# Install
npm ci

# Build
npm run build

# Test
npm test

# Deploy (automatically runs)
npm start
```

---

## Troubleshooting Commands

### Clear Dependencies
```bash
rm -rf node_modules package-lock.json
npm install
```

### Regenerate Prisma Client
```bash
rm -rf node_modules/.prisma
npm run db:generate
```

### Clear TypeScript Build
```bash
rm -rf dist
npm run build
```

### Check for Outdated Packages
```bash
npm outdated
```

### Update Dependencies
```bash
# Update all to latest minor/patch
npm update

# Update to latest major (carefully!)
npx npm-check-updates -u
npm install
```

---

## Script Aliases

Add these to your shell profile for faster commands:

```bash
# ~/.bashrc or ~/.zshrc

# Development
alias dev="npm run dev"
alias test-watch="npm run test:watch"

# Database
alias db-gen="npm run db:generate"
alias db-push="npm run db:push"
alias db-studio="npx prisma studio"

# Build
alias build="npm run build"
alias start-prod="npm start"
```

Then use:
```bash
dev          # Instead of npm run dev
db-gen       # Instead of npm run db:generate
```

---

## Package.json Scripts Explained

```json
{
  "scripts": {
    "dev": "tsx watch src/index.ts",
    // tsx: TypeScript executor
    // watch: Auto-reload on changes
    
    "build": "tsc",
    // tsc: TypeScript compiler
    // Uses tsconfig.json settings
    
    "start": "node dist/index.js",
    // Runs compiled JavaScript
    
    "db:generate": "prisma generate",
    // Generates Prisma Client from schema
    
    "db:push": "prisma db push",
    // Syncs schema to database (dev)
    
    "db:migrate": "prisma migrate dev",
    // Creates migration files (prod)
    
    "test": "jest --coverage",
    // Runs Jest with coverage report
    
    "test:watch": "jest --watch"
    // Runs Jest in watch mode
  }
}
```

---

## Custom Scripts You Can Add

### Lint Code
```json
{
  "scripts": {
    "lint": "eslint src --ext .ts",
    "lint:fix": "eslint src --ext .ts --fix"
  }
}
```

### Format Code
```json
{
  "scripts": {
    "format": "prettier --write \"src/**/*.ts\"",
    "format:check": "prettier --check \"src/**/*.ts\""
  }
}
```

### Clean Build
```json
{
  "scripts": {
    "clean": "rm -rf dist",
    "clean:all": "rm -rf dist node_modules"
  }
}
```

### Combined Commands
```json
{
  "scripts": {
    "prebuild": "npm run clean",
    "prestart": "npm run build",
    "verify": "npm run lint && npm test && npm run build"
  }
}
```

---

## Quick Reference Card

```
┌─────────────────────────────────────────┐
│         Essential Commands              │
├─────────────────────────────────────────┤
│ npm install          Install deps       │
│ npm run dev          Start dev server   │
│ npm run build        Compile TS         │
│ npm start            Start prod server  │
│ npm test             Run tests          │
│ npm run db:generate  Generate Prisma    │
│ npm run db:push      Sync schema        │
└─────────────────────────────────────────┘
```

---

**Script Reference Version:** 1.0.0  
**Last Updated:** December 12, 2025
