import { cors } from '@elysiajs/cors';
import { swagger } from '@elysiajs/swagger';
import { Elysia } from 'elysia';

import { apiRouter } from '@/api';
import { auth } from '@/auth/auth';
import { env } from '@/core/config';

export const app = new Elysia({ name: env.PROJECT_NAME }) //
    .use(
        cors({
            origin: [...env.BACKEND_CORS_ORIGINS, env.FRONTEND_HOST],
            methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
            credentials: true,
            allowedHeaders: true,
        }),
    )
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
