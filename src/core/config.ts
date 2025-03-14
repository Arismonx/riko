import type { StaticDecode } from '@sinclair/typebox';
import { TransformDecodeCheckError, Value } from '@sinclair/typebox/value';
import { t, type TSchema } from 'elysia';

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
    NODE_ENV: t.Union(
        [t.Literal('development'), t.Literal('test'), t.Literal('production')],
        {
            default: 'development',
            description: 'Node environment',
        },
    ),
    PROJECT_NAME: t.String({
        description: 'Project name',
    }),
    HOSTNAME: t.String({
        default: 'localhost',
        description: 'API hostname',
    }),
});

export type Environment = typeof envSchema.static;

export const env: Environment = parseEnv(envSchema, process.env);
