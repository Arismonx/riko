import { InvertedStatusMap } from 'elysia';

type Status = keyof InvertedStatusMap;
type Headers = Record<string, string> | undefined | null;
type ErrorDetail = string | Record<string, unknown>;

type HTTPErrorOptions = {
    status: Status;
    message?: ErrorDetail;
    headers?: Headers;
};

export class HTTPError extends Error {
    public readonly status: Status;
    public readonly detail: ErrorDetail;
    public readonly headers?: Headers;

    constructor({ status, message, headers }: HTTPErrorOptions) {
        super();
        if (!message) {
            const pharse = InvertedStatusMap[status];
            if (!pharse) {
                throw new Error('Invalid status code');
            }
            this.detail = pharse;
        } else {
            this.detail = message;
        }
        this.status = status;
        this.headers = headers;
        this.message = `${status}: ${this.detail}`;
    }
}

// https://www.prisma.io/docs/orm/reference/error-reference#p2002
