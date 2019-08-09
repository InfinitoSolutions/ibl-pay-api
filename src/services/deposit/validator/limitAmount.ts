import ValidatorInterface from '@validator/validator.interface';
import { LimitAmountError } from '@services/deposit/errors';
const Config = require('config');

export class LimitAmountValidator implements ValidatorInterface {

    async validate(data: any) {
        const amount = data.amount;
        const limitAmount = Config.get('payment.limit.BTC');
        if (amount >= limitAmount) {
            throw new LimitAmountError();
        }
        return true;
    }
}
