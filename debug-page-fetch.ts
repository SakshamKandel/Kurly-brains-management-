
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    try {
        const user = await prisma.user.findFirst();
        if (!user) {
            console.log("No user found");
            return;
        }

        const page = await prisma.customPage.findFirst({
            where: { userId: user.id }
        });

        if (!page) {
            console.log("No page found for user");
            return;
        }

        console.log(`Fetching page ${page.id} for user ${user.id}...`);

        const fullPage = await prisma.customPage.findUnique({
            where: {
                id: page.id,
                // userId: user.id // Note: findUnique only takes unique fields in 'where'
            },
            include: {
                blocks: {
                    orderBy: { order: 'asc' }
                }
            }
        });

        // The API uses a compound condition or validates userId after fetch?
        // Wait, in the API route:
        /*
            const page = await prisma.customPage.findUnique({
                where: {
                    id: params.id,
                    userId: session.user.id
                },
                ...
        */
        // Prisma `findUnique` only accepts unique fields. `userId` is NOT part of the ID.
        // THIS IS THE BUG. `findUnique` cannot filter by `userId` unless it's part of a compound unique key!
        // It should be `findFirst` or check userId after fetching.

        console.log("Fetched page successfully:", fullPage?.id);

    } catch (e) {
        console.error("Error during fetch:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
