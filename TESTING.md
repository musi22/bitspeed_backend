# Testing Guide

## Automated Test Scenarios

This guide provides comprehensive test cases to verify the identity reconciliation logic.

## Test Case 1: New Contact Creation

**Scenario**: First identify request with new email and phone

**Request**:
```json
{
  "email": "lorraine@hillvalley.edu",
  "phoneNumber": "123456"
}
```

**Expected Response**:
```json
{
  "contact": {
    "primaryContatctId": 1,
    "emails": ["lorraine@hillvalley.edu"],
    "phoneNumbers": ["123456"],
    "secondaryContactIds": []
  }
}
```

**Expected DB State**:
- Contact ID 1 created with `linkPrecedence: "primary"`

---

## Test Case 2: Link via Shared Phone Number

**Prerequisite**: Contact 1 exists from Test Case 1

**Request**:
```json
{
  "email": "mcfly@hillvalley.edu",
  "phoneNumber": "123456"
}
```

**Expected Response**:
```json
{
  "contact": {
    "primaryContatctId": 1,
    "emails": ["lorraine@hillvalley.edu", "mcfly@hillvalley.edu"],
    "phoneNumbers": ["123456"],
    "secondaryContactIds": [2]
  }
}
```

**Expected DB State**:
- Contact ID 2 created with `linkPrecedence: "secondary"` and `linkedId: 1`

---

## Test Case 3: Identify Existing Contact (No New Info)

**Request**: Same as Test Case 2
```json
{
  "email": "mcfly@hillvalley.edu",
  "phoneNumber": "123456"
}
```

**Expected Response**:
```json
{
  "contact": {
    "primaryContatctId": 1,
    "emails": ["lorraine@hillvalley.edu", "mcfly@hillvalley.edu"],
    "phoneNumbers": ["123456"],
    "secondaryContactIds": [2]
  }
}
```

**Expected DB State**:
- No new contact created (no new information)
- Same as Test Case 2 final state

---

## Test Case 4: Link via Shared Email

**Scenario**: Request with shared email but new phone

**Request**:
```json
{
  "email": "lorraine@hillvalley.edu",
  "phoneNumber": "999999"
}
```

**Expected Response**:
```json
{
  "contact": {
    "primaryContatctId": 1,
    "emails": ["lorraine@hillvalley.edu", "mcfly@hillvalley.edu"],
    "phoneNumbers": ["123456", "999999"],
    "secondaryContactIds": [2, 3]
  }
}
```

**Expected DB State**:
- Contact ID 3 created with new phone `"999999"`, `linkedId: 1`

---

## Test Case 5: Merge Two Separate Groups (Primary to Secondary)

**Setup**:
Create two separate contact groups:

Group 1:
```json
{
  "email": "george@hillvalley.edu",
  "phoneNumber": "111111"
}
```
→ Creates Contact 4 (primary)

Group 2:
```json
{
  "email": "biffsucks@hillvalley.edu",
  "phoneNumber": "222222"
}
```
→ Creates Contact 5 (primary)

**Merge Request**:
```json
{
  "email": "george@hillvalley.edu",
  "phoneNumber": "222222"
}
```

**Expected Response**:
```json
{
  "contact": {
    "primaryContatctId": 4,
    "emails": ["george@hillvalley.edu", "biffsucks@hillvalley.edu"],
    "phoneNumbers": ["111111", "222222"],
    "secondaryContactIds": [5]
  }
}
```

**Expected DB State**:
- Contact 5 updated: `linkPrecedence` changed from "primary" to "secondary", `linkedId: 4`

---

## Test Case 6: Phone Number Only

**Request**:
```json
{
  "phoneNumber": "123456"
}
```

**Expected Response** (should find Contact 1):
```json
{
  "contact": {
    "primaryContatctId": 1,
    "emails": ["lorraine@hillvalley.edu", "mcfly@hillvalley.edu"],
    "phoneNumbers": ["123456"],
    "secondaryContactIds": [2, 3]
  }
}
```

---

## Test Case 7: Email Only

**Request**:
```json
{
  "email": "mcfly@hillvalley.edu"
}
```

**Expected Response** (should find Contact 1 via transitive link):
```json
{
  "contact": {
    "primaryContatctId": 1,
    "emails": ["lorraine@hillvalley.edu", "mcfly@hillvalley.edu"],
    "phoneNumbers": ["123456"],
    "secondaryContactIds": [2, 3]
  }
}
```

---

## Test Case 8: Deep Transitive Linking

**Setup**: Create a chain of links: A → B → C

```json
// Create A
{"email": "a@example.com", "phoneNumber": "111"}
// Contact 10 (primary)

// Create B (links to A via email)
{"email": "b@example.com", "phoneNumber": "111"}
// Contact 11 (secondary, linkedId: 10)

// Create C (links to B via phone)
{"email": "c@example.com", "phoneNumber": "222"}
// Contact 12 (secondary, linkedId: 10)
```

