
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Checking Admin User...");
    const admin = await prisma.user.findFirst({
        where: { role: 'SUPER_ADMIN' }
    });
    console.log("Admin Avatar:", admin?.avatar);
    console.log("Admin ID:", admin?.id);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
