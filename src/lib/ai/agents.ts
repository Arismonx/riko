import { Agent } from '@openai/agents';

export const agent = new Agent({
    name: 'Assistant',
    instructions: 'You are a helpful assistant.',
    model: 'gpt-4.1-nano',
});