**Query**: Identify Contact 12
```json
{
  "email": "c@example.com",
  "phoneNumber": "222"
}
```

**Expected Response** (all three in same group):
```json
{
  "contact": {
    "primaryContatctId": 10,
    "emails": ["a@example.com", "b@example.com", "c@example.com"],
    "phoneNumbers": ["111", "222"],
    "secondaryContactIds": [11, 12]
  }
}
```

---

## Test Case 9: Null/Missing Fields

**Request**:
```json
{
  "phoneNumber": null,
  "email": null
}
```

**Expected Response**:
```json
{
  "error": "Either email or phoneNumber must be provided"
}
```

**HTTP Status**: 400 Bad Request

---

## Test Case 10: Empty Request

**Request**:
```json
{}
```

**Expected Response**:
```json
{
  "error": "Either email or phoneNumber must be provided"
}
```

**HTTP Status**: 400 Bad Request

---

## Running Tests with cURL

### Test Setup Script

```bash
#!/bin/bash

BASE_URL="http://localhost:3000"

echo "Test 1: Create new contact"
curl -X POST $BASE_URL/identify \
  -H "Content-Type: application/json" \
  -d '{"email":"test1@example.com","phoneNumber":"1000"}'
echo "\n"

echo "Test 2: Link new email, same phone"
curl -X POST $BASE_URL/identify \
  -H "Content-Type: application/json" \
  -d '{"email":"test2@example.com","phoneNumber":"1000"}'
echo "\n"

echo "Test 3: Query by phone only"
curl -X POST $BASE_URL/identify \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"1000"}'
echo "\n"

echo "Test 4: Create separate group"
curl -X POST $BASE_URL/identify \
  -H "Content-Type: application/json" \
  -d '{"email":"test3@example.com","phoneNumber":"2000"}'
echo "\n"

echo "Test 5: Merge groups"
curl -X POST $BASE_URL/identify \
  -H "Content-Type: application/json" \
  -d '{"email":"test1@example.com","phoneNumber":"2000"}'
echo "\n"

echo "Test 6: Invalid request"
curl -X POST $BASE_URL/identify \
  -H "Content-Type: application/json" \
  -d '{}'
echo "\n"
```

### Running Tests in Postman

1. Import `Bitespeed.postman_collection.json`
2. Set `base_url` variable to your server URL
3. Run each test request in sequence
4. Verify responses match expected output
5. Check database state between requests

---

## Database Verification

After tests, verify database state:

```sql
-- PostgreSQL
SELECT id, email, phoneNumber, linkedId, linkPrecedence, createdAt
FROM "Contact"
ORDER BY createdAt ASC;

-- SQLite
SELECT id, email, phoneNumber, linkedId, linkPrecedence, createdAt
FROM Contact
ORDER BY createdAt ASC;
```

---

## Performance Testing

### Load Testing with Apache Bench

```bash
# 1000 requests with 10 concurrent connections
ab -n 1000 -c 10 -p request.json -T application/json http://localhost:3000/identify
```

### Using Artillery

```bash
# Install
npm install -g artillery

# Create load-test.yml
cat > load-test.yml << EOF
config:
  target: "http://localhost:3000"
  phases:
    - duration: 10
      arrivalRate: 10
scenarios:
  - name: "Identify Requests"
    flow:
      - post:
          url: "/identify"
          json:
            email: "test@example.com"
            phoneNumber: "1234567890"
EOF

artillery run load-test.yml
```

---

## Expected Test Results Summary

| Test | Scenario | Status |
|------|----------|--------|
| 1 | New contact | ✅ Creates primary |
| 2 | Link via phone | ✅ Creates secondary |
| 3 | Existing info | ✅ No duplicate creation |
| 4 | Link via email | ✅ Adds to group |
| 5 | Merge groups | ✅ Primary consolidation |
| 6 | Phone only query | ✅ Finds group |
| 7 | Email only query | ✅ Finds group |
| 8 | Deep links | ✅ Transitive resolution |
| 9 | Null fields | ✅ Returns 400 error |
| 10 | Empty request | ✅ Returns 400 error |

---

## Debugging Tips

### Enable Logging

```typescript
// In src/index.ts
console.log("Request:", req.body);
console.log("Found contacts:", existingContacts);
console.log("All linked IDs:", allLinkedContactIds);
```

### Check Database State

```bash
# Connect to local database
psql bitespeed

# View all contacts
SELECT * FROM "Contact" ORDER BY "createdAt";

# View specific contact's links
SELECT * FROM "Contact" WHERE "linkedId" = 1;
```

### Use Prisma Studio

```bash
npx prisma studio
```

Opens a GUI at `http://localhost:5555` to browse database visually.

---

## CI/CD Testing

The GitHub Actions workflow (`.github/workflows/ci.yml`) automatically:
- ✅ Installs dependencies
- ✅ Compiles TypeScript
- ✅ Generates Prisma client
- ✅ Type checks with tsc

Run locally to match CI:

```bash
npm ci
npm run build
npm run prisma:generate
npx tsc --noEmit
```
