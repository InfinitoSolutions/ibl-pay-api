import ValidatorInterface from '@validator/validator.interface';
import { NeoTransactionIdValidator } from '@services/payment/validator/neo-transaction-id';
import { AmountValidator } from '@services/payment/validator/rules/amount';
import { IBill } from '@models/bill.model';

export class ConfirmTransactionOverMaxFundRequestValidator implements ValidatorInterface {
    rules: ValidatorInterface[];

    constructor(protected bill: IBill) {
        this.rules = [
            new NeoTransactionIdValidator(),
            new AmountValidator()
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
