import { cors } from '@elysiajs/cors';
import { swagger } from '@elysiajs/swagger';
import { Elysia } from 'elysia';

import { apiRouter } from '@/api';
import { auth } from '@/auth/auth';
import { env } from '@/core/config';

export const app = new Elysia({ name: env.APP_NAME }) //
    .use(
        cors({
            origin: [...env.BACKEND_CORS_ORIGINS, env.FRONTEND_HOST],
            methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
            credentials: true,
            allowedHeaders: ['Content-Type', 'Authorization'],
        }),
    )
    .use((app) => {
        if (env.NODE_ENV === 'development')
            return app.use(
                swagger({
                    path: '/api/docs',
                    documentation: {
                        info: {
                            title: env.APP_NAME,
                            version: env.APP_VERSION,
                        },
                    },
                }),
            );
        return app;
    })
    .use(auth)
    .use(apiRouter({ prefix: '/api/v1' }));

// export type app = typeof app;
