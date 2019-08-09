const Config = require('config');
const withdrawConfig = Config.get('withdraw');
import Currency from '@models/currency.model';
import { IWallet } from '@models/wallet.model';
import Account from '@models/account.model';
import { CONSTANT } from '@models/constant'

export class Balance {

    static async getDecimalsByCurrency(currency: string) {
        const account = await Account.findOne({ currency: currency });
        if (!account) {
            return CONSTANT.DECIMAL;
        }
        return account.decimals;
    }

    static async getMinimumAmountConfig(wallet: IWallet) {
        const { currency } = wallet;
        return (withdrawConfig.minimumAmount[currency]) ? withdrawConfig.minimumAmount[currency] : 0;
    }

    static convertWithDecimals(amount: number, decimals: number): number {
        if (amount <= 0 || decimals <= 0) {
            return amount;
        }
        return Math.round(amount * Math.pow(10, decimals));
    }

    static fromDecimals(floatVal: number, decimals: number) {
        return this.convertWithDecimals(floatVal, decimals);
    }

    static toDecimals(intValue: number, decimals: number): number {
        if (intValue <= 0 || decimals <= 0) {
            return intValue;
        }
        const floatValue: number = (intValue / Math.pow(10, decimals));
        return this.toFixed(floatValue, decimals);
    }

    static async getAvailableBalance(wallet: IWallet) {
        const { balance, debit, currency } = wallet;
        const decimals: number = await this.getDecimalsByCurrency(currency);
        const intBalance: number = await this.convertWithDecimals(balance, decimals);
        const intDebit: number = await this.convertWithDecimals(debit, decimals);

        if (intBalance > intDebit) {
            return this.toDecimals(intBalance - intDebit, decimals);
        }
        return 0;
    }

    static async getWithdrawalFee(wallet: IWallet, commissionRate: number) {
        const decimals: number = await this.getDecimalsByCurrency(wallet.currency);
        const minimum_amount = await this.getMinimumAmountConfig(wallet);
        const available_balance = await this.getAvailableBalance(wallet);
        const fee = commissionRate / 100;
        if (available_balance >= minimum_amount) {
            return this.toFixed((fee * available_balance), decimals);
        }
        return 0;
    }

    static async getAvailableBalanceUsd(wallet: IWallet) {
        const available_balance = await this.getAvailableBalance(wallet);
        const currency = await Currency.findOne({ currency: wallet.currency });
        if (currency) {
            return this.toFixed((available_balance * currency.usd), 2);
        }
        return 0;
    }

    static async getNetAmount(currency: string, amount: number, fee: number) {
        const decimals = await this.getDecimalsByCurrency(currency);
        const intAmount: number = await this.convertWithDecimals(amount, decimals);
        const intFee: number = await this.convertWithDecimals(fee, decimals);
        return this.toDecimals(intAmount - intFee, decimals);
    }

    static toFixed(floatValue: number, decimals: number): number {
        return parseFloat(floatValue.toFixed(decimals));
    }
}
