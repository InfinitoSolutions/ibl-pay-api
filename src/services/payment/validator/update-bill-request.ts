import ValidatorInterface from '@validator/validator.interface';
import { AmountValidator } from '@services/payment/validator/rules/amount';
import { AddressValidator } from '@services/payment/validator/address';

export class UpdateBillRequestValidator implements ValidatorInterface {
    rules: ValidatorInterface[];
    constructor() {
        this.rules = [
            new AddressValidator(),
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
