import express, { Request, Response } from "express";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

// Mock database
const contacts: any[] = [];
let contactId = 0;

// Types
interface IdentifyRequest {
  email?: string | null;
  phoneNumber?: string | null;
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

    // Find matching contacts
    const matchingContacts = contacts.filter(
      (c) =>
        (email && c.email === email) ||
        (phoneNumber && c.phoneNumber === phoneNumber)
    );

    let primaryContact: any;
    let secondaryContactIds: number[] = [];

    if (matchingContacts.length === 0) {
      // Create new primary contact
      primaryContact = {
        id: ++contactId,
        email: email || null,
        phoneNumber: phoneNumber || null,
        linkPrecedence: "primary",
        createdAt: new Date(),
      };
      contacts.push(primaryContact);
    } else {
      // Get the oldest contact as primary
      primaryContact = matchingContacts[0];
      for (const contact of matchingContacts) {
        if (contact.createdAt < primaryContact.createdAt) {
          primaryContact = contact;
        }
      }

      // Create new contact if it has new information
      const hasNewInfo =
        (email && !matchingContacts.some((c) => c.email === email)) ||
        (phoneNumber && !matchingContacts.some((c) => c.phoneNumber === phoneNumber));

      if (hasNewInfo) {
        const newContact = {
          id: ++contactId,
          email: email || null,
          phoneNumber: phoneNumber || null,
          linkPrecedence: "secondary",
          linkedId: primaryContact.id,
          createdAt: new Date(),
        };
        contacts.push(newContact);
        secondaryContactIds.push(newContact.id);
      } else {
        secondaryContactIds = matchingContacts
          .filter((c) => c.id !== primaryContact.id)
          .map((c) => c.id);
      }
    }

    // Collect all emails and phone numbers
    const allEmails = new Set<string>();
    const allPhoneNumbers = new Set<string>();

    const relatedContacts = contacts.filter(
      (c) => c.id === primaryContact.id || c.linkedId === primaryContact.id
    );

    for (const contact of relatedContacts) {
      if (contact.email) allEmails.add(contact.email);
      if (contact.phoneNumber) allPhoneNumbers.add(contact.phoneNumber);
    }

    res.status(200).json({
      contact: {
        primaryContatctId: primaryContact.id,
        emails: Array.from(allEmails),
        phoneNumbers: Array.from(allPhoneNumbers),
        secondaryContactIds,
      },
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "ok" });
});

// Root endpoint
app.get("/", (req: Request, res: Response) => {
  res.json({
    message: "Bitespeed Identity Reconciliation API",
    endpoints: {
      identify: "POST /identify",
      health: "GET /health",
    },
  });
});

// Export for Vercel
export default app;

// Start server for local development
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Bitespeed backend running on port ${PORT}`);
});
