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

### Using Render.com (Free Tier)

1. Push your code to GitHub
2. Create a new PostgreSQL database on Render
3. Create a new Web Service on Render pointing to your GitHub repo
4. Set environment variables:
   - `DATABASE_URL`: Your Render PostgreSQL connection string
   - `NODE_ENV`: production
   - `PORT`: 3000 (Render default)
5. Build command: `npm run build`
6. Start command: `npm start`

Your endpoint will be available at: `https://your-app.onrender.com/identify`

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
