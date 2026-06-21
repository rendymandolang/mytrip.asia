const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

const password = process.env.APPROVAL_DEFAULT_PASSWORD;

const users = [
  {
    fullName: 'Christi',
    email: 'christi@mytrip.local',
    role: 'SUPERADMIN',
  },
  {
    fullName: 'Avichayil',
    email: 'avichayil@mytrip.local',
    role: 'FINANCE_HEAD',
  },
];

async function main() {
  if (!password) {
    throw new Error(
      'APPROVAL_DEFAULT_PASSWORD is required',
    );
  }

  const hashedPassword = await bcrypt.hash(
    password,
    10,
  );

  for (const user of users) {
    await prisma.user.upsert({
      where: {
        email: user.email,
      },
      update: {
        fullName: user.fullName,
        password: hashedPassword,
        role: user.role,
      },
      create: {
        fullName: user.fullName,
        email: user.email,
        password: hashedPassword,
        role: user.role,
      },
    });

    console.log(
      `Upserted ${user.email} as ${user.role}`,
    );
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
