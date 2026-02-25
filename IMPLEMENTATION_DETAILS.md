# Implementation Details - Identity Reconciliation Algorithm

## Overview

This document explains the core algorithm used to reconcile and identify customer identities across multiple orders.

## Key Concepts

### 1. Contact Linking

Contacts are linked when they share either:
- The same **email address**
- The same **phone number**

When multiple contacts share email or phone, they form a **linked group**.

### 2. Primary vs Secondary Contacts

- **Primary Contact**: The oldest contact in a linked group (determined by `createdAt` timestamp)
- **Secondary Contact**: All newer contacts in the group, linked via `linkedId` to the primary

### 3. Transitive Relationships

If contact A links to contact B, and contact B shares information with contact C, then A, B, and C form a single linked group.

**Example:**
```
Contact 1 (email: a@example.com)
Contact 2 (phone: 123, email: b@example.com) ← links to Contact 1 via shared email
Contact 3 (phone: 456) ← needs to link Contact 2 via shared phone 123

Result: All three are in the same group with Contact 1 as primary
```

## Algorithm Walkthrough

### Step 1: Find Existing Matching Contacts

When an identify request arrives with email and/or phoneNumber:

```typescript
const existingContacts = await prisma.contact.findMany({
  where: {
    OR: [
      { email: requestEmail },
      { phoneNumber: requestPhoneNumber }
    ],
    deletedAt: null  // Exclude soft-deleted records
  }
});
```

### Step 2: If No Matches Found

Create a new primary contact:

```typescript
const newContact = await prisma.contact.create({
  data: {
    email: requestEmail,
    phoneNumber: requestPhoneNumber,
    linkPrecedence: "primary",
    linkedId: null
  }
});
```

Return immediately with just this contact.

### Step 3: Collect All Transitively Linked Contacts

If matches exist, perform a **breadth-first search (BFS)** to find all contacts transitively connected:

```typescript
async function findAllLinkedContacts(contactId: number): Promise<Set<number>> {
  const linked = new Set<number>();
  const queue = [contactId];
  const visited = new Set<number>();

  while (queue.length > 0) {
    const current = queue.shift();
    if (visited.has(current)) continue;
    visited.add(current);
    linked.add(current);

    // Find all contacts that link TO this one (secondary contacts)
    const secondaryContacts = await prisma.contact.findMany({
      where: { linkedId: current, deletedAt: null }
    });
    queue.push(...secondaryContacts.map(c => c.id));

    // Follow the linkedId chain upwards (to primary)
    const currentContact = await prisma.contact.findUnique({
      where: { id: current }
    });
    if (currentContact?.linkedId) {
      queue.push(currentContact.linkedId);
    }
  }

  return linked;
}
```

**Why BFS?** 
- Handles arbitrarily deep linking chains
- Finds all related contacts regardless of position in the hierarchy
- Efficient graph traversal

### Step 4: Determine Primary Contact

The primary contact is the **oldest** (earliest `createdAt`):

```typescript
const contacts = await prisma.contact.findMany({
  where: { id: { in: Array.from(allLinkedContactIds) } },
  orderBy: { createdAt: "asc" }
});

const primaryId = contacts[0].id;
```

### Step 5: Check for New Information

Determine if the incoming request contains new email or phone that's not in existing contacts:

```typescript
let needsNewContact = false;

if (email && !existingContacts.some(c => c.email === email)) {
  needsNewContact = true;
}

if (phoneNumber && !existingContacts.some(c => c.phoneNumber === phoneNumber)) {
  needsNewContact = true;
}
```

If new information exists, create a secondary contact:

```typescript
if (needsNewContact) {
  await prisma.contact.create({
    data: {
      email: email || null,
      phoneNumber: phoneNumber || null,
      linkedId: primaryId,
      linkPrecedence: "secondary"
    }
  });
}
```

### Step 6: Consolidate Primary Contacts

If we discovered multiple primary contacts in different groups, make all but the oldest one secondary:

```typescript
for (const contact of allContacts) {
  if (contact.id !== primaryId && contact.linkPrecedence === "primary") {
    // This primary contact must become secondary
    await prisma.contact.update({
      where: { id: contact.id },
      data: {
        linkedId: primaryId,
        linkPrecedence: "secondary",
        updatedAt: new Date()
      }
    });
  }
}
```

This is crucial for handling the case where two separate contact groups are merged.

### Step 7: Compile Response

Fetch all final contacts in the group and prepare the response:

