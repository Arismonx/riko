import { record } from '@elysiajs/opentelemetry';
import {
    type AgentInputItem,
    Runner,
    RunState,
    RunToolApprovalItem,
} from '@openai/agents';
import { status } from 'elysia';

import { agent } from '@/lib/ai/agents';

export function generateConversationId() {
    return `conv_${Bun.randomUUIDv7().replace(/-/g, '').slice(0, 24)}`;
}

type ChatOptions = {
    conversationId?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    messages?: AgentInputItem[] | RunState<any, any>;
    decisions?: Record<string, 'approved' | 'rejected'> | null;
};

// Example code from openai-agents-js

export abstract class AI {
    static async chat(data: ChatOptions) {
        return record('ai.chat', async () => {
            try {
                let { conversationId, messages, decisions } = data;

                if (!messages) {
                    messages = [];
                }

                if (!conversationId) {
                    // we will generate a conversation ID so we can keep track of the state in case of conversations
                    // this is just a key that we can use to store information in the database
                    conversationId = generateConversationId();
                }

                if (!decisions) {
                    decisions = null;
                }

                const runner = new Runner({ groupId: conversationId });

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                let input: AgentInputItem[] | RunState<any, any>;

                if (decisions && data.conversationId) {
                    // If we receive a new request with decisions, we will look up the current state in the database
                    // const stateString = await db().get(data.conversationId);
                    // TODO: Implement database retrieval logic to fetch the conversation state using data.conversationId.
                    const stateString = undefined;

                    if (!stateString) {
                        throw status(404, 'Conversation not found.');
                    }
                    // We then deserialize the state so we can manipulate it and continue the run
                    const state = await RunState.fromString(agent, stateString);

                    const interruptions: RunToolApprovalItem[] =
                        state.getInterruptions();

                    for (const item of interruptions) {
                        if (
                            item.type === 'tool_approval_item' &&
                            'callId' in item.rawItem
                        ) {
                            const callId = item.rawItem.callId;

                            if (decisions[callId] === 'approved') {
                                state.approve(item);
                            } else if (decisions[callId] === 'rejected') {
                                state.reject(item);
                            }
                        }
                    }

                    // We will use the new updated state to continue the run
                    input = state;
                } else {
                    // If we don't have any decisions, we will just assume this is a regular chat and use the messages
                    // as input for the next run
                    input = messages;
                }

                const result = await runner.run(agent, input);

                if (result.interruptions.length > 0) {
                    // If the run resulted in one or more interruptions, we will store the current state in the database

                    // store the state in the database
                    // console.log(JSON.stringify(result.state));
                    // await db().set(conversationId, JSON.stringify(result.state));

                    // We will return all the interruptions as approval requests to the UI/client so it can generate
                    // the UI for approvals
                    // We will also still return the history that contains the tool calls and potentially any interim
                    // text response the agent might have generated (like announcing that it's calling a function)
                    return {
                        conversationId,
                        approvals: result.interruptions
                            .filter(
                                (item) => item.type === 'tool_approval_item',
                            )
                            .map((item) => item.toJSON()),
                        history: result.history,
                    };
                }
                return {
                    response: result.finalOutput,
                    history: result.history,
                    conversationId,
                };
            } catch (error) {
                console.error('Error in AI.chat:', error);
                throw status(500, 'Internal server error.');
            }
        });
    }
}
