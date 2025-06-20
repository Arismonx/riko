import { Elysia, t } from 'elysia';

import { ai } from '@/modules/ai';
import { characters } from '@/modules/characters';

export const ErrorMessage = t.Object({
    code: t.String(),
    message: t.String(),
});

export const apiRouter = <T extends string>(config: { prefix: T }) =>
    new Elysia({
        prefix: config.prefix,
        name: `${config.prefix.replace('/', '-')}`,
        seed: config,
    })
        .guard({
            response: {
                400: ErrorMessage, // bad request
                401: ErrorMessage, // not authenticated
                403: ErrorMessage, // permission denied
                404: ErrorMessage, // not found
                500: ErrorMessage, // internal server error
            },
        })
        .get('/health', true, { detail: { hide: true } })
        .use(ai)
        .use(characters);
