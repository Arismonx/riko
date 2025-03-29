import { jwt } from '@elysiajs/jwt';
import { t } from 'elysia';

import { env } from '@/core/config';

const ALGORITHM = 'HS256';

export const security = jwt({
    name: 'jwt',
    secret: env.SECRET_KEY,
    alg: ALGORITHM,
    typ: 'JWT',
    exp: '7d',
    schema: t.Object({
        sub: t.String(),
    }),
});

export async function verifyPassword(
    plainPassword: string,
    hashedPassword: string,
) {
    return await Bun.password.verify(plainPassword, hashedPassword, 'bcrypt');
}

export async function getPasswordHash(password: string) {
    return await Bun.password.hash(password, {
        algorithm: 'bcrypt',
        cost: 10,
    });
}
