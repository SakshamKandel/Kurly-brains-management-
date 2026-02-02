const { PrismaClient } = require('@prisma/client');

async function clearDatabase() {
    const prisma = new PrismaClient();

    try {
        console.log('🧹 Clearing database (keeping superadmin)...\n');

        // Get the superadmin user
        const superadmin = await prisma.user.findFirst({
            where: {
                OR: [
                    { role: 'SUPER_ADMIN' },
                    { role: 'ADMIN' },
                    { email: 'admin@kurlybrains.com' }
                ]
            }
        });

        if (!superadmin) {
            console.log('❌ No superadmin found. Aborting.');
            return;
        }

        console.log('✓ Found superadmin:', superadmin.email);

        // Delete all data in order (respecting foreign keys)
        console.log('  Deleting blocks...');
        await prisma.block.deleteMany({});

        console.log('  Deleting custom pages...');
        await prisma.customPage.deleteMany({});

        console.log('  Deleting messages...');
        await prisma.message.deleteMany({});

        console.log('  Deleting conversation members...');
        await prisma.conversationMember.deleteMany({});

        console.log('  Deleting conversations...');
        await prisma.conversation.deleteMany({});

        console.log('  Deleting task comments...');
        await prisma.taskComment.deleteMany({});

        console.log('  Deleting tasks...');
        await prisma.task.deleteMany({});

        console.log('  Deleting attendance...');
        await prisma.attendance.deleteMany({});

        console.log('  Deleting leave requests...');
        await prisma.leaveRequest.deleteMany({});

        console.log('  Deleting announcements...');
        await prisma.announcement.deleteMany({});

        console.log('  Deleting client credentials...');
        await prisma.clientCredential.deleteMany({});

        console.log('  Deleting user preferences...');
        await prisma.userPreferences.deleteMany({});

        // Delete all users except superadmin
        console.log('  Deleting all users except superadmin...');
        await prisma.user.deleteMany({
            where: {
                id: { not: superadmin.id }
            }
        });

        console.log('\n✅ Database cleared successfully!');
        console.log('   Only superadmin remains:', superadmin.email);

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

clearDatabase();
