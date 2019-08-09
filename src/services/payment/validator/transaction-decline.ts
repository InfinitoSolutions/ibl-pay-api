import ValidatorInterface from '@validator/validator.interface';
import { UnauthorizedError } from '@services/payment/errors';
import { IUser } from '@models/user.model';
import { ITransaction } from '@models/transaction.model';

export class TransactionDeclineValidator implements ValidatorInterface {
    constructor(
        protected user: IUser,
        protected tran: ITransaction
    ) { }

    async validate(data: any) {
        if (String(this.user._id) !== String(this.tran.from_user)) {
            throw new UnauthorizedError();
        }
        return true;
    }
}
