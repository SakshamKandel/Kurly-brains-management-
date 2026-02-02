
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const email = 'admin@kurlybrains.com';

    console.log(`Looking for user ${email}...`);

    const user = await prisma.user.findUnique({
        where: { email },
    });

    if (!user) {
        console.error(`User ${email} not found!`);
        return;
    }

    console.log(`Found user ${user.firstName} ${user.lastName} with role ${user.role}`);

    // Update to SUPER_ADMIN
    // Note: We cast to any because the client might not have fully refreshed TS types yet in this context
    const updated = await prisma.user.update({
        where: { email },
        data: { role: 'SUPER_ADMIN' as any },
    });

    console.log(`Successfully promoted ${email} to SUPER_ADMIN.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
