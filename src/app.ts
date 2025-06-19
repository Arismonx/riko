import { Elysia } from 'elysia';

import { apiRouter } from '@/api';
import { auth } from '@/auth/auth';

export const app = new Elysia({ name: 'ai-chat-bot' }) //
    .use(auth)
    .use(apiRouter({ prefix: '/api/v1' }));

// export type app = typeof app;
