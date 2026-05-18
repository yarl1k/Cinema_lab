import 'dotenv/config';
import { prisma } from '../services/database/database.js';
import { notifierQueue } from '../services/queue.js';

async function syncExistingUsers() {
    console.log('Починаємо синхронізацію користувачів...');

    try {
        // 1. Дістаємо ВСІХ юзерів з основної БД
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
            }
        });

        console.log(`Знайдено ${users.length} користувачів. Відправляємо в чергу...`);

        // 2. Кидаємо кожного юзера в Redis як подію 'user.created'
        for (const user of users) {
            await notifierQueue.add('user.created', {
                id: user.id,
                email: user.email,
            });
        }

        console.log('Всі користувачі успішно додані в чергу!');
    } catch (error) {
        console.error('Помилка синхронізації:', error);
    } finally {
        // Закриваємо з'єднання, щоб скрипт завершив роботу
        await prisma.$disconnect();
        await notifierQueue.close();
        process.exit(0);
    }
}

syncExistingUsers();
