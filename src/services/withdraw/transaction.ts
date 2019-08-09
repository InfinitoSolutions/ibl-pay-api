import Transaction, { ITransaction } from '@models/transaction.model';
import Wallet, { IWallet } from '@models/wallet.model';
import walletServices from '@services/wallet';
import {
    TRANSACTION_STATUS,
    TRANSACTION_TYPE,
} from '@models/constant';
import { Balance } from '@utils/balance';
import { IUser } from '@models/user.model';
import { NotificationActor } from '@services/notification/interface';
import { NotificationRecipient } from '@services/notification/recipient';
import { RequestWithdrawalMessage } from '@services/withdraw/message';
import NotificationManager from '@services/notification/manager';
import { ICommand } from '@services/interface';
import { CurrencyConverter } from '@services/currency';
import { getCommissionRate } from '@services/withdraw/commission';
import CommissionFee from '@models/commission.model';
import config from 'config';
import {getTransactionSequence} from '@services/transaction';
import Number from '@utils/number';

export interface Wallet {
    name: string;
    address: string;
    currency: string;
}

export interface WithdrawalRequest {
    wallet: Wallet;
    amount: number;
    fee: number;
    txid: string;
}

export class WithdrawTransactionCommand implements ICommand {
    constructor(
        protected user: IUser,
        protected data: WithdrawalRequest
    ) { }

    async execute(): Promise<void> {
        await this.createWithdrawalRequest(this.data);
    }

    async createWithdrawalRequest(withdrawalRequest: WithdrawalRequest) {
        const {amount, wallet, fee: withdrawFee, txid} = withdrawalRequest;
        const withdrawalAmount = amount;
        const currency = wallet.currency;
        const userId = this.user._id;

        // let fee = await this.getCommissionRate();
        const commissionRate = await CommissionFee.findOne({ type: 'WITHDRAW' });
        const fee = commissionRate ? commissionRate.fee_percentage : config.get('withdraw.fee.BTC');
        let commissionFee = await Number.roundFee(fee, withdrawalAmount);
        // let netAmount = await Balance.getNetAmount(currency, withdrawalAmount, commissionFee);

        const exchange = await CurrencyConverter.convertToUsd(withdrawalAmount, currency);
        const usd_rate = exchange.usd_rate;
        const amount_usd = exchange.amount_usd;

        const keywords: string[] = ['Withdraw'];
        if (this.user.display_name) {
            keywords.push(this.user.display_name);
        }
        let tran = await Transaction.create({
            tx_id: txid,
            tx_seq: await getTransactionSequence(),
            status: TRANSACTION_STATUS.WAITING,
            tran_type: TRANSACTION_TYPE.WITHDRAW,
            description: 'Withdraw',
            currency: currency,
            amount: withdrawalAmount,
            request_amount: withdrawalAmount,
            from_user: userId,
            from_address: this.user.neo_wallet,
            to_address: wallet.address,
            to_wallet_name: wallet.name,
            commission_fee: commissionFee,
            commission_percentage: fee,
            keywords,
            usd_rate,
            amount_usd,
            withdraw_fee: withdrawFee
        });
        // await walletServices.debitToWallet(userId, currency, withdrawalAmount);
        // this.sendNotification(tran);
        return tran;
    }

    async sendNotification(tran: ITransaction): Promise<void> {
        const actor = NotificationActor.fromUser(this.user);
        const recipient = NotificationRecipient.fromUser(this.user);
        const message = new RequestWithdrawalMessage(actor, tran);
        await new NotificationManager().send(message, [recipient]);
    }

    async getCommissionRate(): Promise<number> {
        const COMISSION_FEE = config.get('withdraw.fee.BTC');
        try {
            if (this.user.isBuyer()) {
                return COMISSION_FEE;
            }
            return getCommissionRate(this.user);
        } catch (e) {
            return 0;
        }
    }

    async getWithdrawalAddress(currency: string): Promise<string | null> {
        const cryptoCurrencies = this.user.crypto_currencies;
        if (!Array.isArray(cryptoCurrencies) || cryptoCurrencies.length === 0) {
            return null;
        }
        const items = cryptoCurrencies.filter(c => {
            return (c.currency === currency);
        });
        if (items.length === 0) {
            return null;
        }
        return items[0].address;
    }
}
