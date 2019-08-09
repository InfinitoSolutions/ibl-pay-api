import ValidatorInterface from '@validator/validator.interface';
import { RecurringDateValidator } from './recurring-date';
import { IBill } from '@models/bill.model';

export class BillReminderValidation implements ValidatorInterface {
    rules: ValidatorInterface[];
    constructor(protected bill: IBill) {
        this.rules = [
            new RecurringDateValidator()
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
