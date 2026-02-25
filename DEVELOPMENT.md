# Development Guidelines

## Code Standards

### TypeScript Configuration

- **Target**: ES2020
- **Module**: CommonJS
- **Strict Mode**: Enabled
- **Source Maps**: Enabled for debugging

### File Structure

```
src/
├── index.ts          # Main server file
├── test-utils.ts     # Testing utilities
└── types/            # TypeScript types (if added)
```

### Naming Conventions

- **Files**: kebab-case (e.g., `identify-handler.ts`)
- **Classes**: PascalCase (e.g., `IdentifyService`)
- **Functions**: camelCase (e.g., `findAllLinkedContacts`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `PRIMARY_CONTACT_ID`)
- **Variables**: camelCase (e.g., `linkedContactIds`)

---

## Code Style

### Imports

```typescript
// Organize imports: built-in → third-party → local
import express, { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
```

### Comments

Use JSDoc for functions:

```typescript
/**
 * Finds all contacts transitively linked to a given contact ID.
 * Uses BFS to traverse the link chain in both directions.
 * 
 * @param contactId - The ID of the contact to start traversal from
 * @returns Set of all linked contact IDs
 */
async function findAllLinkedContacts(contactId: number): Promise<Set<number>> {
  // implementation
}
```

### Error Handling

```typescript
try {
  // operation
} catch (error) {
  console.error("Descriptive error message:", error);
  res.status(500).json({ error: "User-facing error message" });
}
```

---

## Git Workflow

### Commit Message Format

```
<type>: <subject>

<body>

<footer>
```

**Types**:
- `feat` - New feature
- `fix` - Bug fix
- `refactor` - Code refactoring
- `perf` - Performance improvement
- `test` - Test additions
- `docs` - Documentation
- `chore` - Build/dependency updates

**Examples**:

```bash
git commit -m "feat: implement identify endpoint with contact linking"
git commit -m "refactor: optimize BFS traversal for large contact groups"
git commit -m "fix: ensure primary contact email comes first in response"
git commit -m "docs: add comprehensive API specification"
git commit -m "chore: upgrade prisma to latest version"
```

### Branching Strategy

```
main (production)
├── develop (staging)
│   ├── feature/identify-endpoint
│   ├── feature/contact-linking
│   └── fix/transitive-linking
```

### Pull Request Process

1. Create feature branch: `git checkout -b feature/your-feature`
2. Make changes with meaningful commits
3. Push to GitHub: `git push origin feature/your-feature`
4. Create Pull Request with description
5. Ensure all tests pass
6. Request review
7. Merge to develop after approval

---

## Testing Best Practices

### Unit Testing Structure

```typescript
describe('findAllLinkedContacts', () => {
  it('should find all transitively linked contacts', async () => {
    // Arrange
    const testContactId = 1;
    
    // Act
    const linkedIds = await findAllLinkedContacts(testContactId);
    
    // Assert
    expect(linkedIds).toContain(1);
    expect(linkedIds).toContain(2);
  });
});
```

### Test Coverage

Target coverage:
- Statements: 80%+
- Branches: 75%+
- Functions: 80%+
- Lines: 80%+

### Testing Checklist

- [ ] Unit tests for utility functions
- [ ] Integration tests for /identify endpoint
- [ ] Error case handling
- [ ] Edge cases (null values, large datasets)
- [ ] Performance tests for large contact groups

---

## Performance Optimization

### Database Queries

✅ **Good**:
```typescript
// Single query with where clause
const contacts = await prisma.contact.findMany({
  where: { linkedId: id, deletedAt: null },
});
```

❌ **Avoid**:
```typescript
// N+1 query problem
const contacts = await prisma.contact.findMany();
const filtered = contacts.filter(c => c.linkedId === id);
```

### Caching Strategies

For future optimization:

```typescript
const contactCache = new Map<number, Contact>();

async function getCachedContact(id: number) {
  if (contactCache.has(id)) {
    return contactCache.get(id);
  }
  
  const contact = await prisma.contact.findUnique({ where: { id } });
  contactCache.set(id, contact);
  return contact;
}
```

### Query Optimization

- Use indexes on frequently queried columns
- Limit results with pagination (future enhancement)
- Use `select` to fetch only needed fields

```typescript
const contacts = await prisma.contact.findMany({
  where: { linkedId: id },
  select: { id: true, email: true, phoneNumber: true },
});
```

---

## Security Best Practices

### Input Validation

```typescript
// Always validate incoming data
if (!email && !phoneNumber) {
  return res.status(400).json({
    error: "Either email or phoneNumber must be provided"
  });
}

// Sanitize strings
const sanitizedEmail = email?.trim().toLowerCase();
```

### Environment Variables

```typescript
// Load from .env, never hardcode
const databaseUrl = process.env.DATABASE_URL;
const port = process.env.PORT || 3000;

if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is required");
}
```

### SQL Injection Prevention

Using Prisma ORM prevents SQL injection automatically:

