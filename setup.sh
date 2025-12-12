#!/bin/bash

# Solana Order Execution Engine - Setup Script

echo "🚀 Setting up Solana Order Execution Engine..."

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check for .env file
if [ ! -f .env ]; then
    echo "⚠️  No .env file found. Creating from .env.example..."
    cp .env.example .env
    echo "📝 Please update .env with your Supabase and Upstash credentials"
    echo ""
    echo "Required variables:"
    echo "  - DATABASE_URL (Supabase PostgreSQL)"
    echo "  - REDIS_URL (Upstash Redis)"
    echo ""
    read -p "Press Enter to continue after updating .env..."
fi

# Generate Prisma Client
echo "🔧 Generating Prisma client..."
npm run db:generate

# Push schema to database
echo "📊 Pushing database schema..."
npm run db:push

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Verify your .env file has correct credentials"
echo "  2. Run 'npm run dev' to start the development server"
echo "  3. Open websocket-test.html in your browser to test"
echo "  4. Import postman_collection.json to test the API"
echo ""
