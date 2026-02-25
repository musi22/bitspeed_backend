import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Test utility functions for the identify endpoint
 */

// Seed test data
export async function seedTestData() {
  // Clear existing data
  await prisma.contact.deleteMany({});

  // Create test contacts
  const contact1 = await prisma.contact.create({
    data: {
      email: "lorraine@hillvalley.edu",
      phoneNumber: "123456",
      linkPrecedence: "primary",
    },
  });

  console.log("Created contact 1:", contact1);
}

// Utility to check all contacts
export async function getAllContacts() {
  const contacts = await prisma.contact.findMany();
  return contacts;
}

// Clean up
export async function cleanup() {
  await prisma.contact.deleteMany({});
  await prisma.$disconnect();
}

// Run if executed directly
if (require.main === module) {
  seedTestData()
    .then(async () => {
      const contacts = await getAllContacts();
      console.log("All contacts:", contacts);
      await cleanup();
    })
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
