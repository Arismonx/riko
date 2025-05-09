import { PrismaClient } from '@/generated/prisma/client';

export const prisma = new PrismaClient({
    ...(process.env.NODE_ENV === 'development' && {
        errorFormat: 'pretty',
        log: [
            {
                emit: 'event',
                level: 'query',
            },
            {
                emit: 'stdout',
                level: 'error',
            },
            {
                emit: 'stdout',
                level: 'info',
            },
            {
                emit: 'stdout',
                level: 'warn',
            },
        ],
    }),
});
