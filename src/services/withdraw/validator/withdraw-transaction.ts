import ValidatorInterface from '@validator/validator.interface';
import { AmountValidator } from '@services/payment/validator/rules/amount';
import { CurrencyValidator } from './currency-validate';
import { AvailableBalanceValidator } from '@services/withdraw/validator/available-balance';
import { IUser } from '@models/user.model';
import { WithdrawalKycLimitValidator } from '@services/payment/validator/rules/kyclimit';
import { LimitAmountValidator } from '@services/deposit/validator/limitAmount';
import { CanWithdrawFundValidator } from '@validator/permission';
import { MissingWithdrawalAddressError } from '@services/payment/errors';

export class WithdrawTransactionValidator implements ValidatorInterface {
    rules: ValidatorInterface[];
    constructor(protected user: IUser) {
        this.rules = [
            new AmountValidator(),
            new CurrencyValidator(),
            new AvailableBalanceValidator(this.user),
            new LimitAmountValidator()
        ];
    }

    async validate(data: any) {
        if (this.rules.length === 0) {
            return true;
        }
        for (let i = 0; i < this.rules.length; i++) {
            await this.rules[i].validate(data);
        }
        return true;
    }
}

export class PreCheckWithdrawTransactionValidator implements ValidatorInterface {
    rules: ValidatorInterface[];
    constructor(protected user: IUser) {
        this.rules = [
            new CanWithdrawFundValidator(this.user),
            new AmountValidator(),
            new CurrencyValidator(),
            new AvailableBalanceValidator(this.user),
            new WithdrawalKycLimitValidator(this.user),
            new WithdrawalAddressValidator(this.user)
        ];
    }

    async validate(data: any) {
        if (this.rules.length === 0) {
            return true;
        }
        for (let i = 0; i < this.rules.length; i++) {
            await this.rules[i].validate(data);
        }
        return true;
    }
}

export class WithdrawalAddressValidator implements ValidatorInterface {
    constructor(protected user: IUser) { }

    async validate(data: any): Promise<boolean> {
        const { currency } = data;
        if (!currency) {
            return true;
        }
        const address = await this.getWithdrawalAddress(currency);
        if (!address) {
            throw new MissingWithdrawalAddressError();
        }
        return true;
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