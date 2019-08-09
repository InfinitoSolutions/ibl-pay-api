import ValidatorInterface from '@validator/validator.interface';
import { TransactionConfirmAgainError } from '@services/payment/errors';
import Transaction from '@models/transaction.model';
import { IBill } from '@models/bill.model';

export class BuyerConfirmBillValidator implements ValidatorInterface {
    constructor(protected bill: IBill) { }

    async validate(data: any) {
        const tran = await Transaction.findOne({
            bill_id: this.bill._id,
            tx_id: { $exists: true, $ne: null }
        });
        if (tran) {
            throw new TransactionConfirmAgainError();
        }
        return true;
    }
}

export class MerchantConfirmSchedulerBillValidator implements ValidatorInterface {
    constructor(protected bill: IBill) { }

    async validate(data: any) {
        const tran = await Transaction.findOne({
            bill_id: this.bill._id,
            tx_id: { $exists: true, $ne: null }
        });
        if (tran) {
            throw new TransactionConfirmAgainError();
        }
        return true;
    }
}
