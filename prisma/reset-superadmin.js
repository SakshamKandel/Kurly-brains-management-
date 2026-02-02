const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function resetToSuperAdmin() {
    const prisma = new PrismaClient();

    try {
        console.log('🔄 Resetting database to single superadmin...\n');

        // Delete all related data first (respecting foreign keys)
        console.log('  Clearing all related data...');
        await prisma.block.deleteMany({});
        await prisma.customPage.deleteMany({});
        await prisma.message.deleteMany({});
        await prisma.conversationMember.deleteMany({});
        await prisma.conversation.deleteMany({});
        await prisma.taskComment.deleteMany({});
        await prisma.task.deleteMany({});
        await prisma.attendance.deleteMany({});
        await prisma.leaveRequest.deleteMany({});
        await prisma.announcement.deleteMany({});
        await prisma.clientCredential.deleteMany({});
        await prisma.userPreferences.deleteMany({});

        // Delete ALL users
        console.log('  Deleting all users...');
        await prisma.user.deleteMany({});

        // Create the single superadmin
        console.log('  Creating superadmin...');
        const hashedPassword = await bcrypt.hash('Admin@123@123', 12);

        const superadmin = await prisma.user.create({
            data: {
                email: 'admin@kurlybrains.com',
                password: hashedPassword,
                firstName: 'Super',
                lastName: 'Admin',
                role: 'SUPER_ADMIN',
                department: 'Management',
                position: 'System Administrator',
                status: 'ACTIVE'
            }
        });

        console.log('\n✅ Database reset complete!');
        console.log('─────────────────────────────');
        console.log('   Email:    admin@kurlybrains.com');
        console.log('   Password: Admin@123@123');
        console.log('   Role:     SUPER_ADMIN');
        console.log('─────────────────────────────');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

resetToSuperAdmin();
