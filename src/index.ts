import express, { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const prisma = new PrismaClient();

app.use(express.json());

// Types
interface IdentifyRequest {
  email?: string | null;
  phoneNumber?: string | null;
}

interface ContactResponse {
  contact: {
    primaryContatctId: number;
    emails: string[];
    phoneNumbers: string[];
    secondaryContactIds: number[];
  };
}

/**
 * Helper function to find all contacts linked to a given contact
 * This recursively follows the linkedId chain to find all related contacts
 */
async function findAllLinkedContacts(
  contactId: number
): Promise<Set<number>> {
  const linked = new Set<number>();
  const queue = [contactId];
  const visited = new Set<number>();

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);
    linked.add(current);

    // Find all contacts that link to this one
    const secondaryContacts = await prisma.contact.findMany({
      where: { linkedId: current, deletedAt: null },
    });

    for (const contact of secondaryContacts) {
      if (!visited.has(contact.id)) {
        queue.push(contact.id);
      }
    }

    // Follow the linkedId chain upwards
    const currentContact = await prisma.contact.findUnique({
      where: { id: current },
    });

    if (currentContact?.linkedId && !visited.has(currentContact.linkedId)) {
      queue.push(currentContact.linkedId);
    }
  }

  return linked;
}

/**
 * Find the primary contact in a group of linked contacts
 */
async function findPrimaryContact(contactIds: Set<number>): Promise<number> {
  const contacts = await prisma.contact.findMany({
    where: {
      id: { in: Array.from(contactIds) },
      deletedAt: null,
    },
    orderBy: { createdAt: "asc" },
  });

  if (contacts.length === 0) {
    throw new Error("No valid contacts found");
  }

  // The oldest contact should be the primary one
  return contacts[0].id;
}

/**
 * Main identify endpoint
 */
app.post("/identify", async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, phoneNumber }: IdentifyRequest = req.body;

    // Validation
    if (!email && !phoneNumber) {
      res.status(400).json({
        error: "Either email or phoneNumber must be provided",
      });
      return;
    }

    // Search for existing contacts with matching email or phone number
    const existingContacts = await prisma.contact.findMany({
      where: {
        OR: [
          email ? { email } : undefined,
          phoneNumber ? { phoneNumber } : undefined,
        ].filter(Boolean) as any,
        deletedAt: null,
      },
    });

    let allLinkedContactIds = new Set<number>();

    // If no existing contacts, create a new primary contact
    if (existingContacts.length === 0) {
      const newContact = await prisma.contact.create({
        data: {
          email: email || null,
          phoneNumber: phoneNumber || null,
          linkPrecedence: "primary",
        },
      });

      const response: ContactResponse = {
        contact: {
          primaryContatctId: newContact.id,
          emails: email ? [email] : [],
          phoneNumbers: phoneNumber ? [phoneNumber] : [],
          secondaryContactIds: [],
        },
      };

      res.json(response);
      return;
    }

    // Collect all linked contacts
    for (const contact of existingContacts) {
      const linked = await findAllLinkedContacts(contact.id);
      linked.forEach((id) => allLinkedContactIds.add(id));
    }

    // Find the primary contact (oldest one)
    const primaryId = await findPrimaryContact(allLinkedContactIds);

    // Check if we need to create a new secondary contact
    let needsNewContact = false;

    if (email && !existingContacts.some((c) => c.email === email)) {
      needsNewContact = true;
    }

    if (phoneNumber && !existingContacts.some((c) => c.phoneNumber === phoneNumber)) {
      needsNewContact = true;
    }

    if (needsNewContact) {
      // Create a new secondary contact
      await prisma.contact.create({
        data: {
          email: email || null,
          phoneNumber: phoneNumber || null,
          linkedId: primaryId,
          linkPrecedence: "secondary",
        },
      });
    }

    // Ensure all secondary contacts link to the primary
    // This handles the case where primary contacts need to become secondary
    const secondaryContactIds: number[] = [];
    const allContacts = await prisma.contact.findMany({
      where: {
        id: { in: Array.from(allLinkedContactIds) },
        deletedAt: null,
      },
    });

    for (const contact of allContacts) {
      if (contact.id !== primaryId && contact.linkPrecedence === "secondary") {
        secondaryContactIds.push(contact.id);
      } else if (
        contact.id !== primaryId &&
        contact.linkPrecedence === "primary"
      ) {
        // This primary contact needs to become secondary
        await prisma.contact.update({
          where: { id: contact.id },
          data: {
            linkedId: primaryId,
            linkPrecedence: "secondary",
          },
        });
        secondaryContactIds.push(contact.id);
      }
    }

    // Fetch all final data for the response
    const finalContacts = await prisma.contact.findMany({
      where: {
        id: { in: Array.from(allLinkedContactIds) },
        deletedAt: null,
      },
      orderBy: { createdAt: "asc" },
    });

    const primaryContact = finalContacts.find((c) => c.id === primaryId);
    if (!primaryContact) {
      res.status(500).json({ error: "Failed to identify primary contact" });
      return;
    }

    // Collect unique emails and phone numbers
    const emailsSet = new Set<string>();
    const phoneNumbersSet = new Set<string>();

    for (const contact of finalContacts) {
      if (contact.email) emailsSet.add(contact.email);
      if (contact.phoneNumber) phoneNumbersSet.add(contact.phoneNumber);
    }

    // Ensure primary contact's details come first
    const emails = Array.from(emailsSet);
    const phoneNumbers = Array.from(phoneNumbersSet);

    if (primaryContact.email && emails[0] !== primaryContact.email) {
      emails.splice(emails.indexOf(primaryContact.email), 1);
      emails.unshift(primaryContact.email);
    }

    if (
      primaryContact.phoneNumber &&
      phoneNumbers[0] !== primaryContact.phoneNumber
    ) {
      phoneNumbers.splice(
        phoneNumbers.indexOf(primaryContact.phoneNumber),
        1
      );
      phoneNumbers.unshift(primaryContact.phoneNumber);
    }

    const response: ContactResponse = {
      contact: {
        primaryContatctId: primaryId,
        emails,
        phoneNumbers,
        secondaryContactIds,
      },
    };

    res.json(response);
  } catch (error) {
    console.error("Error in /identify endpoint:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
});

// Health check endpoint
app.get("/api/health", (req: Request, res: Response) => {
  res.json({ status: "ok" });
});

// Root endpoint
app.get("/", (req: Request, res: Response) => {
  res.json({ 
    message: "Bitespeed Identity Reconciliation API",
    endpoints: {
      identify: "POST /api/identify",
      health: "GET /api/health"
    }
  });
});

// Export for Vercel
export default app;

// Start server for local development
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Bitespeed backend running on port ${PORT}`);
});
