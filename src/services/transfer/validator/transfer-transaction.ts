import ValidatorInterface from '@validator/validator.interface';
import { NeoTransactionIdValidator } from '@services/payment/validator/neo-transaction-id';
import { AmountValidator } from '@services/payment/validator/rules/amount';
import { AvailableBalanceValidator } from '@services/payment/validator/rules/available-balance';
import { CurrencyValidator } from '@services/payment/validator/currency';
import { TransferReceiverValidator } from '@services/transfer/validator/transfer-receiver';
import { IUser } from '@models/user.model';
import { BuyerKycLimitValidator } from '@services/payment/validator/rules/kyclimit';
import { CanTransferFundValidator } from '@validator/permission';


export class TransferTransactionValidator implements ValidatorInterface {
    rules: ValidatorInterface[];
    constructor(protected user: IUser) {
        this.rules = [
            new NeoTransactionIdValidator(),
            new AmountValidator(),
            new TransferReceiverValidator(),
            new CurrencyValidator()
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

export class PreCheckTransferTransactionValidator implements ValidatorInterface {
    rules: ValidatorInterface[];
    constructor(protected user: IUser) {
        this.rules = [
            new CanTransferFundValidator(this.user),
            new AvailableBalanceValidator(this.user),
            new TransferReceiverValidator(),
            new CurrencyValidator(),
            new BuyerKycLimitValidator(user)
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