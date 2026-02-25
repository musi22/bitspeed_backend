# Bitespeed API Specification

## Base URL

**Development**: `http://localhost:3000`
**Production**: `https://<your-deployment-url>`

---

## Endpoints

### 1. POST `/identify`

Identifies a customer and returns consolidated contact information based on email and/or phone number.

#### Request

**Method**: POST

**Content-Type**: `application/json`

**Body Schema**:
```json
{
  "email"?: string | null,
  "phoneNumber"?: string | null
}
```

**Parameters**:
- `email` (optional): Customer's email address
- `phoneNumber` (optional): Customer's phone number
- **Note**: At least one of `email` or `phoneNumber` must be provided

#### Request Examples

**Example 1: Both email and phone**
```json
{
  "email": "customer@example.com",
  "phoneNumber": "1234567890"
}
```

**Example 2: Email only**
```json
{
  "email": "customer@example.com"
}
```

**Example 3: Phone only**
```json
{
  "phoneNumber": "1234567890"
}
```

#### Response

**Status Code**: 200 OK

**Content-Type**: `application/json`

**Body Schema**:
```json
{
  "contact": {
    "primaryContatctId": number,
    "emails": string[],
    "phoneNumbers": string[],
    "secondaryContactIds": number[]
  }
}
```

**Response Fields**:
- `primaryContatctId` (number): Database ID of the primary contact (oldest in the group)
- `emails` (array of strings): All unique emails in the contact group
  - First element is the primary contact's email (if it has one)
- `phoneNumbers` (array of strings): All unique phone numbers in the contact group
  - First element is the primary contact's phone (if it has one)
- `secondaryContactIds` (array of numbers): Database IDs of all secondary contacts

#### Response Examples

**Example 1: New contact created**
```json
{
  "contact": {
    "primaryContatctId": 1,
    "emails": ["new@example.com"],
    "phoneNumbers": ["1234567890"],
    "secondaryContactIds": []
  }
}
```

**Example 2: Linked contacts**
```json
{
  "contact": {
    "primaryContatctId": 1,
    "emails": ["first@example.com", "second@example.com"],
    "phoneNumbers": ["1234567890", "9876543210"],
    "secondaryContactIds": [2, 3]
  }
}
```

#### Error Responses

**400 Bad Request**: Missing required fields
```json
{
  "error": "Either email or phoneNumber must be provided"
}
```

**500 Internal Server Error**: Server-side error
```json
{
  "error": "Internal server error"
}
```

---

### 2. GET `/health`

Health check endpoint to verify the service is running.

#### Request

**Method**: GET

**Parameters**: None

#### Response

**Status Code**: 200 OK

**Content-Type**: `application/json`

**Body**:
```json
{
  "status": "ok"
}
```

---

## Business Logic

### Contact Creation and Linking

1. **No Existing Contacts**: Creates a new primary contact
   ```
   Request: {email: "user@example.com", phone: "123"}
   Result: Contact created with linkPrecedence = "primary"
   ```

2. **Existing Contact with Same Email/Phone**: Links as secondary
   ```
   Request: {email: "new@example.com", phone: "123"}  (phone matches existing)
   Result: New secondary contact created, linked to primary
   ```

3. **Merging Two Groups**: Older group remains primary
   ```
   Request: {email: "group1@example.com", phone: "222"}  (email from group 1, phone from group 2)
   Result: Group 2's primary becomes secondary, linked to group 1's primary
   ```

### Transitive Linking

Contacts are linked transitively through shared email or phone:
- Contact A (email: a@example.com, phone: 111)
- Contact B (email: b@example.com, phone: 111) → linked to A
- Contact C (email: a@example.com, phone: 222) → linked to A
- All three form one group with A as primary

---

## HTTP Status Codes

| Code | Meaning | When |
|------|---------|------|
| 200 | OK | Successful identification |
| 400 | Bad Request | Missing email and phone |
| 500 | Internal Server Error | Database or processing error |

---

## Data Types

### Contact Object (Database)
```json
{
  "id": number,
  "email": string | null,
  "phoneNumber": string | null,
  "linkedId": number | null,
  "linkPrecedence": "primary" | "secondary",
  "createdAt": datetime,
  "updatedAt": datetime,
  "deletedAt": datetime | null
}
```

### Identify Response Object
```json
{
  "contact": {
    "primaryContatctId": number,
    "emails": string[],
    "phoneNumbers": string[],
    "secondaryContactIds": number[]
  }
}
```

---

## Usage Patterns

### Pattern 1: Identify Returning Customer
```
POST /identify
{
  "email": "known@example.com",
  "phoneNumber": "1234567890"
}
```
Returns all linked contact information for consolidation.

### Pattern 2: Email-Only Identification
```
POST /identify
{
  "email": "customer@example.com"
}
```
Useful when phone not available at checkout.

### Pattern 3: Phone-Only Identification
```
POST /identify
{
  "phoneNumber": "1234567890"
}
```
Useful for voice order systems.

### Pattern 4: New Order with Existing Phone
```
POST /identify
{
  "email": "different@example.com",
  "phoneNumber": "existing-phone"
}
```
Creates secondary contact, links to existing customer.

---

## Rate Limiting

Currently, no rate limiting is implemented. For production deployment, consider:

```javascript
// Example with express-rate-limit
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.post('/identify', limiter, identifyHandler);
```

---

## Request/Response Examples

### Complete Flow Example

**Step 1: Initial Order**
```bash
curl -X POST http://localhost:3000/identify \
  -H "Content-Type: application/json" \
  -d '{
    "email": "lorraine@hillvalley.edu",
    "phoneNumber": "123456"
  }'
```

**Response**:
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

**Step 2: Follow-up Order (Same Phone, Different Email)**
```bash
curl -X POST http://localhost:3000/identify \
  -H "Content-Type: application/json" \
  -d '{
    "email": "mcfly@hillvalley.edu",
    "phoneNumber": "123456"
  }'
```

**Response**:
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

**Step 3: Query by Phone Only**
```bash
curl -X POST http://localhost:3000/identify \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "123456"
  }'
```

**Response** (same as Step 2):
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

---

## Implementation Notes

### Request Validation
- At least one of `email` or `phoneNumber` must be provided
- Empty strings are treated as missing values
- `null` values are acceptable

### Response Ordering
- `emails[0]` is always the primary contact's email (if present)
- `phoneNumbers[0]` is always the primary contact's phone (if present)
- `secondaryContactIds` contains all non-primary contact IDs

### Database Behavior
- Contacts are never truly deleted (soft delete via `deletedAt`)
- `updatedAt` is automatically set to current timestamp on updates
- `createdAt` determines primary contact (oldest = primary)

### Indexing
Database includes indexes on:
- `email`
- `phoneNumber`
- `linkedId`
- `linkPrecedence`

This ensures fast lookups and traversals.

---

## Pagination

Not applicable - single request returns all related contacts.

---

## Webhooks

Not implemented. Consider adding in future:
- `contact.created` - When new contact created
- `contact.linked` - When contacts are linked
- `contact.merged` - When two groups are merged

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2024-01-XX | Initial release |

---

## Support & Documentation

- **README.md** - Feature overview
- **SETUP.md** - Installation and deployment
- **IMPLEMENTATION_DETAILS.md** - Algorithm details
- **TESTING.md** - Test cases and verification
- **QUICKSTART.md** - 5-minute setup guide
