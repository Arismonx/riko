import { t } from 'elysia';

export const Character = t.Object({
    id: t.String({ format: 'uuid' }),
    title: t.String(),
    createdAt: t.Date(),
    updatedAt: t.Date(),
});

export const Characters = t.Object({});

export const CreateCharacter = t.Object({
    name: t.String(),
    description: t.Optional(t.String()),
    instructions: t.String(),
});

export const UpdateCharacter = t.Partial(CreateCharacter);
