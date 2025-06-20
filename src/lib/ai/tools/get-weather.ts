import { tool } from '@openai/agents';
import { z } from 'zod';

export const getWeather = tool({
    name: 'get_weather',
    description: 'Get the weather for a given city',
    parameters: z.object({
        city: z.string(),
    }),
    execute: async ({ city }) => {
        return `The weather in ${city} is sunny.`;
    },

    needsApproval: true,
});
