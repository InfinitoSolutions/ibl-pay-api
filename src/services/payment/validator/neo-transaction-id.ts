import ValidatorInterface from '@validator/validator.interface';
import { TransactionExistError } from '@services/payment/errors';
import Transaction from '@models/transaction.model';
import Bill from '@models/bill.model';

export class NeoTransactionIdValidator implements ValidatorInterface {

    async validate(data: any) {
        const { tx_id } = data;
        const tran = await Transaction.findOne({ tx_id: tx_id });
        const bill = await Bill.findOne({ agreement_id: tx_id });
        if (tran || bill) {
            throw new TransactionExistError();
        }
        return true;
    }
}
