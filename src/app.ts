import { Elysia } from 'elysia';
import { user } from './auth/auth';
import { cookie } from './auth/cookie'
export const app = new Elysia({ name: 'chat-bot' })


app
.get('/',() => 'Hello World')
.use(user)
.use(cookie)

export type App = typeof app;
