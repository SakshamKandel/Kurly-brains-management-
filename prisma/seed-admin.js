const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function createAdmin() {
    const prisma = new PrismaClient();

    try {
        const hashedPassword = await bcrypt.hash('admin@12345@123', 12);

        const admin = await prisma.user.upsert({
            where: { email: 'admin@kurlybrains.com' },
            update: {},
            create: {
                email: 'admin@kurlybrains.com',
                password: hashedPassword,
                firstName: 'Super',
                lastName: 'Admin',
                role: 'ADMIN',
                department: 'Management',
                position: 'System Administrator',
                status: 'ACTIVE'
            }
        });

        console.log('✅ Super Admin created successfully!');
        console.log('   Email:', admin.email);
        console.log('   Role:', admin.role);
        console.log('   Name:', admin.firstName, admin.lastName);
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

createAdmin();
