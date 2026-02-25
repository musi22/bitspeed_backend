@echo off
REM Bitespeed Backend Setup Script for Windows
REM This script automates the initial setup process

setlocal enabledelayedexpansion

echo.
echo 🚀 Bitespeed Backend - Setup Script
echo ===================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js v16+ first.
    echo    Download from: https://nodejs.org/
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✅ Node.js detected: %NODE_VERSION%
echo.

REM Check if npm is installed
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ npm is not installed.
    exit /b 1
)

for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo ✅ npm detected: %NPM_VERSION%
echo.

REM Step 1: Install dependencies
echo 📦 Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    exit /b 1
)
echo ✅ Dependencies installed
echo.

REM Step 2: Setup .env file
if not exist .env (
    echo 📝 Creating .env file from template...
    copy .env.example .env
    echo ✅ .env created
    echo.
    echo ⚠️  IMPORTANT: Edit .env and set your DATABASE_URL
    echo    Default: postgresql://postgres:password@localhost:5432/bitespeed
    echo.
) else (
    echo ✅ .env file already exists
    echo.
)

REM Step 3: Check database connection
echo 🔍 Checking database connection...
findstr /C:"DATABASE_URL" .env >nul
if %errorlevel% equ 0 (
    echo ✅ DATABASE_URL is set in .env
) else (
    echo ⚠️  DATABASE_URL not found in .env. Please add it manually.
)
echo.

REM Step 4: Generate Prisma client
echo 🔧 Generating Prisma client...
call npm run prisma:generate
if %errorlevel% neq 0 (
    echo ❌ Failed to generate Prisma client
    exit /b 1
)
echo ✅ Prisma client generated
echo.

REM Step 5: Run migrations
echo 📚 Setting up database schema...
call npm run prisma:push
if %errorlevel% neq 0 (
    echo ❌ Failed to setup database schema
    exit /b 1
)
echo ✅ Database schema created
echo.

REM Step 6: Build TypeScript
echo 🔨 Building TypeScript...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Failed to build TypeScript
    exit /b 1
)
echo ✅ Build successful
echo.

echo ===================================
echo ✨ Setup Complete!
echo ===================================
echo.
echo Next steps:
echo 1. Start development server:
echo    npm run dev
echo.
echo 2. Test the API:
echo    curl -X POST http://localhost:3000/identify ^
echo      -H "Content-Type: application/json" ^
echo      -d "{\"email\":\"test@example.com\",\"phoneNumber\":\"1234\"}"
echo.
echo 3. Documentation:
echo    - QUICKSTART.md              - Get running in 5 minutes
echo    - SETUP.md                   - Detailed setup and deployment
echo    - README.md                  - API documentation
echo    - IMPLEMENTATION_DETAILS.md  - Algorithm explanation
echo    - TESTING.md                 - Comprehensive test cases
echo.
echo Happy coding! 🎉
echo.

pause
