import type { StaticDecode } from '@sinclair/typebox';
import { TransformDecodeCheckError, Value } from '@sinclair/typebox/value';
import { t, type TSchema } from 'elysia';

import packageInfo from '../../package.json';

// A Simple Environment Variable Parser

function parseEnv<T extends TSchema>(
    schema: T,
    env: Record<string, string | undefined> = process.env,
): StaticDecode<T> {
    const value = Value.Clone(env);
    const cleaned = Value.Clean(schema, value);
    const defaulted = Value.Default(schema, cleaned);
    const converted = Value.Convert(schema, defaulted);
    try {
        return Value.Decode(schema, converted);
    } catch (err) {
        console.error('Invalid environment variables, check the errors below!');
        if (err instanceof TransformDecodeCheckError) {
            console.log([...Value.Errors(schema, converted)]);
        }
        throw err;
    }
}

//

const envSchema = t.Object({
    // Application
    APP_NAME: t.String({
        description: 'App name',
    }),
    APP_VERSION: t.String({
        description: 'App version',
        default: packageInfo.version || '0.0.1',
    }),
    NODE_ENV: t.Union(
        [t.Literal('development'), t.Literal('test'), t.Literal('production')],
        {
            default: 'development',
            description: 'Node environment',
        },
    ),
    HOSTNAME: t.String({
        default: 'localhost',
        description: 'API hostname',
    }),
    FRONTEND_HOST: t.String({
        description: 'Frontend host',
        default: 'http://localhost:3000',
    }),
    BACKEND_CORS_ORIGINS: t
        .Transform(
            t.String({
                description:
                    'Comma-separated list of origins for the CORS policy',
                default: '', // Default value is set to an empty string as setting a default for Transform is currently unclear.
            }),
        )
        .Decode((value) =>
            value
                .split(',')
                .map((v) => v.trim().replace(/\/$/, ''))
                .filter((v) => v),
        )
        .Encode((value) => value.join(',')),

    // Security
    SECRET_KEY: t.String({
        description: 'Secret key for JWT',
    }),
    ACCESS_TOKEN_EXPIRE: t.String({
        default: '1d',
        pattern: '^\\d+[smhdwMy]$',
        description: 'Access token expiration time',
    }),
});

export type Environment = typeof envSchema.static;

export const env: Environment = parseEnv(envSchema, process.env);
