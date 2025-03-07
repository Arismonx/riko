import { Elysia } from 'elysia';

export const app = new Elysia({ name: 'chat-bot' })

export type App = typeof app;
