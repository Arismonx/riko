import { cors } from '@elysiajs/cors';
import { swagger } from '@elysiajs/swagger';
import { Elysia } from 'elysia';

import { apiRouter } from '@/api';
import { auth } from '@/auth/auth';
import { env } from '@/core/config';

export const app = new Elysia({ name: 'ai-chat-bot' }) //
    .use((app) => {
        const ALL_CORS_ORIGINS: string[] = [
            ...env.BACKEND_CORS_ORIGINS,
            env.FRONTEND_HOST,
        ];
        app.use(
            cors({
                origin: ALL_CORS_ORIGINS,
                methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
                credentials: true,
                allowedHeaders: true,
            }),
        );
        return app;
    })
    .use((app) => {
        if (env.NODE_ENV !== 'production')
            return app.use(
                swagger({
                    path: '/api/docs',
                    documentation: {
                        info: {
                            title: env.PROJECT_NAME,
                            version: env.PROJECT_VERSION,
                        },
                    },
                }),
            );
        return app;
    })
    .use(auth)
    .use(apiRouter({ prefix: '/api/v1' }));

// export type app = typeof app;
