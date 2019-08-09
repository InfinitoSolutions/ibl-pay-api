import { BaseError } from '@validator/errors';
import MESSAGES from '@utils/messages';

export class LimitAmountError extends BaseError {
    constructor(...args: any[]) {
        super(...args);
        this.message = MESSAGES.LIMIT_AMOUNT;
        this.errorCode = 'limit_amount';
    }
}