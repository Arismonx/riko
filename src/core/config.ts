import * as z from 'zod/v4';

import packageInfo from '../../package.json';

const envSchema = z
    .object({
        NODE_ENV: z
            .enum(['development', 'test', 'production'], {
                message:
                    'NODE_ENV must be one of "development", "test", "production"',
            })
            .default('development')
            .describe('Node environment'),

        // Application
        APP_NAME: z.string().describe('App name'),
        APP_VERSION: z.string().describe('App version'),
        HOSTNAME: z.string().default('localhost').describe('API hostname'),
        FRONTEND_HOST: z
            .string()
            .default('http://localhost:3000')
            .describe('Frontend host'),
        BACKEND_CORS_ORIGINS: z
            .string()
            .default('')
            .describe('Comma-separated list of origins for the CORS policy')
            .transform((value) =>
                value
                    .split(',')
                    .map((v) => v.trim().replace(/\/$/, ''))
                    .filter((v) => v),
            ),
        // Security
        SECRET_KEY: z.string().describe('Secret key for JWT'),
        ACCESS_TOKEN_EXPIRE: z
            .string()
            .regex(/^\d+[smhdwMy]$/, {
                message:
                    'ACCESS_TOKEN_EXPIRE must be in the format of a number followed by a time unit (s, m, h, d, w, M, y)',
            })
            .default('15m')
            .describe('Access token expiration time'),

        // Database
        DATABASE_URL: z.string().describe('Database connection string'),

        // Ai
        // AI_DEFAULT_INSTRUCTIONS: z.string().describe('Instructions for AI Agent'),
    })
    .readonly();

const envServer = envSchema.safeParse({
    APP_NAME: 'name' in packageInfo ? packageInfo.name : undefined,
    APP_VERSION: 'version' in packageInfo ? packageInfo.version : undefined,
    ...process.env,
});

if (!envServer.success) {
    console.error('Invalid environment variables, check the errors below!');
    console.error(envServer.error.issues);
    process.exit(1);
}

export type Environment = z.infer<typeof envSchema>;

export const env: Environment = envServer.data;
