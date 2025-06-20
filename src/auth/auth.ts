import { jwt } from '@elysiajs/jwt';
import { Elysia, t } from 'elysia';

import { PrismaClient } from '@/generated/prisma/client';
import { createToken } from '@/core/security';

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
                    data: users,
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

            // TODO i want use httpOnly: false, for development
            const accessJWTToken = await createToken(user.id, 'access', '1d');
            accessToken.set({
                value: accessJWTToken,
                httpOnly: false,
                maxAge: 1 * 86400,
                path: '/',
            });

            // TODO i want use httpOnly: false, for development
            const refreshJWTToken = await createToken(user.id, 'refresh', '3d');
            refreshToken.set({
                value: refreshJWTToken,
                httpOnly: false,
                maxAge: 3 * 86400,
                path: '/',
            });

            await prisma.refreshToken.create({
                data: {
                    token: refreshJWTToken,
                    userId: user.id,
                    expiresAt: new Date(
                        Date.now() + 3 * 86400 * 1000, // 3 days
                    ),
                },
            });

            return status(200, {
                success: true,
                message: `Signed in as ${email}`,
                data: {
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
            if (!accessToken || !accessToken.value) {
                return {
                    message: 'You are not logged in',
                    success: false,
                };
            }
            accessToken.remove();
            if (refreshToken && refreshToken.value) {
                await prisma.refreshToken.deleteMany({
                    where: { token: refreshToken.value },
                });
            }

            refreshToken.remove();
            return {
                message: 'Logout successfully',
                success: true,
            };
        },
        {
            detail: {
                summary: 'logout the user',
                tags: ['authentication'],
            },
        },
    );
