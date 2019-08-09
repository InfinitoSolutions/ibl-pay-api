import ValidatorInterface from '@validator/validator.interface';
import { NeoTransactionIdValidator } from './neo-transaction-id';

export class ConfirmTransactionRequestValidator implements ValidatorInterface {
    rules: ValidatorInterface[];
    constructor() {
        this.rules = [
            new NeoTransactionIdValidator()
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
