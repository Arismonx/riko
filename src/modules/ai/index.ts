// import { AIModel } from './model';
import type { AgentInputItem } from '@openai/agents';
import { Elysia, t } from 'elysia';
import { background } from 'elysia-background';

import { prisma } from '@/core/db';
import { auth } from '@/plugins/auth';

import { AI } from './service';

export const ai = new Elysia({ prefix: '/ai' }) //
    .use(auth)
    .use(background())
    .post(
        '/chat',
        async ({ body, currentUser, status }) => {
            const { conversationId, message, decisions } = body;

            try {
                const response = await prisma.$transaction(async (tx) => {
                    const character = await tx.character.findFirst({
                        where: {
                            userId: currentUser.id,
                        },
                    });

                    if (!character) {
                        throw status(404, 'Character not found');
                    }

                    let chat;

                    if (!conversationId) {
                        chat = await tx.chat.create({
                            data: {
                                title: `Chat with ${character.name}`,
                                characterId: character.id,
                                userId: currentUser.id,
                            },
                            include: {
                                messages: true,
                            },
                        });
                    } else {
                        chat = await tx.chat.findFirst({
                            where: {
                                id: conversationId,
                                userId: currentUser.id,
                            },
                            include: {
                                messages: true,
                            },
                        });
                    }

                    if (!chat) {
                        throw status(404, 'Chat not found');
                    }

                    const chatId = chat.id;

                    const messages: AgentInputItem[] = [];

                    for (const msg of chat.messages) {
                        // TODO: add error handling for JSON parsing
                        const content = JSON.parse(msg.content);
                        messages.push(content);
                    }

                    if (message) {
                        messages.push({
                            type: 'message',
                            role: 'user',
                            content: message,
                        });
                    }

                    // This is just a placeholder to show on the UI to show the agent is working
                    messages.push({
                        type: 'message',
                        role: 'assistant',
                        content: [],
                        status: 'in_progress',
                    });

                    const response = await AI.chat({
                        conversationId: chatId,
                        messages,
                        decisions,
                    });

                    for (const msg of response.history) {
                        const content = JSON.stringify(msg);

                        const existingMessage = await tx.message.findFirst({
                            where: {
                                chatId,
                                content,
                            },
                        });

                        if (!existingMessage) {
                            await tx.message.create({
                                data: {
                                    chatId,
                                    content,
                                },
                            });
                        }
                    }

                    // backgroundTasks.addTask(async () => {});

                    return response;
                });
                return response;
            } catch (err) {
                console.error(err);
                throw status(500, 'Internal server error.');
            }

            // // TODO: fetch conversation history from database if conversationId is provided

            // console.log('AI response:', response.history);
        },
        {
            body: t.Object({
                conversationId: t.Optional(t.String()),
                message: t.Optional(t.String()),
                // messages: t.Array(
                //     t.Object({
                //         role: t.Union([
                //             t.Literal('user'),
                //             t.Literal('assistant'),
                //         ]),
                //         content: t.String(),
                //     }),

                decisions: t.Optional(
                    t.Record(
                        t.String(),
                        t.Union([t.Literal('approved'), t.Literal('rejected')]),
                    ),
                ),
            }),
        },
        // {
        //     body: AIModel.test,
        //     response: {
        //         200: AIModel.test2,
        //         400: AIModel.test3,
        //     },
        // },
    )
    .get('/test', () => {});
