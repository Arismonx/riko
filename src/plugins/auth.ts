import { Elysia } from 'elysia';

import { prisma } from '@/core/db';
import { security } from '@/core/security';
import { HTTPError } from '@/errors';

export const auth = new Elysia({ name: 'auth' })
    .use(security)
    .derive(async ({ jwt, cookie: { auth } }) => {
        console.log('auth', auth.value);
        const jwtPayload = await jwt.verify(auth.value);
        if (!jwtPayload) {
            throw new HTTPError({
                status: 403,
                message: 'Could not validate credentials',
            });
        }

        const userId = jwtPayload.sub;
        console.log('userId', userId);

        const user = await prisma.user.findUnique({ where: { id: userId } });

        if (!user) {
            throw new HTTPError({
                status: 404,
                message: 'User not found',
            });
        }

        if (!user.isActive) {
            throw new HTTPError({
                status: 400,
                message: 'Inactive user',
            });
        }

        return { currentUser: user };
    })
    .as('scoped');
