import { Elysia, t } from 'elysia';

import { prisma } from '@/core/db';
import { HTTPError } from '@/errors';
import { auth } from '@/plugins/auth';

import { Character, CreateCharacter } from './model';

// const CHARACTER_LIMIT = 5;
// const CHARACTER_LIMIT_PRO = 30;

export const characters = new Elysia({
    prefix: '/characters',
    tags: ['characters'],
})
    .use(auth)
    .get(
        '/',
        async ({ query: { limit, offset } }) => {
            const [characters, count] = await prisma.$transaction([
                prisma.character.findMany({
                    skip: offset,
                    take: limit,
                }),
                prisma.character.count(),
            ]);
            return {
                data: characters,
                pagination: {
                    limit: limit,
                    offset: offset,
                    total: count,
                },
            };
        },
        {
            query: t.Object({
                limit: t.Number({ minimum: 1, default: 100 }),
                offset: t.Number({ minimum: 0, default: 0 }),
            }),
        },
    )
    .get(
        '/:id',
        async ({ params: { id } }) => {
            const character = await prisma.character.findUnique({
                where: { id },
            });

            if (!character) {
                throw new HTTPError({
                    status: 404,
                    message: 'Character not found',
                });
            }

            return character;
        },
        {
            params: t.Object({
                id: t.String({ format: 'uuid' }),
            }),
        },
    )
    .post(
        '/',
        async ({ body, set, currentUser }) => {
            try {
                const newCharacter = await prisma.$transaction(async (tx) => {
                    // const count = await tx.character.count({
                    //     where: {
                    //         userId: currentUser.id,
                    //     },
                    // });

                    // if (
                    //     currentUser.tier === 'free' &&
                    //     count >= CHARACTER_LIMIT
                    // ) {
                    //     throw new HTTPError({
                    //         status: 403,
                    //         message: 'Character limit reached',
                    //     });
                    // }

                    // if (
                    //     currentUser.tier === 'pro' &&
                    //     count >= CHARACTER_LIMIT_PRO
                    // ) {
                    //     throw new HTTPError({
                    //         status: 403,
                    //         message: 'Character limit reached',
                    //     });
                    // }

                    const newCharacter = await tx.character.create({
                        data: {
                            ...body,
                            userId: currentUser.id,
                        },
                    });
                    return newCharacter;
                });
                set.status = 201;
                return newCharacter;
            } catch (err) {
                // TODO: handle error for prisma and any other errors
                console.error(err);
                throw new HTTPError({
                    status: 500,
                    message: 'Internal server error',
                });
            }
        },
        {
            body: CreateCharacter,
            response: Character,
        },
    )
    .patch('/:id', () => {
        // TODO: implement update character logic
    })
    .delete('/:id', () => {
        // TODO: implement delete character logic
    });
