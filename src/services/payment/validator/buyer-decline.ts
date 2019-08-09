import ValidatorInterface from '@validator/validator.interface';
import { TransactionDeclineValidator } from './transaction-decline';
import { ITransaction } from '@models/transaction.model';
import { IUser } from '@models/user.model';

export class BuyerDeclineValidator implements ValidatorInterface {
    rules: ValidatorInterface[];
    constructor(protected user: IUser, protected tran: ITransaction) {
        this.rules = [
            new TransactionDeclineValidator(this.user, this.tran),
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
