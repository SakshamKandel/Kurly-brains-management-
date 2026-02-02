
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    try {
        // Find first user to assign page to
        const user = await prisma.user.findFirst();
        if (!user) {
            console.log("No user found");
            return;
        }

        console.log("Creating page for user:", user.email);

        const page = await prisma.customPage.create({
            data: {
                title: "Test Page Manual",
                icon: "🧪",
                userId: user.id,
                blocks: {
                    create: [
                        { type: "text", content: { text: "Hello manually created page" }, order: 0 }
                    ]
                }
            }
        });

        console.log("Created page:", page);
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
