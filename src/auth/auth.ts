import { jwt } from '@elysiajs/jwt';
import { Elysia, t } from 'elysia';

import { PrismaClient } from '@/generated/prisma';
import { date } from 'better-auth';

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
            jwt,
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

            const accessJWTToken = await jwt.sign({ email });
            accessToken.set({
                value: accessJWTToken,
                httpOnly: false,
                maxAge: 1 * 86400,
                path: '/',
            });

            const refreshJWTToken = await jwt.sign({ email });
            refreshToken.set({
                value: refreshJWTToken,
                httpOnly: false,
                maxAge: 3 * 86400,
                path: '/',
            });

            return status(200, {
                success: true,
                message: `Signed in as ${email}`,
                data: {
                    user,
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
    );
