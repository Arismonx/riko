import { jwt } from '@elysiajs/jwt';
import { t } from 'elysia';
import * as jose from 'jose';

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

export const createAccessToken = async (subject: string, exp: string) => {
    const payload = { sub: subject, type: 'access' };
    const encodedJwt = await new jose.SignJWT(payload)
        .setProtectedHeader({ alg: ALGORITHM, typ: 'JWT' })
        .setExpirationTime(exp)
        .sign(new TextEncoder().encode(env.SECRET_KEY));
    return encodedJwt;
};

export const createRefreshToken = async (subject: string, exp: string) => {
    const payload = { sub: subject, type: 'refresh' };
    const encodedJwt = await new jose.SignJWT(payload)
        .setProtectedHeader({ alg: ALGORITHM, typ: 'JWT' })
        .setExpirationTime(exp)
        .sign(new TextEncoder().encode(env.SECRET_KEY));
    return encodedJwt;
};
