import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import { Pool } from 'pg';
import { PrismaClient, UserRole } from '../generated/prisma/client';
import {
  normalizeEmail,
  normalizeLogin,
  normalizePhone,
} from '../src/common/user.utils';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = normalizeEmail(process.env.SEED_ADMIN_EMAIL ?? 'admin@example.com');
  const login = normalizeLogin(process.env.SEED_ADMIN_LOGIN ?? 'admin');
  const phone = normalizePhone(process.env.SEED_ADMIN_PHONE ?? '+79000000000');
  const password = process.env.SEED_ADMIN_PASSWORD ?? 'admin12345';
  const firstName = process.env.SEED_ADMIN_FIRST_NAME ?? 'Админ';
  const lastName = process.env.SEED_ADMIN_LAST_NAME ?? 'Системы';

  const passwordHash = await bcrypt.hash(password, 10);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {
      firstName,
      lastName,
      login,
      phone,
      role: UserRole.ADMIN,
      isActive: true,
      passwordHash,
    },
    create: {
      email,
      firstName,
      lastName,
      login,
      phone,
      role: UserRole.ADMIN,
      passwordHash,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      login: true,
      role: true,
    },
  });

  console.log('Seed admin user:', admin);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
