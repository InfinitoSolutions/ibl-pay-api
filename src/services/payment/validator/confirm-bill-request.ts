import ValidatorInterface from '@validator/validator.interface';
import { NeoTransactionIdValidator } from '@services/payment/validator/neo-transaction-id';
import { AmountValidator } from '@services/payment/validator/rules/amount';
import { EqualBillAmountValidator } from '@services/payment/validator/rules/equal-bill-amount';
import { BillTypeValidator } from '@services/payment/validator/bill-type';
import { BuyerConfirmBillValidator } from '@services/payment/validator/buyer-confirm-bill';
import { BuyerAgreementAlreadyValidator } from '@services/payment/validator/buyer-agreement';
import { AvailableBalanceValidator } from '@services/payment/validator/rules/available-balance';
import { IUser } from '@models/user.model';
import { IBill } from '@models/bill.model';
import { BuyerKycLimitValidator } from '@services/payment/validator/rules/kyclimit';
import { CanProceedPaymentValidator } from '@validator/permission';

export class ConfirmBillRequestValidator implements ValidatorInterface {
    rules: ValidatorInterface[];

    constructor(protected bill: IBill, protected user: IUser) {
        this.rules = [
            new NeoTransactionIdValidator(),
            new BuyerConfirmBillValidator(this.bill),
            new BuyerAgreementAlreadyValidator(this.bill),
            new AmountValidator(),
            new BillTypeValidator()
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

export class PreCheckConfirmBillRequestValidator implements ValidatorInterface {
    rules: ValidatorInterface[];

    constructor(protected user: IUser, protected bill: IBill) {
        this.rules = [
            new AvailableBalanceValidator(this.user),
            new EqualBillAmountValidator(this.bill),
            // new BuyerKycLimitValidator(this.user),
            new CanProceedPaymentValidator(this.user, this.bill)
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
