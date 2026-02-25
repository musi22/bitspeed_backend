# Essential Commands Reference

Quick reference for all common commands.

## 🚀 Getting Started

```bash
# Install dependencies (run first!)
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your database URL
nano .env  # or use your favorite editor

# Setup database schema
npm run prisma:push

# Start development server
npm run dev
```

Server will run on `http://localhost:3000`

---

## 📚 NPM Scripts

All scripts defined in `package.json`:

### Development

```bash
# Start with hot reload (development)
npm run dev

# Start production server
npm start

# Build TypeScript to JavaScript
npm run build
```

### Database

```bash
# Sync schema to database (no migration file)
npm run prisma:push

# Create a database migration
npm run prisma:migrate init              # First time
npm run prisma:migrate -- --name create_contacts  # Future migrations

# Generate/regenerate Prisma client
npm run prisma:generate

# Open Prisma Studio (visual database browser)
npx prisma studio
```

### Testing

```bash
# Run tests (when test setup is added)
npm test
```

---

## 🔧 Common Tasks

### Setup for First Time

```bash
npm install                    # Install dependencies
cp .env.example .env          # Create .env file
# Edit .env - set DATABASE_URL
npm run prisma:push           # Create database schema
npm run dev                   # Start server
```

### Reset Everything

```bash
# Reset database (CLEARS ALL DATA!)
npx prisma migrate reset

# Or just rebuild
rm -rf dist node_modules
npm install
npm run build
npm run prisma:push
npm start
```

### Database Management

```bash
# View database with GUI
npx prisma studio

# Check database status
npm run prisma:push --preview

# See migration status
npx prisma migrate status
```

### Building for Production

```bash
npm run build                 # Compile TypeScript
npm run prisma:generate       # Generate Prisma client
npm start                     # Run production server
```

---

## 📡 Testing the API

### Using cURL

```bash
# Create new contact
curl -X POST http://localhost:3000/identify \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","phoneNumber":"1234567890"}'

# Link with existing phone, new email
curl -X POST http://localhost:3000/identify \
  -H "Content-Type: application/json" \
  -d '{"email":"other@example.com","phoneNumber":"1234567890"}'

# Query by phone only
curl -X POST http://localhost:3000/identify \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"1234567890"}'

# Health check
curl http://localhost:3000/health
```

### Using Postman

1. Import `Bitespeed.postman_collection.json`
2. Update `base_url` variable to `http://localhost:3000`
3. Run requests

### Using Automated Script

```bash
# On Linux/Mac
bash test-scenarios.sh

# On Windows
test-scenarios.bat
```

---

## 🚀 Deployment

### Deploy to Render.com

```bash
# 1. Push code to GitHub
git add .
git commit -m "feat: complete bitespeed backend"
git push origin main

# 2. On Render.com:
# - Create PostgreSQL database
# - Create Web Service from GitHub
# - Build command: npm install && npm run build && npm run prisma:push
# - Start command: npm start
# - Set DATABASE_URL environment variable
# - Deploy!
```

### Local Production Testing

```bash
npm run build                 # Compile
npm run prisma:push          # Setup database
NODE_ENV=production npm start # Run as production
```

---

## 🐛 Troubleshooting

### Port Already in Use (Port 3000)

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux
lsof -i :3000
kill -9 <PID>

# Or use different port
PORT=3001 npm run dev
```

### Database Connection Failed

```bash
# Check PostgreSQL is running
psql -U postgres

# Check connection string in .env
cat .env

# Test connection manually
psql postgresql://user:password@localhost:5432/bitespeed
```

### TypeScript Errors

```bash
# Rebuild everything
rm -rf dist
npm run build

# Check types
npx tsc --noEmit
```

### Prisma Errors

```bash
# Regenerate client
npm run prisma:generate

# Sync schema
npm run prisma:push

# Reset (CLEARS DATA!)
npx prisma migrate reset
```

---

## 📊 Environment Variables

Create `.env` file:

```bash
# Database connection
DATABASE_URL="postgresql://user:password@localhost:5432/bitespeed"

# Server configuration
NODE_ENV="development"
PORT=3000
```

For production (Render.com):
```bash
DATABASE_URL="postgresql://..."  # From Render
NODE_ENV="production"
PORT=3000
```

---

## 🔄 Git Workflow

```bash
# Clone repository
git clone https://github.com/your-username/bitespeed-backend.git
cd bitespeed-backend

# Create feature branch
git checkout -b feature/your-feature

