'use strict';

import Currency, { ICurrency } from '@models/currency.model';
import * as Errors from '@services/payment/errors';

export const getExchangeRate = async () => {
    try {
        return await Currency.find({});
    } catch (e) {
        throw e;
    }
};

export const convertCryptoToUsd = (amount: number, currency: ICurrency): number => {
    const usd = amount * currency.usd;
    return parseFloat(usd.toFixed(2));
};

export const getCurrency = async (currency: string): Promise<ICurrency | null> => {
    try {
        return Currency.findOne({ currency: currency });
    } catch (e) {
        return null;
    }
};

export class CurrencyConverter {
    static async convertToUsd(amount: number, currency: string): Promise<ICurrencyExchange> {
        const crypto = await getCurrency(currency);
        if (!crypto) {
            throw new Errors.InvalidCurrencyError();
        }
        const amount_usd = convertCryptoToUsd(amount, crypto);
        const usd_rate = crypto.usd;
        return { amount, amount_usd, usd_rate, currency };
    }
}

export interface ICurrencyExchange {
    currency: string;
    amount: number;
    amount_usd: number;
    usd_rate: number;
}

export default {
    getExchangeRate,
    getCurrency,
    convertCryptoToUsd,
};
