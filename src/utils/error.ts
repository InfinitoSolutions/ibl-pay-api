const Boom = require('boom');

export const badRequest = (err: any) => {
    const error = Boom.badRequest(err);
    if (err.errorCode) {
        error.output.payload.errors = [err.errorCode];
    }
    return error;
};

export const unauthorized = (err: any) => {
    const error = Boom.unauthorized(err);
    if (err.errorCode) {
        error.output.payload.errors = [err.errorCode];
    }
    return error;
};

export const notFound = (err: any) => {
    const error = Boom.notFound(err);
    if (err.errorCode) {
        error.output.payload.errors = [err.errorCode];
    }
    return error;
};
