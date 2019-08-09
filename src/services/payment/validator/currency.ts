import ValidatorInterface from '@validator/validator.interface';
import { CurrencyNotSupportError } from '@services/payment/errors';
import { SUPPORT_CURRENCIES } from '@models/constant';

export class CurrencyValidator implements ValidatorInterface {

    async validate(data: any) {
        const { currency } = data;
        if (!SUPPORT_CURRENCIES.includes(currency)) {
            throw new CurrencyNotSupportError();
        }
        return true;
    }
}
