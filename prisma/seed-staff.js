const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function seedStaff() {
    console.log('🚀 Seeding staff members...\n');

    const staffMembers = [
        {
            email: 'admin@kurlybrains.com',
            password: 'admin@12345@123',
            firstName: 'Super',
            lastName: 'Admin',
            role: 'ADMIN',
            department: 'Management',
            position: 'System Administrator',
        },
        {
            email: 'john.doe@kurlybrains.com',
            password: 'staff123',
            firstName: 'John',
            lastName: 'Doe',
            role: 'MANAGER',
            department: 'Engineering',
            position: 'Engineering Manager',
        },
        {
            email: 'jane.smith@kurlybrains.com',
            password: 'staff123',
            firstName: 'Jane',
            lastName: 'Smith',
            role: 'STAFF',
            department: 'Engineering',
            position: 'Senior Developer',
        },
        {
            email: 'mike.wilson@kurlybrains.com',
            password: 'staff123',
            firstName: 'Mike',
            lastName: 'Wilson',
            role: 'STAFF',
            department: 'Design',
            position: 'UI/UX Designer',
        },
        {
            email: 'sarah.johnson@kurlybrains.com',
            password: 'staff123',
            firstName: 'Sarah',
            lastName: 'Johnson',
            role: 'MANAGER',
            department: 'Marketing',
            position: 'Marketing Manager',
        },
        {
            email: 'alex.brown@kurlybrains.com',
            password: 'staff123',
            firstName: 'Alex',
            lastName: 'Brown',
            role: 'STAFF',
            department: 'Marketing',
            position: 'Content Writer',
        },
        {
            email: 'emily.davis@kurlybrains.com',
            password: 'staff123',
            firstName: 'Emily',
            lastName: 'Davis',
            role: 'STAFF',
            department: 'Engineering',
            position: 'Frontend Developer',
        },
        {
            email: 'david.lee@kurlybrains.com',
            password: 'staff123',
            firstName: 'David',
            lastName: 'Lee',
            role: 'STAFF',
            department: 'Engineering',
            position: 'Backend Developer',
        },
        {
            email: 'lisa.wang@kurlybrains.com',
            password: 'staff123',
            firstName: 'Lisa',
            lastName: 'Wang',
            role: 'MANAGER',
            department: 'HR',
            position: 'HR Manager',
        },
        {
            email: 'tom.clark@kurlybrains.com',
            password: 'staff123',
            firstName: 'Tom',
            lastName: 'Clark',
            role: 'STAFF',
            department: 'Operations',
            position: 'Operations Specialist',
        },
    ];

    for (const member of staffMembers) {
        try {
            const hashedPassword = await bcrypt.hash(member.password, 12);

            const user = await prisma.user.upsert({
                where: { email: member.email },
                update: {
                    firstName: member.firstName,
                    lastName: member.lastName,
                    department: member.department,
                    position: member.position,
                },
                create: {
                    email: member.email,
                    password: hashedPassword,
                    firstName: member.firstName,
                    lastName: member.lastName,
                    role: member.role,
                    department: member.department,
                    position: member.position,
                    status: 'ACTIVE',
                },
            });

            console.log(`✅ ${user.firstName} ${user.lastName} (${user.role}) - ${user.email}`);
        } catch (error) {
            console.error(`❌ Failed to create ${member.email}:`, error.message);
        }
    }

    // Seed some sample tasks
    console.log('\n📋 Seeding sample tasks...\n');

    const users = await prisma.user.findMany({ take: 5 });

    const tasks = [
        {
            title: 'Complete Q1 Report',
            description: 'Prepare and submit the quarterly performance report',
            priority: 'HIGH',
            status: 'IN_PROGRESS',
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
        {
            title: 'Update Dashboard UI',
            description: 'Implement the new dark theme design across all pages',
            priority: 'MEDIUM',
            status: 'TODO',
            dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        },
        {
            title: 'Review Code PR #142',
            description: 'Review and provide feedback on the authentication feature',
            priority: 'HIGH',
            status: 'REVIEW',
        },
        {
            title: 'Team Meeting Preparation',
            description: 'Prepare agenda and materials for weekly team sync',
            priority: 'LOW',
            status: 'COMPLETED',
        },
        {
            title: 'Security Audit',
            description: 'Run security scans and address any vulnerabilities',
            priority: 'URGENT',
            status: 'TODO',
            dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        },
    ];

    for (let i = 0; i < tasks.length; i++) {
        const task = tasks[i];
        const creator = users[0];
        const assignee = users[i % users.length];

        await prisma.task.create({
            data: {
                ...task,
                creatorId: creator.id,
                assigneeId: assignee.id,
            },
        });
        console.log(`✅ Task: ${task.title}`);
    }

    // Seed sample announcements
    console.log('\n📢 Seeding announcements...\n');

    const admin = users.find(u => u.role === 'ADMIN') || users[0];

    await prisma.announcement.createMany({
        data: [
            {
                title: 'Welcome to Kurly Brains Staff Dashboard',
                content: 'We are excited to launch our new internal staff management platform. This system will help us better communicate, track tasks, and manage our team effectively.',
                priority: 'HIGH',
                isPublished: true,
                publishedAt: new Date(),
                authorId: admin.id,
            },
            {
                title: 'New Leave Policy Update',
                content: 'Please review the updated leave policy document in the HR portal. Key changes include flexible work arrangements and improved maternity/paternity benefits.',
                priority: 'MEDIUM',
                isPublished: true,
                publishedAt: new Date(),
                authorId: admin.id,
            },
            {
                title: 'System Maintenance Notice',
                content: 'The dashboard will undergo scheduled maintenance this weekend (Saturday 2 AM - 6 AM). Please save your work before this time.',
                priority: 'LOW',
                isPublished: true,
                publishedAt: new Date(),
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                authorId: admin.id,
            },
        ],
    });

    console.log('✅ Created 3 announcements\n');

    console.log('🎉 Seeding completed successfully!\n');
    console.log('📧 Login credentials:');
    console.log('   Admin: admin@kurlybrains.com / admin@12345@123');
    console.log('   Staff: any staff email / staff123');
}

seedStaff()
    .catch((error) => {
        console.error('Seeding failed:', error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