```typescript
const finalContacts = await prisma.contact.findMany({
  where: { id: { in: Array.from(allLinkedContactIds) } },
  orderBy: { createdAt: "asc" }
});

// Collect unique emails and phone numbers
const emails = [...new Set(finalContacts.map(c => c.email).filter(Boolean))];
const phoneNumbers = [...new Set(finalContacts.map(c => c.phoneNumber).filter(Boolean))];

// Ensure primary contact's details come first
if (primaryContact.email) {
  emails.unshift(primaryContact.email);
  emails = [...new Set(emails)]; // Deduplicate
}

// Filter out secondary contact IDs
const secondaryContactIds = finalContacts
  .filter(c => c.id !== primaryId)
  .map(c => c.id);
```

## Complex Scenario Walkthrough

### Initial State: Empty database

### Request 1: `{ email: "a@example.com", phone: "111" }`
```
Action: Create new primary contact
Database:
  Contact(id=1, email=a@example.com, phone=111, primary, linkedId=null)
Response: primaryId=1, emails=[a@example.com], phones=[111], secondaryIds=[]
```

### Request 2: `{ email: "b@example.com", phone: "111" }`
```
Action: Find Contact(phone=111) = Contact 1
Check if new info: email "b@example.com" is new → YES
Create secondary contact linked to Contact 1

Database:
  Contact(id=1, email=a@example.com, phone=111, primary, linkedId=null)
  Contact(id=2, email=b@example.com, phone=111, secondary, linkedId=1)

Response: primaryId=1, emails=[a@example.com, b@example.com], phones=[111], secondaryIds=[2]
```

### Request 3: `{ email: "c@example.com", phone: "222" }`
```
Action: No matches found
Create new primary contact

Database:
  Contact(id=1, email=a@example.com, phone=111, primary)
  Contact(id=2, email=b@example.com, phone=111, secondary, linkedId=1)
  Contact(id=3, email=c@example.com, phone=222, primary, linkedId=null)

Response: primaryId=3, emails=[c@example.com], phones=[222], secondaryIds=[]
```

### Request 4: `{ email: "a@example.com", phone: "222" }`
```
Action: Find Contact(email=a@example.com) = Contact 1, and Contact(phone=222) = Contact 3
BFS finds: {1, 2, 3}
Primary (oldest) = Contact 1
Need to make Contact 3 secondary (it's primary but older one exists)

Update Contact 3:
  linkedId: 1
  linkPrecedence: secondary

Database:
  Contact(id=1, email=a@example.com, phone=111, primary)
  Contact(id=2, email=b@example.com, phone=111, secondary, linkedId=1)
  Contact(id=3, email=c@example.com, phone=222, secondary, linkedId=1)

Response: primaryId=1, emails=[a@example.com, b@example.com, c@example.com], phones=[111, 222], secondaryIds=[2, 3]
```

## Edge Cases Handled

### 1. Null Email or Phone
```typescript
where: {
  OR: [
    email ? { email } : undefined,
    phoneNumber ? { phoneNumber } : undefined,
  ].filter(Boolean)
}
```
Only searches for provided fields.

### 2. Duplicate Information in Same Request
```javascript
// Deduplicate with Set
const emails = [...new Set(...)];
const phones = [...new Set(...)];
```

### 3. Soft Deletes
```typescript
deletedAt: null
```
All queries exclude soft-deleted records.

### 4. Transitive Linking
BFS algorithm handles chains of any depth.

### 5. Multiple Secondary Contacts
The algorithm correctly identifies all secondary contacts pointing to the primary.

## Performance Considerations

### Database Indexes

```prisma
@@index([email])
@@index([phoneNumber])
@@index([linkedId])
@@index([linkPrecedence])
```

These ensure:
- Fast lookups by email or phone
- Fast traversal of linked contacts
- Fast filtering by precedence

### Time Complexity

For a request with a linked group of N contacts:
- Finding existing matches: O(1) with indexes
- BFS traversal: O(N + E) where E is number of links
- Overall: O(N) in typical cases

### Space Complexity

- Set to track visited/linked contacts: O(N)
- Reasonable for expected group sizes (typically < 100 contacts per customer)

## Future Optimizations

1. **Caching**: Cache contact groups to avoid repeated BFS traversals
2. **Batch Operations**: Use `transaction()` for atomic multi-contact updates
3. **Compression**: Archive old secondary contacts to reduce query load
4. **Sharding**: Partition by email/phone prefix for horizontal scaling
