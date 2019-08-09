import { BaseError } from '@validator/errors';
import MESSAGES from '@utils/messages';

export class InvalidDataSourceError extends BaseError {
    constructor(...args: any[]) {
        super(...args);
        this.errorCode = 'ds.invalid';
        this.message = MESSAGES.INVALID_DATA_SOURCE;
    }
}