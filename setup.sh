#!/bin/bash

# Bitespeed Backend Setup Script
# This script automates the initial setup process

set -e  # Exit on error

echo "🚀 Bitespeed Backend - Setup Script"
echo "==================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v16+ first."
    echo "   Download from: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js detected: $(node --version)"
echo ""

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed."
    exit 1
fi

echo "✅ npm detected: $(npm --version)"
echo ""

# Step 1: Install dependencies
echo "📦 Installing dependencies..."
npm install
echo "✅ Dependencies installed"
echo ""

# Step 2: Setup .env file
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "✅ .env created"
    echo ""
    echo "⚠️  IMPORTANT: Edit .env and set your DATABASE_URL"
    echo "   Default: postgresql://postgres:password@localhost:5432/bitespeed"
    echo ""
else
    echo "✅ .env file already exists"
    echo ""
fi

# Step 3: Check database connection
echo "🔍 Checking database connection..."
if grep -q "DATABASE_URL" .env; then
    echo "✅ DATABASE_URL is set in .env"
else
    echo "⚠️  DATABASE_URL not found in .env. Please add it manually."
fi
echo ""

# Step 4: Generate Prisma client
echo "🔧 Generating Prisma client..."
npm run prisma:generate
echo "✅ Prisma client generated"
echo ""

# Step 5: Run migrations
echo "📚 Setting up database schema..."
npm run prisma:push
echo "✅ Database schema created"
echo ""

# Step 6: Build TypeScript
echo "🔨 Building TypeScript..."
npm run build
echo "✅ Build successful"
echo ""

echo "==================================="
echo "✨ Setup Complete!"
echo "==================================="
echo ""
echo "Next steps:"
echo "1. Start development server:"
echo "   npm run dev"
echo ""
echo "2. Test the API:"
echo "   curl -X POST http://localhost:3000/identify \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"email\":\"test@example.com\",\"phoneNumber\":\"1234\"}'"
echo ""
echo "3. Documentation:"
echo "   - QUICKSTART.md     - Get running in 5 minutes"
echo "   - SETUP.md          - Detailed setup & deployment guide"
echo "   - README.md         - API documentation"
echo "   - IMPLEMENTATION_DETAILS.md - Algorithm explanation"
echo "   - TESTING.md        - Comprehensive test cases"
echo ""
echo "Happy coding! 🎉"
