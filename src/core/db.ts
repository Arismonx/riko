import { PrismaClient } from '@/generated/prisma/client';
// import { PrismaPg } from '@prisma/adapter-pg';
// import { env } from '@/core/config';

// const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });

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
