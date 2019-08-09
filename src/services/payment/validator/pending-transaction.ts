import ValidatorInterface from '@validator/validator.interface';
import { TransactionIsInvalidError } from '@validator/errors';
import { TRANSACTION_STATUS } from '@models/constant';
import { ITransaction } from '@models/transaction.model';

export class PendingTransactionValidator implements ValidatorInterface {
    constructor(protected tran: ITransaction) { }

    async validate(data: any) {
        if (this.tran.status !== TRANSACTION_STATUS.PENDING) {
            throw new TransactionIsInvalidError();
        }
        return true;
    }
}