# Make changes and commit
git add .
git commit -m "feat: your feature description"

# Push to GitHub
git push origin feature/your-feature

# Create Pull Request on GitHub
```

---

## 📚 Documentation Commands

Open documentation in your editor:

```bash
# View main documentation
cat README.md

# View quick start
cat QUICKSTART.md

# View setup guide
cat SETUP.md

# View API specification
cat API_SPECIFICATION.md

# View algorithm details
cat IMPLEMENTATION_DETAILS.md

# View test cases
cat TESTING.md

# View development guidelines
cat DEVELOPMENT.md
```

---

## 🔍 Project Information

```bash
# Check Node.js version
node --version

# Check npm version
npm --version

# List installed packages
npm list --depth=0

# Check project structure
ls -la

# View package.json scripts
cat package.json | grep -A 20 '"scripts"'
```

---

## ⚙️ Advanced Commands

### Prisma Operations

```bash
# Open Prisma Studio (GUI)
npx prisma studio

# View schema visualization
npx prisma studio --port 5556

# Check migration status
npx prisma migrate status

# Create migration without applying
npx prisma migrate plan --name your_migration

# Apply specific migration
npx prisma migrate resolve --rolled-back migration_id
```

### Development Tools

```bash
# Type check without building
npx tsc --noEmit

# Check code with ESLint (if configured)
npm run lint

# Format code with Prettier (if configured)
npm run format

# Run tests
npm test

# Generate coverage report
npm run test:coverage
```

### Database

```bash
# Connect to PostgreSQL directly
psql postgresql://user:password@localhost:5432/bitespeed

# In psql:
\dt                    # List tables
SELECT * FROM "Contact";  # View contacts
\q                     # Quit

# Using another tool
pgAdmin 4              # Web GUI
DBeaver                # Desktop GUI
```

---

## 🎯 Quick Reference by Task

| Task | Command |
|------|---------|
| **Setup** | `npm install && npm run prisma:push` |
| **Dev** | `npm run dev` |
| **Build** | `npm run build` |
| **Start** | `npm start` |
| **Database** | `npx prisma studio` |
| **Test** | See TESTING.md |
| **Deploy** | See SETUP.md |

---

## 📋 Checklist Before Deployment

```bash
# 1. Install dependencies
npm install
✅ Check: npm list shows all packages

# 2. Check TypeScript
npm run build
✅ Check: dist/ folder created

# 3. Setup database
npm run prisma:push
✅ Check: No errors

# 4. Test server
npm run dev
✅ Check: Server starts on port 3000

# 5. Test API
curl http://localhost:3000/health
✅ Check: Returns { "status": "ok" }

# 6. Test identify
curl -X POST http://localhost:3000/identify \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
✅ Check: Returns contact response

# 7. Check code
git status
✅ Check: All changes committed

# 8. Push to GitHub
git push origin main
✅ Check: Code is on GitHub

# 9. Deploy
# Follow SETUP.md deployment section
✅ Check: App runs on Render.com
```

---

## 🆘 Help & Support

### Get Help

```bash
# View README
cat README.md

# View QUICKSTART
cat QUICKSTART.md

# View full setup guide
cat SETUP.md

# View documentation index
cat INDEX.md
```

### Check Status

```bash
# Is Node installed?
node --version

# Is npm working?
npm --version

# Can I access Postgres?
psql -U postgres

# Is server running?
curl http://localhost:3000/health
```

---

## 💡 Pro Tips

1. **Keep terminal open**: `npm run dev` runs while you code
2. **Use Prisma Studio**: `npx prisma studio` for visual database browsing
3. **Check logs**: Look for error messages in terminal output
4. **Test before pushing**: Run API tests before deploying
5. **Use Postman**: Import collection for API testing
6. **Read docs**: Most answers are in the documentation files
7. **Git commits**: Make small, meaningful commits
8. **Environment variables**: Never commit `.env` file

---

## 📞 Still Need Help?

1. Check [INDEX.md](INDEX.md) for documentation
2. Look in [TESTING.md](TESTING.md) for examples
3. Review [API_SPECIFICATION.md](API_SPECIFICATION.md) for API details
4. Check [IMPLEMENTATION_DETAILS.md](IMPLEMENTATION_DETAILS.md) for algorithm
5. See [DEVELOPMENT.md](DEVELOPMENT.md) for guidelines

**Everything is documented! Read the docs before asking.**

---

**Last Updated**: February 25, 2024
**Status**: ✅ Complete
