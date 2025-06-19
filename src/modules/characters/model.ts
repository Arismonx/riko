import { t, type TSchema } from 'elysia';

export const Character = t.Object({
    id: t.String({ format: 'uuid' }),
    name: t.String(),
    createdAt: t.Date(),
    updatedAt: t.Date(),
});

export type Character = typeof Character.static;

export const Pagination = <T extends TSchema>(schema: T) =>
    t.Object({
        data: t.Array(schema),
        pagination: t.Object({
            total: t.Number(),
            limit: t.Number(),
            offset: t.Number(),
        }),
    });

export const OffsetBasedPagination = t.Object({
    limit: t.Number({ minimum: 1, default: 100 }),
    offset: t.Number({ minimum: 0, default: 0 }),
});

export const Characters = Pagination(Character);

export type Characters = typeof Characters.static;

export const CreateCharacter = t.Object({
    name: t.String(),
    description: t.Optional(t.String()),
    instructions: t.String(),
});

export type CreateCharacter = typeof CreateCharacter.static;

export const UpdateCharacter = t.Partial(CreateCharacter);

export type UpdateCharacter = typeof UpdateCharacter.static;
