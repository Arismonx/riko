import { jwt } from '@elysiajs/jwt';
import { Elysia, t } from 'elysia';

import { PrismaClient } from '@/generated/prisma';
import { createAccessToken, createRefreshToken } from '@/core/security';

const prisma = new PrismaClient();

export const user = new Elysia({ prefix: '/user' })
    .use(
        jwt({
            name: 'jwt',
            secret: process.env.SECRET_KEY as string,
        }),
    )

    .post(
        '/register',
        async ({ body: { email, password }, status }) => {
            const checkemail = await prisma.user.findUnique({
                where: {
                    email: email,
                },
            });

            if (checkemail) {
                return status(409, {
                    success: false,
                    message: 'User already exists',
                });
            } else {
                const hashPassword = await Bun.password.hash(password, {
                    algorithm: 'bcrypt',
                    cost: 10,
                });

                const users = await prisma.user.create({
                    data: {
                        email: email,
                        hashedPassword: hashPassword,
                    },
                });

                return status(201, {
                    success: true,
                    message: 'User created Successful!',
                    date: users,
                });
            }
        },
        {
            body: t.Object({
                email: t.String({ format: 'email' }),
                password: t.String({
                    minLength: 8,
                    description: 'User password (at least 8 characters)',
                }),
            }),
            detail: {
                summary: 'register the user',
                tags: ['authentication'],
            },
        },
    )
    .post(
        '/login',
        async ({
            body: { email, password },
            status,
            cookie: { accessToken, refreshToken },
        }) => {
            const user = await prisma.user.findUnique({
                where: { email: email },
                select: {
                    id: true,
                    email: true,
                    hashedPassword: true,
                },
            });
            if (!user) {
                return status(404, {
                    success: false,
                    message: 'user not found',
                });
            }

            if (!(await Bun.password.verify(password, user.hashedPassword)))
                return status(401, {
                    success: false,
                    message: 'Invalid email or password',
                });

            const accessJWTToken = await createAccessToken(user.id, '1d');
            accessToken.set({
                value: accessJWTToken,
                httpOnly: false,
                maxAge: 1 * 86400,
                path: '/',
            });

            const refreshJWTToken = await createRefreshToken(user.id, '3d');
            refreshToken.set({
                value: refreshJWTToken,
                httpOnly: false,
                maxAge: 3 * 86400,
                path: '/',
            });

            const updateRefreshToken = await prisma.user.update({
                where: { id: user.id },
                data: { refreshJWTToken: refreshJWTToken },
            });

            return status(200, {
                success: true,
                message: `Signed in as ${email}`,
                data: {
                    user: updateRefreshToken,
                    id: user.id,
                    accessJWTToken,
                    refreshJWTToken,
                },
            });
        },
        {
            body: t.Object({
                email: t.String({ format: 'email' }),
                password: t.String(),
            }),
            detail: {
                summary: 'login the user',
                tags: ['authentication'],
            },
        },
    )
    .post(
        '/logout',
        async ({ cookie: { accessToken, refreshToken } }) => {
            accessToken.remove();
            refreshToken.remove();

            return {
                message: 'Logout successfully',
            };
        },
        {
            detail: {
                summary: 'logout the user',
                tags: ['authentication'],
            },
        },
    );
