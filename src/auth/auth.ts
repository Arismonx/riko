import { jwt } from '@elysiajs/jwt';
import { Prisma, PrismaClient } from '@prisma/client';
import { Elysia, t } from 'elysia';

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
        async ({ body: { email, password }, error }) => {
            const checkemail = await prisma.user.findUnique({
                where: {
                    email: email,
                },
            });

            if (checkemail)
                return error(400, {
                    success: false,
                    message: 'User already exists',
                });

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

            return error(201, {
                success: true,
                message: 'User created Successful!',
                data: users,
            });
        },
        {
            body: t.Object({
                email: t.String({ format: 'email' }),
                password: t.String({ minLength: 8 }),
            }),
        },
    )
    .post(
        '/register',
        async ({ body: { email, password }, store, error }) => {
            if (store.user[email])
                return error(400, {
                    success: false,
                    message: 'User already exists',
                });
            store.user[email] = await Bun.password.hash(password, {
                algorithm: 'bcrypt',
                cost: 4,
            });
            console.log('hash password:', store.user[email]);
            return {
                success: true,
                message: 'User created Successful!',
            };
        },
        {
            body: t.Object({
                email: t.String(),
                password: t.String(),
            }),
        },
    )

    .post(
        '/login',
        async ({ jwt, error, body: { email, password }, cookie: { auth } }) => {
            const user = await prisma.user.findUnique({
                where: {
                    email: email,
                },
            });
            if (!user) {
                return error(404, {
                    success: false,
                    message: 'user not found',
                });
            }

            if (!(await Bun.password.verify(password, user.hashedPassword)))
                return error(401, {
                    success: false,
                    message: 'Invalid email or password',
                });

            const token = await jwt.sign({ email });
            auth.set({
                value: token,
                httpOnly: false,
                maxAge: 7 * 86400,
                path: '/',
            });
            return error(200, {
                success: true,
                message: `Signed in as ${email}`,
            });
        },
        {
            body: t.Object({
                email: t.String({ format: 'email' }),
                password: t.String({ minLength: 8 }),
            }),
        },
    );
