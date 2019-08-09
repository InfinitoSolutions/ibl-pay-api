import { TransactionService } from '@services/payment/transaction';
import Transaction from '@models/transaction.model';
import { ReceiverNotFoundError } from '@validator/errors';
import {
    TRANSACTION_STATUS,
    TRANSACTION_TYPE
} from '@models/constant';
import User, { IUser } from '@models/user.model';

import { TransferTransactionConfirmedMessage } from './message';
import NotificationManager from '@services/notification/manager';
import { CurrencyConverter } from '@services/currency';
import {getTransactionSequence} from '@services/transaction';

export class TransferTransaction extends TransactionService {

    async createTransferTransaction(user: IUser, payload: any) {
        const { tx_id, currency, amount, address, email, description } = payload;
        const exchange = await CurrencyConverter.convertToUsd(amount, currency);
        const usd_rate = exchange.usd_rate;
        const amount_usd = exchange.amount_usd;

        const toUser = await User.findOne({ $or: [{ neo_wallet: address }, { email: email }] });
        if (!toUser) {
            throw new ReceiverNotFoundError();
        }
        const keywords: string[] = [description];
        if (user.display_name) {
            keywords.push(user.display_name);
        }
        if (toUser.display_name) {
            keywords.push(toUser.display_name);
        }
        const tran = await Transaction.create({
            status: TRANSACTION_STATUS.PROCESSING,
            tran_type: TRANSACTION_TYPE.TRANSFER,
            currency: currency,
            tx_id: tx_id,
            tx_seq: await getTransactionSequence(),
            amount: amount,
            request_amount: amount,
            from_user: user._id,
            from_address: user.neo_wallet,
            to_user: toUser._id,
            to_address: toUser.neo_wallet,
            description: description,
            keywords: [description],
            amount_usd,
            usd_rate,
            confirmed_at: new Date()
        });
        await this.transferProceed(user, tran);
        return tran;
    }

    async transferProceed(user: IUser, tran: any) {
        const recipients = [{
            _id: tran.from_user
        }, {
            _id: tran.to_user
        }];
        const message = new TransferTransactionConfirmedMessage(user, tran);
        await new NotificationManager().send(message, recipients);
    }
}
