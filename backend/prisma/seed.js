// backend/prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Initializing database seeding sequence...");

    const products = [
        {
            title: "The Discipline Protocol",
            description: "A comprehensive digital course on mastering focus and executing at the highest level.",
            price: 4999.00, // INR
            isDigital: true
        },
        {
            title: "Financial Architecture",
            description: "Advanced templates and psychological frameworks for wealth accumulation.",
            price: 7999.00,
            isDigital: true
        },
        {
            title: "Obsidian Workflow System",
            description: "The exact productivity system used by elite performers.",
            price: 2499.00,
            isDigital: true
        }
    ];

    for (const product of products) {
        await prisma.product.create({ data: product });
    }

    console.log("Premium assets successfully injected into the ecosystem.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });