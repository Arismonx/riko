import z from 'zod';

const envSchema = z
    .object({
        OPENAI_API_KEY: z.string().describe('OpenAI API key'),
        OPENAI_BASE_URL: z
            .string()
            .url()
            .default('https://api.openai.com/v1')
            .describe('OpenAI API base URL'),
    })
    .readonly();

const envServer = envSchema.safeParse(process.env);

if (!envServer.success) {
    console.error('Invalid environment variables, check the errors below!');
    console.error(envServer.error.issues);
    process.exit(1);
}

export type Environment = z.infer<typeof envSchema>;

export const env: Environment = envServer.data;
