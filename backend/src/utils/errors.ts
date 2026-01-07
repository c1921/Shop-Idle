export class VersionConflictError extends Error {
    public readonly serverVersion: number;

    constructor(serverVersion: number) {
        super('version_conflict');
        this.name = 'VersionConflictError';
        this.serverVersion = serverVersion;
    }
}

export class BadRequestError extends Error {
    public readonly error: string;

    constructor(error: string) {
        super(error);
        this.name = 'BadRequestError';
        this.error = error;
    }
}

export class InternalError extends Error {
    constructor(message = 'internal_error') {
        super(message);
        this.name = 'InternalError';
    }
}
