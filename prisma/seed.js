import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('admin123', 10);
  await prisma.admin.upsert({
    where: { username: 'admin' },
    update: {},
    create: { username: 'admin', passwordHash: hash },
  });
  console.log('Seeded admin user (username: admin, password: admin123)');
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => { console.error(e); prisma.$disconnect(); process.exit(1); });
