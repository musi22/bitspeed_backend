# Bitespeed Backend - Complete Setup Guide

## Prerequisites

- **Node.js**: v16 or higher
- **npm**: v8 or higher
- **PostgreSQL**: v12 or higher (or any SQL database supported by Prisma)
- **Git**: For version control

## Local Development Setup

### Step 1: Initialize Node.js Project

```bash
cd backend_bitspeed
npm install
```

This installs all dependencies defined in `package.json`.

### Step 2: Configure Database

#### Option A: PostgreSQL (Recommended)

1. **Install PostgreSQL**:
   - Windows: Download from [postgresql.org](https://www.postgresql.org/download/windows/)
   - Mac: `brew install postgresql`
   - Linux: `sudo apt-get install postgresql`

2. **Create a database**:
   ```bash
   psql -U postgres
   CREATE DATABASE bitespeed;
   \q
   ```

3. **Update `.env` file**:
   ```
   DATABASE_URL="postgresql://postgres:your_password@localhost:5432/bitespeed?schema=public"
   NODE_ENV="development"
   PORT=3000
   ```

#### Option B: SQLite (Quick Testing)

For quick testing without PostgreSQL:

```
DATABASE_URL="file:./dev.db"
```

### Step 3: Setup Database Schema

Run the Prisma migration:

```bash
npm run prisma:push
```

This creates the Contact table in your database.

### Step 4: Start Development Server

```bash
npm run dev
```

The server should start on `http://localhost:3000`

## Testing the API

### Using cURL

```bash
# Test 1: Create a new contact
curl -X POST http://localhost:3000/identify \
  -H "Content-Type: application/json" \
  -d '{"email": "lorraine@hillvalley.edu", "phoneNumber": "123456"}'

# Test 2: Link with existing phone number, new email
curl -X POST http://localhost:3000/identify \
  -H "Content-Type: application/json" \
  -d '{"email": "mcfly@hillvalley.edu", "phoneNumber": "123456"}'

# Test 3: Identify with just phone number
curl -X POST http://localhost:3000/identify \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "123456"}'

# Test 4: Link two separate contact groups
curl -X POST http://localhost:3000/identify \
  -H "Content-Type: application/json" \
  -d '{"email": "george@hillvalley.edu", "phoneNumber": "717171"}'

curl -X POST http://localhost:3000/identify \
  -H "Content-Type: application/json" \
  -d '{"email": "george@hillvalley.edu", "phoneNumber": "717171"}'
```

### Using Postman

1. Open Postman
2. Create a new POST request to `http://localhost:3000/identify`
3. Set headers: `Content-Type: application/json`
4. Set body (JSON):
   ```json
   {
     "email": "user@example.com",
     "phoneNumber": "1234567890"
   }
   ```
5. Click Send

## Deployment on Render.com

### Step 1: Push to GitHub

```bash
git init
git add .
git commit -m "initial: setup bitespeed backend"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/bitespeed-backend.git
git push -u origin main
```

### Step 2: Create Render Account

1. Go to [render.com](https://render.com)
2. Sign up with GitHub
3. Connect your GitHub account

### Step 3: Create PostgreSQL Database

1. Click "New +"
2. Select "PostgreSQL"
3. Name: `bitespeed-db`
4. Region: Choose closest to you
5. PostgreSQL Version: 15
6. Click "Create Database"
7. Copy the **Internal Database URL** (starts with `postgresql://`)

### Step 4: Create Web Service

1. Click "New +"
2. Select "Web Service"
3. Connect your GitHub repository
4. Name: `bitespeed-api`
5. Region: Same as database
6. Branch: `main`
7. Runtime: `node`
8. Build Command: `npm install && npm run build && npm run prisma:push`
9. Start Command: `npm start`

### Step 5: Set Environment Variables

In the Web Service settings, go to "Environment":

```
DATABASE_URL=postgresql://...@dpg-xxxxx.onrender.com/bitespeed_xxxx
NODE_ENV=production
PORT=3000
```

### Step 6: Deploy

Click "Create Web Service" - deployment will start automatically.

Once deployed, your endpoint will be available at:
```
https://bitespeed-api.onrender.com/identify
```

## Project Structure

```
backend_bitspeed/
├── src/
│   ├── index.ts              # Main server file with /identify endpoint
│   └── test-utils.ts         # Testing utilities
├── prisma/
│   ├── schema.prisma         # Database schema
│   └── migrations/           # Database migrations
├── dist/                     # Compiled JavaScript (generated)
├── package.json              # Project dependencies
├── tsconfig.json             # TypeScript configuration
├── .env.example              # Environment variables template
├── .gitignore                # Git ignore rules
└── README.md                 # Project documentation
```

## Key Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Compile TypeScript to JavaScript |
| `npm start` | Run compiled server |
| `npm run prisma:push` | Sync schema with database |
| `npm run prisma:generate` | Generate Prisma client |

## Troubleshooting

### Database Connection Error

**Error**: `Can't reach database server`

**Solution**:
1. Verify PostgreSQL is running: `psql -U postgres`
2. Check DATABASE_URL in `.env`
3. Ensure database exists: `psql -l`

### Port Already in Use

**Error**: `EADDRINUSE: address already in use :::3000`

**Solution**:
```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or use a different port
PORT=3001 npm run dev
```

### TypeScript Errors

**Error**: `Cannot find module` or compilation errors

**Solution**:
```bash
npm install
npm run prisma:generate
npm run build
```

### Prisma Migration Issues

**Solution**:
```bash
# Reset database (WARNING: Clears all data)
npx prisma migrate reset

# Or push schema without migration
npm run prisma:push
```

## Environment Variables

### Development
```
DATABASE_URL="postgresql://user:password@localhost:5432/bitespeed"
NODE_ENV="development"
PORT=3000
```

### Production (Render)
```
DATABASE_URL="postgresql://..."  # From Render
NODE_ENV="production"
PORT=3000
```

## API Response Examples

### Success (200 OK)
```json
{
  "contact": {
    "primaryContatctId": 1,
    "emails": ["lorraine@hillvalley.edu", "mcfly@hillvalley.edu"],
    "phoneNumbers": ["123456"],
    "secondaryContactIds": [23]
  }
}
```

### Error (400 Bad Request)
```json
{
  "error": "Either email or phoneNumber must be provided"
}
```

### Error (500 Internal Server Error)
```json
{
  "error": "Internal server error"
}
```

## Next Steps

1. ✅ Setup local development environment
2. ✅ Test API endpoints locally
3. ✅ Push code to GitHub
4. ✅ Deploy to Render.com
5. ✅ Share the deployed endpoint URL

## Support

For issues or questions:
- Check the README.md for API documentation
- Review the code comments in `src/index.ts`
- Check Render.com logs if deployment fails
- Verify database connection string format

Good luck! 🚀
