# Quick Start Guide

## 🚀 Get Running in 5 Minutes

### 1. Install Dependencies
```bash
cd backend_bitspeed
npm install
```

### 2. Setup Database

**PostgreSQL (Recommended):**
```bash
# Create .env file
cp .env.example .env

# Edit .env with your database URL
# DATABASE_URL="postgresql://user:password@localhost:5432/bitespeed"

# Run migrations
npm run prisma:push
```

**OR SQLite (for testing):**
```bash
echo 'DATABASE_URL="file:./dev.db"' > .env
npm run prisma:push
```

### 3. Start Server
```bash
npm run dev
```

Server runs on `http://localhost:3000`

## 📋 API Usage

### Identify a Customer
```bash
curl -X POST http://localhost:3000/identify \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@example.com",
    "phoneNumber": "1234567890"
  }'
```

### Response
```json
{
  "contact": {
    "primaryContatctId": 1,
    "emails": ["primary@example.com", "secondary@example.com"],
    "phoneNumbers": ["1234567890"],
    "secondaryContactIds": [2, 3]
  }
}
```

## 📁 Project Files

| File | Purpose |
|------|---------|
| `src/index.ts` | Main server and `/identify` endpoint |
| `prisma/schema.prisma` | Database schema |
| `package.json` | Dependencies and scripts |
| `SETUP.md` | Detailed setup guide |
| `IMPLEMENTATION_DETAILS.md` | Algorithm explanation |
| `README.md` | Full documentation |

## 🔧 Common Commands

```bash
npm run dev              # Start dev server
npm run build            # Compile TypeScript
npm start                # Run production server
npm run prisma:push      # Sync database
npm run prisma:generate  # Generate Prisma client
```

## 🌐 Deploy to Render

1. Push code to GitHub
2. Go to [render.com](https://render.com)
3. Click "New +" → "Web Service"
4. Select your repository
5. Use these commands:
   - Build: `npm install && npm run build && npm run prisma:push`
   - Start: `npm start`
6. Add environment variables from `.env.example`
7. Deploy!

Your endpoint: `https://your-app.onrender.com/identify`

## ✅ Testing

### Using Postman
1. Import `Bitespeed.postman_collection.json`
2. Update `base_url` variable to your server URL
3. Run requests

### Using cURL
```bash
# New contact
curl -X POST http://localhost:3000/identify \
  -H "Content-Type: application/json" \
  -d '{"email":"new@example.com","phoneNumber":"123"}'

# Link with existing
curl -X POST http://localhost:3000/identify \
  -H "Content-Type: application/json" \
  -d '{"email":"other@example.com","phoneNumber":"123"}'
```

## ❓ Troubleshooting

**Port in use?** Change PORT in `.env` or kill existing process
```bash
lsof -i :3000  # Find process
kill -9 <PID>  # Kill it
```

**Database error?** Verify `.env` DATABASE_URL and PostgreSQL is running

**Build error?** 
```bash
rm -rf node_modules dist
npm install
npm run build
```

## 📚 Full Documentation

- **SETUP.md** - Complete setup and deployment guide
- **IMPLEMENTATION_DETAILS.md** - Algorithm and design details
- **README.md** - API documentation and features

## 🎯 Next Steps

1. ✅ Clone/pull the repository
2. ✅ Run `npm install && npm run prisma:push`
3. ✅ Start with `npm run dev`
4. ✅ Test the `/identify` endpoint
5. ✅ Push to GitHub
6. ✅ Deploy to Render.com
7. ✅ Share the live endpoint URL

Happy coding! 🎉
