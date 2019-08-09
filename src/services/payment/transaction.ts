'use strict';

import { IBill } from '@models/bill.model';
import Transaction, { ITransaction } from '@models/transaction.model';
import {
    PulledScheduledPaymentMessage
} from './message';
import { TRANSACTION_STATUS } from '@models/constant';
import { PaymentNotificationMessageFactory } from '@services/payment/message/factory';
import { IUser } from '@models/user.model';
import NotificationManager from '@services/notification/manager';
import CommissionFee from '@models/commission.model';
import config from 'config';
import Number from '@utils/number';

export class TransactionService {
    /**
     * Get pending transaction of given ID
     * @param {User} fromUser User who owns transaction
     * @param {String} id Transaction ID
     */
    async getPendingTransaction(fromUser: any, id: any) {
        const from_address = fromUser.neo_wallet;
        const tran = await Transaction.findOne({
            _id: id,
            from_address: from_address,
            status: TRANSACTION_STATUS.PENDING
        });
        return tran;
    }

    /**
     * Buyer confirm a pending transaction
     * @param {User} user
     * @param {Transaction} tran
     * @param {Object} payload = {tx_id}
     */
    async confirmTransaction(user: IUser, tran: ITransaction, payload: any) {
        if (!tran || tran.status !== TRANSACTION_STATUS.PENDING) {
            throw new Error('Invalid Transaction');
        }

        const address = user.neo_wallet;
        if (address !== tran.from_address) {
            throw new Error('Invalid Transaction');
        }

        const { tx_id } = payload;
        const query = {
            _id: tran._id,
            status: TRANSACTION_STATUS.PENDING
        };
        const updates = {
            tx_id: tx_id,
            status: TRANSACTION_STATUS.PROCESSING,
            confirmed_at: new Date()
        };
        const updateOptions = { new: true };
        const t = await Transaction.findOneAndUpdate(query, updates, updateOptions);
        const recipients = [{
            _id: tran.to_user
        }];
        const message = PaymentNotificationMessageFactory.createConfirmedBillMessage(user, tran);
        if (message) {
            await new NotificationManager().send(message, recipients);
        }
        return t;
    }

    /**
     * Buyer confirm when Merchant pull over max fund of bill
     *
     * @param {User} user
     * @param {Transaction} tran
     * @param {Object} payload = { tx_id, amount }
     */
    async confirmWithMaxFund(user: IUser, tran: ITransaction, payload: any) {
        const { tx_id, amount } = payload;
        const query = {
            _id: tran._id,
            status: TRANSACTION_STATUS.PROCESSING
        };
        const updates = {
            tx_id: tx_id,
            amount: amount,
            status: TRANSACTION_STATUS.CONFIRMED
        };
        const updateOptions = { new: true };
        await Transaction.findOneAndUpdate(query, updates, updateOptions);
        const recipients = [{
            _id: tran.to_user
        }];
        const message = PaymentNotificationMessageFactory.createConfirmedBillMessage(user, tran);
        if (message) {
            await new NotificationManager().send(message, recipients);
        }
        return tran;
    }

    /**
     * Merchant pull fund
     *
     * @param {Transaction} tran
     * @param {Object} payload = { tx_id, amount}
     */
    async pullFund(tran: ITransaction, payload: any) {
        const { tx_id, amount } = payload;
        const query = {
            _id: tran._id,
            status: TRANSACTION_STATUS.PENDING
        };
        const commissionRate = await CommissionFee.findOne({ type: 'SCHEDULE' });
        const fee = commissionRate ? commissionRate.fee_percentage : config.get('payment.fee.BTC');
        const commissionFee = await Number.roundFee(fee, amount);
        const updates = {
            tx_id: tx_id,
            status: TRANSACTION_STATUS.PROCESSING,
            amount: amount,
            commission_fee: commissionFee,
            amount_usd: amount * tran.usd_rate
        };
        const updateOptions = { new: true };
        await Transaction.findOneAndUpdate(query, updates, updateOptions);
        const recipients = [{
            _id: tran.from_user
        }, {
            _id: tran.to_user
        }];
        const actor = {
            _id: tran.to_user
        };
        const message = new PulledScheduledPaymentMessage(actor, tran);
        await new NotificationManager().send(message, recipients);
        return tran;
    }
}
