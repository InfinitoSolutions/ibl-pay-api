import Wallet from '@models/wallet.model';
import Currency from '@models/currency.model';
import User from '@models/user.model';

import NeoApi from '@services/neo/api';
import { Balance } from '@utils/balance';
import { IUser } from '@models/user.model';
import { createNeoWallet } from '@services/user';

/**
 * Get NEP5_NEO Wallets
 * 
 * @param user IUser
 */
export const getUserWallets = async (user: IUser) => {
    const address = user.neo_wallet;
    let wallet: any = await Wallet.findOne({ user_id: user._id, currency: 'BTC' });
    if (!wallet) {
        wallet = await createNeoWallet(user);
    }
    let data = wallet.toJSON();
    try {
        let balance = 0;
        if (address) {
            balance = await NeoApi.getBalance(address);
        }
        data['balance'] = balance;
        const currency = await Currency.findOne({ currency: wallet.currency });
        if (currency) {
            data['usd'] = parseFloat((balance * currency.usd).toFixed(2));
        }
        // Save wallet
        wallet.balance = balance;
        wallet.available = balance;
        wallet.save();
    } catch (e) { }
    return data;
};

export const debitToWallet = async (userId: string, currency: string, amount: number) => {
    const wallet: any = await Wallet.findOne({ user_id: userId, currency: currency });
    const decimals = await Balance.getDecimalsByCurrency(wallet.currency);
    const intAmount = await Balance.convertWithDecimals(amount, decimals);
    let debit: number = 0;
    if (wallet.debit && wallet.debit > 0) {
        const intDebit = await Balance.convertWithDecimals(wallet.debit, decimals);
        debit = Balance.toDecimals(intDebit + intAmount, decimals);
    } else {
        debit = Balance.toDecimals(intAmount, decimals);
    }
    wallet.debit = debit;
    return await wallet.save();
};

export const updateDebitWallet = async (userId: string, currency: string, amount: number) => {
    const wallet: any = await Wallet.findOne({ user_id: userId, currency: currency });
    const decimals = await Balance.getDecimalsByCurrency(wallet.currency);
    const intAmount = await Balance.convertWithDecimals(amount, decimals);
    let debit: number = 0;
    if (wallet.debit && wallet.debit > 0) {
        const intDebit = await Balance.convertWithDecimals(wallet.debit, decimals);
        debit = Balance.toDecimals(intDebit - intAmount, decimals);
    }
    wallet.debit = (debit > 0) ? debit : 0;
    return await wallet.save();
};

export default {
    getUserWallets,
    debitToWallet,
    updateDebitWallet
};