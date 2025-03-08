import { Elysia, t } from 'elysia'
import { jwt } from '@elysiajs/jwt'

export const user = new Elysia({ prefix: '/user' })
    .use(
        jwt({
            name: 'jwt',
            secret: 'Fischl von Luftschloss Narfidort'
        })
    )
    .state({
        user: {} as Record<string, string>,
        session: {} as Record<number, string>
    })
    .post('/register', async ({ body: { email, password }, store, error }) => {
        if (store.user[email])
            return error(400, {
                success: false,
                message: 'User already exists'
            })
        store.user[email] = await Bun.password.hash(password, {
            algorithm: 'bcrypt',
            cost: 4
        })
        console.log("hash password:", store.user[email])
        return {
            success: true,
            message: 'User created Successful!'
        }
    }, {
        body: t.Object({
            email: t.String(),
            password: t.String()
        })
    })

    .post(
        '/login',
        async ({
            jwt,
            store: { user },
            error,
            body: { email, password },
            cookie:{ auth },
        }) => {
            const value = await jwt.sign(email)
            auth.set({
                value,
                httpOnly: false,
                maxAge: 7 * 86400,
                path:'/'
            })

            if (
                !user[email] ||
                !(await Bun.password.verify(password, user[email]))
            )
                return error(400, {
                    success: false,
                    message: 'Invalid username or password'
                })

            return {
                success: true,
                message: `Signed in as ${email}`
            }
        },
        {
            body: t.Object({
                email: t.String(),
                password: t.String()
            }),
        }
    )
