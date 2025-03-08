
import { app } from '@/app';

app.listen(
    {
        port: 8000,
    },
    ({ hostname, port }) => {
        const url = `${process.env.NODE_ENV !== 'production' ? 'http://' : 'https://'}${hostname}:${port}`;
        console.log(`🦊 Elysia is running at ${url}`);
    },
);
