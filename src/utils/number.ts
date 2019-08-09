import Account from '@models/account.model';
import { CONSTANT } from '@models/constant'

export default class Number {
    private static __Precision: number = 12
    private static __fixed: number = 16

    static async getDecimalsByCurrency(currency: string) {
        const account = await Account.findOne({ currency: currency });
        if (!account) {
            return CONSTANT.DECIMAL;
        }
        return account.decimals;
    }

    static async round(floatValue: number, currency: string = 'BTC') {
        const decimals: number = await this.getDecimalsByCurrency(currency);
        return parseFloat(floatValue.toFixed(decimals));
    }

    private static toFixedDown = (str, digits) => {
        var re = new RegExp("(\\d+\\.\\d{" + digits + "})(\\d)"),
            m = str.match(re);
        return m ? m[1] : str;
    }

    static async roundFee(fee: number, value: number, currency: string = 'BTC') {
        if (fee <= 0) {
            return 0;
        }
        const floatFee = fee / 100;
        const decimals: number = await this.getDecimalsByCurrency(currency);
        const minimum = Math.pow(10, -decimals);
        const tokenFee1 = parseFloat((floatFee * value).toPrecision(this.__Precision)).toFixed(this.__fixed);
        const tokenFee2 = this.toFixedDown(tokenFee1, decimals);
        let result = parseFloat(tokenFee2);
        if (+tokenFee1 > +tokenFee2) {
            result += minimum;
        }
        if (result < minimum) {
            result = minimum;
        }
        return result;
    }

}
