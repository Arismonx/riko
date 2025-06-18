import { Agent } from '@openai/agents';

import { getWeather } from './tools/get-weather';

export const agent = new Agent({
    name: 'Assistant',
    instructions: 'You are a helpful assistant.',
    // tools: [getWeather],
    model: 'gpt-4.1-nano',
});

// Elysia
// PostgreSQL
// Prisma
// OpenAI Agent SDK
