import Transaction from '@models/transaction.model';
import { TRANSACTION_STATUS, TRANSACTION_TYPE } from '@models/constant';
import { IUser } from '@models/user.model';
import { CurrencyConverter } from '@services/currency';
import {getTransactionSequence} from '@services/transaction';

export interface DepositRequest {
    from_address: string;
    from_wallet_name: string;
    currency: string;
    amount: number;
    tx_id: string;
}

export class DepositTransaction {
    /**
     * Deposit transaction
     * @param {User} user User who owns transaction
     * @param {DepositRequest} data data
     */

    async createDepositTransaction(user: IUser, data: DepositRequest) {
        const { from_address, from_wallet_name, currency, amount, tx_id } = data;
        const userId = user._id;

        const exchange = await CurrencyConverter.convertToUsd(amount, currency);
        const usd_rate = exchange.usd_rate;
        const amount_usd = exchange.amount_usd;

        const keywords: string[] = ['Deposit'];
        if (user.display_name) {
            keywords.push(user.display_name);
        }

        const params = {
            to_user: user._id,
            to_address: user.neo_wallet,
            from_wallet_name,
            description: 'Deposit',
            from_address,
            btc_id: tx_id,
            tx_seq: await getTransactionSequence(),
            request_amount: amount,
            amount,
            currency,
            amount_usd,
            usd_rate,
            keywords,
            status: TRANSACTION_STATUS.WAITING,
            tran_type: TRANSACTION_TYPE.DEPOSIT
        };

        let tran = await Transaction.create(params);
        return tran;
    }
}
