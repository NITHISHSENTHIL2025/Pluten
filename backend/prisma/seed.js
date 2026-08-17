const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const products = [
  {
    title: 'The Discipline Protocol',
    description: 'A comprehensive digital course on mastering focus and executing at the highest level.',
    price: 4999.0,
    isDigital: true,
  },
  {
    title: 'Financial Architecture',
    description: 'Advanced templates and psychological frameworks for wealth accumulation.',
    price: 7999.0,
    isDigital: true,
  },
  {
    title: 'Obsidian Workflow System',
    description: 'The exact productivity system used by elite performers.',
    price: 2499.0,
    isDigital: true,
  },
];

async function main() {
  console.log('[PLUTEN SEED] Starting idempotent seed.');

  for (const product of products) {
    const existing = await prisma.product.findFirst({
      where: { title: product.title },
      select: { id: true, title: true },
    });

    if (existing) {
      console.log(`[PLUTEN SEED] Skipping existing product: ${existing.title}`);
      continue;
    }

    await prisma.product.create({ data: product });
    console.log(`[PLUTEN SEED] Created product: ${product.title}`);
  }

  console.log('[PLUTEN SEED] Complete. Existing production records were not overwritten.');
}

main()
  .catch((error) => {
    console.error('[PLUTEN SEED] Failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
