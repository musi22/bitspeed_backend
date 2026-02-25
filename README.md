# Bitespeed Backend - Identity Reconciliation Service

A Node.js backend service that identifies and reconciles customer identities across multiple orders by linking contacts based on shared email addresses and phone numbers.

## Features

- **Identity Reconciliation**: Links customers across multiple orders using email and phone number
- **Primary/Secondary Contacts**: Automatically designates the oldest contact as primary
- **Transitive Relationships**: Handles complex linking scenarios where contacts connect indirectly
- **RESTful API**: Simple POST endpoint for identity identification

## Tech Stack

- **Runtime**: Node.js
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma

## Setup Instructions

### Prerequisites

- Node.js (v16+)
- PostgreSQL (or any supported SQL database)
- npm or yarn

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   Update `.env` with your database connection string:
   ```
   DATABASE_URL="postgresql://user:password@localhost:5432/bitespeed?schema=public"
   NODE_ENV="development"
   PORT=3000
   ```

3. **Setup Prisma and database:**
   ```bash
   npm run prisma:push
   ```
   Or use migrations:
   ```bash
   npm run prisma:migrate init
   ```

4. **Generate Prisma client:**
   ```bash
   npm run prisma:generate
   ```

### Running the Server

**Development mode** (with hot reload):
```bash
npm run dev
```

**Production mode:**
```bash
npm run build
npm start
```

## API Endpoints

### POST `/identify`

Identifies a customer and returns consolidated contact information.

**Request:**
```json
{
  "email": "user@example.com",
  "phoneNumber": "1234567890"
}
```

**Response (200 OK):**
```json
{
  "contact": {
    "primaryContatctId": 1,
    "emails": ["user@example.com", "other@example.com"],
    "phoneNumbers": ["1234567890"],
    "secondaryContactIds": [2, 3]
  }
}
```

**Notes:**
- Either `email` or `phoneNumber` (or both) must be provided
- If no matching contacts exist, a new primary contact is created
- If a request contains information that matches existing contacts but with new details, a secondary contact is created
- Primary contacts are determined by creation time (oldest is primary)

### GET `/health`

Health check endpoint.

**Response (200 OK):**
```json
{
  "status": "ok"
}
```

## Database Schema

### Contact Table

| Field | Type | Description |
|-------|------|-------------|
| id | Int | Primary key |
| phoneNumber | String? | Customer's phone number |
| email | String? | Customer's email address |
| linkedId | Int? | ID of the primary contact this is linked to |
| linkPrecedence | String | "primary" or "secondary" |
| createdAt | DateTime | Record creation timestamp |
| updatedAt | DateTime | Record last update timestamp |
| deletedAt | DateTime? | Soft delete timestamp |

## Example Scenario

**Initial Request:**
```json
{
  "email": "lorraine@hillvalley.edu",
  "phoneNumber": "123456"
}
```

**Database State:** Creates contact with id=1 as primary

**Second Request:**
```json
{
  "email": "mcfly@hillvalley.edu",
  "phoneNumber": "123456"
}
```

**Database State:** Creates contact with id=23 as secondary, linked to id=1

**Response:**
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

## Deployment

### Live Endpoint

The API is currently hosted and ready to use:

**Base URL:** `https://bitspeed-backend-76xg.onrender.com`

**Identify Endpoint:** `https://bitspeed-backend-76xg.onrender.com/identify`

### Deploying Your Own Instance

#### Option 1: Using Render.com (Recommended)

1. Push your code to GitHub (Done ✓)
2. Go to [render.com](https://render.com) and sign up
3. Click "New +" and select "Web Service"
4. Connect your GitHub repository: `https://github.com/musi22/bitspeed_backend`
5. Configure the service:
   - Name: `bitspeed-backend`
   - Runtime: `Node`
   - Build Command: `npm install && npm run prisma:generate && npm run build`
   - Start Command: `npm start`
6. Add environment variable:
   - `DATABASE_URL`: PostgreSQL connection string (get free DB from Render or Neon)
   - `NODE_ENV`: `production`
7. Click "Create Web Service"

Your endpoint will be available at: `https://your-service.onrender.com/identify`

#### Option 2: Using Vercel

1. Go to [vercel.com](https://vercel.com) and sign up
2. Click "New Project" and select your GitHub repository
3. Add environment variable: `DATABASE_URL` with your PostgreSQL connection string
4. Click "Deploy"

Your endpoint will be available at: `https://your-project.vercel.app/identify`

#### Free PostgreSQL Options:
- [Render PostgreSQL](https://render.com/docs/databases)
- [Neon](https://neon.tech)
- [Supabase](https://supabase.com)

## Error Handling

- **400 Bad Request**: Missing both email and phoneNumber
- **500 Internal Server Error**: Database or server errors

## Git Workflow

This project uses small, meaningful commits:

```bash
git add .
git commit -m "feat: add identify endpoint for contact reconciliation"
git commit -m "feat: implement contact linking logic"
git commit -m "refactor: optimize database queries for performance"
```

## License

MIT
