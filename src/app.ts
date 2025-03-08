import { Elysia } from 'elysia';

import { prisma } from '@/core/db';

export const app = new Elysia({ name: 'chat-bot' })


app.get('/test', () => {
    const users = prisma.user.findMany({
        skip: 0, // offset
        take: 10, // limit
    });
    return users;
})

export type App = typeof app;