```typescript
// Safe - parameterized query
const contact = await prisma.contact.findUnique({
  where: { email: userInput }
});
```

### CORS (if needed)

```typescript
import cors from 'cors';

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(','),
  credentials: true
}));
```

---

## Logging

### Development

```typescript
console.log("Identifying contact:", { email, phoneNumber });
console.error("Database error:", error);
```

### Production

For future enhancement, use a logging library:

```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

logger.info('Contact identified', { primaryId: 1 });
logger.error('Failed to update contact', error);
```

---

## Database Migrations

### Creating a Migration

```bash
# Make changes to schema.prisma, then:
npm run prisma:migrate -- --name your_migration_name

# Or push without creating migration file (for development)
npm run prisma:push
```

### Reviewing Migrations

```bash
# View migration history
ls prisma/migrations/

# Check migration SQL
cat prisma/migrations/*/migration.sql
```

### Best Practices

1. One logical change per migration
2. Meaningful migration names
3. Test migrations locally first
4. Never modify existing migration files
5. Review migration SQL before applying to production

---

## Deployment Checklist

- [ ] All tests passing
- [ ] Code reviewed
- [ ] Migrations tested locally
- [ ] Environment variables configured
- [ ] Database backups created
- [ ] Rollback plan prepared
- [ ] Monitoring/logging setup
- [ ] Health check endpoint verified
- [ ] API documentation updated
- [ ] Commit messages clear and descriptive

---

## Common Tasks

### Adding a New Endpoint

1. Define request/response types
2. Implement handler function with error handling
3. Add route to Express app
4. Write tests
5. Update API_SPECIFICATION.md
6. Commit with descriptive message

### Modifying Database Schema

1. Update `schema.prisma`
2. Create migration: `npm run prisma:migrate`
3. Update Prisma client: `npm run prisma:generate`
4. Update types if needed
5. Test thoroughly
6. Commit schema changes

### Fixing a Bug

1. Create bug fix branch: `git checkout -b fix/bug-description`
2. Write failing test first (TDD)
3. Fix the bug
4. Verify test passes
5. Create PR with detailed description
6. Commit with `fix:` prefix

---

## Tools & Extensions

### Recommended VS Code Extensions

- **Prisma**: Official Prisma ORM support
- **ES7+ React/Redux/React-Native snippets**: Code snippets
- **Thunder Client** or **REST Client**: API testing
- **GitLens**: Git integration
- **Error Lens**: Inline error messages

### Development Tools

- **Postman**: API testing
- **Prisma Studio**: Database visualization
- **PostgreSQL**: Database client (DBeaver or pgAdmin)
- **Docker**: Containerization

---

## Documentation Standards

### README Updates

When adding features, update corresponding sections:
- Features list
- Installation steps
- Usage examples
- API endpoints

### Comment Requirements

```typescript
// Required comments:
// - Complex algorithms
// - Non-obvious business logic
// - Edge case handling
// - Important gotchas

// NOT required:
// - Self-explanatory code
// - Variable assignments
// - Simple loops
```

### Example Documentation

```typescript
/**
 * Performs BFS to find all contacts linked to the given contact ID.
 * Traverses both directions: following linkedId upwards and
 * finding secondary contacts pointing to this one.
 * 
 * Time Complexity: O(N) where N = number of linked contacts
 * Space Complexity: O(N) for the set and queue
 * 
 * @example
 * const linkedIds = await findAllLinkedContacts(5);
 * // Returns Set { 1, 2, 3, 5 }
 * 
 * @param contactId - The starting contact ID
 * @returns Set of all transitively linked contact IDs
 * @throws Will throw if database query fails
 */
```

---

## Troubleshooting Development Issues

### Port Already in Use

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux
lsof -i :3000
kill -9 <PID>
```

### Database Connection Issues

```bash
# Test connection string format
# postgresql://username:password@host:port/database?schema=public

# Verify PostgreSQL is running
psql -U postgres

# Check .env is loaded
grep DATABASE_URL .env
```

### TypeScript Errors

```bash
# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build

# Type check
npx tsc --noEmit
```

### Prisma Issues

```bash
# Reset local database
npx prisma migrate reset

# Generate fresh client
npm run prisma:generate

# Push schema to database
npm run prisma:push
```

---

## Resources

- [Express.js Documentation](https://expressjs.com/)
- [Prisma ORM Docs](https://www.prisma.io/docs/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [REST API Best Practices](https://restfulapi.net/)

---

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes with clear commits
4. Write/update tests
5. Update documentation
6. Submit a pull request

For major changes, please open an issue first to discuss proposed changes.

---

## Questions?

Check the following in order:
1. QUICKSTART.md - Quick setup
2. SETUP.md - Detailed setup
3. README.md - Feature overview
4. API_SPECIFICATION.md - API details
5. IMPLEMENTATION_DETAILS.md - Algorithm explanation
6. TESTING.md - Test examples
