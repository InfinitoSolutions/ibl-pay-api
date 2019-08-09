import ValidatorInterface from '@validator/validator.interface';
import { AmountValidator } from '@services/payment/validator/rules/amount';
import { CurrencyValidator } from '@services/payment/validator/currency';
import { LimitAmountValidator } from './limitAmount';
import { IUser } from '@models/user.model';


export class DepositTransactionValidator implements ValidatorInterface {
    rules: ValidatorInterface[];
    constructor(protected user: IUser) {
        this.rules = [
            new AmountValidator(),
            new CurrencyValidator(),
            new LimitAmountValidator()
        ];
    }

    async validate(data: any) {
        if (this.rules.length === 0) {
            return true;
        }
        for (let i = 0; i < this.rules.length; i++) {
            await this.rules[i].validate(data);
        }
        return true;
    }
}